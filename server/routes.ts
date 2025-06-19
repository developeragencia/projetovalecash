import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { db } from "./db";
import { eq, and, desc, sql, gt, gte, lt, lte, inArray, ne, count } from "drizzle-orm";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { format } from "date-fns";
import { 
  calculateTransactionFees, 
  calculateClientCashback, 
  calculatePlatformFee,
  calculateMerchantReceives 
} from "./helpers/fee-calculator";
import { 
  generateFinancialReport, 
  getRevenueByPeriod, 
  getTopMerchantsByRevenue 
} from "./helpers/financial-reports";
import {
  users,
  merchants,
  products,
  transactions,
  transactionItems,
  cashbacks,
  transfers,
  commissionSettings,
  notifications,
  qrCodes,
  referrals,
  PaymentMethod,
  TransactionStatus,
  NotificationType
} from "@shared/schema";

// Middleware para verificar autenticação
const isAuthenticated = async (req: Request, res: Response, next: Function) => {
  // Verificar se usuário está autenticado via sessão
  if (req.isAuthenticated && req.isAuthenticated() && req.user) {
    console.log(`🔍 Usuário autenticado: ${(req.user as any).name} (${(req.user as any).type})`);
    return next();
  }
  
  // Em desenvolvimento, sempre permitir acesso com usuários demo
  if (process.env.NODE_ENV === 'development') {
    try {
      // Determinar qual usuário usar baseado na rota
      let testUser;
      const url = req.url;
      
      if (url.includes('/merchant/') || url.includes('/api/merchant/')) {
        testUser = await storage.getUserByEmail("lojista@valecashback.com");
        console.log(`🔧 Acesso merchant liberado como ${testUser?.name}`);
      } else if (url.includes('/client/') || url.includes('/api/client/')) {
        testUser = await storage.getUserByEmail("cliente@valecashback.com");
        console.log(`🔧 Acesso client liberado como ${testUser?.name}`);
      } else {
        testUser = await storage.getUserByEmail("admin@valecashback.com");
        console.log(`🔧 Acesso admin liberado como ${testUser?.name}`);
      }
      
      if (testUser) {
        (req as any).user = testUser;
        return next();
      }
    } catch (error) {
      console.error("Erro ao buscar usuário demo:", error);
    }
  }
  
  console.log(`🔍 Verificando autenticação - isAuthenticated: ${req.isAuthenticated ? req.isAuthenticated() : false} user: ${!!req.user}`);
  return res.status(401).json({ message: "Usuário não autenticado" });
};

// Middleware para verificar tipo de usuário
export const isUserType = (type: string) => async (req: Request, res: Response, next: Function) => {
  const user = (req as any).user;
  
  // Verificar se usuário está autenticado
  if (!user) {
    return res.status(401).json({ message: "Usuário não autenticado" });
  }
  
  console.log(`🔐 Verificando tipo de usuário: requerido=${type}, atual=${user.type}, usuário=${user.name}`);
  
  // Verificar tipo de usuário direto
  if (user.type === type) {
    console.log(`✅ Tipo de usuário correto: ${type}`);
    return next();
  }
  
  // Para merchant, verificar se existe merchant associado ao usuário
  if (type === 'merchant') {
    try {
      const [merchant] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.user_id, user.id))
        .limit(1);
        
      if (merchant) {
        console.log(`✅ Merchant encontrado: ${user.name} (loja: ${merchant.store_name})`);
        return next();
      }
      
      console.log(`⚠️ Merchant não encontrado para usuário ${user.name}, verificando fallback...`);
    } catch (error) {
      console.error("❌ Erro ao verificar merchant:", error);
    }
  }
  
  // Em desenvolvimento, permitir acesso sempre
  if (process.env.NODE_ENV === 'development') {
    console.log(`🚀 Modo desenvolvimento: liberando acesso ${type} para ${user.name}`);
    return next();
  }
  
  console.log(`❌ Acesso negado para ${user.name}: tipo ${user.type} não é ${type}`);
  return res.status(403).json({ message: "Acesso negado - tipo de usuário incorreto" });
};

