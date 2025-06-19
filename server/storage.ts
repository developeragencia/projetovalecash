import { 
  users, 
  type User, 
  type InsertUser,
  passwordResetTokens,
  type PasswordResetToken,
  type InsertPasswordResetToken,
  systemNotifications,
  type SystemNotification,
  type InsertSystemNotification
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gt } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import bcrypt from "bcrypt";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(userId: number, newPassword: string): Promise<boolean>;
  hashPassword(password: string): Promise<string>;
  comparePasswords(supplied: string, stored: string): Promise<boolean>;
  
  // Sistema de redefinição de senha
  createPasswordResetToken(userId: number): Promise<string>;
  validatePasswordResetToken(token: string): Promise<{ valid: boolean; userId?: number }>;
  usePasswordResetToken(token: string): Promise<boolean>;
  
  // Sistema de notificações
  createNotification(notification: InsertSystemNotification): Promise<SystemNotification>;
  getUserNotifications(userId: number, onlyUnread?: boolean): Promise<SystemNotification[]>;
  markNotificationAsRead(notificationId: number): Promise<boolean>;
  
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
    
    // Inicializa os usuários padrão se não existirem
    this.initializeDefaultUsers();
  }
  
  // Métodos para gerenciamento de senhas
  async hashPassword(password: string): Promise<string> {
    // Importar as funções necessárias
    const { scrypt, randomBytes } = await import('crypto');
    const { promisify } = await import('util');
    
    const scryptAsync = promisify(scrypt);
    const salt = randomBytes(16).toString('hex');
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString('hex')}.${salt}`;
  }

  async comparePasswords(supplied: string, stored: string): Promise<boolean> {
    try {
      // Handle bcrypt passwords (new format)
      if (stored.startsWith('$2b$') || stored.startsWith('$2a$')) {
        return await bcrypt.compare(supplied, stored);
      }
      
      // Handle legacy scrypt passwords (old format)
      if (stored.includes('.')) {
        const { scrypt, timingSafeEqual } = await import('crypto');
        const { promisify } = await import('util');
        
        const scryptAsync = promisify(scrypt);
        
        const [hashed, salt] = stored.split('.');
        if (!hashed || !salt) {
          console.error('Formato de senha armazenada inválido');
          return false;
        }
        
        const hashedBuf = Buffer.from(hashed, 'hex');
        const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
        
        if (hashedBuf.length !== suppliedBuf.length) {
          console.error('Tamanhos de buffer diferentes');
          return false;
        }
        
        return timingSafeEqual(hashedBuf, suppliedBuf);
      }
      
      // Plain text comparison (fallback)
      console.log('Senha sem hash detectada, comparação direta');
      return supplied === stored;
    } catch (error) {
      console.error('Erro ao comparar senhas:', error);
      return false;
    }
  }

  private async initializeDefaultUsers() {
    console.log("Inicializando usuários padrão...");
    
    try {
      // Verificar se já existem usuários
      const existingUsers = await db.select().from(users).limit(1);
      
      if (existingUsers.length === 0) {
        // Criar usuários padrão
        const adminUser: InsertUser = {
          name: "Administrador",
          username: "admin",
          email: "admin@valecashback.com",
          password: await this.hashPassword("senha123"),
          type: "admin",
          status: "active",
          phone: null,
          country: "Brasil",
          country_code: "BR",
          security_question: "Qual o nome do seu primeiro animal de estimação?",
          security_answer: "Rex",
          photo: null,
          invitation_code: null,
        };
        
        const clientUser: InsertUser = {
          name: "Cliente Teste",
          username: "cliente",
          email: "cliente@valecashback.com",
          password: await this.hashPassword("senha123"),
          type: "client",
          status: "active",
          phone: "(11) 98765-4321",
          country: "Brasil",
          country_code: "BR",
          security_question: "Qual o nome da cidade onde você nasceu?",
          security_answer: "São Paulo",
          photo: null,
          invitation_code: "CL123456",
        };
        
        const merchantUser: InsertUser = {
          name: "Lojista Teste",
          username: "lojista",
          email: "lojista@valecashback.com",
          password: await this.hashPassword("senha123"),
          type: "merchant",
          status: "active",
          phone: "(11) 3456-7890",
          country: "Brasil",
          country_code: "BR",
          security_question: "Qual o modelo do seu primeiro carro?",
          security_answer: "Fusca",
          photo: null,
          invitation_code: "LJ123456",
        };
        
        await this.createUser(adminUser);
        await this.createUser(clientUser);
        await this.createUser(merchantUser);
        
        console.log("Usuários padrão criados com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao inicializar usuários padrão:", error);
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select()
      .from(users)
      .where(eq(users.id, id));
    
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select()
      .from(users)
      .where(eq(users.email, username));
    
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select()
      .from(users)
      .where(eq(users.email, email));
    
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Garantindo que todos os campos obrigatórios estejam preenchidos
    const userWithDefaults = {
      ...insertUser,
      status: insertUser.status || "active",
      username: insertUser.username || null,
      phone: insertUser.phone || null,
      country: insertUser.country || null,
      country_code: insertUser.country_code || null,
      security_question: insertUser.security_question || null,
      security_answer: insertUser.security_answer || null,
      photo: insertUser.photo || null,
      invitation_code: insertUser.invitation_code || null,
    };

    const result = await db.insert(users)
      .values(userWithDefaults)
      .returning();
    
    return result[0];
  }

  async updateUserPassword(userId: number, newPassword: string): Promise<boolean> {
    try {
      const hashedPassword = await this.hashPassword(newPassword);
      const result = await db.update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, userId))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error("Erro ao atualizar senha:", error);
      return false;
    }
  }

  async createPasswordResetToken(userId: number): Promise<string> {
    try {
      // Gerar token único
      const { randomBytes } = await import('crypto');
      const token = randomBytes(32).toString('hex');
      
      // Token expira em 1 hora
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      
      // Invalidar tokens anteriores do usuário
      await db.update(passwordResetTokens)
        .set({ is_used: true, used_at: new Date() })
        .where(and(
          eq(passwordResetTokens.user_id, userId),
          eq(passwordResetTokens.is_used, false)
        ));
      
      // Criar novo token
      await db.insert(passwordResetTokens)
        .values({
          user_id: userId,
          token,
          expires_at: expiresAt,
          is_used: false
        });
      
      return token;
    } catch (error) {
      console.error("Erro ao criar token de redefinição:", error);
      throw error;
    }
  }

  async validatePasswordResetToken(token: string): Promise<{ valid: boolean; userId?: number }> {
    try {
      const result = await db.select()
        .from(passwordResetTokens)
        .where(and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.is_used, false),
          gt(passwordResetTokens.expires_at, new Date())
        ));
      
      if (result.length === 0) {
        return { valid: false };
      }
      
      return { valid: true, userId: result[0].user_id };
    } catch (error) {
      console.error("Erro ao validar token:", error);
      return { valid: false };
    }
  }

  async usePasswordResetToken(token: string): Promise<boolean> {
    try {
      const result = await db.update(passwordResetTokens)
        .set({ is_used: true, used_at: new Date() })
        .where(and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.is_used, false)
        ))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error("Erro ao usar token:", error);
      return false;
    }
  }

  async createNotification(notification: InsertSystemNotification): Promise<SystemNotification> {
    const result = await db.insert(systemNotifications)
      .values(notification)
      .returning();
    
    return result[0];
  }

  async getUserNotifications(userId: number, onlyUnread: boolean = false): Promise<SystemNotification[]> {
    if (onlyUnread) {
      return db.select()
        .from(systemNotifications)
        .where(and(
          eq(systemNotifications.user_id, userId),
          eq(systemNotifications.is_read, false)
        ))
        .orderBy(systemNotifications.sent_at);
    }
    
    return db.select()
      .from(systemNotifications)
      .where(eq(systemNotifications.user_id, userId))
      .orderBy(systemNotifications.sent_at);
  }

  async markNotificationAsRead(notificationId: number): Promise<boolean> {
    try {
      const result = await db.update(systemNotifications)
        .set({ is_read: true, read_at: new Date() })
        .where(eq(systemNotifications.id, notificationId))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
      return false;
    }
  }
}

export const storage = new DatabaseStorage();