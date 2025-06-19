import type { Express, Request, Response } from "express";
import { db } from "./db";
import { sql } from "drizzle-orm";
// Importar funções de auth diretamente
const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: "Não autenticado" });
};

const isUserType = (requiredType: string) => {
  return (req: any, res: any, next: any) => {
    const user = req.user;
    if (user && user.type === requiredType) {
      return next();
    }
    return res.status(403).json({ message: "Acesso negado" });
  };
};

export function addReportsRoutes(app: Express) {
  // Endpoint principal de relatórios
  app.get("/api/admin/reports", isAuthenticated, isUserType("admin"), async (req: Request, res: Response) => {
    try {
      const { type = 'transactions', startDate, endDate, merchantId, status = 'all' } = req.query;
      
      let whereClause = "WHERE 1=1";
      const params: any[] = [];
      
      // Filtro por data
      if (startDate) {
        whereClause += " AND t.created_at >= $" + (params.length + 1);
        params.push(startDate);
      }
      
      if (endDate) {
        whereClause += " AND t.created_at <= $" + (params.length + 1);
        params.push(endDate + ' 23:59:59');
      }
      
      // Filtro por comerciante
      if (merchantId && merchantId !== 'all') {
        whereClause += " AND t.merchant_id = $" + (params.length + 1);
        params.push(parseInt(merchantId as string));
      }
      
      // Filtro por status
      if (status !== 'all') {
        whereClause += " AND t.status = $" + (params.length + 1);
        params.push(status);
      }

      let query = "";
      
      if (type === 'transactions') {
        query = `
          SELECT 
            t.id,
            t.created_at as date,
            u.name as customer_name,
            m.store_name as merchant_name,
            CAST(t.amount AS DECIMAL) as amount,
            CAST(t.cashback_amount AS DECIMAL) as cashback_amount,
            t.status,
            t.payment_method
          FROM transactions t
          LEFT JOIN users u ON t.user_id = u.id
          LEFT JOIN merchants m ON t.merchant_id = m.id
          ${whereClause}
          ORDER BY t.created_at DESC
          LIMIT 1000
        `;
      } else if (type === 'merchants') {
        query = `
          SELECT 
            m.id,
            m.store_name,
            m.created_at as date,
            u.name as owner_name,
            u.email,
            m.approved,
            COUNT(t.id) as total_transactions,
            COALESCE(SUM(CAST(t.amount AS DECIMAL)), 0) as total_sales
          FROM merchants m
          LEFT JOIN users u ON m.user_id = u.id
          LEFT JOIN transactions t ON m.id = t.merchant_id AND t.status = 'completed'
          GROUP BY m.id, m.store_name, m.created_at, u.name, u.email, m.approved
          ORDER BY total_sales DESC
        `;
      } else if (type === 'customers') {
        query = `
          SELECT 
            u.id,
            u.name,
            u.email,
            u.created_at as date,
            COUNT(t.id) as total_transactions,
            COALESCE(SUM(CAST(t.amount AS DECIMAL)), 0) as total_spent,
            COALESCE(c.balance, 0) as cashback_balance,
            COALESCE(c.total_earned, 0) as total_cashback_earned
          FROM users u
          LEFT JOIN transactions t ON u.id = t.user_id AND t.status = 'completed'
          LEFT JOIN cashbacks c ON u.id = c.user_id
          WHERE u.type = 'client'
          GROUP BY u.id, u.name, u.email, u.created_at, c.balance, c.total_earned
          ORDER BY total_spent DESC
        `;
      }

      const result = await db.execute(sql.raw(query));
      res.json(result.rows);
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      res.status(500).json({ message: "Erro ao gerar relatório" });
    }
  });

  // Endpoint de exportação de relatórios
  app.get("/api/admin/reports/export", isAuthenticated, isUserType("admin"), async (req: Request, res: Response) => {
    try {
      const { format = 'csv' } = req.query;
      
      // Reutilizar a lógica do endpoint principal
      const reportData = await getReportData(req);
      
      if (format === 'csv') {
        const csv = convertToCSV(reportData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=relatorio.csv');
        res.send(csv);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=relatorio.json');
        res.json(reportData);
      }
    } catch (error) {
      console.error("Erro ao exportar relatório:", error);
      res.status(500).json({ message: "Erro ao exportar relatório" });
    }
  });

  // Relatórios específicos de performance
  app.get("/api/admin/performance", isAuthenticated, isUserType("admin"), async (req: Request, res: Response) => {
    try {
      // Performance dos últimos 30 dias
      const performance = await db.execute(sql`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as transactions,
          SUM(CAST(amount AS DECIMAL)) as total_sales,
          SUM(CAST(cashback_amount AS DECIMAL)) as total_cashback,
          AVG(CAST(amount AS DECIMAL)) as avg_transaction_value
        FROM transactions
        WHERE created_at >= NOW() - INTERVAL '30 days' AND status = 'completed'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `);

      // Top performers
      const topMerchants = await db.execute(sql`
        SELECT 
          m.store_name,
          COUNT(t.id) as transactions,
          SUM(CAST(t.amount AS DECIMAL)) as total_sales
        FROM merchants m
        JOIN transactions t ON m.id = t.merchant_id
        WHERE t.created_at >= NOW() - INTERVAL '30 days' AND t.status = 'completed'
        GROUP BY m.id, m.store_name
        ORDER BY total_sales DESC
        LIMIT 10
      `);

      const topCustomers = await db.execute(sql`
        SELECT 
          u.name,
          COUNT(t.id) as transactions,
          SUM(CAST(t.amount AS DECIMAL)) as total_spent
        FROM users u
        JOIN transactions t ON u.id = t.user_id
        WHERE t.created_at >= NOW() - INTERVAL '30 days' AND t.status = 'completed'
        GROUP BY u.id, u.name
        ORDER BY total_spent DESC
        LIMIT 10
      `);

      res.json({
        dailyPerformance: performance.rows,
        topMerchants: topMerchants.rows,
        topCustomers: topCustomers.rows
      });
    } catch (error) {
      console.error("Erro ao gerar dados de performance:", error);
      res.status(500).json({ message: "Erro ao gerar dados de performance" });
    }
  });
}

async function getReportData(req: Request) {
  const { type = 'transactions', startDate, endDate, merchantId, status = 'all' } = req.query;
  
  let whereClause = "WHERE 1=1";
  const params: any[] = [];
  
  if (startDate) {
    whereClause += " AND t.created_at >= $" + (params.length + 1);
    params.push(startDate);
  }
  
  if (endDate) {
    whereClause += " AND t.created_at <= $" + (params.length + 1);
    params.push(endDate + ' 23:59:59');
  }
  
  if (merchantId && merchantId !== 'all') {
    whereClause += " AND t.merchant_id = $" + (params.length + 1);
    params.push(parseInt(merchantId as string));
  }
  
  if (status !== 'all') {
    whereClause += " AND t.status = $" + (params.length + 1);
    params.push(status);
  }

  const query = `
    SELECT 
      t.id,
      t.created_at as date,
      u.name as customer_name,
      m.store_name as merchant_name,
      CAST(t.amount AS DECIMAL) as amount,
      CAST(t.cashback_amount AS DECIMAL) as cashback_amount,
      t.status,
      t.payment_method
    FROM transactions t
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN merchants m ON t.merchant_id = m.id
    ${whereClause}
    ORDER BY t.created_at DESC
  `;

  const result = await db.execute(sql.raw(query));
  return result.rows;
}

function convertToCSV(data: any[]): string {
  if (!data.length) return '';
  
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      return typeof value === 'string' ? `"${value}"` : value;
    }).join(',')
  );
  
  return [csvHeaders, ...csvRows].join('\n');
}