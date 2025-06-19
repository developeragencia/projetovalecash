import { db } from "../db";
import { sql } from "drizzle-orm";
import { transactions, users, commissionSettings } from "@shared/schema";

interface FinancialSummary {
  totalVolume: number;
  totalCashbackPaid: number;
  totalPlatformRevenue: number;
  totalReferralBonuses: number;
  merchantNetRevenue: number;
  transactionCount: number;
  averageTransactionValue: number;
}

/**
 * Gera relatório financeiro baseado no novo modelo de taxas
 */
export async function generateFinancialReport(
  startDate?: string,
  endDate?: string
): Promise<FinancialSummary> {
  
  // Buscar configurações atuais
  const [settings] = await db.select().from(commissionSettings).limit(1);
  const platformFeeRate = settings ? parseFloat(settings.platform_fee) / 100 : 0.05;
  const clientCashbackRate = settings ? parseFloat(settings.client_cashback) / 100 : 0.02;
  const referralBonusRate = settings ? parseFloat(settings.referral_bonus) / 100 : 0.01;

  // Construir query com filtros de data opcionais
  let dateFilter = "";
  if (startDate && endDate) {
    dateFilter = `AND t.created_at >= '${startDate}' AND t.created_at <= '${endDate}'`;
  }

  // Buscar dados de transações
  const financialData = await db.execute(sql`
    SELECT 
      COUNT(*) as transaction_count,
      COALESCE(SUM(CAST(t.amount AS DECIMAL)), 0) as total_volume,
      COALESCE(SUM(CAST(t.cashback_amount AS DECIMAL)), 0) as total_cashback_paid,
      COALESCE(AVG(CAST(t.amount AS DECIMAL)), 0) as average_transaction_value
    FROM transactions t
    WHERE t.status = 'completed'
    ${dateFilter}
  `);

  const data = financialData.rows[0] as any;
  
  const totalVolume = parseFloat(data.total_volume || "0");
  const totalCashbackPaid = parseFloat(data.total_cashback_paid || "0");
  const transactionCount = parseInt(data.transaction_count || "0");
  const averageTransactionValue = parseFloat(data.average_transaction_value || "0");

  // Calcular receita da plataforma (5% do volume total)
  const totalPlatformRevenue = totalVolume * platformFeeRate;

  // Calcular bônus de indicação estimado (1% do volume)
  const totalReferralBonuses = totalVolume * referralBonusRate;

  // Calcular receita líquida dos lojistas (95% do volume)
  const merchantNetRevenue = totalVolume - totalPlatformRevenue;

  return {
    totalVolume,
    totalCashbackPaid,
    totalPlatformRevenue,
    totalReferralBonuses,
    merchantNetRevenue,
    transactionCount,
    averageTransactionValue
  };
}

/**
 * Relatório por período (mensal, semanal, diário)
 */
export async function getRevenueByPeriod(period: 'daily' | 'weekly' | 'monthly' = 'monthly') {
  let dateFormat = 'YYYY-MM-DD';
  let intervalGroup = 'DATE(t.created_at)';
  
  switch (period) {
    case 'weekly':
      dateFormat = 'YYYY-"W"WW';
      intervalGroup = 'DATE_TRUNC(\'week\', t.created_at)';
      break;
    case 'monthly':
      dateFormat = 'YYYY-MM';
      intervalGroup = 'DATE_TRUNC(\'month\', t.created_at)';
      break;
  }

  const revenueData = await db.execute(sql`
    SELECT 
      ${sql.raw(intervalGroup)} as period,
      COUNT(*) as transaction_count,
      COALESCE(SUM(CAST(t.amount AS DECIMAL)), 0) as total_volume,
      COALESCE(SUM(CAST(t.cashback_amount AS DECIMAL)), 0) as total_cashback,
      COALESCE(SUM(CAST(t.amount AS DECIMAL) * 0.05), 0) as platform_revenue
    FROM transactions t
    WHERE t.status = 'completed'
      AND t.created_at >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY ${sql.raw(intervalGroup)}
    ORDER BY period DESC
    LIMIT 12
  `);

  return revenueData.rows.map((row: any) => ({
    period: row.period,
    transactionCount: parseInt(row.transaction_count || "0"),
    totalVolume: parseFloat(row.total_volume || "0"),
    totalCashback: parseFloat(row.total_cashback || "0"),
    platformRevenue: parseFloat(row.platform_revenue || "0")
  }));
}

/**
 * Top lojistas por volume e receita gerada para a plataforma
 */
export async function getTopMerchantsByRevenue(limit: number = 10) {
  const topMerchants = await db.execute(sql`
    SELECT 
      u.email,
      u.name,
      COUNT(t.id) as transaction_count,
      COALESCE(SUM(CAST(t.amount AS DECIMAL)), 0) as total_volume,
      COALESCE(SUM(CAST(t.amount AS DECIMAL) * 0.05), 0) as platform_revenue_generated,
      COALESCE(SUM(CAST(t.cashback_amount AS DECIMAL)), 0) as cashback_distributed
    FROM users u
    JOIN transactions t ON u.id = t.merchant_id
    WHERE u.type = 'merchant'
      AND t.status = 'completed'
    GROUP BY u.id, u.email, u.name
    ORDER BY total_volume DESC
    LIMIT ${limit}
  `);

  return topMerchants.rows.map((row: any) => ({
    email: row.email,
    name: row.name || 'Nome não informado',
    transactionCount: parseInt(row.transaction_count || "0"),
    totalVolume: parseFloat(row.total_volume || "0"),
    platformRevenueGenerated: parseFloat(row.platform_revenue_generated || "0"),
    cashbackDistributed: parseFloat(row.cashback_distributed || "0")
  }));
}