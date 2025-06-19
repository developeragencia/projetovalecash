import { Express, Request, Response } from "express";
import { pool } from "./db";
import { isUserType } from "./routes";

export function addSimpleAdminRoutes(app: Express) {
  // Rota simplificada para buscar todos os usuários
  app.get("/api/admin/users-simple", isUserType("admin"), async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 50;
      const userType = req.query.userType as string;
      const search = req.query.search as string;
      const offset = (page - 1) * pageSize;

      console.log('Buscando usuários simples:', { page, pageSize, userType, search });

      // Query base
      let query = `
        SELECT 
          u.id, u.name, u.email, u.type, u.status, 
          u.created_at, u.phone, u.username,
          CASE 
            WHEN u.type = 'client' THEN COALESCE((SELECT SUM(balance) FROM cashbacks WHERE user_id = u.id), 0)
            WHEN u.type = 'merchant' THEN COALESCE((SELECT SUM(amount) FROM transactions WHERE merchant_id = u.id AND status = 'completed'), 0)
            ELSE 0
          END as saldo
        FROM users u
        WHERE 1=1
      `;
      
      const params = [];
      let paramIndex = 1;

      // Filtro por tipo
      if (userType && userType !== 'all') {
        query += ` AND u.type = $${paramIndex}`;
        params.push(userType);
        paramIndex++;
      }

      // Filtro por busca
      if (search && search.trim()) {
        query += ` AND (u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
        params.push(`%${search.trim()}%`);
        paramIndex++;
      }

      // Contar total
      const countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) FROM').replace(/CASE.*END as saldo,?/, '');
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].count);

      // Buscar usuários com paginação
      query += ` ORDER BY u.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(pageSize, offset);

      const result = await pool.query(query, params);
      
      console.log(`Encontrados ${result.rows.length} usuários de ${total} total`);

      res.json({
        users: result.rows.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          type: user.type,
          status: user.status,
          created_at: user.created_at,
          phone: user.phone,
          username: user.username,
          total_cashback: user.type === 'client' ? parseFloat(user.saldo || '0') : 0,
          sales_total: user.type === 'merchant' ? parseFloat(user.saldo || '0') : 0
        })),
        totalUsers: total,
        pagination: {
          total,
          page,
          pageSize,
          pageCount: Math.ceil(total / pageSize)
        }
      });

    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      res.status(500).json({ message: "Erro ao buscar usuários" });
    }
  });
}