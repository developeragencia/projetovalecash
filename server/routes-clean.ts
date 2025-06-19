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
  platformFee: "5.0", // 5%
  merchantCommission: "2.0", // 2%
  clientCashback: "2.0", // 2%
  referralBonus: "1.0", // 1%
  minWithdrawal: "20.0", // $20,00 (valor mínimo de saque)
  maxCashbackBonus: "10.0", // 10%
  withdrawalFee: "5.0", // 5% (taxa sobre saques)
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
        // Se não houver configurações, criar as padrões e retornar
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