// Configurações globais do sistema (defaults) - CORRIGIDAS
const DEFAULT_SETTINGS = {
  platformFee: "5.0",        // Plataforma cobra 5% do lojista
  merchantCommission: "0.0", // Removido: Comissão de Lojista (0%)
  clientCashback: "2.0",     // Cashback para clientes 2%
  referralBonus: "1.0",      // Indicações 1%
  minWithdrawal: "20.0",
  maxCashbackBonus: "10.0",
  withdrawalFee: "5.0",
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Configurar autenticação e rotas relacionadas
  setupAuth(app);
  
  // ======== ROTAS BÁSICAS ========
  
  // Verificar status de autenticação
  app.get("/api/auth/me", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      res.json(user);
    } catch (error) {
      console.error("Erro ao obter dados do usuário:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Obter configurações de comissão
  app.get("/api/commission-settings", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const settings = await db.select().from(commissionSettings).limit(1);
      
      if (settings.length === 0) {
        const [newSettings] = await db.insert(commissionSettings).values({
          platform_fee: DEFAULT_SETTINGS.platformFee,
          merchant_commission: DEFAULT_SETTINGS.merchantCommission,
          client_cashback: DEFAULT_SETTINGS.clientCashback,
          referral_bonus: DEFAULT_SETTINGS.referralBonus,
          min_withdrawal: DEFAULT_SETTINGS.minWithdrawal,
          max_cashback_bonus: DEFAULT_SETTINGS.maxCashbackBonus,
          withdrawal_fee: DEFAULT_SETTINGS.withdrawalFee,
        }).returning();
        
        return res.json(newSettings);
      }
      
      res.json(settings[0]);
    } catch (error) {
      console.error("Erro ao obter configurações de comissão:", error);
      res.status(500).json({ message: "Erro ao obter configurações de comissão" });
    }
  });

  // Atualizar configurações de comissão (apenas admin)
  app.put("/api/commission-settings", isAuthenticated, isUserType("admin"), async (req: Request, res: Response) => {
    try {
      const { platform_fee, merchant_commission, client_cashback, referral_bonus, min_withdrawal, max_cashback_bonus, withdrawal_fee } = req.body;
      
      const updatedSettings = await db.update(commissionSettings)
        .set({
          platform_fee: platform_fee?.toString(),
          merchant_commission: merchant_commission?.toString(), 
          client_cashback: client_cashback?.toString(),
          referral_bonus: referral_bonus?.toString(),
          min_withdrawal: min_withdrawal?.toString(),
          max_cashback_bonus: max_cashback_bonus?.toString(),
          withdrawal_fee: withdrawal_fee?.toString(),
          updated_at: new Date()
        })
        .returning();
        
      res.json(updatedSettings[0]);
    } catch (error) {
      console.error("Erro ao atualizar configurações de comissão:", error);
      res.status(500).json({ message: "Erro ao atualizar configurações de comissão" });
    }
  });

  // ======== ENDPOINTS DE VALIDAÇÃO DE CONVITE ========

  // Validar código de convite
  app.get("/api/invite/:code", async (req: Request, res: Response) => {
    try {
      const { code } = req.params;
      
      if (!code) {
        return res.status(400).json({ message: "Código de convite é obrigatório" });
      }

      // Buscar usuário pelo código de convite
      const [referrer] = await db.select({
        id: users.id,
        name: users.name,
        type: users.type,
        invitation_code: users.invitation_code
      })
      .from(users)
      .where(eq(users.invitation_code, code));

      if (!referrer) {
        return res.status(404).json({ 
          message: "Código de convite inválido",
          valid: false 
        });
      }

      // Buscar configurações de comissão
      const [settings] = await db.select().from(commissionSettings).limit(1);
      const referralBonus = settings ? parseFloat(settings.referral_bonus) : 1.0;

      res.json({
        valid: true,
        referrerId: referrer.id,
        referrerName: referrer.name,
        referrerType: referrer.type,
        referralCode: referrer.invitation_code,
        bonus: referralBonus,
        message: `Você foi convidado por ${referrer.name}`
      });

    } catch (error) {
      console.error("Erro ao validar convite:", error);
      res.status(500).json({ 
        message: "Erro interno do servidor",
        valid: false 
      });
    }
  });

  // ======== ROTAS DE ADMINISTRAÇÃO ========
  
  // Listar todos os usuários (apenas admin)
  app.get("/api/admin/users", async (req: Request, res: Response) => {
    try {
      const allUsers = await db.execute(sql`
        SELECT 
          u.id,
          u.name,
          u.email,
          u.phone,
          u.type,
          u.status,
          u.created_at,
          u.last_login,
          COALESCE(c.balance, '0.00') as balance,
          COALESCE(c.total_earned, '0.00') as total_earned,
          COALESCE(c.total_spent, '0.00') as total_spent,
          m.store_name,
          m.approved as merchant_approved
        FROM users u
        LEFT JOIN cashbacks c ON u.id = c.user_id
        LEFT JOIN merchants m ON u.id = m.user_id
        ORDER BY u.created_at DESC
      `);
      res.json(allUsers.rows);
    } catch (error) {
      console.error("Erro ao listar usuários:", error);
      res.status(500).json({ message: "Erro ao listar usuários" });
    }
  });

  // Criar novo usuário
  app.post("/api/admin/users", isAuthenticated, isUserType("admin"), async (req: Request, res: Response) => {
    try {
      const { name, email, password, phone, type, address, city, state, country } = req.body;
      
      // Verificar se email já existe
      const existingUser = await db.select().from(users).where(eq(users.email, email));
      if (existingUser.length > 0) {
        return res.status(400).json({ message: "Email já está em uso" });
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const [newUser] = await db.insert(users).values({
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        type,
        address: address || null,
        city: city || null,
        state: state || null,
        country: country || null,
        status: "active",
        password_updated: true
      }).returning();
      
      // Criar saldo de cashback inicial se for cliente
      if (type === "client") {
        await db.insert(cashbacks).values({
          user_id: newUser.id,
          balance: "0.0",
          total_earned: "0.0",
          total_spent: "0.0"
        });
      }
      
      // Criar dados de comerciante se for merchant
      if (type === "merchant") {
        await db.insert(merchants).values({
          user_id: newUser.id,
          store_name: `Loja de ${name}`,
          category: "Geral",
          approved: true
        });
      }
      
      res.json({ message: "Usuário criado com sucesso", user: newUser });
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      res.status(500).json({ message: "Erro ao criar usuário" });
    }
  });
  
  // Editar usuário
  app.put("/api/admin/users/:id", isAuthenticated, isUserType("admin"), async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { name, email, phone, type, address, city, state, country, status } = req.body;
      
      const [updatedUser] = await db.update(users)
        .set({
          name,
          email,
          phone: phone || null,
          type,
          address: address || null,
          city: city || null,
          state: state || null,
          country: country || null,
          status
        })
        .where(eq(users.id, userId))
        .returning();
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      res.json({ message: "Usuário atualizado com sucesso", user: updatedUser });
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      res.status(500).json({ message: "Erro ao atualizar usuário" });
    }
  });
  
  // Redefinir senha do usuário
  app.put("/api/admin/users/:id/password", isAuthenticated, isUserType("admin"), async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { password } = req.body;
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      await db.update(users)
        .set({
          password: hashedPassword,
          password_updated: true
        })
        .where(eq(users.id, userId));
      
      res.json({ message: "Senha redefinida com sucesso" });
    } catch (error) {
      console.error("Erro ao redefinir senha:", error);
      res.status(500).json({ message: "Erro ao redefinir senha" });
    }
  });
  
  // Adicionar saldo ao usuário
  app.post("/api/admin/users/:id/balance", isAuthenticated, isUserType("admin"), async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { amount, description } = req.body;
      const adminId = (req.user as any).id;
      
      // Verificar se usuário existe
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Atualizar saldo de cashback
      await db.execute(sql`
        INSERT INTO cashbacks (user_id, balance, total_earned, updated_at)
        VALUES (${userId}, ${amount}, ${amount}, NOW())
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          balance = cashbacks.balance + ${amount},
          total_earned = cashbacks.total_earned + ${amount},
          updated_at = NOW()
      `);
      
      res.json({ message: "Saldo adicionado com sucesso" });
    } catch (error) {
      console.error("Erro ao adicionar saldo:", error);
      res.status(500).json({ message: "Erro ao adicionar saldo" });
    }
  });
  
  // Gerenciar saldo do usuário (adicionar/remover)
  app.put("/api/admin/users/:id/balance", isAuthenticated, isUserType("admin"), async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { operation, amount, description } = req.body;
      const adminId = (req.user as any).id;
      
      // Verificar se usuário existe
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      const amountValue = parseFloat(amount);
      if (isNaN(amountValue) || amountValue <= 0) {
        return res.status(400).json({ message: "Valor inválido" });
      }
      
      // Buscar saldo atual do usuário
      const [cashback] = await db.select().from(cashbacks).where(eq(cashbacks.user_id, userId));
      
      let currentBalance = 0;
      let currentTotalEarned = 0;
      
      if (cashback) {
        currentBalance = parseFloat(cashback.balance);
        currentTotalEarned = parseFloat(cashback.total_earned);
      }
      
      let newBalance = currentBalance;
      let newTotalEarned = currentTotalEarned;
      
      if (operation === 'add') {
        newBalance += amountValue;
        newTotalEarned += amountValue;
      } else if (operation === 'remove') {
        if (currentBalance < amountValue) {
          return res.status(400).json({ message: "Saldo insuficiente para remoção" });
        }
        newBalance -= amountValue;
      } else {
        return res.status(400).json({ message: "Operação inválida. Use 'add' ou 'remove'" });
      }
      
      // Atualizar ou criar saldo na tabela cashbacks
      if (cashback) {
        await db
          .update(cashbacks)
          .set({
            balance: newBalance.toFixed(2),
            total_earned: newTotalEarned.toFixed(2),
            updated_at: new Date()
          })
          .where(eq(cashbacks.user_id, userId));
      } else {
        await db
          .insert(cashbacks)
          .values({
            user_id: userId,
            balance: newBalance.toFixed(2),
            total_earned: newTotalEarned.toFixed(2),
            total_spent: "0.00"
          });
      }
      
      // Log da operação para auditoria
      console.log(`💰 Saldo ${operation === 'add' ? 'adicionado' : 'removido'}: R$ ${amountValue.toFixed(2)} para usuário ${userId} por admin ${adminId}`);
      
      res.json({ 
        message: `Saldo ${operation === 'add' ? 'adicionado' : 'removido'} com sucesso`,
        new_balance: newBalance.toFixed(2)
      });
    } catch (error) {
      console.error("Erro ao gerenciar saldo:", error);
      res.status(500).json({ message: "Erro ao gerenciar saldo" });
    }
  });

  // Remover saldo do usuário
  app.delete("/api/admin/users/:id/balance", isAuthenticated, isUserType("admin"), async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { amount, description } = req.body;
      
      // Verificar se usuário existe
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Verificar saldo atual
      const [cashback] = await db.select().from(cashbacks).where(eq(cashbacks.user_id, userId));
      const currentBalance = parseFloat(cashback?.balance || "0");
      
      if (currentBalance < amount) {
        return res.status(400).json({ message: "Saldo insuficiente para remoção" });
      }
      
      // Atualizar saldo de cashback
      await db.execute(sql`
        UPDATE cashbacks 
        SET 
          balance = balance - ${amount},
          total_spent = total_spent + ${amount},
          updated_at = NOW()
        WHERE user_id = ${userId}
      `);
      
      res.json({ message: "Saldo removido com sucesso" });
    } catch (error) {
      console.error("Erro ao remover saldo:", error);
      res.status(500).json({ message: "Erro ao remover saldo" });
    }
  });
  
  // Excluir usuário
  app.delete("/api/admin/users/:id", isAuthenticated, isUserType("admin"), async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const adminId = (req.user as any).id;
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "ID de usuário inválido" });
      }
      
      // Não permitir auto-exclusão
      if (userId === adminId) {
        return res.status(400).json({ message: "Não é possível excluir sua própria conta" });
      }
      
      // Verificar se usuário existe
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      console.log(`🗑️  Iniciando exclusão do usuário: ${user.name} (ID: ${userId})`);
      
      // Executar exclusão em transação para garantir consistência
      await db.transaction(async (tx) => {
        // 1. Excluir dados relacionados primeiro (ordem importante para evitar constraint errors)
        
        // Excluir transferências onde o usuário é remetente ou destinatário
        await tx.delete(transfers).where(
          sql`from_user_id = ${userId} OR to_user_id = ${userId}`
        );
        
        // Excluir notificações do usuário
        await tx.delete(notifications).where(eq(notifications.user_id, userId));
        
        // Excluir cashbacks do usuário
        await tx.delete(cashbacks).where(eq(cashbacks.user_id, userId));
        
        // Excluir QR codes do usuário
        await tx.delete(qrCodes).where(eq(qrCodes.user_id, userId));
        
        // Se for merchant, excluir dados relacionados
        if (user.type === 'merchant') {
          // Buscar merchant_id
          const [merchant] = await tx.select().from(merchants).where(eq(merchants.user_id, userId));
          if (merchant) {
            // Excluir produtos do merchant
            await tx.delete(products).where(eq(products.merchant_id, merchant.id));
            
            // Excluir itens de transação relacionados às transações do merchant
            await tx.delete(transactionItems).where(
              sql`transaction_id IN (SELECT id FROM transactions WHERE merchant_id = ${merchant.id})`
            );
            
            // Excluir transações do merchant
            await tx.delete(transactions).where(eq(transactions.merchant_id, merchant.id));
            
            // Excluir registro do merchant
            await tx.delete(merchants).where(eq(merchants.id, merchant.id));
          }
        }
        
        // Se for client, excluir transações como cliente
        if (user.type === 'client') {
          // Excluir itens de transação relacionados às transações do cliente
          await tx.delete(transactionItems).where(
            sql`transaction_id IN (SELECT id FROM transactions WHERE user_id = ${userId})`
          );
          
          // Excluir transações do cliente
          await tx.delete(transactions).where(eq(transactions.user_id, userId));
          
          // Excluir referrals onde o usuário é referrer ou referred
          await tx.delete(referrals).where(
            sql`referrer_id = ${userId} OR referred_id = ${userId}`
          );
        }
        
        // 2. Finalmente, excluir o usuário
        await tx.delete(users).where(eq(users.id, userId));
        
        console.log(`✅ Usuário ${user.name} (ID: ${userId}) excluído com sucesso`);
      });
      
      res.json({ 
        message: "Usuário excluído com sucesso",
        deletedUser: {
          id: userId,
          name: user.name,
          email: user.email,
          type: user.type
        }
      });
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      res.status(500).json({ 
        message: "Erro ao excluir usuário",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });
  
  // Obter detalhes completos do usuário
  app.get("/api/admin/users/:id", isAuthenticated, isUserType("admin"), async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Buscar dados completos do usuário
      const userDetails = await db.execute(sql`
        SELECT 
          u.*,
          c.balance,
          c.total_earned,
          c.total_spent,
          c.updated_at as balance_updated,
          m.store_name,
          m.category as merchant_category,
          m.approved as merchant_approved,
          m.commission_rate
        FROM users u
        LEFT JOIN cashbacks c ON u.id = c.user_id
        LEFT JOIN merchants m ON u.id = m.user_id
        WHERE u.id = ${userId}
      `);
      
      if (userDetails.rows.length === 0) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Buscar últimas transações
      const recentTransactions = await db.execute(sql`
        SELECT 
          t.id,
          t.amount,
          t.cashback_amount,
          t.description,
          t.status,
          t.payment_method,
          t.created_at,
          m.store_name as merchant_name
        FROM transactions t
        LEFT JOIN merchants m ON t.merchant_id = m.id
        WHERE t.user_id = ${userId}
        ORDER BY t.created_at DESC
        LIMIT 10
      `);
      
      res.json({
        user: userDetails.rows[0],
        recentTransactions: recentTransactions.rows
      });
    } catch (error) {
      console.error("Erro ao buscar detalhes do usuário:", error);
      res.status(500).json({ message: "Erro ao buscar detalhes do usuário" });
    }
  });

  // Listar todos os comerciantes (apenas admin)
  app.get("/api/admin/merchants", async (req: Request, res: Response) => {
    try {
      const allMerchants = await db
        .select({
          id: merchants.id,
          user_id: merchants.user_id,
          store_name: merchants.store_name,
          category: merchants.category,
          approved: merchants.approved,
          created_at: merchants.created_at,
          user_name: users.name,
          user_email: users.email,
          user_phone: users.phone
        })
        .from(merchants)
        .leftJoin(users, eq(merchants.user_id, users.id))
        .orderBy(desc(merchants.created_at));
      
      res.json(allMerchants);
    } catch (error) {
      console.error("Erro ao listar comerciantes:", error);
      res.status(500).json({ message: "Erro ao listar comerciantes" });
    }
  });

  // Aprovar comerciante (apenas admin)
  app.patch("/api/admin/merchants/:id/approve", isAuthenticated, isUserType("admin"), async (req: Request, res: Response) => {
    try {
      const merchantId = parseInt(req.params.id);
      
      await db
        .update(merchants)
        .set({ approved: true })
        .where(eq(merchants.id, merchantId));
      
      res.json({ message: "Comerciante aprovado com sucesso" });
    } catch (error) {
      console.error("Erro ao aprovar comerciante:", error);
      res.status(500).json({ message: "Erro ao aprovar comerciante" });
    }
  });

  // Editar comerciante (apenas admin)
  app.put("/api/admin/merchants/:id", isAuthenticated, isUserType("admin"), async (req: Request, res: Response) => {
    try {
      const merchantId = parseInt(req.params.id);
      const { store_name, category, address, city, state, country, commission_rate, approved, user_name, user_email, user_phone } = req.body;
      
      // Buscar o merchant e o usuário associado
      const [merchant] = await db
        .select({
          id: merchants.id,
          user_id: merchants.user_id,
          store_name: merchants.store_name,
          category: merchants.category,
          address: merchants.address,
          city: merchants.city,
          state: merchants.state,
          country: merchants.country,
          commission_rate: merchants.commission_rate,
          approved: merchants.approved
        })
        .from(merchants)
        .where(eq(merchants.id, merchantId))
        .limit(1);
      
      if (!merchant) {
        return res.status(404).json({ message: "Comerciante não encontrado" });
      }
      
      // Atualizar dados do merchant
      const merchantUpdates: any = {};
      if (store_name !== undefined) merchantUpdates.store_name = store_name;
      if (category !== undefined) merchantUpdates.category = category;
      if (address !== undefined) merchantUpdates.address = address;
      if (city !== undefined) merchantUpdates.city = city;
      if (state !== undefined) merchantUpdates.state = state;
      if (country !== undefined) merchantUpdates.country = country;
      if (commission_rate !== undefined) merchantUpdates.commission_rate = commission_rate;
      if (approved !== undefined) merchantUpdates.approved = approved;
      
      if (Object.keys(merchantUpdates).length > 0) {
        await db
          .update(merchants)
          .set(merchantUpdates)
          .where(eq(merchants.id, merchantId));
      }
      
      // Atualizar dados do usuário se fornecidos
      const userUpdates: any = {};
      if (user_name !== undefined) userUpdates.name = user_name;
      if (user_email !== undefined) userUpdates.email = user_email;
      if (user_phone !== undefined) userUpdates.phone = user_phone;
      
      if (Object.keys(userUpdates).length > 0) {
        await db
          .update(users)
          .set(userUpdates)
          .where(eq(users.id, merchant.user_id));
      }
      
      res.json({ message: "Comerciante atualizado com sucesso" });
    } catch (error) {
      console.error("Erro ao atualizar comerciante:", error);
      res.status(500).json({ message: "Erro ao atualizar comerciante" });
    }
  });

  // Excluir comerciante (apenas admin)
  app.delete("/api/admin/merchants/:id", isAuthenticated, isUserType("admin"), async (req: Request, res: Response) => {
    try {
      const merchantId = parseInt(req.params.id);
      
      // Buscar o merchant para obter o user_id
      const [merchant] = await db
        .select({ user_id: merchants.user_id })
        .from(merchants)
        .where(eq(merchants.id, merchantId))
        .limit(1);
      
      if (!merchant) {
        return res.status(404).json({ message: "Comerciante não encontrado" });
      }
      
      // Verificar se há transações associadas
      const [transactionCount] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(transactions)
        .where(eq(transactions.merchant_id, merchantId));
      
      if (transactionCount.count > 0) {
        // Se há transações, apenas desativar em vez de excluir
        await db
          .update(merchants)
          .set({ approved: false })
          .where(eq(merchants.id, merchantId));
        
        await db
          .update(users)
          .set({ status: 'inactive' })
          .where(eq(users.id, merchant.user_id));
        
        return res.json({ message: "Comerciante desativado (há transações associadas)" });
      }
      
      // Se não há transações, pode excluir completamente
      await db.delete(merchants).where(eq(merchants.id, merchantId));
      await db.delete(users).where(eq(users.id, merchant.user_id));
      
      res.json({ message: "Comerciante excluído com sucesso" });
    } catch (error) {
      console.error("Erro ao excluir comerciante:", error);
      res.status(500).json({ message: "Erro ao excluir comerciante" });
    }
  });

  // Obter detalhes completos do comerciante (apenas admin)
  app.get("/api/admin/merchants/:id", isAuthenticated, isUserType("admin"), async (req: Request, res: Response) => {
    try {
      const merchantId = parseInt(req.params.id);
      
      // Buscar dados completos do merchant e usuário
      const merchantDetails = await db.execute(sql`
        SELECT 
          m.*,
          u.name as user_name,
          u.email as user_email,
          u.phone as user_phone,
          u.status as user_status,
          u.created_at as user_created_at,
          u.last_login,
          COUNT(DISTINCT t.id) as total_transactions,
          COALESCE(SUM(CAST(t.amount AS DECIMAL)), 0) as total_sales,
          COALESCE(SUM(CAST(t.cashback_amount AS DECIMAL)), 0) as total_cashback,
          COUNT(DISTINCT p.id) as total_products
        FROM merchants m
        LEFT JOIN users u ON m.user_id = u.id
        LEFT JOIN transactions t ON m.id = t.merchant_id AND t.status = 'completed'
        LEFT JOIN products p ON m.id = p.merchant_id
        WHERE m.id = ${merchantId}
        GROUP BY m.id, u.id
      `);
      
      if (merchantDetails.rows.length === 0) {
        return res.status(404).json({ message: "Comerciante não encontrado" });
      }
      
      // Buscar últimas transações
      const recentTransactions = await db.execute(sql`
        SELECT 
          t.id,
          t.amount,
          t.cashback_amount,
          t.description,
          t.status,
          t.payment_method,
          t.created_at,
          u.name as client_name,
          u.email as client_email
        FROM transactions t
        LEFT JOIN users u ON t.user_id = u.id
        WHERE t.merchant_id = ${merchantId}
        ORDER BY t.created_at DESC
        LIMIT 10
      `);
      
      res.json({
        merchant: merchantDetails.rows[0],
        recentTransactions: recentTransactions.rows
      });
    } catch (error) {
      console.error("Erro ao buscar detalhes do comerciante:", error);
      res.status(500).json({ message: "Erro ao buscar detalhes do comerciante" });
    }
  });

  // ======== ROTAS DE COMERCIANTE ========
  
  // Dashboard do merchant
  app.get("/api/merchant/dashboard", isAuthenticated, isUserType("merchant"), async (req: Request, res: Response) => {
    try {
      // Em desenvolvimento, usar o ID do lojista demo diretamente
      let userId = (req.user as any).id;
      if (process.env.NODE_ENV === 'development') {
        const merchantUser = await storage.getUserByEmail("lojista@valecashback.com");
        if (merchantUser) {
          userId = merchantUser.id;
        }
      }
      
      // Buscar loja do merchant
      const [merchant] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.user_id, userId))
        .limit(1);

      if (!merchant) {
        return res.status(404).json({ message: "Comerciante não encontrado" });
      }

      // Buscar transações da loja
      const recentTransactions = await db
        .select({
          id: transactions.id,
          amount: transactions.amount,
          cashback_amount: transactions.cashback_amount,
          description: transactions.description,
          status: transactions.status,
          created_at: transactions.created_at,
          client_name: users.name
        })
        .from(transactions)
        .leftJoin(users, eq(transactions.user_id, users.id))
        .where(eq(transactions.merchant_id, merchant.id))
        .orderBy(desc(transactions.created_at))
        .limit(5);

      // Calcular estatísticas
      const salesStatsResult = await db
        .select({
          total_sales: sql`COALESCE(SUM(CAST(amount AS NUMERIC)), 0)`,
          total_transactions: sql`COUNT(*)`,
          total_cashback: sql`COALESCE(SUM(CAST(cashback_amount AS NUMERIC)), 0)`
        })
        .from(transactions)
        .where(eq(transactions.merchant_id, merchant.id));

      const salesStats = salesStatsResult[0] || { total_sales: 0, total_transactions: 0, total_cashback: 0 };

      // Estatísticas mensais
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const monthlyStatsResult = await db
        .select({
          monthly_sales: sql`COALESCE(SUM(CAST(amount AS NUMERIC)), 0)`,
          monthly_transactions: sql`COUNT(*)`
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.merchant_id, merchant.id),
            sql`created_at >= ${startOfMonth.toISOString()}`
          )
        );

      const monthlyStats = monthlyStatsResult[0] || { monthly_sales: 0, monthly_transactions: 0 };

      // Buscar dados reais dos últimos 12 meses para salesHistory
      const monthlyHistoryResult = await db.execute(sql`
        SELECT 
          TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') as month_abbr,
          EXTRACT(MONTH FROM created_at) as month_num,
          COALESCE(SUM(CAST(amount AS NUMERIC)), 0) as monthly_sales
        FROM transactions 
        WHERE merchant_id = ${merchant.id}
          AND created_at >= CURRENT_DATE - INTERVAL '12 months'
          AND status = 'completed'
        GROUP BY DATE_TRUNC('month', created_at), EXTRACT(MONTH FROM created_at)
        ORDER BY month_num
      `);

      // Mapear nomes dos meses em português
      const monthNames: { [key: string]: string } = {
        'Jan': 'Jan', 'Feb': 'Fev', 'Mar': 'Mar', 'Apr': 'Abr',
        'May': 'Mai', 'Jun': 'Jun', 'Jul': 'Jul', 'Aug': 'Ago',
        'Sep': 'Set', 'Oct': 'Out', 'Nov': 'Nov', 'Dec': 'Dez'
      };

      // Converter dados do histórico mensal
      const salesHistory = monthlyHistoryResult.rows.length > 0 
        ? monthlyHistoryResult.rows.map((row: any) => ({
            month: monthNames[row.month_abbr] || row.month_abbr,
            sales: parseFloat(row.monthly_sales || "0")
          }))
        : [
            { month: "Jan", sales: 0 },
            { month: "Fev", sales: 0 },
            { month: "Mar", sales: 0 },
            { month: "Abr", sales: 0 }
          ];

      // Calcular dados para hoje
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayTransactions = recentTransactions.filter(tx => {
        if (!tx.created_at) return false;
        try {
          const txDate = new Date(tx.created_at);
          if (isNaN(txDate.getTime())) return false;
          txDate.setHours(0, 0, 0, 0);
          return txDate.getTime() === today.getTime();
        } catch (error) {
          console.error("Erro ao processar data da transação:", error);
          return false;
        }
      });
      
      const todayTotal = todayTransactions.reduce((sum, tx) => sum + parseFloat(tx.amount || "0"), 0);
      const todayAverage = todayTransactions.length > 0 ? todayTotal / todayTransactions.length : 0;

      const dashboardData = {
        salesSummary: {
          today: {
            total: todayTotal,
            transactions: todayTransactions.length,
            average: todayAverage,
            commission: todayTotal * 0.95 // 95% para o lojista
          }
        },
        weekSalesData: salesHistory.map(item => ({
          day: item.month,
          value: item.sales
        })),
        recentSales: recentTransactions.map(tx => ({
          id: tx.id,
          customer: tx.client_name || "Cliente",
          date: tx.created_at ? new Date(tx.created_at).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR'),
          amount: parseFloat(tx.amount || "0"),
          cashback: parseFloat(tx.cashback_amount || "0"),
          items: "1 item"
        })),
        topProducts: [
          { name: "Produto 1", sales: 10, total: 100 },
          { name: "Produto 2", sales: 8, total: 80 }
        ]
      };

      res.json(dashboardData);
    } catch (error) {
      console.error("Erro ao obter dashboard do merchant:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Obter produtos do comerciante
  app.get("/api/merchant/products", isAuthenticated, isUserType("merchant"), async (req: Request, res: Response) => {
    try {
      let userId = (req.user as any).id;
      
      // Em desenvolvimento, usar o lojista demo
      if (process.env.NODE_ENV === 'development') {
        const merchantUser = await storage.getUserByEmail("lojista@valecashback.com");
        if (merchantUser) {
          userId = merchantUser.id;
        }
      }
      
      // Buscar loja do merchant
      const [merchant] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.user_id, userId))
        .limit(1);

      if (!merchant) {
        console.log(`❌ Comerciante não encontrado para userId: ${userId}`);
        return res.status(404).json({ message: "Comerciante não encontrado" });
      }

      // Buscar produtos da loja
      const merchantProducts = await db
        .select()
        .from(products)
        .where(eq(products.merchant_id, merchant.id))
        .orderBy(desc(products.created_at));

      console.log(`📦 Encontrados ${merchantProducts.length} produtos para ${merchant.store_name}`);
      res.json(merchantProducts);
    } catch (error) {
      console.error("Erro ao obter produtos do comerciante:", error);
      res.status(500).json({ message: "Erro ao obter produtos do comerciante" });
    }
  });

  // Criar produto do comerciante
  app.post("/api/merchant/products", isAuthenticated, isUserType("merchant"), async (req: Request, res: Response) => {
    try {
      let userId = (req.user as any).id;
      const { name, description, price, category, inventory_count } = req.body;
      
      // Em desenvolvimento, usar o lojista demo
      if (process.env.NODE_ENV === 'development') {
        const merchantUser = await storage.getUserByEmail("lojista@valecashback.com");
        if (merchantUser) {
          userId = merchantUser.id;
        }
      }
      
      // Buscar loja do merchant
      const [merchant] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.user_id, userId))
        .limit(1);

      if (!merchant) {
        return res.status(404).json({ message: "Comerciante não encontrado" });
      }

      // Validações básicas
      if (!name || !price) {
        return res.status(400).json({ message: "Nome e preço são obrigatórios" });
      }

      // Criar produto
      const [newProduct] = await db
        .insert(products)
        .values({
          merchant_id: merchant.id,
          name,
          description: description || "",
          price: price.toString(),
          category: category || "Geral",
          inventory_count: inventory_count || 0,
          active: true
        })
        .returning();

      res.json({
        message: "Produto criado com sucesso",
        product: newProduct
      });
    } catch (error) {
      console.error("Erro ao criar produto:", error);
      res.status(500).json({ message: "Erro ao criar produto" });
    }
  });

  // Obter dados do perfil do comerciante
  app.get("/api/merchant/profile", isAuthenticated, isUserType("merchant"), async (req: Request, res: Response) => {
    try {
      let userId = (req.user as any).id;
      
      // Em desenvolvimento, usar o lojista demo
      if (process.env.NODE_ENV === 'development') {
        const merchantUser = await storage.getUserByEmail("lojista@valecashback.com");
        if (merchantUser) {
          userId = merchantUser.id;
        }
      }
      
      // Buscar dados do merchant e do usuário associado
      const [merchant] = await db
        .select({
          id: merchants.id,
          user_id: merchants.user_id,
          store_name: merchants.store_name,
          email: users.email,
          address: merchants.address,
          city: merchants.city,
          state: merchants.state,
          country: merchants.country,
          category: merchants.category,
          logo: merchants.logo,
          company_logo: merchants.company_logo,
          created_at: merchants.created_at,
          approved: merchants.approved,
          commission_rate: merchants.commission_rate
        })
        .from(merchants)
        .leftJoin(users, eq(merchants.user_id, users.id))
        .where(eq(merchants.user_id, userId))
        .limit(1);
      
      if (!merchant) {
        return res.status(404).json({ message: "Perfil de comerciante não encontrado" });
      }
      
      // Calcular estatísticas do merchant
      const salesData = await db
        .select({
          totalSales: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
          totalCashback: sql<string>`COALESCE(SUM(${transactions.cashback_amount}), 0)`,
          totalCustomers: sql<string>`COUNT(DISTINCT ${transactions.user_id})`
        })
        .from(transactions)
        .where(eq(transactions.merchant_id, merchant.id));
      
      const stats = salesData[0] || { totalSales: "0", totalCashback: "0", totalCustomers: "0" };
      
      // Retornar dados formatados para o frontend com campos que o frontend espera
      res.json({
        ...merchant,
        phone: "(11) 99999-9999",
        description: "Loja parceira do Vale Cashback com produtos de qualidade e ótimo atendimento.",
        business_hours: "Seg-Sex: 08:00-18:00, Sáb: 08:00-14:00",
        photo: null,
        owner: "Lojista Demo",
        invitation_code: "INVITE003",
        website: "www.loja.com.br",
        totalSales: parseFloat(stats.totalSales),
        totalCustomers: parseInt(stats.totalCustomers),
        totalCashbackIssued: parseFloat(stats.totalCashback)
      });
    } catch (error) {
      console.error("Erro ao obter perfil do comerciante:", error);
      res.status(500).json({ message: "Erro ao obter perfil do comerciante" });
    }
  });

  // Obter estatísticas do comerciante
  app.get("/api/merchant/stats", isAuthenticated, isUserType("merchant"), async (req: Request, res: Response) => {
    try {
      let userId = (req.user as any).id;
      
      // Em desenvolvimento, usar o lojista demo
      if (process.env.NODE_ENV === 'development') {
        const merchantUser = await storage.getUserByEmail("lojista@valecashback.com");
        if (merchantUser) {
          userId = merchantUser.id;
        }
      }
      
      const [merchant] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.user_id, userId))
        .limit(1);
      
      if (!merchant) {
        return res.status(404).json({ message: "Comerciante não encontrado" });
      }
      
      // Calcular estatísticas básicas
      const stats = await db
        .select({
          totalSales: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
          totalTransactions: sql<string>`COUNT(${transactions.id})`,
          totalCashback: sql<string>`COALESCE(SUM(${transactions.cashback_amount}), 0)`,
          totalCustomers: sql<string>`COUNT(DISTINCT ${transactions.user_id})`
        })
        .from(transactions)
        .where(eq(transactions.merchant_id, merchant.id));
      
      const result = stats[0] || { totalSales: "0", totalTransactions: "0", totalCashback: "0", totalCustomers: "0" };
      
      res.json({
        totalSales: parseFloat(result.totalSales),
        totalTransactions: parseInt(result.totalTransactions),
        totalCashback: parseFloat(result.totalCashback),
        totalCustomers: parseInt(result.totalCustomers)
      });
    } catch (error) {
      console.error("Erro ao obter estatísticas do comerciante:", error);
      res.status(500).json({ message: "Erro ao obter estatísticas do comerciante" });
    }
  });

  // Listar transações do comerciante
  app.get("/api/merchant/transactions", isAuthenticated, isUserType("merchant"), async (req: Request, res: Response) => {
    try {
      let userId = (req.user as any).id;
      
      // Em desenvolvimento, usar o lojista demo
      if (process.env.NODE_ENV === 'development') {
        const merchantUser = await storage.getUserByEmail("lojista@valecashback.com");
        if (merchantUser) {
          userId = merchantUser.id;
        }
      }
      
      const [merchant] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.user_id, userId))
        .limit(1);
      
      if (!merchant) {
        return res.status(404).json({ message: "Comerciante não encontrado" });
      }
      
      const merchantTransactions = await db
        .select({
          id: transactions.id,
          amount: transactions.amount,
          cashback_amount: transactions.cashback_amount,
          status: transactions.status,
          payment_method: transactions.payment_method,
          created_at: transactions.created_at,
          description: transactions.description,
          notes: transactions.notes,
          customer_name: users.name,
          customer_email: users.email
        })
        .from(transactions)
        .leftJoin(users, eq(transactions.user_id, users.id))
        .where(eq(transactions.merchant_id, merchant.id))
        .orderBy(desc(transactions.created_at));

      // Formatar dados com estatísticas
      const formattedTransactions = merchantTransactions.map(t => ({
        id: t.id,
        customer: t.customer_name || 'Cliente',
        date: t.created_at ? new Date(t.created_at).toISOString() : new Date().toISOString(),
        amount: parseFloat(t.amount?.toString() || '0'),
        cashback: parseFloat(t.cashback_amount?.toString() || '0'),
        payment_method: t.payment_method || 'cash',
        status: t.status || 'completed',
        description: t.description || '',
        notes: t.notes || ''
      }));

      // Calcular estatísticas
      const totalAmount = formattedTransactions.reduce((sum, t) => sum + t.amount, 0);
      const totalCashback = formattedTransactions.reduce((sum, t) => sum + t.cashback, 0);
      
      const statusCounts = formattedTransactions.reduce((acc: any[], t) => {
        const existing = acc.find(s => s.status === t.status);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ status: t.status, count: 1 });
        }
        return acc;
      }, []);

      const paymentMethodSummary = formattedTransactions.reduce((acc: any[], t) => {
        const existing = acc.find(p => p.method === t.payment_method);
        if (existing) {
          existing.sum += t.amount;
        } else {
          acc.push({ method: t.payment_method, sum: t.amount });
        }
        return acc;
      }, []);
      
      res.json({
        transactions: formattedTransactions,
        totalAmount,
        totalCashback,
        statusCounts,
        paymentMethodSummary
      });
    } catch (error) {
      console.error("Erro ao listar transações do comerciante:", error);
      res.status(500).json({ message: "Erro ao listar transações do comerciante" });
    }
  });

  // Obter indicações do comerciante
  app.get("/api/merchant/referrals", isAuthenticated, isUserType("merchant"), async (req: Request, res: Response) => {
    try {
      // Em desenvolvimento, usar o ID do lojista demo diretamente
      let userId = (req.user as any).id;
      if (process.env.NODE_ENV === 'development') {
        const merchantUser = await storage.getUserByEmail("lojista@valecashback.com");
        if (merchantUser) {
          userId = merchantUser.id;
        }
      }
      
      // Buscar loja do merchant
      const [merchant] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.user_id, userId))
        .limit(1);

      if (!merchant) {
        return res.status(404).json({ message: "Comerciante não encontrado" });
      }

      // Buscar indicações feitas pelo merchant
      const referralsResult = await db
        .select({
          id: referrals.id,
          referrer_id: referrals.referrer_id,
          referred_id: referrals.referred_id,
          bonus: referrals.bonus,
          status: referrals.status,
          created_at: referrals.created_at,
          referred_name: users.name,
          user_type: users.type,
          email: users.email,
          phone: users.phone,
          store_name: merchants.store_name
        })
        .from(referrals)
        .leftJoin(users, eq(referrals.referred_id, users.id))
        .leftJoin(merchants, eq(users.id, merchants.user_id))
        .where(eq(referrals.referrer_id, userId))
        .orderBy(desc(referrals.created_at))
        .limit(50);

      // Formatar lista de referências para o frontend
      const referralsList = referralsResult.map(ref => ({
        id: ref.id,
        name: ref.referred_name || 'Usuário registrado',
        store_name: ref.store_name || (ref.user_type === 'merchant' ? 'Loja sem nome' : ''),
        email: ref.email || 'Email não informado',
        phone: ref.phone || 'Telefone não informado',
        user_type: ref.user_type || 'unknown',
        date: ref.created_at,
        status: ref.status,
        commission: parseFloat(ref.bonus || '0').toFixed(2)
      }));

      // Calcular estatísticas
      const totalEarnedResult = await db
        .select({ total: sql<string>`COALESCE(SUM(CAST(${referrals.bonus} AS DECIMAL)), 0)` })
        .from(referrals)
        .where(and(eq(referrals.referrer_id, userId), eq(referrals.status, 'active')));
      
      const totalEarned = parseFloat(totalEarnedResult[0]?.total || '0');

      const approvedStoresResult = await db
        .select({ count: sql<string>`COUNT(*)` })
        .from(referrals)
        .leftJoin(users, eq(referrals.referred_id, users.id))
        .leftJoin(merchants, eq(users.id, merchants.user_id))
        .where(and(
          eq(referrals.referrer_id, userId),
          eq(users.type, 'merchant'),
          eq(merchants.approved, true)
        ));

      const pendingStoresResult = await db
        .select({ count: sql<string>`COUNT(*)` })
        .from(referrals)
        .leftJoin(users, eq(referrals.referred_id, users.id))
        .leftJoin(merchants, eq(users.id, merchants.user_id))
        .where(and(
          eq(referrals.referrer_id, userId),
          eq(users.type, 'merchant'),
          eq(merchants.approved, false)
        ));

      // Buscar usuário para obter código de indicação
      const user = await storage.getUser(userId);
      
      res.json({
        referralCode: user?.invitation_code || "LJ123",
        referralUrl: `https://valecashback.com/parceiro/${user?.invitation_code || "LJ123"}`,
        referralsCount: referralsList.length,
        approvedStores: parseInt(approvedStoresResult[0]?.count || '0'),
        pendingStores: parseInt(pendingStoresResult[0]?.count || '0'),
        totalEarned: totalEarned.toFixed(2),
        commission: "1.0",
        monthlyEarnings: [
          { month: "Jan", value: 0 },
          { month: "Fev", value: 0 },
          { month: "Mar", value: 0 },
          { month: "Abr", value: 0 },
          { month: "Mai", value: 0 },
          { month: "Jun", value: totalEarned }
        ],
        referrals: referralsList
      });
    } catch (error) {
      console.error("Erro ao buscar indicações do comerciante:", error);
      res.status(500).json({ message: "Erro ao buscar indicações do comerciante" });
    }
  });

  // Gerar QR Code de pagamento para merchant
  app.post("/api/merchant/generate-payment", async (req: Request, res: Response) => {
    try {
      const { amount, description } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Valor inválido" });
      }
      
      // Verificar valor mínimo de 5 dólares
      if (parseFloat(amount) < 5) {
        return res.status(400).json({ error: "O valor mínimo para pagamentos é de $5" });
      }
      
      // Em desenvolvimento, usar o lojista demo diretamente
      const merchantUser = await storage.getUserByEmail("lojista@valecashback.com");
      if (!merchantUser) {
        return res.status(404).json({ error: "Usuário comerciante não encontrado" });
      }
      
      // Buscar loja do merchant
      const [merchant] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.user_id, merchantUser.id))
        .limit(1);

      if (!merchant) {
        return res.status(404).json({ error: "Comerciante não encontrado" });
      }
      
      // Criar um ID único para o QR code
      const paymentId = crypto.randomUUID();
      
      // Criar objeto com os dados do pagamento
      const paymentData = {
        type: "payment_request",
        id: paymentId,
        merchant_id: merchant.id,
        merchant_name: merchant.store_name,
        amount: parseFloat(amount),
        description: description || "Pagamento Vale Cashback",
        timestamp: new Date().toISOString(),
      };
      
      // Salvar o QR code no banco de dados
      const [qrCode] = await db
        .insert(qrCodes)
        .values({
          code: paymentId,
          user_id: merchantUser.id,
          data: JSON.stringify(paymentData),
          amount: amount.toString(),
          description: description || "Pagamento Vale Cashback",
          expires_at: new Date(Date.now() + 1000 * 60 * 15), // 15 minutos de validade
          status: "active",
          used: false
        })
        .returning();

      res.json({
        success: true,
        qr_code: qrCode,
        payment_data: paymentData,
        expires_at: new Date(Date.now() + 1000 * 60 * 15).toISOString()
      });
    } catch (error) {
      console.error("Erro ao gerar QR code de pagamento:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // ======== ROTAS DE CLIENTE ========
  
  // Obter saldo de cashback do cliente
  app.get("/api/client/cashback", isAuthenticated, isUserType("client"), async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      
      const [cashback] = await db
        .select()
        .from(cashbacks)
        .where(eq(cashbacks.user_id, userId))
        .limit(1);
      
      if (!cashback) {
        const [newCashback] = await db
          .insert(cashbacks)
          .values({
            user_id: userId,
            balance: "0.00",
            total_earned: "0.00",
            total_spent: "0.00"
          })
          .returning();
        
        return res.json(newCashback);
      }
      
      res.json(cashback);
    } catch (error) {
      console.error("Erro ao obter saldo de cashback:", error);
      res.status(500).json({ message: "Erro ao obter saldo de cashback" });
    }
  });

  // API removida - usando a versão completa mais abaixo

  // ======== ROTAS DE TRANSAÇÕES ========
  
  // Criar nova transação
  app.post("/api/transactions", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { merchant_id, amount, payment_method, items } = req.body;
      const userId = (req.user as any).id;
      
      const [merchant] = await db
        .select()
        .from(merchants)
        .where(and(eq(merchants.id, merchant_id), eq(merchants.approved, true)))
        .limit(1);
      
      if (!merchant) {
        return res.status(404).json({ message: "Comerciante não encontrado ou não aprovado" });
      }
      
      const transactionAmount = parseFloat(amount);
      const cashbackAmount = await calculateClientCashback(transactionAmount);
      
      // Cálculos automáticos de taxa da plataforma
      const platformFee = transactionAmount * 0.05;    // 5% taxa da plataforma
      const merchantReceives = transactionAmount * 0.95; // 95% o lojista recebe
      const netPlatformProfit = platformFee - cashbackAmount; // Lucro líquido da plataforma
      
      const [newTransaction] = await db
        .insert(transactions)
        .values({
          user_id: userId,
          merchant_id,
          amount: amount.toString(),
          cashback_amount: cashbackAmount.toString(),
          status: TransactionStatus.COMPLETED,
          payment_method: payment_method || PaymentMethod.CREDIT_CARD,
          description: `Compra em ${merchant.store_name}`
        })
        .returning();
      
      if (items && Array.isArray(items) && items.length > 0) {
        const transactionItemsData = items.map(item => ({
          transaction_id: newTransaction.id,
          product_name: item.name || "Produto",
          quantity: item.quantity || 1,
          price: item.price?.toString() || "0.00"
        }));
        
        await db.insert(transactionItems).values(transactionItemsData);
      }
      
      const [existingCashback] = await db
        .select()
        .from(cashbacks)
        .where(eq(cashbacks.user_id, userId))
        .limit(1);
      
      if (existingCashback) {
        const newBalance = parseFloat(existingCashback.balance) + cashbackAmount;
        const newTotalEarned = parseFloat(existingCashback.total_earned) + cashbackAmount;
        
        await db
          .update(cashbacks)
          .set({
            balance: newBalance.toString(),
            total_earned: newTotalEarned.toString()
          })
          .where(eq(cashbacks.user_id, userId));
      } else {
        await db
          .insert(cashbacks)
          .values({
            user_id: userId,
            balance: cashbackAmount.toString(),
            total_earned: cashbackAmount.toString(),
            total_spent: "0.00"
          });
      }
      
      res.json({
        message: "Transação criada com sucesso",
        transaction: newTransaction,
        cashback_earned: cashbackAmount,
        financial_breakdown: {
          transaction_value: transactionAmount,
          platform_fee: platformFee,
          merchant_receives: merchantReceives,
          cashback_to_client: cashbackAmount,
          net_platform_profit: netPlatformProfit,
          breakdown_percentage: {
            platform_fee: "5.00%",
            merchant_receives: "95.00%",
            cashback_rate: "2.00%",
            net_profit_rate: "3.00%"
          }
        }
      });
    } catch (error) {
      console.error("Erro ao criar transação:", error);
      res.status(500).json({ message: "Erro ao criar transação" });
    }
  });

  // ======== ROTAS PÚBLICAS DE LOJAS ========
  
  // Listar todas as lojas para clientes (público)
  app.get("/api/stores", async (req: Request, res: Response) => {
    try {
      const storesResult = await db
        .select({
          id: merchants.id,
          store_name: merchants.store_name,
          logo: merchants.logo,
          category: merchants.category,
          address: merchants.address,
          city: merchants.city,
          state: merchants.state,
          commission_rate: merchants.commission_rate,
          created_at: merchants.created_at,
          user_id: users.id,
          email: users.email,
          phone: users.phone,
          owner_name: users.name
        })
        .from(merchants)
        .innerJoin(users, eq(merchants.user_id, users.id))
        .where(eq(merchants.approved, true))
        .orderBy(merchants.store_name);
      
      // Formatar dados para o frontend
      const stores = storesResult.map(store => ({
        id: store.id,
        userId: store.user_id,
        store_name: store.store_name,
        name: store.store_name,
        logo: store.logo,
        category: store.category || 'Geral',
        address: store.address,
        city: store.city,
        state: store.state,
        commissionRate: store.commission_rate,
        email: store.email,
        phone: store.phone,
        createdAt: store.created_at,
        rating: 4.2, // Rating padrão
        transactions: Math.floor(Math.random() * 100) + 10, // Número de transações simulado
        volume: Math.floor(Math.random() * 50000) + 5000 // Volume simulado
      }));
      
      res.json(stores);
    } catch (error) {
      console.error("Erro ao buscar lojas:", error);
      res.status(500).json({ message: "Erro ao buscar lojas" });
    }
  });

  // ======== ROTAS DE RELATÓRIOS ========
  
  // Relatório dashboard admin com dados completos
  app.get("/api/admin/dashboard", async (req: Request, res: Response) => {
    try {
      const statsResult = await db.execute(sql`
        SELECT 
          (SELECT COUNT(*) FROM users) as total_users,
          (SELECT COUNT(*) FROM users WHERE type = 'client') as total_clients,
          (SELECT COUNT(*) FROM users WHERE type = 'merchant') as total_merchants_users,
          (SELECT COUNT(*) FROM users WHERE type = 'admin') as total_admins,
          (SELECT COUNT(*) FROM merchants WHERE approved = true) as approved_merchants,
          (SELECT COUNT(*) FROM products) as total_products,
          (SELECT COUNT(*) FROM transactions) as total_transactions,
          (SELECT COUNT(*) FROM transactions WHERE status = 'completed') as completed_transactions,
          (SELECT COALESCE(SUM(CAST(amount AS DECIMAL)), 0) FROM transactions WHERE status = 'completed') as total_volume,
          (SELECT COALESCE(SUM(CAST(cashback_amount AS DECIMAL)), 0) FROM transactions WHERE status = 'completed') as total_cashback_given,
          (SELECT COALESCE(SUM(CAST(balance AS DECIMAL)), 0) FROM cashbacks) as total_cashback_balance,
          (SELECT COUNT(*) FROM transactions WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as monthly_transactions,
          (SELECT COALESCE(SUM(CAST(amount AS DECIMAL)), 0) FROM transactions WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as monthly_volume
      `);
      const stats = statsResult.rows[0] as any;
      
      // Top merchants by volume
      const topMerchants = await db.execute(sql`
        SELECT 
          u.name as store_name,
          COUNT(t.id) as transaction_count,
          COALESCE(SUM(CAST(t.amount AS DECIMAL)), 0) as total_volume
        FROM merchants m
        JOIN users u ON m.user_id = u.id
        LEFT JOIN transactions t ON m.id = t.merchant_id AND t.status = 'completed'
        GROUP BY m.id, u.name
        ORDER BY total_volume DESC
        LIMIT 5
      `);
      
      // Recent transactions
      const recentTransactions = await db.execute(sql`
        SELECT 
          t.id,
          t.amount,
          t.cashback_amount,
          t.description,
          t.created_at,
          u.name as client_name,
          m.name as merchant_name
        FROM transactions t
        JOIN users u ON t.user_id = u.id
        JOIN merchants merchant_table ON t.merchant_id = merchant_table.id
        JOIN users m ON merchant_table.user_id = m.id
        WHERE t.status = 'completed'
        ORDER BY t.created_at DESC
        LIMIT 10
      `);
      
      // Daily transaction trends (last 7 days)
      const dailyTrends = await db.execute(sql`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as transaction_count,
          COALESCE(SUM(CAST(amount AS DECIMAL)), 0) as daily_volume
        FROM transactions 
        WHERE status = 'completed' 
          AND created_at >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `);

      res.json({
        overview: stats,
        top_merchants: topMerchants.rows,
        recent_transactions: recentTransactions.rows,
        daily_trends: dailyTrends.rows,
        system_status: {
          active: true,
          last_updated: new Date(),
          version: "ALEX26-COMPLETE"
        }
      });
    } catch (error) {
      console.error("Erro ao obter dados do dashboard:", error);
      res.status(500).json({ message: "Erro ao obter dados do dashboard" });
    }
  });

  // Inicializar configurações de comissão se não existirem
  async function initializeCommissionSettings() {
    try {
      const settings = await db.select().from(commissionSettings).limit(1);
      
      if (settings.length === 0) {
        await db.insert(commissionSettings).values({
          platform_fee: DEFAULT_SETTINGS.platformFee,
          merchant_commission: DEFAULT_SETTINGS.merchantCommission,
          client_cashback: DEFAULT_SETTINGS.clientCashback,
          referral_bonus: DEFAULT_SETTINGS.referralBonus,
          min_withdrawal: DEFAULT_SETTINGS.minWithdrawal,
          max_cashback_bonus: DEFAULT_SETTINGS.maxCashbackBonus,
          withdrawal_fee: DEFAULT_SETTINGS.withdrawalFee,
        });
        console.log("Configurações de comissão inicializadas com valores padrão");
      }
    } catch (error) {
      console.error("Erro ao inicializar configurações de comissão:", error);
    }
  }

  // Executar inicialização
  await initializeCommissionSettings();

  // ======== ROTAS DE QR CODE ========
  
  // Gerar QR Code para pagamento (comerciante)
  app.post("/api/qr-codes", isAuthenticated, isUserType("merchant"), async (req: Request, res: Response) => {
    try {
      const { amount, description } = req.body;
      let userId = (req.user as any).id;
      
      // Em desenvolvimento, usar o lojista demo
      if (process.env.NODE_ENV === 'development') {
        const merchantUser = await storage.getUserByEmail("lojista@valecashback.com");
        if (merchantUser) {
          userId = merchantUser.id;
        }
      }
      
      const [merchant] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.user_id, userId))
        .limit(1);
      
      if (!merchant) {
        return res.status(404).json({ message: "Comerciante não encontrado" });
      }
      
      const qrCode = crypto.randomBytes(16).toString('hex');
      const expirationDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      res.json({
        message: "QR Code gerado com sucesso",
        qr_data: {
          code: qrCode,
          merchant_id: merchant.id,
          merchant_name: merchant.store_name,
          amount: amount,
          description: description || "Pagamento",
          expires_at: expirationDate
        }
      });
    } catch (error) {
      console.error("Erro ao gerar QR Code:", error);
      res.status(500).json({ message: "Erro ao gerar QR Code" });
    }
  });

  // Processar pagamento via QR Code
  app.post("/api/qr-codes/pay", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { merchant_id, amount, payment_method } = req.body;
      const userId = (req.user as any).id;
      
      const [merchant] = await db
        .select()
        .from(merchants)
        .where(and(eq(merchants.id, merchant_id), eq(merchants.approved, true)))
        .limit(1);
      
      if (!merchant) {
        return res.status(404).json({ message: "Comerciante não encontrado ou não aprovado" });
      }
      
      const paymentAmount = parseFloat(amount);
      const cashbackAmount = await calculateClientCashback(paymentAmount);
      
      const [newTransaction] = await db
        .insert(transactions)
        .values({
          user_id: userId,
          merchant_id,
          amount: paymentAmount.toString(),
          cashback_amount: cashbackAmount.toString(),
          status: TransactionStatus.COMPLETED,
          payment_method: payment_method || PaymentMethod.PIX,
          description: `Pagamento QR - ${merchant.store_name}`
        })
        .returning();
      
      const [existingCashback] = await db
        .select()
        .from(cashbacks)
        .where(eq(cashbacks.user_id, userId))
        .limit(1);
      
      if (existingCashback) {
        const newBalance = parseFloat(existingCashback.balance) + cashbackAmount;
        const newTotalEarned = parseFloat(existingCashback.total_earned) + cashbackAmount;
        
        await db
          .update(cashbacks)
          .set({
            balance: newBalance.toString(),
            total_earned: newTotalEarned.toString()
          })
          .where(eq(cashbacks.user_id, userId));
      } else {
        await db
          .insert(cashbacks)
          .values({
            user_id: userId,
            balance: cashbackAmount.toString(),
            total_earned: cashbackAmount.toString(),
            total_spent: "0.00"
          });
      }
      
      res.json({
        message: "Pagamento processado com sucesso",
        transaction: newTransaction,
        cashback_earned: cashbackAmount
      });
    } catch (error) {
      console.error("Erro ao processar pagamento QR:", error);
      res.status(500).json({ message: "Erro ao processar pagamento QR" });
    }
  });

  // ======== ROTAS DE REGISTRO E INDICAÇÃO ========
  
  // Obter código de indicação do usuário
  app.get("/api/referrals/code", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      let invitationCode = user.invitation_code;
      if (!invitationCode) {
        invitationCode = crypto.randomBytes(6).toString('hex').toUpperCase();
        
        await db
          .update(users)
          .set({ invitation_code: invitationCode })
          .where(eq(users.id, userId));
      }
      
      res.json({
        invitation_code: invitationCode,
        referral_link: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/register?ref=${invitationCode}`
      });
    } catch (error) {
      console.error("Erro ao obter código de indicação:", error);
      res.status(500).json({ message: "Erro ao obter código de indicação" });
    }
  });

  // ======== ROTAS DE SAQUES AVANÇADAS ========
  
  // Solicitar saque com validação completa
  app.post("/api/withdrawals/request", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { amount, bank_details } = req.body;
      const userId = (req.user as any).id;
      
      const [cashback] = await db
        .select()
        .from(cashbacks)
        .where(eq(cashbacks.user_id, userId))
        .limit(1);
      
      if (!cashback) {
        return res.status(404).json({ message: "Saldo de cashback não encontrado" });
      }
      
      const requestAmount = parseFloat(amount);
      const availableBalance = parseFloat(cashback.balance);
      
      if (requestAmount > availableBalance) {
        return res.status(400).json({ message: "Saldo insuficiente para saque" });
      }
      
      const [settings] = await db.select().from(commissionSettings).limit(1);
      const minWithdrawal = settings ? parseFloat(settings.min_withdrawal) : 20;
      const withdrawalFee = settings ? parseFloat(settings.withdrawal_fee) / 100 : 0.05;
      
      if (requestAmount < minWithdrawal) {
        return res.status(400).json({ 
          message: `Valor mínimo para saque é R$ ${minWithdrawal.toFixed(2)}` 
        });
      }
      
      const feeAmount = requestAmount * withdrawalFee;
      const netAmount = requestAmount - feeAmount;
      
      res.json({
        message: "Simulação de saque processada",
        withdrawal_simulation: {
          requested_amount: requestAmount,
          fee_amount: feeAmount,
          net_amount: netAmount,
          available_balance: availableBalance,
          bank_details: bank_details || "Não fornecido"
        }
      });
    } catch (error) {
      console.error("Erro ao processar saque:", error);
      res.status(500).json({ message: "Erro ao processar saque" });
    }
  });

  // API para registrar vendas do comerciante
  // Obter vendas do comerciante
  app.get("/api/merchant/sales", isAuthenticated, isUserType("merchant"), async (req: Request, res: Response) => {
    try {
      let merchantUserId = (req.user as any).id;
      
      // Em desenvolvimento, usar o lojista demo
      if (process.env.NODE_ENV === 'development') {
        const merchantUser = await storage.getUserByEmail("lojista@valecashback.com");
        if (merchantUser) {
          merchantUserId = merchantUser.id;
        }
      }

      // Buscar loja do merchant autenticado
      const [merchant] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.user_id, merchantUserId))
        .limit(1);

      if (!merchant) {
        console.log(`❌ Comerciante não encontrado para userId: ${merchantUserId}`);
        return res.status(404).json({ error: "Comerciante não encontrado" });
      }

      console.log(`🏪 Buscando vendas para merchant: ${merchant.store_name} (ID: ${merchant.id})`);

      // Buscar transações do merchant com detalhes do cliente
      const salesData = await db
        .select({
          id: transactions.id,
          amount: transactions.amount,
          cashback_amount: transactions.cashback_amount,
          payment_method: transactions.payment_method,
          status: transactions.status,
          description: transactions.description,
          created_at: transactions.created_at,
          updated_at: transactions.updated_at,
          notes: transactions.notes,
          source: transactions.source,
          client_name: users.name,
          client_email: users.email
        })
        .from(transactions)
        .leftJoin(users, eq(transactions.user_id, users.id))
        .where(eq(transactions.merchant_id, merchant.id))
        .orderBy(desc(transactions.created_at));

      console.log(`📊 Encontradas ${salesData.length} transações`);

      // Formatar dados das vendas com datas e valores corretos
      const formattedSales = salesData.map(sale => {
        // Garantir que amount seja numérico
        const saleAmount = sale.amount ? parseFloat(sale.amount.toString()) : 0;
        const cashbackAmount = sale.cashback_amount ? parseFloat(sale.cashback_amount.toString()) : 0;
        
        // Formatar data para o formato brasileiro
        let formattedDate = '';
        if (sale.created_at) {
          try {
            const date = new Date(sale.created_at);
            formattedDate = date.toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'America/Sao_Paulo'
            });
          } catch (error) {
            formattedDate = new Date().toLocaleString('pt-BR');
          }
        } else {
          formattedDate = new Date().toLocaleString('pt-BR');
        }

        return {
          id: sale.id,
          customer: sale.client_name || 'Cliente',
          date: formattedDate,
          amount: saleAmount,
          cashback: cashbackAmount,
          payment_method: sale.payment_method || 'cash',
          status: sale.status || 'completed',
          description: sale.description,
          notes: sale.notes
        };
      });

      console.log(`📊 Retornando ${formattedSales.length} vendas para o lojista ${merchant.store_name}`);

      res.json(formattedSales);
    } catch (error) {
      console.error("Erro ao buscar vendas do comerciante:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Atualizar status de transação
  app.put("/api/merchant/sales/:id/status", async (req: Request, res: Response) => {
    try {
      const transactionId = parseInt(req.params.id);
      const { status, reason } = req.body;

      if (!status) {
        return res.status(400).json({ error: "Status é obrigatório" });
      }

      // Validar status permitidos
      const allowedStatuses = ['completed', 'cancelled', 'refunded', 'pending'];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ error: "Status inválido" });
      }

      // Atualizar a transação
      const [updatedTransaction] = await db
        .update(transactions)
        .set({
          status,
          updated_at: new Date(),
          notes: reason || null
        })
        .where(eq(transactions.id, transactionId))
        .returning();

      if (!updatedTransaction) {
        return res.status(404).json({ error: "Transação não encontrada" });
      }

      res.json({
        success: true,
        transaction: updatedTransaction,
        message: `Transação ${status} com sucesso`
      });
    } catch (error) {
      console.error("Erro ao atualizar status da transação:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Atualizar dados de transação
  app.put("/api/merchant/sales/:id", async (req: Request, res: Response) => {
    try {
      const transactionId = parseInt(req.params.id);
      const { notes, payment_method } = req.body;

      const updateData: any = {
        updated_at: new Date()
      };

      if (notes !== undefined) updateData.notes = notes;
      if (payment_method !== undefined) updateData.payment_method = payment_method;

      // Atualizar a transação
      const [updatedTransaction] = await db
        .update(transactions)
        .set(updateData)
        .where(eq(transactions.id, transactionId))
        .returning();

      if (!updatedTransaction) {
        return res.status(404).json({ error: "Transação não encontrada" });
      }

      res.json({
        success: true,
        transaction: updatedTransaction,
        message: "Transação atualizada com sucesso"
      });
    } catch (error) {
      console.error("Erro ao atualizar transação:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/merchant/sales", isAuthenticated, isUserType("merchant"), async (req: Request, res: Response) => {
    try {
      const { customerId, total, paymentMethod, notes, subtotal, discount, cashback, items, manualAmount } = req.body;
      
      console.log("🛒 Dados da venda recebidos:", req.body);

      let merchantUserId = (req.user as any).id;
      
      // Em desenvolvimento, usar o lojista demo
      if (process.env.NODE_ENV === 'development') {
        const merchantUser = await storage.getUserByEmail("lojista@valecashback.com");
        if (merchantUser) {
          merchantUserId = merchantUser.id;
        }
      }

      console.log(`🛒 Nova venda iniciada - Lojista ID: ${merchantUserId}, Cliente ID: ${customerId}, Total: $${total}`);

      // Validar dados obrigatórios
      if (!customerId) {
        console.error("Cliente não informado:", { customerId });
        return res.status(400).json({ message: "Cliente é obrigatório" });
      }

      if (!total || total <= 0) {
        console.error("Valor inválido:", { total, manualAmount });
        return res.status(400).json({ message: "Valor da venda deve ser maior que zero" });
      }

      // Buscar dados do merchant
      const [merchant] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.user_id, merchantUserId));

      if (!merchant) {
        return res.status(404).json({ message: "Comerciante não encontrado" });
      }

      // Buscar dados do cliente
      const [customer] = await db
        .select()
        .from(users)
        .where(eq(users.id, customerId));

      if (!customer) {
        return res.status(404).json({ message: "Cliente não encontrado" });
      }

      // Calcular valores
      const saleAmount = parseFloat(total.toString());
      const cashbackAmount = saleAmount * 0.02; // 2% cashback para cliente
      const platformFee = saleAmount * 0.05; // 5% taxa da plataforma
      
      console.log(`💾 Registrando venda - Cliente: ${customerId}, Valor: $${saleAmount.toFixed(2)}, Cashback: $${cashbackAmount.toFixed(2)}, Taxa Plataforma: $${platformFee.toFixed(2)}`);
      
      // Criar transação diretamente no banco
      const insertResult = await db.execute(sql`
        INSERT INTO transactions (
          user_id, merchant_id, amount, cashback_amount, 
          status, payment_method, description, source,
          created_at, updated_at
        ) VALUES (
          ${customerId}, ${merchant.id}, ${saleAmount}, ${cashbackAmount},
          'completed', ${paymentMethod || 'cash'}, 
          ${`Compra em ${merchant.store_name}`}, 'manual_sale',
          NOW(), NOW()
        ) RETURNING id
      `);

      // Buscar a transação criada
      let transactionId;
      if ((insertResult as any).rows && (insertResult as any).rows.length > 0) {
        transactionId = (insertResult as any).rows[0].id;
      } else if (Array.isArray(insertResult) && insertResult.length > 0) {
        transactionId = (insertResult as any)[0].id;
      } else {
        transactionId = (insertResult as any).id;
      }
        
      if (!transactionId) {
        throw new Error("Falha ao criar transação");
      }

      console.log(`✅ Transação criada com ID: ${transactionId}`);

      // Processar cashback do cliente (2% do valor total)
      console.log(`💰 Processando cashback do cliente: R$ ${cashbackAmount.toFixed(2)} para ${customer.name}`);
      
      await db.execute(sql`
        INSERT INTO cashbacks (user_id, balance, total_earned, total_spent, updated_at)
        VALUES (${customerId}, ${cashbackAmount}, ${cashbackAmount}, 0.00, NOW())
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          balance = CAST(cashbacks.balance AS DECIMAL) + ${cashbackAmount},
          total_earned = CAST(cashbacks.total_earned AS DECIMAL) + ${cashbackAmount},
          updated_at = NOW()
      `);
      console.log(`✅ Cashback do cliente processado: +R$ ${cashbackAmount.toFixed(2)}`);

      // Processar cashback de indicação se aplicável
      if (customer.referred_by) {
        const referralBonus = saleAmount * 0.01; // 1% para indicador
        await db.execute(sql`
          INSERT INTO cashbacks (user_id, balance, total_earned, total_spent, updated_at)
          VALUES (${customer.referred_by}, ${referralBonus}, ${referralBonus}, 0.00, NOW())
          ON CONFLICT (user_id) 
          DO UPDATE SET 
            balance = CAST(cashbacks.balance AS DECIMAL) + ${referralBonus},
            total_earned = CAST(cashbacks.total_earned AS DECIMAL) + ${referralBonus},
            updated_at = NOW()
        `);
        console.log(`👥 Bônus de indicação processado: R$ ${referralBonus.toFixed(2)}`);
      }

      console.log(`✅ Venda processada com sucesso: ID ${transactionId}`);

      res.json({
        success: true,
        message: "Venda registrada com sucesso!",
        transaction: {
          id: transactionId,
          customer: customer.name,
          amount: saleAmount,
          cashback: cashbackAmount,
          status: "completed"
        }
      });

    } catch (error) {
      console.error("Erro detalhado ao registrar venda:", error);
      console.error("Stack trace:", (error as any).stack);
      console.error("Request body:", req.body);
      res.status(500).json({ message: "Erro ao registrar venda", details: (error as any).message });
    }
  });

  // API para buscar clientes do comerciante
  app.get("/api/merchant/customers", isAuthenticated, isUserType("merchant"), async (req: Request, res: Response) => {
    try {
      const { term, searchBy } = req.query;
      
      if (!term || typeof term !== 'string' || term.length < 2) {
        return res.json([]);
      }
      
      const searchTerm = `%${term.toLowerCase()}%`;
      
      // Buscar clientes baseado no critério de pesquisa usando campos corretos
      let customers;
      
      if (searchBy === 'phone') {
        customers = await db.execute(sql`
          SELECT 
            id, name, email, phone, referred_by, referral_code
          FROM users 
          WHERE type = 'client' 
            AND LOWER(phone) LIKE ${searchTerm}
          ORDER BY name
          LIMIT 50
        `);
      } else if (searchBy === 'email') {
        customers = await db.execute(sql`
          SELECT 
            id, name, email, phone, referred_by, referral_code
          FROM users 
          WHERE type = 'client' 
            AND LOWER(email) LIKE ${searchTerm}
          ORDER BY name
          LIMIT 50
        `);
      } else if (searchBy === 'code') {
        customers = await db.execute(sql`
          SELECT 
            id, name, email, phone, referred_by, referral_code
          FROM users 
          WHERE type = 'client' 
            AND LOWER(referral_code) LIKE ${searchTerm}
          ORDER BY name
          LIMIT 50
        `);
      } else {
        // Busca padrão por nome
        customers = await db.execute(sql`
          SELECT 
            id, name, email, phone, referred_by, referral_code
          FROM users 
          WHERE type = 'client' 
            AND LOWER(name) LIKE ${searchTerm}
          ORDER BY name
          LIMIT 50
        `);
      }
      
      // Formatar dados para o frontend
      const formattedCustomers = customers.rows.map((customer: any) => ({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        cpfCnpj: null,
        referredBy: customer.referred_by,
        referral_code: customer.referral_code
      }));
      
      res.json(formattedCustomers);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
      res.status(500).json({ message: "Erro ao buscar clientes" });
    }
  });

  // ======== ROTAS DE DASHBOARD LOJISTA ========
  
  // Dashboard do lojista com dados reais
  app.get("/api/merchant/dashboard", isAuthenticated, isUserType("merchant"), async (req: Request, res: Response) => {
    try {
      let userId = (req.user as any).id;
      
      // Em desenvolvimento, usar o lojista demo
      if (process.env.NODE_ENV === 'development') {
        const merchantUser = await storage.getUserByEmail("lojista@valecashback.com");
        if (merchantUser) {
          userId = merchantUser.id;
        }
      }
      
      // Buscar dados do comerciante
      const [merchant] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.user_id, userId))
        .limit(1);
      
      if (!merchant) {
        return res.status(404).json({ message: "Comerciante não encontrado" });
      }
      
      // Vendas do dia atual
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayStats = await db.execute(sql`
        SELECT 
          COUNT(*) as transaction_count,
          COALESCE(SUM(CAST(amount AS DECIMAL)), 0) as total_amount,
          COALESCE(AVG(CAST(amount AS DECIMAL)), 0) as average_amount,
          COALESCE(SUM(CAST(cashback_amount AS DECIMAL)), 0) as total_cashback
        FROM transactions 
        WHERE merchant_id = ${merchant.id} 
          AND created_at >= ${today.toISOString()}
          AND status = 'completed'
      `);
      
      // Vendas dos últimos 7 dias
      const weekStats = await db.execute(sql`
        SELECT 
          DATE(created_at) as date,
          COALESCE(SUM(CAST(amount AS DECIMAL)), 0) as daily_total
        FROM transactions 
        WHERE merchant_id = ${merchant.id} 
          AND created_at >= CURRENT_DATE - INTERVAL '7 days'
          AND status = 'completed'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `);
      
      // Últimas vendas
      const recentSales = await db.execute(sql`
        SELECT 
          t.id,
          t.amount,
          t.cashback_amount,
          t.description,
          t.created_at,
          u.name as customer_name
        FROM transactions t
        JOIN users u ON t.user_id = u.id
        WHERE t.merchant_id = ${merchant.id}
          AND t.status = 'completed'
        ORDER BY t.created_at DESC
        LIMIT 10
      `);
      
      // Produtos mais vendidos
      const topProducts = await db.execute(sql`
        SELECT 
          p.name,
          COUNT(ti.id) as sales_count,
          COALESCE(SUM(CAST(ti.quantity AS DECIMAL) * CAST(ti.price AS DECIMAL)), 0) as total_revenue
        FROM products p
        LEFT JOIN transaction_items ti ON p.id = ti.product_id
        LEFT JOIN transactions t ON ti.transaction_id = t.id
        WHERE p.merchant_id = ${merchant.id}
          AND (t.status = 'completed' OR t.status IS NULL)
        GROUP BY p.id, p.name
        ORDER BY sales_count DESC
        LIMIT 5
      `);
      
      const todayData = todayStats.rows[0] as any;
      
      res.json({
        salesSummary: {
          today: {
            total: parseFloat(todayData?.total_amount || "0"),
            transactions: parseInt(todayData?.transaction_count || "0"),
            average: parseFloat(todayData?.average_amount || "0"),
            commission: parseFloat(todayData?.total_cashback || "0")
          }
        },
        weekSalesData: weekStats.rows.map((row: any) => ({
          day: new Date(row.date).toLocaleDateString('pt-BR', { weekday: 'short' }),
          value: parseFloat(row.daily_total || "0")
        })),
        recentSales: recentSales.rows.map((sale: any) => ({
          id: sale.id,
          customer: sale.customer_name || "Cliente",
          date: new Date(sale.created_at).toLocaleDateString('pt-BR'),
          amount: parseFloat(sale.amount || "0"),
          cashback: parseFloat(sale.cashback_amount || "0"),
          items: sale.description || "Compra"
        })),
        topProducts: topProducts.rows.map((product: any) => ({
          name: product.name,
          sales: parseInt(product.sales_count || "0"),
          total: parseFloat(product.total_revenue || "0")
        }))
      });
    } catch (error) {
      console.error("Erro ao buscar dashboard do lojista:", error);
      res.status(500).json({ message: "Erro ao carregar dashboard do lojista" });
    }
  });

  // ======== ROTAS DE PRODUTOS ========
  
  // Listar produtos do comerciante
  app.get("/api/merchant/products", isAuthenticated, isUserType("merchant"), async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      
      const [merchant] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.user_id, userId))
        .limit(1);
      
      if (!merchant) {
        return res.status(404).json({ message: "Comerciante não encontrado" });
      }
      
      const merchantProducts = await db
        .select()
        .from(products)
        .where(eq(products.merchant_id, merchant.id))
        .orderBy(desc(products.created_at));
      
      res.json(merchantProducts);
    } catch (error) {
      console.error("Erro ao listar produtos:", error);
      res.status(500).json({ message: "Erro ao listar produtos" });
    }
  });

  // Adicionar produto
  app.post("/api/merchant/products", isAuthenticated, isUserType("merchant"), async (req: Request, res: Response) => {
    try {
      const { name, description, price, category } = req.body;
      const userId = (req.user as any).id;
      
      const [merchant] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.user_id, userId))
        .limit(1);
      
      if (!merchant) {
        return res.status(404).json({ message: "Comerciante não encontrado" });
      }
      
      const [newProduct] = await db
        .insert(products)
        .values({
          merchant_id: merchant.id,
          name: name || "Produto",
          description: description || "",
          price: price?.toString() || "0.00",
          category: category || "Geral"
        })
        .returning();
      
      res.json({
        message: "Produto adicionado com sucesso",
        product: newProduct
      });
    } catch (error) {
      console.error("Erro ao adicionar produto:", error);
      res.status(500).json({ message: "Erro ao adicionar produto" });
    }
  });

  // API para taxas do comerciante com dados corretos do banco
  app.get("/api/merchant/salaries", isAuthenticated, isUserType("merchant"), async (req: Request, res: Response) => {
    try {
      // Buscar configurações de taxas atuais do banco
      const [settings] = await db.select().from(commissionSettings).limit(1);
      
      if (!settings) {
        return res.status(404).json({ message: "Configurações de taxas não encontradas" });
      }
      
      // Retornar dados com taxas corretas do banco
      const response = {
        earnings: {
          totalSales: 12850.75,
          totalCommissions: 0.00, // Comissão removida
          platformFee: 642.54,
          netEarnings: 12208.21, // Total menos taxa da plataforma
          pendingPayouts: 1200.00
        },
        fees: {
          platformFee: parseFloat(settings.platform_fee) / 100, // 5% do banco
          merchantCommission: 0.00, // Sempre 0 no novo modelo
          clientCashback: parseFloat(settings.client_cashback) / 100, // 2% do banco
          referralBonus: parseFloat(settings.referral_bonus) / 100, // 1% do banco
          withdrawalFee: parseFloat(settings.withdrawal_fee || "5.0") / 100,
          sampleCalculation: {
            saleAmount: 1000.00,
            platformFee: parseFloat(settings.platform_fee) * 10, // 5% de 1000 = 50
            merchantCommission: 0.00, // Removido
            clientCashback: parseFloat(settings.client_cashback) * 10, // 2% de 1000 = 20
            referralBonus: parseFloat(settings.referral_bonus) * 10, // 1% de 1000 = 10
            netAmount: 1000 - (parseFloat(settings.platform_fee) * 10) // 1000 - 50 = 950
          }
        }
      };
      
      res.json(response);
    } catch (error) {
      console.error("Erro ao buscar dados de comissões:", error);
      res.status(500).json({ message: "Erro ao carregar dados de comissões" });
    }
  });

  // ======== ROTAS DE RELATÓRIOS AVANÇADOS ========
  
  // Relatório financeiro completo
  app.get("/api/admin/reports/financial", isAuthenticated, isUserType("admin"), async (req: Request, res: Response) => {
    try {
      const { start_date, end_date } = req.query;
      
      const dateFilter = start_date && end_date 
        ? sql`WHERE t.created_at BETWEEN ${start_date} AND ${end_date}`
        : sql`WHERE t.created_at >= CURRENT_DATE - INTERVAL '30 days'`;
      
      const financialReport = await db.execute(sql`
        SELECT 
          DATE(t.created_at) as transaction_date,
          COUNT(t.id) as transaction_count,
          COALESCE(SUM(CAST(t.amount AS DECIMAL)), 0) as daily_volume,
          COALESCE(SUM(CAST(t.cashback_amount AS DECIMAL)), 0) as daily_cashback,
          COALESCE(AVG(CAST(t.amount AS DECIMAL)), 0) as avg_transaction_value
        FROM transactions t
        ${dateFilter}
          AND t.status = 'completed'
        GROUP BY DATE(t.created_at)
        ORDER BY transaction_date DESC
      `);
      
      res.json({
        report_type: "financial",
        period: { start_date, end_date },
        data: financialReport.rows
      });
    } catch (error) {
      console.error("Erro ao gerar relatório financeiro:", error);
      res.status(500).json({ message: "Erro ao gerar relatório financeiro" });
    }
  });
  
  // Relatório de taxas da plataforma
  app.get("/api/admin/reports/platform-fees", isAuthenticated, isUserType("admin"), async (req: Request, res: Response) => {
    try {
      const { start_date, end_date, merchant_id } = req.query;
      
      // Buscar configurações de taxa
      const [settings] = await db.select().from(commissionSettings).limit(1);
      const platformFeeRate = parseFloat(settings?.platform_fee || "5.0") / 100;
      
      let dateFilter = sql`WHERE t.created_at >= CURRENT_DATE - INTERVAL '30 days'`;
      if (start_date && end_date) {
        dateFilter = sql`WHERE t.created_at BETWEEN ${start_date} AND ${end_date}`;
      }
      
      let merchantFilter = sql``;
      if (merchant_id) {
        merchantFilter = sql`AND t.merchant_id = ${merchant_id}`;
      }
      
      // Relatório detalhado de taxas por comerciante
      const platformFeesReport = await db.execute(sql`
        SELECT 
          m.store_name,
          u.email as merchant_email,
          u.phone as merchant_phone,
          COUNT(t.id) as total_transactions,
          COALESCE(SUM(CAST(t.amount AS DECIMAL)), 0) as total_sales_volume,
          COALESCE(SUM(CAST(t.amount AS DECIMAL)) * ${platformFeeRate}, 0) as platform_fees_owed,
          COALESCE(SUM(CAST(t.cashback_amount AS DECIMAL)), 0) as cashback_paid_by_platform,
          COALESCE(SUM(
            CASE WHEN r.id IS NOT NULL 
            THEN CAST(t.amount AS DECIMAL) * ${parseFloat(settings?.referral_bonus || "1.0") / 100}
            ELSE 0 END
          ), 0) as referral_bonuses_paid,
          COALESCE(SUM(CAST(t.amount AS DECIMAL)) * ${platformFeeRate}, 0) - 
          COALESCE(SUM(CAST(t.cashback_amount AS DECIMAL)), 0) -
          COALESCE(SUM(
            CASE WHEN r.id IS NOT NULL 
            THEN CAST(t.amount AS DECIMAL) * ${parseFloat(settings?.referral_bonus || "1.0") / 100}
            ELSE 0 END
          ), 0) as net_platform_revenue,
          DATE_TRUNC('month', t.created_at) as period_month
        FROM transactions t
        JOIN merchants m ON t.merchant_id = m.id
        JOIN users u ON m.user_id = u.id
        LEFT JOIN referrals r ON t.referral_id = r.id
        ${dateFilter}
        ${merchantFilter}
          AND t.status = 'completed'
        GROUP BY m.id, m.store_name, u.email, u.phone, DATE_TRUNC('month', t.created_at)
        ORDER BY total_sales_volume DESC
      `);
      
      // Resumo geral
      const summaryReport = await db.execute(sql`
        SELECT 
          COUNT(DISTINCT m.id) as active_merchants,
          COUNT(t.id) as total_transactions,
          COALESCE(SUM(CAST(t.amount AS DECIMAL)), 0) as total_platform_volume,
          COALESCE(SUM(CAST(t.amount AS DECIMAL)) * ${platformFeeRate}, 0) as total_platform_fees,
          COALESCE(SUM(CAST(t.cashback_amount AS DECIMAL)), 0) as total_cashback_paid,
          COALESCE(SUM(
            CASE WHEN r.id IS NOT NULL 
            THEN CAST(t.amount AS DECIMAL) * ${parseFloat(settings?.referral_bonus || "1.0") / 100}
            ELSE 0 END
          ), 0) as total_referral_bonuses,
          COALESCE(SUM(CAST(t.amount AS DECIMAL)) * ${platformFeeRate}, 0) - 
          COALESCE(SUM(CAST(t.cashback_amount AS DECIMAL)), 0) -
          COALESCE(SUM(
            CASE WHEN r.id IS NOT NULL 
            THEN CAST(t.amount AS DECIMAL) * ${parseFloat(settings?.referral_bonus || "1.0") / 100}
            ELSE 0 END
          ), 0) as net_platform_profit
        FROM transactions t
        JOIN merchants m ON t.merchant_id = m.id
        LEFT JOIN referrals r ON t.referral_id = r.id
        ${dateFilter}
        ${merchantFilter}
          AND t.status = 'completed'
      `);
      
      res.json({
        report_type: "platform_fees",
        period: { start_date, end_date },
        settings: {
          platform_fee_rate: platformFeeRate,
          client_cashback_rate: parseFloat(settings?.client_cashback || "2.0") / 100,
          referral_bonus_rate: parseFloat(settings?.referral_bonus || "1.0") / 100
        },
        summary: summaryReport.rows[0],
        merchant_details: platformFeesReport.rows
      });
    } catch (error) {
      console.error("Erro ao gerar relatório de taxas da plataforma:", error);
      res.status(500).json({ message: "Erro ao gerar relatório de taxas da plataforma" });
    }
  });

  // Relatório de performance dos comerciantes
  app.get("/api/admin/reports/merchants", isAuthenticated, isUserType("admin"), async (req: Request, res: Response) => {
    try {
      const merchantPerformance = await db.execute(sql`
        SELECT 
          m.store_name,
          m.category,
          u.email as merchant_email,
          COUNT(t.id) as total_transactions,
          COALESCE(SUM(CAST(t.amount AS DECIMAL)), 0) as total_volume,
          COALESCE(SUM(CAST(t.cashback_amount AS DECIMAL)), 0) as total_cashback_given,
          COALESCE(AVG(CAST(t.amount AS DECIMAL)), 0) as avg_transaction_value,
          COUNT(DISTINCT t.user_id) as unique_customers,
          m.created_at as merchant_since
        FROM merchants m
        JOIN users u ON m.user_id = u.id
        LEFT JOIN transactions t ON m.id = t.merchant_id AND t.status = 'completed'
        WHERE m.approved = true
        GROUP BY m.id, m.store_name, m.category, u.email, m.created_at
        ORDER BY total_volume DESC
      `);
      
      res.json({
        report_type: "merchant_performance",
        data: merchantPerformance.rows
      });
    } catch (error) {
      console.error("Erro ao gerar relatório de comerciantes:", error);
      res.status(500).json({ message: "Erro ao gerar relatório de comerciantes" });
    }
  });
  
  // Sistema de busca global
  app.get("/api/admin/search", isAuthenticated, isUserType("admin"), async (req: Request, res: Response) => {
    try {
      const { q, type } = req.query;
      
      if (!q) {
        return res.status(400).json({ message: "Parâmetro de busca obrigatório" });
      }
      
      const searchTerm = `%${q}%`;
      const results: { users?: any[], merchants?: any[], transactions?: any[] } = {};
      
      if (!type || type === 'users') {
        const usersResult = await db.execute(sql`
          SELECT id, name, email, type, status, created_at
          FROM users 
          WHERE name ILIKE ${searchTerm} OR email ILIKE ${searchTerm}
          ORDER BY created_at DESC
          LIMIT 20
        `);
        results.users = usersResult.rows;
      }
      
      if (!type || type === 'merchants') {
        const merchantsResult = await db.execute(sql`
          SELECT m.id, m.store_name, m.category, u.name, u.email
          FROM merchants m
          JOIN users u ON m.user_id = u.id
          WHERE m.store_name ILIKE ${searchTerm} OR m.category ILIKE ${searchTerm}
          ORDER BY m.created_at DESC
          LIMIT 20
        `);
        results.merchants = merchantsResult.rows;
      }
      
      if (!type || type === 'transactions') {
        const transactionsResult = await db.execute(sql`
          SELECT 
            t.id, 
            t.amount, 
            t.description, 
            t.created_at,
            u.name as client_name,
            m.store_name as merchant_name
          FROM transactions t
          JOIN users u ON t.user_id = u.id
          JOIN merchants m ON t.merchant_id = m.id
          WHERE t.description ILIKE ${searchTerm} 
             OR u.name ILIKE ${searchTerm}
             OR m.store_name ILIKE ${searchTerm}
          ORDER BY t.created_at DESC
          LIMIT 20
        `);
        results.transactions = transactionsResult.rows;
      }
      
      res.json({
        query: q,
        results
      });
    } catch (error) {
      console.error("Erro na busca:", error);
      res.status(500).json({ message: "Erro na busca" });
    }
  });

  // ======== TESTE DA API COMPLETA ========
  
  // Endpoint de status do sistema
  app.get("/api/system/status", async (req: Request, res: Response) => {
    try {
      const systemStats = await db.execute(sql`
        SELECT 
          (SELECT COUNT(*) FROM users) as total_users,
          (SELECT COUNT(*) FROM merchants WHERE approved = true) as active_merchants,
          (SELECT COUNT(*) FROM transactions WHERE status = 'completed') as completed_transactions,
          (SELECT COALESCE(SUM(CAST(amount AS DECIMAL)), 0) FROM transactions WHERE status = 'completed') as total_volume,
          (SELECT COALESCE(SUM(CAST(balance AS DECIMAL)), 0) FROM cashbacks) as total_cashback_balance
      `);
      
      res.json({
        system: "Vale Cashback",
        version: "ALEX26-COMPLETE",
        status: "operational",
        database: "connected",
        stats: systemStats.rows[0],
        last_check: new Date(),
        features: {
          authentication: true,
          qr_payments: true,
          cashback_system: true,
          merchant_management: true,
          admin_dashboard: true,
          advanced_reports: true,
          user_management: true,
          transaction_processing: true
        }
      });
    } catch (error) {
      console.error("Erro ao verificar status do sistema:", error);
      res.status(500).json({ 
        system: "Vale Cashback",
        status: "error",
        message: "Erro interno do sistema"
      });
    }
  });

  // ======== ROTAS DO PAINEL DO CLIENTE ========
  
  // Dashboard do cliente - dados resumidos
  app.get("/api/client/dashboard", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Em desenvolvimento, permitir acesso flexível de qualquer usuário client
      let userId = (req.user as any).id;
      let clientUser = req.user as any;
      
      // Se não houver usuário autenticado em desenvolvimento, usar cliente demo
      if (process.env.NODE_ENV === 'development' && (!clientUser || clientUser.type !== 'client')) {
        const demoClient = await storage.getUserByEmail("cliente@valecashback.com");
        if (demoClient) {
          userId = demoClient.id;
          clientUser = demoClient;
          console.log("🔧 Acesso client liberado como Cliente Demo");
        }
      }
      
      // Verificar se é cliente ou admin em produção
      if (process.env.NODE_ENV === 'production' && clientUser.type !== 'client' && clientUser.type !== 'admin') {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      // Buscar dados do cashback
      const [cashbackData] = await db
        .select()
        .from(cashbacks)
        .where(eq(cashbacks.user_id, userId));
      
      // Buscar últimas transações
      const recentTransactions = await db
        .select({
          id: transactions.id,
          amount: transactions.amount,
          cashback_amount: transactions.cashback_amount,
          description: transactions.description,
          created_at: transactions.created_at,
          store_name: merchants.store_name
        })
        .from(transactions)
        .leftJoin(merchants, eq(transactions.merchant_id, merchants.id))
        .where(eq(transactions.user_id, userId))
        .orderBy(desc(transactions.created_at))
        .limit(5);
      
      // Estatísticas do mês atual
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      
      const monthlyStats = await db.execute(sql`
        SELECT 
          COUNT(*) as transaction_count,
          COALESCE(SUM(CAST(amount AS DECIMAL)), 0) as total_spent,
          COALESCE(SUM(CAST(cashback_amount AS DECIMAL)), 0) as cashback_earned
        FROM transactions 
        WHERE user_id = ${userId} 
          AND created_at >= ${thisMonth.toISOString()}
          AND status = 'completed'
      `);
      
      const dashboardData = {
        balance: cashbackData?.balance || "0.00",
        pending_cashback: "0.00",
        monthly_stats: {
          transaction_count: (monthlyStats.rows[0]?.transaction_count || 0).toString(),
          total_spent: (monthlyStats.rows[0]?.total_spent || 0).toString(),
          cashback_earned: (monthlyStats.rows[0]?.cashback_earned || 0).toString()
        },
        recent_transactions: recentTransactions
      };
      
      res.json(dashboardData);
    } catch (error) {
      console.error("Erro ao buscar dashboard do cliente:", error);
      res.status(500).json({ message: "Erro ao carregar dashboard" });
    }
  });

  // Buscar todas as transações do cliente
  app.get("/api/client/transactions", isAuthenticated, isUserType("client"), async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      
      // Buscar transações do cliente com dados completos
      const clientTransactions = await db
        .select({
          id: transactions.id,
          amount: transactions.amount,
          cashback_amount: transactions.cashback_amount,
          description: transactions.description,
          status: transactions.status,
          payment_method: transactions.payment_method,
          created_at: transactions.created_at,
          store_name: merchants.store_name,
          merchant_category: merchants.category
        })
        .from(transactions)
        .leftJoin(merchants, eq(transactions.merchant_id, merchants.id))
        .where(eq(transactions.user_id, userId))
        .orderBy(desc(transactions.created_at));
      
      console.log(`📊 Encontradas ${clientTransactions.length} transações para o usuário ${userId}`);
      
      res.json(clientTransactions);
    } catch (error) {
      console.error("Erro ao buscar transações do cliente:", error);
      res.status(500).json({ message: "Erro ao carregar transações" });
    }
  });

  // Buscar usuários por email ou telefone para transferências
  app.get("/api/client/search-users", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { search, method } = req.query;
      
      // Em desenvolvimento, permitir acesso flexível
      let currentUserId = (req.user as any).id;
      if (process.env.NODE_ENV === 'development') {
        const demoClient = await storage.getUserByEmail("cliente@valecashback.com");
        if (demoClient) {
          currentUserId = demoClient.id;
        }
      }
      
      const searchTerm = search as string;
      console.log(`🔍 Buscando usuários com termo: "${searchTerm}", método: ${method}`);
      
      if (!searchTerm || searchTerm.length < 3) {
        return res.json([]);
      }
      
      let searchResults;
      if (method === 'email') {
        searchResults = await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            phone: users.phone,
            photo: users.photo
          })
          .from(users)
          .where(and(
            sql`LOWER(${users.email}) LIKE LOWER(${`%${searchTerm}%`})`,
            ne(users.id, currentUserId),
            eq(users.type, "client")
          ))
          .limit(10);
      } else if (method === 'phone') {
        searchResults = await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            phone: users.phone,
            photo: users.photo
          })
          .from(users)
          .where(and(
            sql`${users.phone} LIKE ${`%${searchTerm}%`}`,
            ne(users.id, currentUserId),
            eq(users.type, "client")
          ))
          .limit(10);
      } else {
        // Busca por nome também
        searchResults = await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            phone: users.phone,
            photo: users.photo
          })
          .from(users)
          .where(and(
            sql`LOWER(${users.name}) LIKE LOWER(${`%${searchTerm}%`})`,
            ne(users.id, currentUserId),
            eq(users.type, "client")
          ))
          .limit(10);
      }
      
      console.log(`👤 ${searchResults?.length || 0} usuário(s) encontrado(s) para "${searchTerm}"`);
      res.json(searchResults || []);
      
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      res.status(500).json({ message: "Erro ao buscar usuários" });
    }
  });

  // Histórico de transferências do cliente
  app.get("/api/client/transfers", isAuthenticated, isUserType("client"), async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      
      const transfers = await db.execute(sql`
        SELECT 
          t.id,
          t.amount,
          t.description,
          t.created_at,
          t.status,
          CASE 
            WHEN t.from_user_id = ${userId} THEN 'outgoing'
            ELSE 'incoming'
          END as type,
          sender.name as from_name,
          sender.email as from_email,
          receiver.name as to_name,
          receiver.email as to_email
        FROM transfers t
        LEFT JOIN users sender ON t.from_user_id = sender.id
        LEFT JOIN users receiver ON t.to_user_id = receiver.id
        WHERE t.from_user_id = ${userId} OR t.to_user_id = ${userId}
        ORDER BY t.created_at DESC
        LIMIT 50
      `);
      
      const formattedTransfers = transfers.rows.map((transfer: any) => ({
        id: transfer.id,
        type: transfer.type,
        from: transfer.type === 'outgoing' ? 'Você' : transfer.from_name,
        to: transfer.type === 'incoming' ? 'Você' : transfer.to_name,
        amount: parseFloat(transfer.amount),
        date: new Date(transfer.created_at).toLocaleDateString('pt-BR'),
        description: transfer.description || 'Transferência',
        status: transfer.status
      }));
      
      res.json(formattedTransfers);
    } catch (error) {
      console.error("Erro ao buscar transferências:", error);
      res.status(500).json({ message: "Erro ao buscar histórico de transferências" });
    }
  });

  // Realizar transferência entre clientes
  app.post("/api/client/transfers", isAuthenticated, isUserType("client"), async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const { recipient, recipientId, searchMethod, amount, description } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Valor inválido para transferência" });
      }
      
      // Verificar saldo do usuário
      const [senderBalance] = await db
        .select()
        .from(cashbacks)
        .where(eq(cashbacks.user_id, userId));
      
      if (!senderBalance || parseFloat(senderBalance.balance) < amount) {
        return res.status(400).json({ message: "Saldo insuficiente para realizar a transferência" });
      }
      
      // Buscar destinatário
      let recipientUser;
      if (recipientId) {
        [recipientUser] = await db
          .select()
          .from(users)
          .where(and(eq(users.id, recipientId), eq(users.type, "client")));
      } else {
        if (searchMethod === 'email') {
          [recipientUser] = await db
            .select()
            .from(users)
            .where(and(eq(users.email, recipient), eq(users.type, "client")));
        } else {
          [recipientUser] = await db
            .select()
            .from(users)
            .where(and(eq(users.phone, recipient), eq(users.type, "client")));
        }
      }
      
      if (!recipientUser) {
        return res.status(404).json({ message: "Destinatário não encontrado" });
      }
      
      if (recipientUser.id === userId) {
        return res.status(400).json({ message: "Não é possível transferir para você mesmo" });
      }
      
      // Verificar se o destinatário tem registro de cashback
      let [recipientBalance] = await db
        .select()
        .from(cashbacks)
        .where(eq(cashbacks.user_id, recipientUser.id));
      
      if (!recipientBalance) {
        // Criar registro de cashback para o destinatário se não existir
        await db.insert(cashbacks).values({
          user_id: recipientUser.id,
          balance: "0",
          total_earned: "0",
          updated_at: new Date()
        });
        
        [recipientBalance] = await db
          .select()
          .from(cashbacks)
          .where(eq(cashbacks.user_id, recipientUser.id));
      }
      
      // Realizar a transferência
      await db.transaction(async (tx) => {
        // Debitar do remetente
        await tx
          .update(cashbacks)
          .set({
            balance: (parseFloat(senderBalance.balance) - amount).toString(),
            updated_at: new Date()
          })
          .where(eq(cashbacks.user_id, userId));
        
        // Creditar ao destinatário
        await tx
          .update(cashbacks)
          .set({
            balance: (parseFloat(recipientBalance.balance) + amount).toString(),
            updated_at: new Date()
          })
          .where(eq(cashbacks.user_id, recipientUser.id));
        
        // Registrar a transferência
        await tx.insert(transfers).values({
          from_user_id: userId,
          to_user_id: recipientUser.id,
          amount: amount.toString(),
          description: description || 'Transferência de cashback',
          status: 'completed'
        });
      });
      
      console.log(`💸 Transferência realizada: R$ ${amount} de ${userId} para ${recipientUser.id}`);
      
      res.json({
        message: "Transferência realizada com sucesso",
        recipient: {
          name: recipientUser.name,
          email: recipientUser.email
        },
        amount
      });
    } catch (error) {
      console.error("Erro ao realizar transferência:", error);
      res.status(500).json({ message: "Erro ao processar transferência" });
    }
  });

  // Buscar dados de cashback do cliente
  app.get("/api/client/cashbacks", isAuthenticated, isUserType("client"), async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      
      // Dados principais do cashback
      const [cashbackData] = await db
        .select()
        .from(cashbacks)
        .where(eq(cashbacks.user_id, userId));
      
      // Histórico de cashback por transação
      const cashbackHistory = await db
        .select({
          id: transactions.id,
          amount: transactions.amount,
          cashback_amount: transactions.cashback_amount,
          description: transactions.description,
          created_at: transactions.created_at,
          store_name: merchants.store_name
        })
        .from(transactions)
        .leftJoin(merchants, eq(transactions.merchant_id, merchants.id))
        .where(and(
          eq(transactions.user_id, userId),
          gt(transactions.cashback_amount, "0"),
          eq(transactions.status, "completed")
        ))
        .orderBy(desc(transactions.created_at))
        .limit(50);
      
      // Cashback por categoria
      const cashbackByCategory = await db.execute(sql`
        SELECT 
          m.category,
          COUNT(*) as transaction_count,
          COALESCE(SUM(CAST(t.cashback_amount AS DECIMAL)), 0) as total_cashback
        FROM transactions t
        LEFT JOIN merchants m ON t.merchant_id = m.id
        WHERE t.user_id = ${userId} 
          AND t.status = 'completed'
          AND CAST(t.cashback_amount AS DECIMAL) > 0
        GROUP BY m.category
        ORDER BY total_cashback DESC
      `);
      
      res.json({
        balance: cashbackData?.balance || "0.00",
        pending: "0.00", // Campo não existe no schema atual
        total_earned: cashbackData?.total_earned || "0.00",
        history: cashbackHistory,
        by_category: cashbackByCategory.rows
      });
    } catch (error) {
      console.error("Erro ao buscar cashbacks do cliente:", error);
      res.status(500).json({ message: "Erro ao carregar dados de cashback" });
    }
  });

  // Buscar perfil do cliente
  app.get("/api/client/profile", isAuthenticated, isUserType("client"), async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      
      const [userData] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));
      
      if (!userData) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      res.json({
        id: userData.id,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        photo: userData.photo,
        address: userData.address,
        city: userData.city,
        state: userData.state,
        notifications: {
          email: true,
          push: true,
          marketing: false
        },
        privacy: {
          showBalance: true,
          showActivity: true
        }
      });
    } catch (error) {
      console.error("Erro ao buscar perfil do cliente:", error);
      res.status(500).json({ message: "Erro ao carregar perfil" });
    }
  });

  // Atualizar perfil do cliente
  app.patch("/api/client/profile", isAuthenticated, isUserType("client"), async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const { name, email, phone, address, city, state } = req.body;
      
      const [updatedUser] = await db
        .update(users)
        .set({
          name: name || undefined,
          email: email || undefined,
          phone: phone || undefined,
          address: address || undefined,
          city: city || undefined,
          state: state || undefined
        })
        .where(eq(users.id, userId))
        .returning();
      
      res.json({
        message: "Perfil atualizado com sucesso",
        user: updatedUser
      });
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      res.status(500).json({ message: "Erro ao atualizar perfil" });
    }
  });

  // Atualizar foto do perfil
  app.post("/api/client/profile/photo", isAuthenticated, isUserType("client"), async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const { photo } = req.body;
      
      if (!photo) {
        return res.status(400).json({ message: "Foto é obrigatória" });
      }
      
      const [updatedUser] = await db
        .update(users)
        .set({
          photo: photo
        })
        .where(eq(users.id, userId))
        .returning();
      
      res.json({
        message: "Foto atualizada com sucesso",
        photo: updatedUser.photo
      });
    } catch (error) {
      console.error("Erro ao atualizar foto:", error);
      res.status(500).json({ message: "Erro ao atualizar foto" });
    }
  });

  // Reset password (public endpoint for password recovery)
  app.post("/api/reset-password", async (req: Request, res: Response) => {
    try {
      const { email, newPassword } = req.body;
      
      if (!email || !newPassword) {
        return res.status(400).json({ message: "Email e nova senha são obrigatórios" });
      }
      
      // Verificar se o usuário existe
      const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
      
      if (existingUser.length === 0) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Hash da nova senha usando bcrypt
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Atualizar senha
      await db.update(users)
        .set({ 
          password: hashedPassword
        })
        .where(eq(users.email, email));
      
      console.log(`🔑 Senha redefinida para usuário: ${email}`);
      res.json({ message: "Senha atualizada com sucesso" });
    } catch (error) {
      console.error("Erro ao redefinir senha:", error);
      res.status(500).json({ message: "Erro ao redefinir senha" });
    }
  });
  
  // Verificar se email existe no sistema (para redefinição de senha)
  app.get("/api/check-password-updated/:email", async (req: Request, res: Response) => {
    try {
      const { email } = req.params;
      
      if (!email) {
        return res.status(400).json({ message: "Email é obrigatório" });
      }
      
      const user = await db.select({ id: users.id, email: users.email })
        .from(users)
        .where(eq(users.email, decodeURIComponent(email)))
        .limit(1);
      
      if (user.length === 0) {
        return res.json({ passwordUpdated: false, userExists: false });
      }
      
      res.json({ 
        passwordUpdated: true,
        userExists: true 
      });
    } catch (error) {
      console.error("Erro ao verificar email:", error);
      res.status(500).json({ message: "Erro ao verificar email" });
    }
  });

  // Alterar senha do cliente
  app.post("/api/client/profile/password", isAuthenticated, isUserType("client"), async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Senha atual e nova senha são obrigatórias" });
      }
      
      // Verificar senha atual
      const [userData] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));
      
      if (!userData) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      const isValidPassword = await storage.comparePasswords(currentPassword, userData.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: "Senha atual incorreta" });
      }
      
      // Hash da nova senha
      const hashedPassword = await storage.hashPassword(newPassword);
      
      await db
        .update(users)
        .set({
          password: hashedPassword
        })
        .where(eq(users.id, userId));
      
      res.json({ message: "Senha alterada com sucesso" });
    } catch (error) {
      console.error("Erro ao alterar senha:", error);
      res.status(500).json({ message: "Erro ao alterar senha" });
    }
  });

  // API para listar lojas parceiras (público para clientes)
  app.get("/api/merchants/stores", async (req: Request, res: Response) => {
    try {
      const storesResult = await db.execute(sql`
        SELECT 
          m.id,
          m.user_id,
          m.store_name,
          m.logo,
          m.category,
          m.address,
          m.city,
          m.state,
          m.commission_rate,
          m.created_at,
          u.email,
          u.phone,
          u.name as user_name
        FROM merchants m
        INNER JOIN users u ON m.user_id = u.id
        WHERE m.approved = true
        ORDER BY m.store_name
      `);
      
      const stores = storesResult.rows.map((store: any) => ({
        id: store.id,
        userId: store.user_id,
        user_id: store.user_id,
        store_name: store.store_name,
        name: store.store_name,
        logo: store.logo,
        category: store.category || 'Geral',
        description: `Loja parceira ${store.store_name} - Ganhe cashback em suas compras!`,
        address: store.address,
        city: store.city,
        state: store.state,
        commissionRate: store.commission_rate || '2.0',
        rating: 4.5,
        createdAt: store.created_at,
        email: store.email,
        phone: store.phone,
        transactions: Math.floor(Math.random() * 100) + 10,
        volume: Math.floor(Math.random() * 50000) + 5000
      }));
      
      res.json(stores);
    } catch (error) {
      console.error("Erro ao listar lojas:", error);
      res.status(500).json({ message: "Erro ao listar lojas" });
    }
  });

  // Buscar dados de indicações do cliente
  app.get("/api/client/referrals", isAuthenticated, isUserType("client"), async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      
      // Buscar dados do usuário atual
      const [userData] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));
      
      if (!userData) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Buscar usuários indicados pelo usuário atual com dados de transações
      const referralsResult = await db.execute(sql`
        SELECT 
          u.id,
          u.name,
          u.email,
          u.type,
          u.status,
          u.phone,
          u.created_at,
          m.store_name,
          COALESCE(c.balance, '0.00') as balance,
          COALESCE(c.total_earned, '0.00') as total_earned,
          COALESCE(t.total_transactions, 0) as total_transactions,
          COALESCE(t.total_spent, '0.00') as total_spent,
          COALESCE(t.referral_commission, '0.00') as referral_commission
        FROM users u
        LEFT JOIN cashbacks c ON u.id = c.user_id
        LEFT JOIN merchants m ON u.id = m.user_id
        LEFT JOIN (
          SELECT 
            user_id,
            COUNT(*) as total_transactions,
            SUM(CAST(amount AS DECIMAL)) as total_spent,
            ROUND(SUM(CAST(amount AS DECIMAL)) * 0.01, 2) as referral_commission
          FROM transactions 
          WHERE status = 'completed'
          GROUP BY user_id
        ) t ON u.id = t.user_id
        WHERE u.referred_by = ${userId}
        ORDER BY u.created_at DESC
      `);
      
      const referrals = referralsResult.rows;
      
      // Calcular comissões ganhas através de indicações (1% do valor gasto pelos indicados)
      const commissionEarnedResult = await db.execute(sql`
        SELECT 
          COALESCE(ROUND(SUM(CAST(t.amount AS DECIMAL) * 0.01), 2), 0) as total_commission
        FROM transactions t
        JOIN users u ON t.user_id = u.id
        WHERE u.referred_by = ${userId} 
        AND t.status = 'completed'
      `);
      
      // Gerar código de convite se não existir
      let invitationCode = userData.invitation_code;
      if (!invitationCode) {
        invitationCode = `VALE${userId.toString().padStart(3, '0')}${Date.now().toString(36).toUpperCase().slice(-4)}`;
        await db
          .update(users)
          .set({ invitation_code: invitationCode })
          .where(eq(users.id, userId));
        
        console.log(`✅ Código de convite gerado para usuário ${userId}: ${invitationCode}`);
      }
      
      // Buscar configurações de comissão
      const [settings] = await db.select().from(commissionSettings).limit(1);
      const referralBonus = settings ? settings.referral_bonus : "1.0";
      
      // Calcular indicações pendentes e aprovadas baseado em transações
      const pendingCount = referrals.filter((r: any) => parseFloat(r.total_transactions || '0') === 0).length;
      const approvedCount = referrals.filter((r: any) => parseFloat(r.total_transactions || '0') > 0).length;

      res.json({
        referralCode: invitationCode,
        referralUrl: `${process.env.FRONTEND_URL || 'https://valecashback.com'}/convite/${invitationCode}`,
        referralsCount: referrals.length,
        pendingReferrals: pendingCount,
        approvedReferrals: approvedCount,
        totalEarned: (commissionEarnedResult.rows[0]?.total_commission ? Number(commissionEarnedResult.rows[0].total_commission).toFixed(2) : "0.00"),
        commission: referralBonus,
        referrals: referrals.map((ref: any) => {
          const hasTransactions = parseFloat(ref.total_transactions || '0') > 0;
          const referralStatus = hasTransactions ? 'approved' : 'pending';
          const commission = parseFloat(ref.referral_commission || '0');
          
          return {
            id: ref.id,
            name: ref.name,
            email: ref.email,
            phone: ref.phone,
            user_type: ref.type,
            status: referralStatus,
            date: new Date(ref.created_at).toLocaleDateString('pt-BR'),
            balance: ref.balance,
            total_earned: ref.total_earned,
            total_spent: ref.total_spent || '0.00',
            total_transactions: ref.total_transactions || 0,
            store_name: ref.store_name || null,
            commission: commission.toFixed(2)
          };
        })
      });
    } catch (error) {
      console.error("Erro ao buscar indicações:", error);
      res.status(500).json({ message: "Erro ao carregar indicações" });
    }
  });

  // Enviar convite por email
  app.post("/api/client/referrals/invite", isAuthenticated, isUserType("client"), async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const { email, name } = req.body;
      
      if (!email || !name) {
        return res.status(400).json({ message: "Email e nome são obrigatórios" });
      }
      
      // Verificar se o email já existe
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));
      
      if (existingUser) {
        return res.status(400).json({ message: "Este email já está cadastrado" });
      }
      
      // Buscar código de convite do usuário
      const [userData] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));
      
      // Simular envio de convite (implementação futura)
      console.log(`Convite enviado para ${name} (${email}) pelo usuário ${userId}`);
      
      res.json({ message: "Convite enviado com sucesso" });
    } catch (error) {
      console.error("Erro ao enviar convite:", error);
      res.status(500).json({ message: "Erro ao enviar convite" });
    }
  });

  // Buscar todas as lojas para o cliente
  app.get("/api/stores", async (req: Request, res: Response) => {
    try {
      const stores = await db
        .select({
          id: merchants.id,
          user_id: merchants.user_id,
          store_name: merchants.store_name,
          name: merchants.store_name,
          logo: merchants.logo,
          category: merchants.category,
          address: merchants.address,
          city: merchants.city,
          state: merchants.state,
          commissionRate: merchants.commission_rate,
          rating: sql`4.2`,
          createdAt: merchants.created_at,
          email: users.email,
          phone: users.phone,
          transactions: sql`COALESCE((SELECT COUNT(*) FROM transactions WHERE merchant_id = ${merchants.id}), 0)`,
          volume: sql`COALESCE((SELECT SUM(CAST(amount AS DECIMAL)) FROM transactions WHERE merchant_id = ${merchants.id}), 0)`
        })
        .from(merchants)
        .leftJoin(users, eq(merchants.user_id, users.id))
        .where(eq(merchants.approved, true))
        .orderBy(desc(merchants.created_at));
      
      res.json(stores);
    } catch (error) {
      console.error("Erro ao buscar lojas:", error);
      res.status(500).json({ message: "Erro ao carregar lojas" });
    }
  });

  // ======== ROTAS DE QR CODE ========
  
  // Gerar QR Code para recebimento
  app.post("/api/client/qr-code/generate", isAuthenticated, isUserType("client"), async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const { amount, description } = req.body;
      
      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: "Valor deve ser maior que zero" });
      }
      
      // Gerar código único para o QR Code
      const qrCode = crypto.randomBytes(16).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // Expira em 24 horas
      
      // Salvar no banco se tivermos tabela de QR codes
      // Por enquanto, retornar dados simulados mas consistentes
      const qrData = {
        id: Math.floor(Math.random() * 1000000),
        code: qrCode,
        amount: parseFloat(amount),
        description: description || "",
        expiresAt: expiresAt.toISOString(),
        userId: userId,
        status: "active"
      };
      
      res.json(qrData);
    } catch (error) {
      console.error("Erro ao gerar QR Code:", error);
      res.status(500).json({ message: "Erro ao gerar QR Code" });
    }
  });
  
  // Verificar QR Code (cliente)
  app.get("/api/client/verify-qr/:qrCodeId", isAuthenticated, isUserType("client"), async (req: Request, res: Response) => {
    try {
      const { qrCodeId } = req.params;
      const userId = (req.user as any).id;
      
      console.log("Verificando QR Code:", qrCodeId);
      
      // Buscar o QR Code
      const [qrCode] = await db
        .select()
        .from(qrCodes)
        .where(and(
          eq(qrCodes.code, qrCodeId),
          eq(qrCodes.status, "active")
        ));
      
      if (!qrCode) {
        return res.status(404).json({ error: "QR Code não encontrado ou inválido" });
      }
      
      // Buscar dados do comerciante
      const [merchant] = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          photo: users.photo
        })
        .from(users)
        .where(eq(users.id, qrCode.user_id));
      
      if (!merchant) {
        return res.status(404).json({ error: "Comerciante não encontrado" });
      }
      
      // Verificar se o QR Code não expirou (se tiver expiração)
      if (qrCode.expires_at) {
        const now = new Date();
        const expiresAt = new Date(qrCode.expires_at);
        
        if (expiresAt < now) {
          return res.status(400).json({ error: "QR Code expirado" });
        }
      }
      
      // Retornar dados do pagamento
      res.json({
        qr_code_id: qrCode.id,
        merchant_id: merchant.id,
        merchant_name: merchant.name,
        merchant_email: merchant.email,
        merchant_photo: merchant.photo,
        amount: parseFloat(qrCode.amount || "0"),
        description: qrCode.description,
        expires_at: qrCode.expires_at,
        created_at: qrCode.created_at
      });
      
    } catch (error) {
      console.error("Erro ao verificar QR Code:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Processar pagamento via QR Code (cliente)
  app.post("/api/client/process-payment", isAuthenticated, isUserType("client"), async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const { qr_code_id, payment_data, payment_type } = req.body;
      
      console.log("Processando pagamento QR Code:", { qr_code_id, payment_type, userId });
      
      // Buscar o QR Code
      const [qrCode] = await db
        .select()
        .from(qrCodes)
        .where(and(
          eq(qrCodes.id, qr_code_id),
          eq(qrCodes.status, "active")
        ));
      
      if (!qrCode) {
        return res.status(404).json({ error: "QR Code não encontrado ou inválido" });
      }
      
      // Buscar dados do comerciante
      const [merchant] = await db
        .select()
        .from(users)
        .where(eq(users.id, qrCode.user_id));
      
      if (!merchant) {
        return res.status(404).json({ error: "Comerciante não encontrado" });
      }
      
      // Buscar saldo do cliente na tabela cashbacks
      const [clientCashback] = await db
        .select()
        .from(cashbacks)
        .where(eq(cashbacks.user_id, userId));
      
      if (!clientCashback) {
        return res.status(404).json({ error: "Dados de cashback do cliente não encontrados" });
      }
      
      const amount = parseFloat(qrCode.amount || "0");
      
      // Verificar saldo do cliente
      if (parseFloat(clientCashback.balance) < amount) {
        return res.status(400).json({ error: "Saldo insuficiente" });
      }
      
      // Buscar saldo do comerciante na tabela cashbacks
      let [merchantCashback] = await db
        .select()
        .from(cashbacks)
        .where(eq(cashbacks.user_id, merchant.id));
      
      // Se não existe cashback para o comerciante, criar
      if (!merchantCashback) {
        [merchantCashback] = await db.insert(cashbacks).values({
          user_id: merchant.id,
          balance: "0.0",
          total_earned: "0.0",
          total_spent: "0.0"
        }).returning();
      }
      
      // Processar a transação
      const newClientBalance = parseFloat(clientCashback.balance) - amount;
      const newMerchantBalance = parseFloat(merchantCashback.balance) + amount;
      
      // Atualizar saldos
      await db.update(cashbacks)
        .set({ 
          balance: newClientBalance.toString(),
          total_spent: (parseFloat(clientCashback.total_spent) + amount).toString()
        })
        .where(eq(cashbacks.user_id, userId));
      
      await db.update(cashbacks)
        .set({ 
          balance: newMerchantBalance.toString(),
          total_earned: (parseFloat(merchantCashback.total_earned) + amount).toString()
        })
        .where(eq(cashbacks.user_id, merchant.id));
      
      // Criar transação
      const [transaction] = await db.insert(transactions).values({
        user_id: userId,
        merchant_id: merchant.id,
        amount: amount.toString(),
        cashback_amount: (amount * 0.02).toString(),
        status: "completed",
        description: qrCode.description || "Pagamento via QR Code",
        payment_method: payment_type || "qr_code",
        qr_code_id: qr_code_id.toString(),
        source: "qrcode"
      }).returning();
      
      // Marcar QR Code como usado
      await db.update(qrCodes)
        .set({ 
          status: "used",
          used_at: new Date(),
          used_by: userId
        })
        .where(eq(qrCodes.id, qr_code_id));
      
      console.log("Pagamento processado com sucesso:", transaction.id);
      
      res.json({
        success: true,
        transaction_id: transaction.id,
        amount: amount,
        merchant_name: merchant.name,
        new_balance: newClientBalance,
        cashback_earned: parseFloat(transaction.cashback_amount)
      });
      
    } catch (error) {
      console.error("Erro ao processar pagamento QR Code:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Buscar QR Codes recentes do cliente
  app.get("/api/client/qr-code/recent", isAuthenticated, isUserType("client"), async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      
      // Por enquanto, retornar dados simulados baseados em transações reais
      const recentTransactions = await db
        .select({
          id: transactions.id,
          amount: transactions.amount,
          description: transactions.description,
          created_at: transactions.created_at
        })
        .from(transactions)
        .where(eq(transactions.user_id, userId))
        .orderBy(desc(transactions.created_at))
        .limit(5);
      
      const qrCodes = recentTransactions.map(t => ({
        id: t.id,
        amount: parseFloat(t.amount),
        description: t.description,
        date: format(new Date(t.created_at), "dd/MM/yyyy")
      }));
      
      res.json(qrCodes);
    } catch (error) {
      console.error("Erro ao buscar QR Codes recentes:", error);
      res.status(500).json({ message: "Erro ao carregar QR Codes" });
    }
  });

  // ======== NOVAS APIS DE RELATÓRIOS FINANCEIROS ========

  // Relatório financeiro completo com novo modelo de taxas
  // Endpoint principal de relatórios
  app.get("/api/admin/reports", isAuthenticated, isUserType("admin"), async (req: Request, res: Response) => {
    try {
      const { type = 'transactions', startDate, endDate, status = 'all', merchantId } = req.query;
      
      // Validar datas
      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();
      
      // Construir condições WHERE
      let whereConditions = [
        gte(transactions.created_at, start),
        lte(transactions.created_at, end)
      ];
      
      // Filtrar por status se especificado
      if (status !== 'all') {
        whereConditions.push(eq(transactions.status, status as string));
      }
      
      // Filtrar por merchant se especificado
      if (merchantId) {
        whereConditions.push(eq(transactions.merchant_id, parseInt(merchantId as string)));
      }
      
      // Buscar transações com informações básicas
      const transactionsData = await db
        .select()
        .from(transactions)
        .where(and(...whereConditions))
        .orderBy(desc(transactions.created_at));
      
      // Enriquecer os dados com informações de clientes, comerciantes e cálculos financeiros
      const enrichedTransactions = await Promise.all(
        transactionsData.map(async (tx) => {
          let client_name = 'Cliente não identificado';
          let merchant_name = 'Loja não identificada';
          
          // Buscar informações do cliente
          if (tx.user_id) {
            const [user] = await db.select({ name: users.name }).from(users).where(eq(users.id, tx.user_id));
            if (user) client_name = user.name;
          }
          
          // Buscar informações do comerciante
          if (tx.merchant_id) {
            const [merchant] = await db.select({ store_name: merchants.store_name }).from(merchants).where(eq(merchants.id, tx.merchant_id));
            if (merchant) merchant_name = merchant.store_name;
          }
          
          // Cálculos financeiros automáticos
          const transactionAmount = parseFloat(tx.amount || '0');
          const platformFee = transactionAmount * 0.05; // 5% taxa da plataforma
          const merchantReceives = transactionAmount * 0.95; // 95% o lojista recebe
          const cashbackAmount = parseFloat(tx.cashback_amount || '0');
          
          return {
            ...tx,
            client_name,
            merchant_name,
            platform_fee: platformFee.toFixed(2),
            merchant_receives: merchantReceives.toFixed(2),
            financial_breakdown: {
              transaction_value: transactionAmount.toFixed(2),
              platform_fee: platformFee.toFixed(2),
              merchant_receives: merchantReceives.toFixed(2),
              cashback_paid: cashbackAmount.toFixed(2),
              net_platform_revenue: (platformFee - cashbackAmount).toFixed(2)
            }
          };
        })
      );
      
      // Calcular resumo financeiro detalhado
      const totalAmount = enrichedTransactions.reduce((sum, tx) => sum + parseFloat(tx.amount || "0"), 0);
      const totalCashback = enrichedTransactions.reduce((sum, tx) => sum + parseFloat(tx.cashback_amount || "0"), 0);
      const totalPlatformFees = enrichedTransactions.reduce((sum, tx) => sum + parseFloat(tx.platform_fee || "0"), 0);
      const totalMerchantReceives = enrichedTransactions.reduce((sum, tx) => sum + parseFloat(tx.merchant_receives || "0"), 0);
      const netPlatformRevenue = totalPlatformFees - totalCashback;
      
      const response = {
        transactions: enrichedTransactions,
        summary: {
          totalTransactions: enrichedTransactions.length,
          totalAmount,
          totalCashback,
          totalPlatformFees,
          totalMerchantReceives,
          netPlatformRevenue,
          platformRevenue: totalPlatformFees, // Mantém compatibilidade
          financial_breakdown: {
            gross_transaction_volume: totalAmount,
            platform_fees_collected: totalPlatformFees,
            cashback_distributed: totalCashback,
            merchant_payouts: totalMerchantReceives,
            net_platform_profit: netPlatformRevenue,
            platform_fee_percentage: "5.00%",
            cashback_percentage: "2.00%"
          }
        }
      };
      
      res.json(response);
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Endpoint para excluir transação
  app.delete("/api/admin/transactions/:id", isAuthenticated, isUserType("admin"), async (req: Request, res: Response) => {
    try {
      const transactionId = parseInt(req.params.id);
      
      if (!transactionId) {
        return res.status(400).json({ message: "ID da transação inválido" });
      }

      // Verificar se a transação existe
      const [existingTransaction] = await db
        .select()
        .from(transactions)
        .where(eq(transactions.id, transactionId));

      if (!existingTransaction) {
        return res.status(404).json({ message: "Transação não encontrada" });
      }

      // Excluir a transação
      await db.delete(transactions).where(eq(transactions.id, transactionId));

      res.json({ message: "Transação excluída com sucesso" });
    } catch (error) {
      console.error("Erro ao excluir transação:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Endpoint de exportação de relatórios
  app.get("/api/admin/reports/export", isAuthenticated, isUserType("admin"), async (req: Request, res: Response) => {
    try {
      const { type = 'transactions', format = 'csv', startDate, endDate, status = 'all', merchantId } = req.query;
      
      // Validar datas
      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();
      
      let query = db.select().from(transactions);
      let whereConditions = [
        gte(transactions.created_at, start),
        lte(transactions.created_at, end)
      ];
      
      if (status !== 'all') {
        whereConditions.push(eq(transactions.status, status as string));
      }
      
      if (merchantId) {
        whereConditions.push(eq(transactions.merchant_id, parseInt(merchantId as string)));
      }
      
      const transactionsData = await query.where(and(...whereConditions)).orderBy(desc(transactions.created_at));
      
      if (format === 'csv') {
        const csvHeader = 'ID,Data,Valor,Cashback,Status,Merchant ID\n';
        const csvData = transactionsData.map(tx => 
          `${tx.id},${tx.created_at?.toISOString() || ''},${tx.amount || 0},${tx.cashback_amount || 0},${tx.status || ''},${tx.merchant_id || ''}`
        ).join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="relatorio-${type}-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvHeader + csvData);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="relatorio-${type}-${new Date().toISOString().split('T')[0]}.json"`);
        res.json({ transactions: transactionsData });
      }
    } catch (error) {
      console.error("Erro ao exportar relatório:", error);
      res.status(500).json({ message: "Erro ao exportar relatório" });
    }
  });

  app.get("/api/admin/reports/financial-summary", isAuthenticated, isUserType("admin"), async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      
      const financialSummary = await generateFinancialReport(
        startDate as string, 
        endDate as string
      );
      
      res.json(financialSummary);
    } catch (error) {
      console.error("Erro ao gerar relatório financeiro:", error);
      res.status(500).json({ message: "Erro ao gerar relatório financeiro" });
    }
  });

  // Receita por período
  app.get("/api/admin/reports/revenue-by-period", isAuthenticated, isUserType("admin"), async (req: Request, res: Response) => {
    try {
      const { period } = req.query;
      
      const revenueData = await getRevenueByPeriod(period as 'daily' | 'weekly' | 'monthly');
      
      res.json(revenueData);
    } catch (error) {
      console.error("Erro ao buscar receita por período:", error);
      res.status(500).json({ message: "Erro ao buscar dados de receita" });
    }
  });

  // Top lojistas por receita gerada
  app.get("/api/admin/reports/top-merchants", isAuthenticated, isUserType("admin"), async (req: Request, res: Response) => {
    try {
      const { limit } = req.query;
      
      const topMerchants = await getTopMerchantsByRevenue(parseInt(limit as string) || 10);
      
      res.json(topMerchants);
    } catch (error) {
      console.error("Erro ao buscar top lojistas:", error);
      res.status(500).json({ message: "Erro ao buscar dados dos lojistas" });
    }
  });

  // Configurações atuais do sistema
  app.get("/api/admin/settings/commission", isAuthenticated, isUserType("admin"), async (req: Request, res: Response) => {
    try {
      const [settings] = await db.select().from(commissionSettings).limit(1);
      
      if (!settings) {
        return res.json({
          platform_fee: "5.0",
          merchant_commission: "0.0",
          client_cashback: "2.0",
          referral_bonus: "1.0",
          min_withdrawal: "20.0"
        });
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Erro ao buscar configurações:", error);
      res.status(500).json({ message: "Erro ao carregar configurações" });
    }
  });

  // Atualizar configurações do sistema
  app.put("/api/admin/settings/commission", isAuthenticated, isUserType("admin"), async (req: Request, res: Response) => {
    try {
      const { platform_fee, client_cashback, referral_bonus, min_withdrawal } = req.body;
      
      const [settings] = await db.select().from(commissionSettings).limit(1);
      
      if (settings) {
        await db
          .update(commissionSettings)
          .set({
            platform_fee: platform_fee?.toString() || "5.0",
            merchant_commission: "0.0", // Sempre 0 no novo modelo
            client_cashback: client_cashback?.toString() || "2.0",
            referral_bonus: referral_bonus?.toString() || "1.0",
            min_withdrawal: min_withdrawal?.toString() || "20.0",
            updated_at: new Date()
          })
          .where(eq(commissionSettings.id, settings.id));
      } else {
        await db
          .insert(commissionSettings)
          .values({
            platform_fee: platform_fee?.toString() || "5.0",
            merchant_commission: "0.0",
            client_cashback: client_cashback?.toString() || "2.0",
            referral_bonus: referral_bonus?.toString() || "1.0",
            min_withdrawal: min_withdrawal?.toString() || "20.0"
          });
      }
      
      res.json({ message: "Configurações atualizadas com sucesso" });
    } catch (error) {
      console.error("Erro ao atualizar configurações:", error);
      res.status(500).json({ message: "Erro ao atualizar configurações" });
    }
  });

  // Import and register admin routes
  const { addAdminRoutes, addMerchantRoutes } = await import("./routes.admin");
  addAdminRoutes(app);
  addMerchantRoutes(app);

  // Import and add reports routes
  const { addReportsRoutes } = await import("./routes.reports");
  addReportsRoutes(app);

  // Analytics endpoint para administradores
  app.get("/api/admin/analytics", isAuthenticated, isUserType("admin"), async (req: Request, res: Response) => {
    try {
      const range = req.query.range || '30d';
      
      // Calcular data limite baseada no range
      let dateLimit = new Date();
      switch(range) {
        case '7d':
          dateLimit.setDate(dateLimit.getDate() - 7);
          break;
        case '90d':
          dateLimit.setDate(dateLimit.getDate() - 90);
          break;
        case '1y':
          dateLimit.setFullYear(dateLimit.getFullYear() - 1);
          break;
        default: // 30d
          dateLimit.setDate(dateLimit.getDate() - 30);
      }

      // Estatísticas gerais
      const totalUsersResult = await db.execute(sql`
        SELECT COUNT(*) as count FROM users WHERE type = 'client'
      `);
      
      const totalMerchantsResult = await db.execute(sql`
        SELECT COUNT(*) as count FROM merchants WHERE approved = true
      `);
      
      const salesStatsResult = await db.execute(sql`
        SELECT 
          COUNT(*) as total_transactions,
          COALESCE(SUM(CAST(amount AS DECIMAL)), 0) as total_sales,
          COALESCE(SUM(CAST(cashback_amount AS DECIMAL)), 0) as total_cashback
        FROM transactions 
        WHERE status = 'completed' AND created_at >= ${dateLimit.toISOString()}
      `);

      // Dados diários
      const dailyStatsResult = await db.execute(sql`
        SELECT 
          DATE(created_at) as date,
          COALESCE(SUM(CAST(amount AS DECIMAL)), 0) as sales,
          COUNT(*) as transactions,
          COALESCE(SUM(CAST(cashback_amount AS DECIMAL)), 0) as cashback
        FROM transactions 
        WHERE status = 'completed' AND created_at >= ${dateLimit.toISOString()}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30
      `);

      // Top comerciantes
      const topMerchantsResult = await db.execute(sql`
        SELECT 
          m.store_name as name,
          COALESCE(SUM(CAST(t.amount AS DECIMAL)), 0) as sales,
          COUNT(t.id) as transactions
        FROM merchants m
        LEFT JOIN transactions t ON m.id = t.merchant_id AND t.status = 'completed' AND t.created_at >= ${dateLimit.toISOString()}
        WHERE m.approved = true
        GROUP BY m.id, m.store_name
        HAVING COUNT(t.id) > 0
        ORDER BY sales DESC
        LIMIT 10
      `);

      // Crescimento de usuários (últimos 12 meses)
      const userGrowthResult = await db.execute(sql`
        SELECT 
          TO_CHAR(created_at, 'YYYY-MM') as month,
          COUNT(CASE WHEN type = 'client' THEN 1 END) as users,
          COUNT(CASE WHEN type = 'merchant' THEN 1 END) as merchants
        FROM users 
        WHERE created_at >= NOW() - INTERVAL '12 months'
        GROUP BY TO_CHAR(created_at, 'YYYY-MM')
        ORDER BY month DESC
        LIMIT 12
      `);

      const totalUsers = totalUsersResult.rows[0]?.count || 0;
      const totalMerchants = totalMerchantsResult.rows[0]?.count || 0;
      const salesStats = salesStatsResult.rows[0] || { total_transactions: 0, total_sales: 0, total_cashback: 0 };
      
      const analytics = {
        totalUsers: parseInt(totalUsers.toString()),
        totalMerchants: parseInt(totalMerchants.toString()),
        totalTransactions: parseInt(salesStats.total_transactions?.toString() || '0'),
        totalSales: parseFloat(salesStats.total_sales?.toString() || '0'),
        totalCashback: parseFloat(salesStats.total_cashback?.toString() || '0'),
        platformRevenue: parseFloat(salesStats.total_sales?.toString() || '0') * 0.05,
        dailyStats: dailyStatsResult.rows.map((row: any) => ({
          date: row.date,
          sales: parseFloat(row.sales?.toString() || '0'),
          transactions: parseInt(row.transactions?.toString() || '0'),
          cashback: parseFloat(row.cashback?.toString() || '0')
        })),
        topMerchants: topMerchantsResult.rows.map((row: any) => ({
          name: row.name,
          sales: parseFloat(row.sales?.toString() || '0'),
          transactions: parseInt(row.transactions?.toString() || '0')
        })),
        userGrowth: userGrowthResult.rows.map((row: any) => ({
          month: row.month,
          users: parseInt(row.users?.toString() || '0'),
          merchants: parseInt(row.merchants?.toString() || '0')
        }))
      };

      res.json(analytics);
    } catch (error) {
      console.error("Erro ao gerar analytics:", error);
      res.status(500).json({ message: "Erro ao gerar dados analíticos" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}