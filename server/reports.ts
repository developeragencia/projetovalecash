import { db } from "./db";
import { sql } from "drizzle-orm";
import { 
  transactions, 
  merchants, 
  users, 
  transactionItems,
  commissionSettings
} from "@shared/schema";
import { eq, and, gte, lte, desc, sum, count, isNull, isNotNull, like } from "drizzle-orm";

/**
 * Obtém o relatório detalhado de comissões para o painel administrativo
 */
export async function getCommissionsReport() {
  try {
    // Buscar configurações de comissões atuais
    const settingsList = await db
      .select()
      .from(commissionSettings);
    
    const settings = settingsList.length > 0 ? settingsList[0] : null;
    
    // Buscar todos os clientes ativos que têm transações
    const clientsWithTransactions = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        created_at: users.created_at,
        status: users.status
      })
      .from(users)
      .where(
        and(
          eq(users.type, "client"),
          eq(users.status, "active")
        )
      );
      
    // Para cada cliente, calcular o total de cashback recebido e comissões pendentes
    const clientReports = await Promise.all(
      clientsWithTransactions.map(async (client) => {
        // Total de cashback recebido
        const cashbackResult = await db
          .select({ total: sql`SUM(${transactions.cashback_amount})::float` })
          .from(transactions)
          .where(
            and(
              eq(transactions.user_id, client.id),
              eq(transactions.status, "completed")
            )
          );
          
        const totalCashback = cashbackResult[0]?.total || 0;
        
        // Total de transações completadas
        const transactionCountResult = await db
          .select({ count: sql`COUNT(*)::int` })
          .from(transactions)
          .where(
            and(
              eq(transactions.user_id, client.id),
              eq(transactions.status, "completed")
            )
          );
          
        const transactionCount = transactionCountResult[0]?.count || 0;
        
        // Valor médio das transações
        const avgTransactionResult = await db
          .select({ avg: sql`AVG(${transactions.amount})::float` })
          .from(transactions)
          .where(
            and(
              eq(transactions.user_id, client.id),
              eq(transactions.status, "completed")
            )
          );
          
        const avgTransaction = avgTransactionResult[0]?.avg || 0;
        
        // Total gasto pelo cliente
        const totalSpentResult = await db
          .select({ total: sql`SUM(${transactions.amount})::float` })
          .from(transactions)
          .where(
            and(
              eq(transactions.user_id, client.id),
              eq(transactions.status, "completed")
            )
          );
          
        const totalSpent = totalSpentResult[0]?.total || 0;
        
        return {
          ...client,
          totalCashback,
          transactionCount,
          avgTransaction,
          totalSpent,
          percentCashback: totalSpent > 0 ? (totalCashback / totalSpent) * 100 : 0
        };
      })
    );
    
    // Calcular estatísticas gerais
    const totalClients = clientReports.length;
    const totalCashbackIssued = clientReports.reduce((sum, client) => sum + (client.totalCashback || 0), 0);
    const totalTransactions = clientReports.reduce((sum, client) => sum + (client.transactionCount || 0), 0);
    const totalSpent = clientReports.reduce((sum, client) => sum + (client.totalSpent || 0), 0);
    
    // Organizar o relatório para retornar
    return {
      settings,
      summary: {
        totalClients,
        totalCashbackIssued,
        totalTransactions,
        totalSpent,
        avgCashbackPerClient: totalClients > 0 ? totalCashbackIssued / totalClients : 0,
        avgSpendPerClient: totalClients > 0 ? totalSpent / totalClients : 0
      },
      clients: clientReports.sort((a, b) => (b.totalCashback || 0) - (a.totalCashback || 0))
    };
  } catch (error) {
    console.error("Erro ao gerar relatório de comissões:", error);
    throw error;
  }
}

/**
 * Obtém o relatório completo de vendas de um lojista específico
 */
