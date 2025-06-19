import { db } from "../db";
import { commissionSettings } from "@shared/schema";

interface FeeCalculation {
  clientCashback: number;
  platformFee: number;
  referralBonus: number;
  merchantReceives: number;
}

/**
 * Calcula todas as taxas baseadas no novo modelo:
 * - Lojista paga 5% para a plataforma
 * - Cliente recebe 2% de cashback
 * - Bônus de indicação de 1%
 * - Lojista não recebe comissão adicional
 */
export async function calculateTransactionFees(amount: number): Promise<FeeCalculation> {
  // Buscar configurações atuais do banco
  const [settings] = await db.select().from(commissionSettings).limit(1);
  
  // Usar configurações do banco ou valores padrão
  const platformFeeRate = settings ? parseFloat(settings.platform_fee) / 100 : 0.05; // 5%
  const clientCashbackRate = settings ? parseFloat(settings.client_cashback) / 100 : 0.02; // 2%
  const referralBonusRate = settings ? parseFloat(settings.referral_bonus) / 100 : 0.01; // 1%
  
  // Cálculos baseados no valor da transação
  const platformFee = amount * platformFeeRate; // 5% do valor total pago pela loja
  const clientCashback = amount * clientCashbackRate; // 2% do valor para o cliente
  const referralBonus = amount * referralBonusRate; // 1% para indicações
  
  // O lojista recebe o valor total menos a taxa da plataforma (5%)
  const merchantReceives = amount - platformFee;
  
  return {
    clientCashback,
    platformFee,
    referralBonus,
    merchantReceives
  };
}

/**
 * Calcula apenas o cashback para o cliente
 */
export async function calculateClientCashback(amount: number): Promise<number> {
  const [settings] = await db.select().from(commissionSettings).limit(1);
  const clientCashbackRate = settings ? parseFloat(settings.client_cashback) / 100 : 0.02;
  
  return amount * clientCashbackRate;
}

/**
 * Calcula a taxa da plataforma que o lojista deve pagar
 */
export async function calculatePlatformFee(amount: number): Promise<number> {
  const [settings] = await db.select().from(commissionSettings).limit(1);
  const platformFeeRate = settings ? parseFloat(settings.platform_fee) / 100 : 0.05;
  
  return amount * platformFeeRate;
}

/**
 * Calcula o valor que o lojista recebe após descontar a taxa da plataforma
 */
export async function calculateMerchantReceives(amount: number): Promise<number> {
  const platformFee = await calculatePlatformFee(amount);
  return amount - platformFee;
}

/**
 * Calcula bônus de indicação
 */
export async function calculateReferralBonus(amount: number): Promise<number> {
  const [settings] = await db.select().from(commissionSettings).limit(1);
  const referralBonusRate = settings ? parseFloat(settings.referral_bonus) / 100 : 0.01;
  
  return amount * referralBonusRate;
}