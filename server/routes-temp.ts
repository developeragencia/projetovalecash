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
  referrals,
  transfers,
  commissionSettings,
  notifications,
  PaymentMethod,
  TransactionStatus,
  NotificationType,
  auditLogs,
  userBonuses,
  withdrawalRequests
} from "@shared/schema";
import { addAdminRoutes, addMerchantRoutes, addClientRoutes } from "./routes.admin";
import { addPaymentRoutes } from "./routes.payment";
import { addWithdrawalRoutes } from "./routes.withdrawal";
import { addBrandRoutes } from "./routes.brand";
import { addCleanReportsRoutes } from "./routes.reports-clean";

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
  if (req.user.type !== type) {
    return res.status(403).json({ message: `Acesso restrito para ${type}` });
  }
  next();
};

// Configurações globais do sistema (defaults)
const DEFAULT_SETTINGS = {
  platformFee: 0.05, // 5%
  merchantCommission: 0.02, // 2%
  clientCashback: 0.02, // 2%
  referralBonus: 0.01, // 1%
  minWithdrawal: 20, // $20,00 (valor mínimo de saque)
  maxCashbackBonus: 10.0, // 10%
  withdrawalFee: 0.05, // 5% (taxa sobre saques)
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Configurar autenticação e rotas relacionadas
  setupAuth(app);
  
  // ======== SISTEMA DE REDEFINIÇÃO DE SENHA ========
  
  // Solicitar redefinição de senha (apenas para usuários cadastrados)
  app.post("/api/password-reset/request", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email é obrigatório" });
      }
      
      // Verificar se o usuário existe no sistema
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Por segurança, não revelamos se o email existe ou não
        return res.json({ 
          message: "Se o email estiver cadastrado, você receberá instruções para redefinir sua senha." 
        });
      }
      
      // Gerar token de redefinição
      const token = await storage.createPasswordResetToken(user.id);
      
      // Criar notificação no sistema para o usuário
      await storage.createNotification({
        user_id: user.id,
        type: "password_reset",
        title: "Redefinição de Senha Solicitada",
        message: `Um link para redefinir sua senha foi gerado. Token: ${token}. Este link expira em 1 hora.`,
        is_read: false,
        metadata: JSON.stringify({ token, expires_in: "1 hour" })
      });
      
      console.log(`Token de redefinição criado para usuário ${user.email}: ${token}`);
      
      res.json({ 
        message: "Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.",
        // Em produção, remover esta linha de debug
        debug_token: token
      });
    } catch (error) {
      console.error("Erro ao solicitar redefinição de senha:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  // Validar token de redefinição
  app.get("/api/password-reset/validate/:token", async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      
      const validation = await storage.validatePasswordResetToken(token);
      
      if (!validation.valid) {
        return res.status(400).json({ 
          message: "Token inválido ou expirado",
          valid: false 
        });
      }
      
      res.json({ 
        message: "Token válido",
        valid: true,
        userId: validation.userId 
      });
    } catch (error) {
      console.error("Erro ao validar token:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  // Redefinir senha com token
  app.post("/api/password-reset/confirm", async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ 
          message: "Token e nova senha são obrigatórios" 
        });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ 
          message: "A senha deve ter pelo menos 6 caracteres" 
        });
      }
      
      // Validar token
      const validation = await storage.validatePasswordResetToken(token);
      
      if (!validation.valid || !validation.userId) {
        return res.status(400).json({ 
          message: "Token inválido ou expirado" 
        });
      }
      
      // Atualizar senha
      const success = await storage.updateUserPassword(validation.userId, newPassword);
      
      if (!success) {
        return res.status(500).json({ 
          message: "Erro ao atualizar senha" 
        });
      }
      
      // Marcar token como usado
      await storage.usePasswordResetToken(token);
      
      // Criar notificação de confirmação
      await storage.createNotification({
        user_id: validation.userId,
        type: "security_alert",
        title: "Senha Redefinida com Sucesso",
        message: "Sua senha foi redefinida com sucesso. Se você não fez esta alteração, entre em contato conosco imediatamente.",
        is_read: false,
        metadata: JSON.stringify({ timestamp: new Date().toISOString() })
      });
      
      res.json({ 
        message: "Senha redefinida com sucesso. Você já pode fazer login com sua nova senha." 
      });
    } catch (error) {
      console.error("Erro ao redefinir senha:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  // ======== SISTEMA DE NOTIFICAÇÕES ========
  
  // Obter notificações do usuário autenticado
  app.get("/api/notifications", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      const onlyUnread = req.query.unread === 'true';
      
      const notifications = await storage.getUserNotifications(userId, onlyUnread);
      
      res.json({ notifications });
    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
      res.status(500).json({ message: "Erro ao buscar notificações" });
    }
  });
  
  // Marcar notificação como lida
  app.patch("/api/notifications/:id/read", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const notificationId = parseInt(req.params.id);
      
      if (isNaN(notificationId)) {
        return res.status(400).json({ message: "ID de notificação inválido" });
      }
      
      const success = await storage.markNotificationAsRead(notificationId);
      
      if (!success) {
        return res.status(404).json({ message: "Notificação não encontrada" });
      }
      
      res.json({ message: "Notificação marcada como lida" });
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  // Rota temporária para redefinir senha diretamente (remova em produção)
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
      
      // Hash da nova senha
      const hashedPassword = await storage.hashPassword(newPassword);
      
      // Atualizar senha e marcar como atualizada
      await db.update(users)
        .set({ 
          password: hashedPassword,
          password_updated: true 
        })
        .where(eq(users.email, email));
      
      res.json({ message: "Senha atualizada com sucesso" });
    } catch (error) {
      console.error("Erro ao redefinir senha:", error);
      res.status(500).json({ message: "Erro ao redefinir senha" });
    }
  });
  
  // Verificar se email já teve senha atualizada
  app.get("/api/check-password-updated/:email", async (req: Request, res: Response) => {
    try {
      const { email } = req.params;
      
      if (!email) {
        return res.status(400).json({ message: "Email é obrigatório" });
      }
      
      const user = await db.select({ password_updated: users.password_updated })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      
      if (user.length === 0) {
        return res.json({ passwordUpdated: false, userExists: false });
      }
      
      res.json({ 
        passwordUpdated: user[0].password_updated || false,
        userExists: true 
      });
    } catch (error) {
      console.error("Erro ao verificar status da senha:", error);
      res.status(500).json({ message: "Erro ao verificar status da senha" });
    }
  });
  
  // Adicionar rotas administrativas, de lojista e de cliente
  addAdminRoutes(app);
  addMerchantRoutes(app);
  addClientRoutes(app);
  
  // Adicionar rotas de solicitação de saque
  addWithdrawalRoutes(app);
  
  // Adicionar rotas de configurações de marca
  addBrandRoutes(app);
  
  // Adicionar rotas de pagamento com QR Code
  addPaymentRoutes(app);
  
  // Adicionar rotas limpas de relatórios
  addCleanReportsRoutes(app);
  
  // ======== ROTAS DE PRODUTOS ========

  // Obter todos os produtos
  app.get("/api/products", async (req, res) => {
    try {
      const allProducts = await db
        .select({
          id: products.id,
          name: products.name,
          description: products.description,
          price: products.price,
          category: products.category,
          inventory_count: products.inventory_count,
          active: products.active,
          created_at: products.created_at,
          merchant_id: products.merchant_id,
          merchant_name: merchants.store_name,
          merchant_logo: merchants.logo,
        })
        .from(products)
        .leftJoin(merchants, eq(products.merchant_id, merchants.id))
        .where(eq(products.active, true))
        .orderBy(desc(products.created_at));

      res.json(allProducts);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      res.status(500).json({ message: "Erro ao buscar produtos" });
    }
  });

  // Obter produto específico
  app.get("/api/products/:id", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      
      const [product] = await db
        .select({
          id: products.id,
          name: products.name,
          description: products.description,
          price: products.price,
          category: products.category,
          inventory_count: products.inventory_count,
          active: products.active,
          created_at: products.created_at,
          merchant_id: products.merchant_id,
          merchant_name: merchants.store_name,
          merchant_logo: merchants.logo,
        })
        .from(products)
        .leftJoin(merchants, eq(products.merchant_id, merchants.id))
        .where(eq(products.id, productId));

      if (!product) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }

      res.json(product);
    } catch (error) {
      console.error("Erro ao buscar produto:", error);
      res.status(500).json({ message: "Erro ao buscar produto" });
    }
  });

  // ======== ROTAS DE CASHBACK ========

  // Obter saldo de cashback do usuário
  app.get("/api/user/cashback", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      // Buscar saldo de cashback do usuário
      const [userCashback] = await db
        .select()
        .from(cashbacks)
        .where(eq(cashbacks.user_id, req.user.id))
        .limit(1);

      // Se não existir registro, criar um com saldo zero
      let cashbackData = userCashback;
      if (!userCashback) {
        const [newCashback] = await db
          .insert(cashbacks)
          .values({
            user_id: req.user.id,
            balance: "0.00",
            total_earned: "0.00",
            total_spent: "0.00"
          })
          .returning();
        cashbackData = newCashback;
      }

      // Buscar transações recentes do usuário
      const recentTransactions = await db
        .select({
          id: transactions.id,
          amount: transactions.amount,
          cashback_amount: transactions.cashback_amount,
          description: transactions.description,
          status: transactions.status,
          created_at: transactions.created_at,
          merchant_name: merchants.store_name
        })
        .from(transactions)
        .leftJoin(merchants, eq(transactions.merchant_id, merchants.id))
        .where(eq(transactions.user_id, req.user.id))
        .orderBy(desc(transactions.created_at))
        .limit(10);

      res.json({
        balance: parseFloat(cashbackData.balance || "0"),
        total_earned: parseFloat(cashbackData.total_earned || "0"),
        total_spent: parseFloat(cashbackData.total_spent || "0"),
        recent_transactions: recentTransactions
      });
    } catch (error) {
      console.error("Erro ao buscar cashback do usuário:", error);
      res.status(500).json({ message: "Erro ao buscar dados de cashback" });
    }
  });

  // ======== ROTAS DE DASHBOARD ========

  // Dashboard do cliente
  app.get("/api/client/dashboard", isAuthenticated, async (req, res) => {
    try {
      if (!req.user || req.user.type !== 'client') {
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Buscar saldo de cashback
      const [userCashback] = await db
        .select()
        .from(cashbacks)
        .where(eq(cashbacks.user_id, req.user.id))
        .limit(1);

      // Buscar transações recentes
      const recentTransactions = await db
        .select({
          id: transactions.id,
          amount: transactions.amount,
          cashback_amount: transactions.cashback_amount,
          description: transactions.description,
          status: transactions.status,
          created_at: transactions.created_at,
          merchant_name: merchants.store_name
        })
        .from(transactions)
        .leftJoin(merchants, eq(transactions.merchant_id, merchants.id))
        .where(eq(transactions.user_id, req.user.id))
        .orderBy(desc(transactions.created_at))
        .limit(5);

      // Contar total de transações
      const [transactionCount] = await db
        .select({ count: count() })
        .from(transactions)
        .where(eq(transactions.user_id, req.user.id));

      // Buscar referências
      const [referralData] = await db
        .select({ 
          count: count(),
          total_bonus: sql`COALESCE(SUM(bonus), 0)` 
        })
        .from(referrals)
        .where(eq(referrals.referrer_id, req.user.id));

      const dashboardData = {
        cashbackBalance: parseFloat(userCashback?.balance || "0"),
        referralBalance: parseFloat(referralData?.total_bonus || "0"),
        transactionsCount: Number(transactionCount.count) || 0,
        recentTransactions: recentTransactions.map(tx => ({
          id: tx.id,
          merchant: tx.merchant_name || "Loja",
          date: tx.created_at?.toISOString() || new Date().toISOString(),
          amount: parseFloat(tx.amount || "0"),
          cashback: parseFloat(tx.cashback_amount || "0"),
          status: tx.status || "pending"
        })),
        monthStats: {
          earned: parseFloat(userCashback?.total_earned || "0"),
          transferred: 0,
          received: parseFloat(referralData?.total_bonus || "0")
        },
        balanceHistory: [
          { month: "Jan", value: parseFloat(userCashback?.balance || "0") * 0.3 },
          { month: "Fev", value: parseFloat(userCashback?.balance || "0") * 0.5 },
          { month: "Mar", value: parseFloat(userCashback?.balance || "0") * 0.8 },
          { month: "Abr", value: parseFloat(userCashback?.balance || "0") }
        ]
      };

      res.json(dashboardData);
    } catch (error) {
      console.error("Erro ao buscar dashboard do cliente:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Dashboard do merchant
  app.get("/api/merchant/dashboard", isAuthenticated, async (req, res) => {
    try {
      if (!req.user || req.user.type !== 'merchant') {
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Buscar loja do merchant
      const [merchant] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.user_id, req.user.id))
        .limit(1);

      if (!merchant) {
        return res.status(404).json({ message: "Loja não encontrada" });
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
      const [salesStats] = await db
        .select({
          total_sales: sql`COALESCE(SUM(amount), 0)`,
          total_transactions: count(),
          total_cashback: sql`COALESCE(SUM(cashback_amount), 0)`
        })
        .from(transactions)
        .where(eq(transactions.merchant_id, merchant.id));

      // Calcular vendas do mês atual
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const [monthlyStats] = await db
        .select({
          monthly_sales: sql`COALESCE(SUM(amount), 0)`,
          monthly_transactions: count()
        })
        .from(transactions)
        .where(and(
          eq(transactions.merchant_id, merchant.id),
          gte(transactions.created_at, startOfMonth)
        ));

      const dashboardData = {
        totalSales: parseFloat(salesStats?.total_sales || "0"),
        totalTransactions: Number(salesStats?.total_transactions) || 0,
        totalCashback: parseFloat(salesStats?.total_cashback || "0"),
        monthlySales: parseFloat(monthlyStats?.monthly_sales || "0"),
        monthlyTransactions: Number(monthlyStats?.monthly_transactions) || 0,
        commission: parseFloat(salesStats?.total_sales || "0") * 0.02, // 2% de comissão
        recentTransactions: recentTransactions.map(tx => ({
          id: tx.id,
          client: tx.client_name || "Cliente",
          date: tx.created_at?.toISOString() || new Date().toISOString(),
          amount: parseFloat(tx.amount || "0"),
          cashback: parseFloat(tx.cashback_amount || "0"),
          status: tx.status || "pending"
        })),
        salesHistory: [
          { month: "Jan", sales: parseFloat(salesStats?.total_sales || "0") * 0.2 },
          { month: "Fev", sales: parseFloat(salesStats?.total_sales || "0") * 0.4 },
          { month: "Mar", sales: parseFloat(salesStats?.total_sales || "0") * 0.7 },
          { month: "Abr", sales: parseFloat(salesStats?.total_sales || "0") }
        ]
      };

      res.json(dashboardData);
    } catch (error) {
      console.error("Erro ao buscar dashboard do merchant:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Dashboard do admin
  app.get("/api/admin/dashboard", isAuthenticated, async (req, res) => {
    try {
      if (!req.user || req.user.type !== 'admin') {
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Estatísticas gerais do sistema
      const [userStats] = await db
        .select({
          total_users: count(),
          clients: sql`COUNT(CASE WHEN type = 'client' THEN 1 END)`,
          merchants: sql`COUNT(CASE WHEN type = 'merchant' THEN 1 END)`
        })
        .from(users);

      const [transactionStats] = await db
        .select({
          total_transactions: count(),
          total_volume: sql`COALESCE(SUM(amount), 0)`,
          total_cashback: sql`COALESCE(SUM(cashback_amount), 0)`
        })
        .from(transactions);

      const [storeStats] = await db
        .select({
          total_stores: count(),
          active_stores: sql`COUNT(CASE WHEN approved = true THEN 1 END)`
        })
        .from(merchants);

      // Transações recentes para admin
      const recentTransactions = await db
        .select({
          id: transactions.id,
          amount: transactions.amount,
          cashback_amount: transactions.cashback_amount,
          description: transactions.description,
          status: transactions.status,
          created_at: transactions.created_at,
          client_name: users.name,
          merchant_name: merchants.store_name
        })
        .from(transactions)
        .leftJoin(users, eq(transactions.user_id, users.id))
        .leftJoin(merchants, eq(transactions.merchant_id, merchants.id))
        .orderBy(desc(transactions.created_at))
        .limit(10);

      const dashboardData = {
        totalUsers: Number(userStats?.total_users) || 0,
        totalClients: Number(userStats?.clients) || 0,
        totalMerchants: Number(userStats?.merchants) || 0,
        totalStores: Number(storeStats?.total_stores) || 0,
        activeStores: Number(storeStats?.active_stores) || 0,
        totalTransactions: Number(transactionStats?.total_transactions) || 0,
        totalVolume: parseFloat(transactionStats?.total_volume || "0"),
        totalCashback: parseFloat(transactionStats?.total_cashback || "0"),
        platformRevenue: parseFloat(transactionStats?.total_volume || "0") * 0.05, // 5% de taxa da plataforma
        recentTransactions: recentTransactions.map(tx => ({
          id: tx.id,
          client: tx.client_name || "Cliente",
          merchant: tx.merchant_name || "Loja",
          date: tx.created_at?.toISOString() || new Date().toISOString(),
          amount: parseFloat(tx.amount || "0"),
          cashback: parseFloat(tx.cashback_amount || "0"),
          status: tx.status || "pending"
        })),
        monthlyStats: [
          { month: "Jan", users: Number(userStats?.total_users) * 0.3, volume: parseFloat(transactionStats?.total_volume || "0") * 0.2 },
          { month: "Fev", users: Number(userStats?.total_users) * 0.5, volume: parseFloat(transactionStats?.total_volume || "0") * 0.4 },
          { month: "Mar", users: Number(userStats?.total_users) * 0.8, volume: parseFloat(transactionStats?.total_volume || "0") * 0.7 },
          { month: "Abr", users: Number(userStats?.total_users), volume: parseFloat(transactionStats?.total_volume || "0") }
        ]
      };

      res.json(dashboardData);
    } catch (error) {
      console.error("Erro ao buscar dashboard do admin:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Transações do cliente
  app.get("/api/client/transactions", isAuthenticated, async (req, res) => {
    try {
      if (!req.user || req.user.type !== 'client') {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const { period = "30days", store = "all", status = "all" } = req.query;

      let whereConditions = [eq(transactions.user_id, req.user.id)];

      // Filtro por período
      if (period !== "all") {
        const daysAgo = period === "7days" ? 7 : period === "30days" ? 30 : period === "90days" ? 90 : 365;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysAgo);
        whereConditions.push(gte(transactions.created_at, startDate));
      }

      // Filtro por loja
      if (store !== "all") {
        whereConditions.push(eq(transactions.merchant_id, parseInt(store as string)));
      }

      // Filtro por status
      if (status !== "all") {
        whereConditions.push(eq(transactions.status, status as string));
      }

      const clientTransactions = await db
        .select({
          id: transactions.id,
          amount: transactions.amount,
          cashback_amount: transactions.cashback_amount,
          description: transactions.description,
          status: transactions.status,
          payment_method: transactions.payment_method,
          created_at: transactions.created_at,
          merchant_name: merchants.store_name,
          merchant_id: transactions.merchant_id
        })
        .from(transactions)
        .leftJoin(merchants, eq(transactions.merchant_id, merchants.id))
        .where(and(...whereConditions))
        .orderBy(desc(transactions.created_at));

      const formattedTransactions = clientTransactions.map(tx => ({
        id: tx.id,
        merchant: tx.merchant_name || "Loja",
        date: tx.created_at?.toISOString() || new Date().toISOString(),
        amount: parseFloat(tx.amount || "0"),
        cashback: parseFloat(tx.cashback_amount || "0"),
        status: tx.status || "pending",
        paymentMethod: tx.payment_method || "cash",
        description: tx.description || "",
        merchant_id: tx.merchant_id
      }));

      res.json(formattedTransactions);
    } catch (error) {
      console.error("Erro ao buscar transações do cliente:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Referências do cliente
  app.get("/api/client/referrals", isAuthenticated, async (req, res) => {
    try {
      if (!req.user || req.user.type !== 'client') {
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Buscar código de convite do usuário
      const referralCode = req.user.invitation_code || `REF${req.user.id}`;
      const referralUrl = `https://valecashback.com/convite/${referralCode}`;

      // Buscar referências feitas pelo usuário
      const userReferrals = await db
        .select({
          id: referrals.id,
          referred_user_id: referrals.referred_id,
          bonus: referrals.bonus,
          status: referrals.status,
          created_at: referrals.created_at,
          referred_name: users.name,
          referred_email: users.email
        })
        .from(referrals)
        .leftJoin(users, eq(referrals.referred_id, users.id))
        .where(eq(referrals.referrer_id, req.user.id))
        .orderBy(desc(referrals.created_at));

      // Calcular estatísticas
      const [stats] = await db
        .select({
          total_referrals: count(),
          total_earned: sql`COALESCE(SUM(bonus), 0)`,
          pending_count: sql`COUNT(CASE WHEN status = 'pending' THEN 1 END)`
        })
        .from(referrals)
        .where(eq(referrals.referrer_id, req.user.id));

      const referralsData = {
        referralCode,
        referralUrl,
        referralsCount: Number(stats?.total_referrals) || 0,
        pendingReferrals: Number(stats?.pending_count) || 0,
        totalEarned: parseFloat(stats?.total_earned || "0").toFixed(2),
        commission: "5.0", // 5% de comissão por referência
        referrals: userReferrals.map(ref => ({
          id: ref.id,
          name: ref.referred_name || "Usuário",
          email: ref.referred_email || "",
          date: ref.created_at?.toISOString() || new Date().toISOString(),
          bonus: parseFloat(ref.bonus || "0"),
          status: ref.status || "pending"
        }))
      };

      res.json(referralsData);
    } catch (error) {
      console.error("Erro ao buscar referências do cliente:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ======== ROTAS DE BÔNUS (SEPARADO DO CASHBACK) ========

  // Obter bônus disponível do usuário (separado do cashback)
  app.get("/api/user/bonus", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      // Buscar bônus não utilizados do usuário
      const userBonusesResult = await db
        .select()
        .from(userBonuses)
        .where(and(
          eq(userBonuses.user_id, req.user.id),
          eq(userBonuses.is_used, false)
        ));

      // Calcular total de bônus disponível
      const totalBonus = userBonusesResult.reduce((sum, bonus) => {
        return sum + parseFloat(bonus.amount || '0');
      }, 0);

      res.json({
        totalBonus: totalBonus,
        bonuses: userBonusesResult,
        message: totalBonus > 0 ? `Você tem $${totalBonus.toFixed(2)} em bônus disponível!` : "Nenhum bônus disponível"
      });
    } catch (error) {
      console.error("Erro ao buscar bônus do usuário:", error);
      res.status(500).json({ message: "Erro ao buscar bônus" });
    }
  });

  // ======== ROTAS DE NOTIFICAÇÕES ========

  // Obter notificações do usuário atual
  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      // Verificamos se o usuário está definido
      if (!req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      // Buscar todas as notificações do usuário, ordenadas por data de criação (mais recentes primeiro)
      // Aumentado o limite para garantir que todas as notificações sejam exibidas
      const userNotifications = await db
        .select()
        .from(notifications)
        .where(eq(notifications.user_id, req.user.id))
        .orderBy(desc(notifications.created_at))
        .limit(100);

      // Contar notificações não lidas
      const unreadCount = await db
        .select({ count: count() })
        .from(notifications)
        .where(and(
          eq(notifications.user_id, req.user.id),
          eq(notifications.read, false)
        ));

      res.json({
        notifications: userNotifications,
        unreadCount: Number(unreadCount[0].count) || 0
      });
    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
      res.status(500).json({ message: "Erro ao buscar notificações" });
    }
  });

  // Marcar notificação como lida
  app.patch("/api/notifications/:id/read", isAuthenticated, async (req, res) => {
    try {
      // Verificamos se o usuário está definido
      if (!req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      const notificationId = parseInt(req.params.id);
      
      // Verificar se a notificação existe e pertence ao usuário atual
      const notification = await db
        .select()
        .from(notifications)
        .where(and(
          eq(notifications.id, notificationId),
          eq(notifications.user_id, req.user.id)
        ))
        .limit(1);
      
      if (notification.length === 0) {
        return res.status(404).json({ message: "Notificação não encontrada" });
      }
      
      // Marcar como lida
      await db
        .update(notifications)
        .set({ read: true })
        .where(eq(notifications.id, notificationId));
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
      res.status(500).json({ message: "Erro ao atualizar notificação" });
    }
  });

  // Marcar todas as notificações como lidas
  app.patch("/api/notifications/mark-all-read", isAuthenticated, async (req, res) => {
    try {
      // Verificamos se o usuário está definido
      if (!req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      await db
        .update(notifications)
        .set({ read: true })
        .where(and(
          eq(notifications.user_id, req.user.id),
          eq(notifications.read, false)
        ));
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Erro ao marcar todas notificações como lidas:", error);
      res.status(500).json({ message: "Erro ao atualizar notificações" });
    }
  });

  // Excluir notificação
  app.delete("/api/notifications/:id", isAuthenticated, async (req, res) => {
    try {
      // Verificamos se o usuário está definido
      if (!req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      const notificationId = parseInt(req.params.id);
      
      // Verificar se a notificação existe e pertence ao usuário atual
      const notification = await db
        .select()
        .from(notifications)
        .where(and(
          eq(notifications.id, notificationId),
          eq(notifications.user_id, req.user.id)
        ))
        .limit(1);
      
      if (notification.length === 0) {
        return res.status(404).json({ message: "Notificação não encontrada" });
      }
      
      // Excluir notificação
      await db
        .delete(notifications)
        .where(eq(notifications.id, notificationId));
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Erro ao excluir notificação:", error);
      res.status(500).json({ message: "Erro ao excluir notificação" });
    }
  });
  
  // Inicializa as configurações de comissão
  await initializeCommissionSettings();
  
  // API para listar todas as lojas (pública)
  app.get("/api/stores", async (req, res) => {
    try {
      const allStores = await db
        .select({
          id: merchants.id,
          name: merchants.store_name,  // Usando o nome exato da coluna no banco
          logo: merchants.logo,
          category: merchants.category,
          address: merchants.address,
          city: merchants.city,
          state: merchants.state,
          commission_rate: merchants.commission_rate,
          approved: merchants.approved,
          created_at: merchants.created_at,
          user_id: merchants.user_id,
        })
        .from(merchants)
        .where(eq(merchants.approved, true));
        
      // Ordenar manualmente por nome da loja
      allStores.sort((a, b) => a.name.localeCompare(b.name));
      
      // Adicionar informações adicionais como avaliações e número de clientes
      const storesWithDetails = await Promise.all(
        allStores.map(async (store) => {
          // Obter informações do usuário associado (lojista)
          const [merchantUser] = await db
            .select({
              name: users.name,
              email: users.email,
              phone: users.phone,
              photo: users.photo,
              status: users.status
            })
            .from(users)
            .where(eq(users.id, store.user_id));
            
          // Contar o número de transações
          const [transactionCount] = await db
            .select({
              count: sql`COUNT(*)`,
            })
            .from(transactions)
            .where(eq(transactions.merchant_id, store.id));
          
          // Calcular o volume de vendas
          const [salesVolume] = await db
            .select({
              total: sql`COALESCE(SUM(amount), 0)`,
            })
            .from(transactions)
            .where(eq(transactions.merchant_id, store.id));
          
          return {
            id: store.id,
            name: store.name,
            logo: store.logo || "https://ui-avatars.com/api/?name=" + encodeURIComponent(store.name) + "&background=random&color=fff&size=128",
            category: store.category,
            address: store.address,
            city: store.city,
            state: store.state,
            commission_rate: store.commission_rate,
            created_at: store.created_at,
            owner: merchantUser.name,
            email: merchantUser.email,
            phone: merchantUser.phone,
            photo: merchantUser.photo,
            status: merchantUser.status,
            transactions: Number(transactionCount.count) || 0,
            volume: Number(salesVolume.total) || 0,
            rating: 4.5, // Valor padrão, seria substituído por real no futuro
          };
        })
      );
      
      res.json(storesWithDetails);
    } catch (error) {
      console.error("Erro ao buscar lojas:", error);
      res.status(500).json({ message: "Erro ao buscar lojas" });
    }
  });
  
  // API para buscar detalhes de uma loja específica
  app.get("/api/stores/:id", async (req, res) => {
    try {
      const storeId = parseInt(req.params.id);
      
      const [store] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.id, storeId));
      
      if (!store) {
        return res.status(404).json({ message: "Loja não encontrada" });
      }
      
      // Obter informações do usuário associado (lojista)
      const [merchantUser] = await db
        .select({
          name: users.name,
          email: users.email,
          phone: users.phone,
          photo: users.photo,
        })
        .from(users)
        .where(eq(users.id, store.user_id));
        
      // Obter produtos da loja
      const storeProducts = await db
        .select()
        .from(products)
        .where(eq(products.merchant_id, storeId))
        .limit(10);
        
      // Obter transações recentes
      // Buscar transações sem usar orderBy(desc()) que está causando erros
      const allRecentTransactions = await db
        .select({
          id: transactions.id,
          amount: transactions.amount,
          date: transactions.created_at,
          status: transactions.status,
        })
        .from(transactions)
        .where(eq(transactions.merchant_id, storeId))
        .limit(10);
        
      // Ordenar manualmente por data de criação (decrescente)
      const recentTransactions = allRecentTransactions
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);
        
      // Contar o número de transações
      const [transactionCount] = await db
        .select({
          count: sql`COUNT(*)`,
        })
        .from(transactions)
        .where(eq(transactions.merchant_id, storeId));
      
      // Calcular o volume de vendas
      const [salesVolume] = await db
        .select({
          total: sql`COALESCE(SUM(amount), 0)`,
        })
        .from(transactions)
        .where(eq(transactions.merchant_id, storeId));
      
      const storeDetails = {
        ...store,
        owner: merchantUser.name,
        email: merchantUser.email,
        phone: merchantUser.phone,
        photo: merchantUser.photo,
        products: storeProducts,
        recentTransactions,
        transactionCount: Number(transactionCount.count) || 0,
        salesVolume: Number(salesVolume.total) || 0,
        rating: 4.5, // Valor padrão, seria substituído por real no futuro
      };
      
      res.json(storeDetails);
    } catch (error) {
      console.error("Erro ao buscar detalhes da loja:", error);
      res.status(500).json({ message: "Erro ao buscar detalhes da loja" });
    }
  });
  
  // API para aprovar uma loja (admin)
  app.post("/api/admin/stores/:id/approve", isUserType("admin"), async (req, res) => {
    try {
      const storeId = parseInt(req.params.id);
      
      const [updatedStore] = await db
        .update(merchants)
        .set({
          approved: true,
        })
        .where(eq(merchants.id, storeId))
        .returning();
        
      if (!updatedStore) {
        return res.status(404).json({ message: "Loja não encontrada" });
      }
      
      res.json({ message: "Loja aprovada com sucesso", store: updatedStore });
    } catch (error) {
      console.error("Erro ao aprovar loja:", error);
      res.status(500).json({ message: "Erro ao aprovar loja" });
    }
  });
  
  // API para rejeitar uma loja (admin)
  app.post("/api/admin/stores/:id/reject", isUserType("admin"), async (req, res) => {
    try {
      const storeId = parseInt(req.params.id);
      const { reason } = req.body;
      
      if (!reason) {
        return res.status(400).json({ message: "Motivo da rejeição é obrigatório" });
      }
      
      // Obter dados da loja
      const [store] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.id, storeId));
      
      if (!store) {
        return res.status(404).json({ message: "Loja não encontrada" });
      }
      
      // Atualizar status do usuário lojista
      await db
        .update(users)
        .set({
          status: "rejected",
        })
        .where(eq(users.id, store.user_id));
      
      // Em uma implementação real, enviaríamos um email com o motivo da rejeição
      
      res.json({ message: "Loja rejeitada com sucesso" });
    } catch (error) {
      console.error("Erro ao rejeitar loja:", error);
      res.status(500).json({ message: "Erro ao rejeitar loja" });
    }
  });
  
  // API para ativar/desativar uma loja (admin)
  app.post("/api/admin/stores/:id/toggle-status", isUserType("admin"), async (req, res) => {
    try {
      const storeId = parseInt(req.params.id);
      
      // Obter dados da loja
      const [store] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.id, storeId));
      
      if (!store) {
        return res.status(404).json({ message: "Loja não encontrada" });
      }
      
      // Obter status atual do usuário
      const [merchantUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, store.user_id));
      
      const newStatus = merchantUser.status === "active" ? "inactive" : "active";
      
      // Atualizar status do usuário lojista
      await db
        .update(users)
        .set({
          status: newStatus,
        })
        .where(eq(users.id, store.user_id));
      
      res.json({ message: `Loja ${newStatus === "active" ? "ativada" : "desativada"} com sucesso` });
    } catch (error) {
      console.error("Erro ao alterar status da loja:", error);
      res.status(500).json({ message: "Erro ao alterar status da loja" });
    }
  });
  
  // API para atualizar taxa de comissão de uma loja (admin)
  app.post("/api/admin/stores/:id/commission", isUserType("admin"), async (req, res) => {
    try {
      const storeId = parseInt(req.params.id);
      const { commissionRate } = req.body;
      
      if (commissionRate === undefined || isNaN(Number(commissionRate))) {
        return res.status(400).json({ message: "Taxa de comissão inválida" });
      }
      
      const [updatedStore] = await db
        .update(merchants)
        .set({
          commission_rate: Number(commissionRate),
        })
        .where(eq(merchants.id, storeId))
        .returning();
        
      if (!updatedStore) {
        return res.status(404).json({ message: "Loja não encontrada" });
      }
      
      res.json({ message: "Taxa de comissão atualizada com sucesso", store: updatedStore });
    } catch (error) {
      console.error("Erro ao atualizar taxa de comissão:", error);
      res.status(500).json({ message: "Erro ao atualizar taxa de comissão" });
    }
  });
  
  // Endpoint para obter dados do perfil autenticado
  app.get("/api/auth/me", (req, res) => {
    if (req.isAuthenticated()) {
      // Excluir senha e outros dados sensíveis
      const { password, ...userData } = req.user;
      return res.json(userData);
    }
    return res.status(401).json({ message: "Usuário não autenticado" });
  });
  
  // Inicializar configurações de comissão se não existirem
  async function initializeCommissionSettings() {
    try {
      // Primeiro, verificar se a coluna withdrawal_fee existe na tabela
      try {
        await db.execute(sql`
          DO $$
          BEGIN
            BEGIN
              ALTER TABLE commission_settings 
              ADD COLUMN withdrawal_fee NUMERIC NOT NULL DEFAULT '5.0';
              RAISE NOTICE 'Coluna withdrawal_fee adicionada com sucesso';
            EXCEPTION
              WHEN duplicate_column THEN
                RAISE NOTICE 'Coluna withdrawal_fee já existe';
            END;
          END $$;
        `);
        console.log("Tentativa de adicionar a coluna withdrawal_fee concluída");
      } catch (columnError) {
        console.log("Erro ao adicionar coluna withdrawal_fee (ignorando):", columnError);
        // Podemos ignorar este erro e continuar
      }
      
      // Agora verificar se já existem configurações
      const existingSettings = await db.execute(sql`
        SELECT id, platform_fee, merchant_commission, client_cashback, 
               referral_bonus, min_withdrawal, max_cashback_bonus 
        FROM commission_settings LIMIT 1
      `);
      
      if (!existingSettings.rows.length) {
        // Criar configurações padrão usando SQL direto para evitar problemas de schema
        await db.execute(sql`
          INSERT INTO commission_settings (
            platform_fee, 
            merchant_commission, 
            client_cashback, 
            referral_bonus, 
            min_withdrawal, 
            max_cashback_bonus
          ) VALUES (
            '5.0', 
            '2.0', 
            '2.0', 
            '1.0', 
            '20.0', 
            '10.0'
          )
        `);
        
        console.log("Configurações de comissão padrão criadas com sucesso");
      } else {
        console.log("Configurações de comissão existentes encontradas");
        // Atualizar valores para os novos padrões
        await db.execute(sql`
          UPDATE commission_settings
          SET platform_fee = '5.0',
              min_withdrawal = '20.0'
          WHERE platform_fee != '5.0' OR min_withdrawal != '20.0'
        `);
      }
    } catch (error) {
      console.error("Erro ao inicializar configurações de comissão:", error);
    }
  }
  
  // Inicializar as configurações na inicialização do servidor
  initializeCommissionSettings();
  
  // ROTAS DO ADMIN
  
  // Obter configurações de taxas
  app.get("/api/admin/settings/rates", isUserType("admin"), async (req, res) => {
    try {
      const settings = await db.select().from(commissionSettings).limit(1);
      
      if (settings.length === 0) {
        // Se não houver configurações, criar as padrões e retornar
        const [newSettings] = await db.insert(commissionSettings).values({
          platform_fee: DEFAULT_SETTINGS.platformFee,
          merchant_commission: DEFAULT_SETTINGS.merchantCommission,
          client_cashback: DEFAULT_SETTINGS.clientCashback,
          referral_bonus: DEFAULT_SETTINGS.referralBonus,
          min_withdrawal: DEFAULT_SETTINGS.minWithdrawal,
          max_cashback_bonus: DEFAULT_SETTINGS.maxCashbackBonus,
        }).returning();
        
        return res.json(newSettings);
      }
      
      res.json(settings[0]);
    } catch (error) {
      console.error("Erro ao buscar configurações de taxas:", error);
      res.status(500).json({ message: "Erro ao buscar configurações de taxas" });
    }
  });
  
  // Atualizar configurações de taxas
  app.patch("/api/admin/settings/rates", isUserType("admin"), async (req, res) => {
    try {
      const {
        platformFee,
        merchantCommission,
        clientCashback,
        referralBonus,
        minWithdrawal,
        maxCashbackBonus
      } = req.body;
      
      // Buscar configurações existentes
      const settings = await db.select().from(commissionSettings).limit(1);
      
      if (settings.length === 0) {
        // Se não houver configurações, criar as novas
        const [newSettings] = await db.insert(commissionSettings).values({
          platformFee: platformFee ?? DEFAULT_SETTINGS.platformFee,
          merchantCommission: merchantCommission ?? DEFAULT_SETTINGS.merchantCommission,
          clientCashback: clientCashback ?? DEFAULT_SETTINGS.clientCashback,
          referralBonus: referralBonus ?? DEFAULT_SETTINGS.referralBonus,
          minWithdrawal: minWithdrawal ?? DEFAULT_SETTINGS.minWithdrawal,
          maxCashbackBonus: maxCashbackBonus ?? DEFAULT_SETTINGS.maxCashbackBonus,
          updatedBy: req.user?.id,
        }).returning();
        
        return res.json(newSettings);
      }
      
      // Atualizar configurações existentes
      const [updatedSettings] = await db.update(commissionSettings)
        .set({
          ...(platformFee !== undefined && { platformFee }),
          ...(merchantCommission !== undefined && { merchantCommission }),
          ...(clientCashback !== undefined && { clientCashback }),
          ...(referralBonus !== undefined && { referralBonus }),
          ...(minWithdrawal !== undefined && { minWithdrawal }),
          ...(maxCashbackBonus !== undefined && { maxCashbackBonus }),
          updatedAt: new Date(),
          updatedBy: req.user?.id,
        })
        .where(eq(commissionSettings.id, settings[0].id))
        .returning();
      
      res.json(updatedSettings);
    } catch (error) {
      console.error("Erro ao atualizar configurações de taxas:", error);
      res.status(500).json({ message: "Erro ao atualizar configurações de taxas" });
    }
  });
  
  // Dashboard do Admin
  app.get("/api/admin/dashboard", isUserType("admin"), async (req, res) => {
    try {
      // Implementar dashboard do administrador com métricas gerais
      const userCount = await db.select({ count: sql`COUNT(*)` }).from(users);
      const merchantCount = await db.select({ count: sql`COUNT(*)` }).from(merchants);
      const transactionCount = await db.select({ count: sql`COUNT(*)` }).from(transactions);
      const totalSales = await db.select({ sum: sql`SUM(amount)` }).from(transactions);
      
      // Buscar transações sem usar orderBy(desc()) que está causando erros
      const allRecentTransactions = await db
        .select({
          id: transactions.id,
          amount: transactions.amount,
          date: transactions.created_at,
          customerName: users.name,
          merchantName: merchants.store_name,
          status: transactions.status
        })
        .from(transactions)
        .innerJoin(users, eq(transactions.user_id, users.id))
        .innerJoin(merchants, eq(transactions.merchant_id, merchants.id))
        .limit(10);
        
      // Ordenar manualmente por data de criação (decrescente)
      const recentTransactions = allRecentTransactions
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);
      
      res.json({
        userCount: userCount[0].count,
        merchantCount: merchantCount[0].count,
        transactionCount: transactionCount[0].count,
        totalSales: totalSales[0].sum || 0,
        recentTransactions
      });
    } catch (error) {
      console.error("Erro ao buscar dados do dashboard admin:", error);
      res.status(500).json({ message: "Erro ao buscar dados do dashboard" });
    }
  });
  
  // ROTAS DO LOJISTA
  
  // Dashboard do Lojista
  app.get("/api/merchant/dashboard", isUserType("merchant"), async (req, res) => {
    try {
      // Implementar dashboard do lojista com métricas das vendas
      const merchantId = req.user?.id;
      
      if (!merchantId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      // Buscar merchant_id usando SQL direto para evitar problemas de nomenclatura das colunas
      const merchantResult = await db.execute(
        sql`SELECT id FROM merchants WHERE user_id = ${merchantId}`
      );
      
      if (merchantResult.rows.length === 0) {
        return res.status(404).json({ message: "Lojista não encontrado" });
      }
      
      const merchant_id = merchantResult.rows[0].id;
      
      // Obter estatísticas de vendas usando SQL direto
      const salesData = await db.execute(
        sql`SELECT 
          COUNT(*) as transactions_count,
          COALESCE(SUM(amount), 0) as total_sales,
          COALESCE(SUM(CASE WHEN DATE(created_at) = CURRENT_DATE THEN amount ELSE 0 END), 0) as today_sales,
          COALESCE(SUM(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 ELSE 0 END), 0) as today_transactions
        FROM transactions 
        WHERE merchant_id = ${merchant_id}`
      );
      
      // Calcular valor médio de vendas do dia - com tratamento melhorado para valores inválidos
      let todayTransactions = 0;
      if (salesData.rows && salesData.rows.length > 0) {
        const rawValue = salesData.rows[0]?.today_transactions;
        if (rawValue !== null && rawValue !== undefined) {
          todayTransactions = typeof rawValue === 'string' ? parseInt(rawValue) : Number(rawValue);
          if (isNaN(todayTransactions)) todayTransactions = 0;
        }
      }
      
      let todaySales = 0;
      if (salesData.rows && salesData.rows.length > 0) {
        const rawValue = salesData.rows[0]?.today_sales;
        if (rawValue !== null && rawValue !== undefined) {
          todaySales = typeof rawValue === 'string' ? parseFloat(rawValue) : Number(rawValue);
          if (isNaN(todaySales)) todaySales = 0;
        }
      }
      
      console.log(`Vendas de hoje: ${todaySales}, Transações: ${todayTransactions}`);
      
      // Calcular valor médio de vendas do dia
      const averageSale = todayTransactions > 0 ? todaySales / todayTransactions : 0;
      
      // Calcular comissão do dia (2%)
      const todayCommission = todaySales * 0.02;
      
      // Obter vendas dos últimos 7 dias
      const weekSalesResult = await db.execute(
        sql`SELECT 
          TO_CHAR(DATE(created_at), 'Dy') as day, 
          COALESCE(SUM(amount), 0) as value
        FROM transactions 
        WHERE 
          merchant_id = ${merchant_id} AND 
          created_at >= CURRENT_DATE - INTERVAL '6 days'
        GROUP BY DATE(created_at), TO_CHAR(DATE(created_at), 'Dy')
        ORDER BY DATE(created_at)`
      );
      
      // Obter vendas recentes com informações do cliente
      const recentSalesResult = await db.execute(
        sql`SELECT 
          t.id, 
          t.amount, 
          t.cashback_amount as cashback, 
          t.created_at as date, 
          u.name as customer, 
          t.status,
          (SELECT COUNT(*) FROM transaction_items WHERE transaction_id = t.id) as items_count
        FROM transactions t
        JOIN users u ON t.user_id = u.id
        WHERE t.merchant_id = ${merchant_id}
        ORDER BY t.created_at DESC
        LIMIT 5`
      );
      
      // Obter produtos mais vendidos
      const topProductsResult = await db.execute(
        sql`SELECT 
          p.name, 
          COUNT(*) as sales,
          COALESCE(SUM(ti.price * ti.quantity), 0) as total
        FROM transaction_items ti
        JOIN products p ON ti.product_id = p.id
        JOIN transactions t ON ti.transaction_id = t.id
        WHERE t.merchant_id = ${merchant_id}
        GROUP BY p.name
        ORDER BY sales DESC
        LIMIT 5`
      );
      
      // Formatar dados para o frontend com tratamento de tipos
      const recentSales = recentSalesResult.rows.map(sale => {
        // Conversão segura dos tipos desconhecidos
        const saleId = typeof sale.id === 'number' ? sale.id : parseInt(String(sale.id || 0));
        const customerName = String(sale.customer || '');
        const saleDate = sale.date ? new Date(String(sale.date)) : new Date();
        const amount = typeof sale.amount === 'number' ? sale.amount : parseFloat(String(sale.amount || 0));
        const cashback = typeof sale.cashback === 'number' ? sale.cashback : parseFloat(String(sale.cashback || 0));
        const itemsCount = typeof sale.items_count === 'number' ? sale.items_count : parseInt(String(sale.items_count || 0));
        
        return {
          id: saleId,
          customer: customerName,
          date: saleDate.toLocaleDateString('pt-BR'),
          amount: amount,
          cashback: cashback,
          items: `${itemsCount} ${itemsCount === 1 ? 'item' : 'itens'}`
        };
      });
      
      const weekSalesData = weekSalesResult.rows.map(day => {
        const dayName = String(day.day || '');
        const value = typeof day.value === 'number' ? day.value : parseFloat(String(day.value || 0));
        
        return {
          day: dayName,
          value: value
        };
      });
      
      const topProducts = topProductsResult.rows.map(product => {
        const productName = String(product.name || '');
        const sales = typeof product.sales === 'number' ? product.sales : parseInt(String(product.sales || 0));
        const total = typeof product.total === 'number' ? product.total : parseFloat(String(product.total || 0));
        
        return {
          name: productName,
          sales: sales,
          total: total
        };
      });
      
      // Preparar resposta completa para o dashboard
      const dashboardData = {
        salesSummary: {
          today: {
            total: todaySales,
            transactions: todayTransactions,
            average: averageSale,
            commission: todayCommission
          }
        },
        weekSalesData,
        recentSales,
        topProducts
      };
      
      res.json(dashboardData);
    } catch (error) {
      console.error("Erro ao buscar dados do dashboard lojista:", error);
      res.status(500).json({ message: "Erro ao buscar dados do dashboard" });
    }
  });
  
  // Obter saldo da carteira do lojista
  app.get("/api/merchant/wallet", isUserType("merchant"), async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Buscar saldo atual
      const [walletData] = await db
        .select()
        .from(cashbacks)
        .where(eq(cashbacks.user_id, userId));
      
      if (!walletData) {
        return res.status(404).json({ 
          success: false, 
          message: "Carteira não encontrada" 
        });
      }
      
      // Buscar solicitações de saque pendentes
      const pendingWithdrawals = await db
        .select({
          total: sql`COALESCE(SUM(CAST(amount as DECIMAL(10,2))), 0)`.as("total"),
          count: sql`COUNT(*)`.as("count")
        })
        .from(withdrawalRequests)
        .where(
          and(
            eq(withdrawalRequests.user_id, userId),
            eq(withdrawalRequests.status, "pending")
          )
        );
      
      const currentBalance = parseFloat(walletData.balance);
      const pendingAmount = parseFloat(pendingWithdrawals[0]?.total?.toString() || "0");
      const pendingCount = parseInt(pendingWithdrawals[0]?.count?.toString() || "0");
      
      res.json({
        success: true,
        walletData: {
          currentBalance,
          pendingAmount,
          pendingCount,
          availableBalance: Math.max(0, currentBalance - pendingAmount)
        }
      });
    } catch (error) {
      console.error("Erro ao buscar saldo do lojista:", error);
      res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar dados da carteira" 
      });
    }
  });
  
  // Listar produtos do lojista
  app.get("/api/merchant/products", isUserType("merchant"), async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      const merchantId = req.user.id;
      
      // Obter dados do merchant
      const merchantList = await db
        .select()
        .from(merchants)
        .where(eq(merchants.user_id, merchantId));
      
      if (!merchantList.length) {
        return res.json([]);
      }
      
      const merchant = merchantList[0];
        
      // Listar produtos do lojista
      const allProductsList = await db
        .select()
        .from(products)
        .where(eq(products.merchant_id, merchant.id));
        
      // Ordenar manualmente por nome do produto
      const productsList = allProductsList.sort((a, b) => 
        a.name.localeCompare(b.name));
        
      res.json({ products: productsList });
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      res.status(500).json({ message: "Erro ao buscar produtos" });
    }
  });
  
  // API corrigida para listar vendas do merchant
  app.get("/api/merchant/sales", isUserType("merchant"), async (req, res) => {
    try {
      const merchantUserId = req.user?.id;
      if (!merchantUserId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      // Buscar dados do merchant
      const [merchant] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.user_id, merchantUserId));

      if (!merchant) {
        return res.json({ transactions: [] });
      }

      // Buscar todas as transações do merchant com dados do cliente
      const salesResult = await db.execute(
        sql`SELECT 
          t.id,
          t.user_id,
          u.name as customer,
          t.created_at as date,
          t.amount,
          t.cashback_amount as cashback,
          t.status,
          t.payment_method,
          COALESCE((
            SELECT COUNT(*) 
            FROM transaction_items ti 
            WHERE ti.transaction_id = t.id
          ), 0) as items_count
        FROM transactions t
        JOIN users u ON t.user_id = u.id
        WHERE t.merchant_id = ${merchant.id}
        AND t.status IN ('completed', 'pending', 'cancelled')
        ORDER BY t.created_at DESC`
      );

      // Formatar dados para o frontend
      const formattedSales = salesResult.rows.map(sale => ({
        id: sale.id,
        user_id: sale.user_id,
        customer: sale.customer || 'Cliente desconhecido',
        date: new Date(sale.date).toLocaleDateString('pt-BR') + ' ' + 
              new Date(sale.date).toLocaleTimeString('pt-BR'),
        amount: parseFloat(sale.amount || 0),
        cashback: parseFloat(sale.cashback || 0),
        status: sale.status,
        payment_method: sale.payment_method,
        items: `${sale.items_count} ${sale.items_count === 1 ? 'item' : 'itens'}`
      }));

      res.json({ transactions: formattedSales });
    } catch (error) {
      console.error("Erro ao buscar vendas do merchant:", error);
      res.status(500).json({ message: "Erro ao buscar vendas" });
    }
  });

  // Gerenciar status de uma venda (cancelar, reembolsar)
  app.put("/api/merchant/sales/:transactionId/status", isUserType("merchant"), async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      const merchantUserId = req.user.id;
      const transactionId = parseInt(req.params.transactionId);
      const { status, reason } = req.body;
      
      if (!transactionId || isNaN(transactionId)) {
        return res.status(400).json({ message: "ID de transação inválido" });
      }
      
      if (!status || !["completed", "cancelled", "refunded"].includes(status)) {
        return res.status(400).json({ message: "Status inválido. Utilize 'completed', 'cancelled' ou 'refunded'" });
      }
      
      // Obter dados do merchant
      const merchantResults = await db
        .select()
        .from(merchants)
        .where(eq(merchants.user_id, merchantUserId));
        
      if (merchantResults.length === 0) {
        return res.status(404).json({ message: "Dados do lojista não encontrados" });
      }
      
      const merchant = merchantResults[0];
      
      // Verificar se a transação existe e pertence a este lojista
      const [transaction] = await db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.id, transactionId),
            eq(transactions.merchant_id, merchant.id)
          )
        );
        
      if (!transaction) {
        return res.status(404).json({ message: "Transação não encontrada ou não pertence a este lojista" });
      }
      
      // Obter status atual
      const currentStatus = transaction.status;
      
      // Verificar se a mudança de status é válida
      if (currentStatus === status) {
        return res.status(400).json({ message: `A transação já está com status '${status}'` });
      }
      
      // Lógica específica para cada tipo de mudança de status
      if (status === "cancelled") {
        // Apenas transações com status 'completed' ou 'pending' podem ser canceladas
        if (![TransactionStatus.COMPLETED, TransactionStatus.PENDING].includes(currentStatus)) {
          return res.status(400).json({ 
            message: `Não é possível cancelar uma transação com status '${currentStatus}'` 
          });
        }
        
        // Atualizar status da transação
        await db
          .update(transactions)
          .set({ 
            status: TransactionStatus.CANCELLED,
            updated_at: new Date(),
            notes: reason ? `${transaction.notes || ''} | Cancelado: ${reason}` : transaction.notes 
          })
          .where(eq(transactions.id, transactionId));
          
        // Se houver cashback associado, reverter
        if (parseFloat(transaction.cashback_amount) > 0) {
          // Verificar cashback atual do cliente
          const [cashback] = await db
            .select()
            .from(cashbacks)
            .where(eq(cashbacks.user_id, transaction.user_id));
            
          if (cashback) {
            // Calcular novo saldo (não permitir saldo negativo)
            const currentBalance = parseFloat(cashback.balance);
            const cashbackAmount = parseFloat(transaction.cashback_amount);
            const newBalance = Math.max(0, currentBalance - cashbackAmount).toString();
            
            // Atualizar cashback