export async function getMerchantSalesReport(merchantId: number, period: string, startDate?: string, endDate?: string) {
  try {
    // Determinar datas de início e fim com base no período
    let start_date: Date, end_date: Date;
    const now = new Date();
    
    // Se startDate e endDate foram fornecidos, usar esses valores
    if (startDate && endDate) {
      start_date = new Date(startDate);
      end_date = new Date(endDate);
    } else {
      // Caso contrário, calcular com base no período
      switch (period) {
        case "today":
          start_date = new Date(now.setHours(0, 0, 0, 0));
          end_date = new Date(now.setHours(23, 59, 59, 999));
          break;
        case "week":
          start_date = new Date(now);
          start_date.setDate(start_date.getDate() - 7);
          end_date = new Date(now);
          break;
        case "month":
          start_date = new Date(now);
          start_date.setMonth(start_date.getMonth() - 1);
          end_date = new Date(now);
          break;
        case "quarter":
          start_date = new Date(now);
          start_date.setMonth(start_date.getMonth() - 3);
          end_date = new Date(now);
          break;
        case "year":
          start_date = new Date(now);
          start_date.setFullYear(start_date.getFullYear() - 1);
          end_date = new Date(now);
          break;
        default:
          // Últimos 30 dias por padrão
          start_date = new Date(now);
          start_date.setDate(start_date.getDate() - 30);
          end_date = new Date(now);
      }
    }
    
    // Buscar transações no período especificado
    const transactionsList = await db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        cashback_amount: transactions.cashback_amount,
        payment_method: transactions.payment_method,
        status: transactions.status,
        created_at: transactions.created_at,
        customer_id: transactions.user_id,
        customer_name: users.name,
      })
      .from(transactions)
      .innerJoin(users, eq(users.id, transactions.user_id))
      .where(
        and(
          eq(transactions.merchant_id, merchantId),
          gte(transactions.created_at, start_date),
          lte(transactions.created_at, end_date),
          eq(transactions.status, "completed")
        )
      );
    
    // Calcular estatísticas
    let totalSales = 0;
    let totalItems = 0;
    let totalCashback = 0;
    
    // Map com contagem por método de pagamento
    const paymentMethods: Record<string, number> = {};
    
    // Map para agrupar vendas por dia
    const dailySales: Record<string, number> = {};
    
    // Map para contar transações por cliente
    const customerTransactions: Record<number, { 
      count: number, 
      total: number, 
      name: string 
    }> = {};
    
    // Obtendo configurações atuais de comissões
    const commissionConfigResult = await db
      .select()
      .from(commissionSettings)
      .orderBy(desc(commissionSettings.updated_at))
      .limit(1);

    const commissionConfig = commissionConfigResult.length > 0 ? commissionConfigResult[0] : {
      platform_fee: "0.05",
      merchant_commission: "0.02",
      client_cashback: "0.02",
      referral_bonus: "0.01",
      withdrawal_fee: "0.05"
    };
    
    // Processar todas as transações
    transactionsList.forEach(tx => {
      // Somar valores
      const txAmount = Number(tx.amount || 0);
      totalSales += txAmount;
      totalCashback += Number(tx.cashback_amount || 0);
      
      // Contar por método de pagamento
      const method = tx.payment_method || 'outros';
      paymentMethods[method] = (paymentMethods[method] || 0) + txAmount;
      
      // Agrupar por dia
      const dayStr = tx.created_at ? tx.created_at.toISOString().split('T')[0] : '?';
      dailySales[dayStr] = (dailySales[dayStr] || 0) + txAmount;
      
      // Agrupar por cliente
      if (tx.customer_id) {
        if (!customerTransactions[tx.customer_id]) {
          customerTransactions[tx.customer_id] = { 
            count: 0, 
            total: 0, 
            name: tx.customer_name || `Cliente #${tx.customer_id}` 
          };
        }
        customerTransactions[tx.customer_id].count++;
        customerTransactions[tx.customer_id].total += txAmount;
      }
    });
    
    // Calcular comissão com base nas configurações atuais
    const totalCommission = totalSales * Number(commissionConfig.merchant_commission);
    const totalPlatformFee = totalSales * Number(commissionConfig.platform_fee);
    
    // Buscar itens das transações para análise de produtos
    const transactionIds = transactionsList.map(tx => tx.id);
    let topProducts: { name: string, count: number, total: number }[] = [];
    
    if (transactionIds.length > 0) {
      // Buscar itens apenas se houver transações
      const items = await db
        .select({
          name: transactionItems.product_name,
          price: transactionItems.price,
          quantity: transactionItems.quantity,
        })
        .from(transactionItems)
        .where(sql`transaction_id IN (${transactionIds.join(',')})`)
        .orderBy(transactionItems.price);
      
      // Contar por produto
      const productSummary: Record<string, { count: number, total: number }> = {};
      
      items.forEach(item => {
        totalItems += Number(item.quantity || 0);
        
        if (item.name) {
          if (!productSummary[item.name]) {
            productSummary[item.name] = { count: 0, total: 0 };
          }
          productSummary[item.name].count += Number(item.quantity || 0);
          productSummary[item.name].total += Number(item.price || 0) * Number(item.quantity || 0);
        }
      });
      
      // Converter para array e ordenar por total
      topProducts = Object.entries(productSummary)
        .map(([name, data]) => ({
          name,
          count: data.count,
          total: data.total
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);
    }
    
    // Converter dados diários para formato timeline
    const timeline = Object.entries(dailySales)
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    // Converter métodos de pagamento para formato de gráfico
    const paymentMethodsChart = Object.entries(paymentMethods)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    
    // Converter dados de clientes para formato de gráfico
    const topCustomers = Object.values(customerTransactions)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map(customer => ({
        name: customer.name,
        visits: customer.count,
        spent: customer.total
      }));
    
    // Resultado final
    return {
      transactionCount: transactionsList.length,
      itemCount: totalItems,
      totalAmount: totalSales,
      totalCashback: totalCashback,
      totalCommission: totalCommission,
      totalPlatformFee: totalPlatformFee,
      transactions: transactionsList,
      commissionConfig,
      timeline,
      paymentMethods: paymentMethodsChart,
      topProducts,
      topCustomers,
      averageTransaction: transactionsList.length > 0 ? 
        totalSales / transactionsList.length : 0
    };
    
  } catch (error) {
    console.error("Erro ao gerar relatório de vendas:", error);
    throw new Error("Falha ao gerar relatório de vendas");
  }
}

