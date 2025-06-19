import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { db } from "./db";
import { eq, and, desc, sql, gt, gte, lt, lte, inArray, ne, count } from "drizzle-orm";
import crypto from "crypto";
import { format } from "date-fns";
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
  PaymentMethod,
  TransactionStatus,
  NotificationType
} from "@shared/schema";

// Middleware para verificar autenticação
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Usuário não autenticado" });
  }
  next();
};

// Middleware para verificar tipo de usuário
export const isUserType = (type: string) => (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Usuário não autenticado" });
  }
  if ((req.user as any).type !== type) {
    return res.status(403).json({ message: `Acesso restrito para ${type}` });
  }
  next();
};

// Configurações globais do sistema (defaults)
const DEFAULT_SETTINGS = {
  platformFee: "5.0",
  merchantCommission: "2.0", 
  clientCashback: "2.0",
  referralBonus: "1.0",
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

  // ======== ROTAS DE ADMINISTRAÇÃO ========
  
  // Listar todos os usuários (apenas admin)
  app.get("/api/admin/users", isAuthenticated, isUserType("admin"), async (req: Request, res: Response) => {
    try {
      const allUsers = await db.select().from(users).orderBy(desc(users.created_at));
      res.json(allUsers);
    } catch (error) {
      console.error("Erro ao listar usuários:", error);
      res.status(500).json({ message: "Erro ao listar usuários" });
    }
  });

  // Listar todos os comerciantes (apenas admin)
  app.get("/api/admin/merchants", isAuthenticated, isUserType("admin"), async (req: Request, res: Response) => {
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

  // ======== ROTAS DE COMERCIANTE ========
  
  // Obter dados do perfil do comerciante
  app.get("/api/merchant/profile", isAuthenticated, isUserType("merchant"), async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      
      const [merchant] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.user_id, userId))
        .limit(1);
      
      if (!merchant) {
        return res.status(404).json({ message: "Perfil de comerciante não encontrado" });
      }
      
      res.json(merchant);
    } catch (error) {
      console.error("Erro ao obter perfil do comerciante:", error);
      res.status(500).json({ message: "Erro ao obter perfil do comerciante" });
    }
  });

  // Listar transações do comerciante
  app.get("/api/merchant/transactions", isAuthenticated, isUserType("merchant"), async (req: Request, res: Response) => {
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
      
      const merchantTransactions = await db
        .select({
          id: transactions.id,
          amount: transactions.amount,
          cashback_amount: transactions.cashback_amount,
          status: transactions.status,
          payment_method: transactions.payment_method,
          created_at: transactions.created_at,
          customer_name: users.name,
          customer_email: users.email
        })
        .from(transactions)
        .leftJoin(users, eq(transactions.user_id, users.id))
        .where(eq(transactions.merchant_id, merchant.id))
        .orderBy(desc(transactions.created_at));
      
      res.json(merchantTransactions);
    } catch (error) {
      console.error("Erro ao listar transações do comerciante:", error);
      res.status(500).json({ message: "Erro ao listar transações do comerciante" });
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

  // Listar transações do cliente
  app.get("/api/client/transactions", isAuthenticated, isUserType("client"), async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      
      const clientTransactions = await db
        .select({
          id: transactions.id,
          amount: transactions.amount,
          cashback_amount: transactions.cashback_amount,
          status: transactions.status,
          payment_method: transactions.payment_method,
          created_at: transactions.created_at,
          merchant_name: merchants.store_name
        })
        .from(transactions)
        .leftJoin(merchants, eq(transactions.merchant_id, merchants.id))
        .where(eq(transactions.user_id, userId))
        .orderBy(desc(transactions.created_at));
      
      res.json(clientTransactions);
    } catch (error) {
      console.error("Erro ao listar transações do cliente:", error);
      res.status(500).json({ message: "Erro ao listar transações do cliente" });
    }
  });

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
      
      const [settings] = await db.select().from(commissionSettings).limit(1);
      const clientCashbackRate = settings ? parseFloat(settings.client_cashback) / 100 : 0.02;
      
      const transactionAmount = parseFloat(amount);
      const cashbackAmount = transactionAmount * clientCashbackRate;
      
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
        cashback_earned: cashbackAmount
      });
    } catch (error) {
      console.error("Erro ao criar transação:", error);
      res.status(500).json({ message: "Erro ao criar transação" });
    }
  });

  // ======== ROTAS DE RELATÓRIOS ========
  
  // Relatório dashboard admin
  app.get("/api/admin/dashboard", isAuthenticated, isUserType("admin"), async (req: Request, res: Response) => {
    try {
      const [totalUsers] = await db
        .select({ count: count() })
        .from(users);
      
      const [approvedMerchants] = await db
        .select({ count: count() })
        .from(merchants)
        .where(eq(merchants.approved, true));
      
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const [monthlyTransactions] = await db
        .select({ count: count() })
        .from(transactions)
        .where(gte(transactions.created_at, startOfMonth));
      
      const [totalVolume] = await db
        .select({ 
          total: sql<string>`COALESCE(SUM(CAST(${transactions.amount} AS DECIMAL)), 0)` 
        })
        .from(transactions)
        .where(eq(transactions.status, TransactionStatus.COMPLETED));
      
      res.json({
        total_users: totalUsers.count,
        approved_merchants: approvedMerchants.count,
        monthly_transactions: monthlyTransactions.count,
        total_volume: totalVolume.total || "0"
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

  const httpServer = createServer(app);
  return httpServer;
}