/**
 * Obtém um relatório de comissões detalhado para o painel administrativo (versão legada)
 */
async function getCommissionsReportLegacy() {
  try {
    // Obter todas as transações com status "completed"
    const allTransactions = await db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        cashback_amount: transactions.cashback_amount,
        created_at: transactions.created_at,
        user_id: transactions.user_id,
        merchant_id: transactions.merchant_id,
        user_name: users.name,
        merchant_name: merchants.store_name,
      })
      .from(transactions)
      .innerJoin(users, eq(users.id, transactions.user_id))
      .innerJoin(merchants, eq(merchants.id, transactions.merchant_id))
      .where(eq(transactions.status, "completed"));

    // Obter as configurações de comissão atuais
    const commissionConfigResult = await db
      .select()
      .from(commissionSettings)
      .orderBy(desc(commissionSettings.updated_at))
      .limit(1);

    const commissionConfig = commissionConfigResult.length > 0 ? commissionConfigResult[0] : {
      platform_fee: "0.05",
      merchant_commission: "0.02",
      client_cashback: "0.02",
      referral_bonus: "0.01",
      withdrawal_fee: "0.05"
    };
    
    const platformFeeRate = Number(commissionConfig.platform_fee);
    const merchantCommissionRate = Number(commissionConfig.merchant_commission);
    const clientCashbackRate = Number(commissionConfig.client_cashback);
    const referralBonusRate = Number(commissionConfig.referral_bonus);

    // Agrupar por cliente para calcular cashback total
    const clientSummary: Record<number, {
      id: number,
      name: string,
      totalCashback: number,
      totalReferralBonus: number,
      transactionCount: number,
      lastTransaction: Date | null
    }> = {};
    
    // Agrupar por loja para calcular comissões
    const merchantSummary: Record<number, {
      id: number,
      name: string,
      totalSales: number,
      totalCommission: number,
      totalPlatformFee: number,
      transactionCount: number,
      lastTransaction: Date | null
    }> = {};
    
    // Processar transações
    allTransactions.forEach(tx => {
      const txAmount = Number(tx.amount || 0);
      const cashbackAmount = Number(tx.cashback_amount || 0);
      const merchantCommission = txAmount * merchantCommissionRate;
      const platformFee = txAmount * platformFeeRate;
      const referralBonus = txAmount * referralBonusRate;
      
      // Processar dados do cliente
      if (tx.user_id) {
        if (!clientSummary[tx.user_id]) {
          clientSummary[tx.user_id] = {
            id: tx.user_id,
            name: tx.user_name || `Cliente #${tx.user_id}`,
            totalCashback: 0,
            totalReferralBonus: 0,
            transactionCount: 0,
            lastTransaction: null
          };
        }
        
        const client = clientSummary[tx.user_id];
        client.totalCashback += cashbackAmount;
        client.totalReferralBonus += referralBonus;
        client.transactionCount++;
        
        // Atualizar data da última transação se for mais recente
        if (!client.lastTransaction || 
            (tx.created_at && client.lastTransaction < tx.created_at)) {
          client.lastTransaction = tx.created_at;
        }
      }
      
      // Processar dados do lojista
      if (tx.merchant_id) {
        if (!merchantSummary[tx.merchant_id]) {
          merchantSummary[tx.merchant_id] = {
            id: tx.merchant_id,
            name: tx.merchant_name || `Loja #${tx.merchant_id}`,
            totalSales: 0,
            totalCommission: 0,
            totalPlatformFee: 0,
            transactionCount: 0,
            lastTransaction: null
          };
        }
        
        const merchant = merchantSummary[tx.merchant_id];
        merchant.totalSales += txAmount;
        merchant.totalCommission += merchantCommission;
        merchant.totalPlatformFee += platformFee;
        merchant.transactionCount++;
        
        // Atualizar data da última transação se for mais recente
        if (!merchant.lastTransaction || 
            (tx.created_at && merchant.lastTransaction < tx.created_at)) {
          merchant.lastTransaction = tx.created_at;
        }
      }
    });
    
    // Converter para arrays
    const clientCommissions = Object.values(clientSummary)
      .sort((a, b) => b.totalCashback - a.totalCashback);
    
    const merchantCommissions = Object.values(merchantSummary)
      .sort((a, b) => b.totalSales - a.totalSales);
    
    // Calcular totais
    const totalSystemRevenue = Object.values(merchantSummary).reduce(
      (sum, merchant) => sum + merchant.totalPlatformFee, 0);
    
    const totalMerchantCommissions = Object.values(merchantSummary).reduce(
      (sum, merchant) => sum + merchant.totalCommission, 0);
    
    const totalCashback = Object.values(clientSummary).reduce(
      (sum, client) => sum + client.totalCashback, 0);
    
    const totalReferralBonus = Object.values(clientSummary).reduce(
      (sum, client) => sum + client.totalReferralBonus, 0);
    
    // Retornar resultado
    return {
      clientCommissions,
      merchantCommissions,
      totalSystemRevenue,
      totalMerchantCommissions,
      totalCashback,
      totalReferralBonus,
      totalTransactions: allTransactions.length,
      commissionConfig
    };
  } catch (error) {
    console.error("Erro ao gerar relatório de comissões:", error);
    throw new Error("Falha ao gerar relatório de comissões");
  }
}