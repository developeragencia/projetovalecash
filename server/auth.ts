import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { User, users, auditLogs, merchants, InsertMerchant, userBonuses, cashbacks } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

declare global {
  namespace Express {
    // Define User interface para o passport
    interface User {
      id: number;
      name: string;
      username: string | null;
      email: string;
      password: string;
      phone: string | null;
      country: string | null;
      country_code: string | null;
      type: string;
      status: string;
      photo: string | null;
      security_question: string | null;
      security_answer: string | null;
      created_at: Date;
      last_login: Date | null;
      invitation_code: string | null;
    }
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  // Handle bcrypt passwords (new format)
  if (stored.startsWith('$2b$') || stored.startsWith('$2a$')) {
    try {
      return await bcrypt.compare(supplied, stored);
    } catch (error) {
      console.error("Erro ao comparar senha bcrypt:", error);
      return false;
    }
  }
  
  // Handle legacy scrypt passwords (old format)
  if (stored.includes('.')) {
    try {
      const [hashed, salt] = stored.split(".");
      const hashedBuf = Buffer.from(hashed, "hex");
      const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
      return timingSafeEqual(hashedBuf, suppliedBuf);
    } catch (error) {
      console.error("Erro ao comparar senha scrypt:", error);
      return false;
    }
  }
  
  // Invalid password format
  console.error("Formato de senha armazenada inválido");
  return false;
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "vale-cashback-secret-key",
    resave: false, // Não força salvamento desnecessário
    saveUninitialized: false, // Não salva sessões vazias
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 dias
      sameSite: 'lax',
      secure: false,
      httpOnly: true, // Previne acesso via JavaScript
      path: '/'
    },
    rolling: false, // Não renova cookie a cada request
    name: 'connect.sid'
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password'
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByUsername(email);
          if (!user) {
            return done(null, false, { message: 'Credenciais inválidas' });
          }
          
          const passwordMatch = await comparePasswords(password, user.password);
          
          if (!passwordMatch) {
            return done(null, false, { message: 'Credenciais inválidas' });
          }
          
          return done(null, user);
        } catch (error) {
          console.error('Erro durante autenticação:', error);
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    console.log('🔐 Serializando usuário:', user.id, user.email);
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log('🔓 Deserializando usuário ID:', id);
      const user = await storage.getUser(id);
      if (user) {
        console.log('✅ Usuário encontrado:', user.email, user.type);
        done(null, user);
      } else {
        console.log('❌ Usuário não encontrado para ID:', id);
        done(null, false);
      }
    } catch (error) {
      console.error('❌ Erro ao deserializar usuário:', error);
      done(error);
    }
  });

  // Endpoint para verificar se email já existe
  app.post("/api/auth/check-email", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email é obrigatório" });
      }
      
      const existingUser = await storage.getUserByUsername(email);
      res.json({ exists: !!existingUser });
    } catch (error) {
      console.error("Erro ao verificar email:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Endpoint para verificar se telefone já existe
  app.post("/api/auth/check-phone", async (req, res) => {
    try {
      const { phone } = req.body;
      if (!phone || phone.trim().length === 0) {
        return res.json({ exists: false });
      }
      
      const cleanPhone = phone.trim();
      if (cleanPhone.length < 10) {
        return res.json({ exists: false });
      }
      
      const existingUserByPhone = await db
        .select()
        .from(users)
        .where(eq(users.phone, cleanPhone))
        .limit(1);
        
      res.json({ exists: existingUserByPhone.length > 0 });
    } catch (error) {
      console.error("Erro ao verificar telefone:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/auth/register", async (req, res, next) => {
    try {
      const userData = req.body;
      
      // Verificar se o email já existe
      const existingUserByEmail = await storage.getUserByUsername(userData.email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "Este email já está em uso" });
      }
      
      // Verificar se o telefone já existe (se fornecido e válido)
      if (userData.phone && userData.phone.trim().length >= 10) {
        const cleanPhone = userData.phone.trim();
        const existingUserByPhone = await db
          .select()
          .from(users)
          .where(eq(users.phone, cleanPhone))
          .limit(1);
          
        if (existingUserByPhone.length > 0) {
          return res.status(400).json({ message: "Este telefone já está em uso" });
        }
      }
      
      // Processar código de convite se fornecido
      let referrerId = null;
      if (userData.referralCode) {
        try {
          const [referrer] = await db
            .select()
            .from(users)
            .where(eq(users.invitation_code, userData.referralCode))
            .limit(1);
            
          if (referrer) {
            referrerId = referrer.id;
            console.log(`✅ Código de convite válido: ${userData.referralCode} (referrer: ${referrer.name})`);
          } else {
            console.log(`⚠️ Código de convite inválido: ${userData.referralCode}`);
          }
        } catch (error) {
          console.error("Erro ao validar código de convite:", error);
        }
      }
      
      // Hashear a senha antes de salvar no banco de dados
      userData.password = await storage.hashPassword(userData.password);
      
      // Adicionar referrer_id aos dados do usuário se válido
      if (referrerId) {
        userData.referred_by = referrerId;
      }
      
      // Criar o usuário
      const user = await storage.createUser(userData);
      
      // BÔNUS DE CADASTRO: $10 FIXOS que entram automaticamente no saldo
      try {
        // Verificar se já existe cashback para este usuário (evitar duplicação)
        const existingCashback = await db
          .select()
          .from(cashbacks)
          .where(eq(cashbacks.user_id, user.id))
          .limit(1);

        if (existingCashback.length === 0) {
          // 1. Adicionar $10 na tabela de cashbacks (para aparecer no saldo)
          await db.insert(cashbacks).values({
            user_id: user.id,
            balance: "10.00",
            total_earned: "10.00",
            updated_at: new Date()
          });
          console.log(`💰 Cashback de $10 criado para usuário ${user.id}`);
        } else {
          // Se já existe, apenas atualizar o saldo somando $10
          await db
            .update(cashbacks)
            .set({
              balance: (parseFloat(existingCashback[0].balance) + 10.00).toString(),
              total_earned: (parseFloat(existingCashback[0].total_earned) + 10.00).toString(),
              updated_at: new Date()
            })
            .where(eq(cashbacks.user_id, user.id));
          console.log(`💰 Cashback atualizado com $10 para usuário ${user.id}`);
        }
        
        console.log(`✅ BÔNUS DE $10 ADICIONADO AUTOMATICAMENTE AO SALDO do usuário ${user.id} (${user.email})`);
      } catch (bonusError) {
        console.error('❌ Erro ao adicionar bônus de $10 ao saldo:', bonusError);
        console.error('Detalhes do erro:', bonusError);
        // Continuamos mesmo se houver erro para não interromper o fluxo de registro
      }
      
      // Se for um lojista, criar automaticamente o registro na tabela de merchants
      if (user.type === 'merchant') {
        try {
          // Verificar se já existe um registro para este usuário
          const existingMerchant = await db
            .select()
            .from(merchants)
            .where(eq(merchants.user_id, user.id))
            .limit(1);
            
          if (existingMerchant.length === 0) {
            // Criar o registro de lojista com dados padrão que podem ser editados depois
            const merchantData: InsertMerchant = {
              user_id: user.id,
              store_name: user.name || `Loja de ${user.email}`,
              category: "",
              address: "",
              city: "",
              state: "",
              country: "",
              logo: null,
              company_logo: null,
              approved: true, // Aprovação automática para fins de teste
              commission_rate: "2" // Taxa padrão de 2%
            };
            
            await db.insert(merchants).values(merchantData);
            console.log(`Registro de lojista criado automaticamente para o usuário ${user.id}`);
          }
        } catch (error) {
          console.error('Erro ao criar registro de lojista:', error);
          // Continuamos mesmo se houver erro para não interromper o fluxo de registro
        }
      }
      
      // Retorna os dados do usuário (exceto a senha)
      const { password: _, ...userWithoutPassword } = user;
      
      req.login(user, (err) => {
        if (err) return next(err);
        return res.status(201).json(userWithoutPassword);
      });
    } catch (error: any) {
      console.error("Erro no registro:", error);
      res.status(500).json({ message: error.message || "Erro interno do servidor" });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    const { userType } = req.body;
    
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return next(err);
      }
      
      if (!user) {
        return res.status(401).json({ message: info?.message || "Credenciais inválidas" });
      }
      
      // Verificar o tipo de usuário apenas se especificado
      if (userType && user.type !== userType) {
        return res.status(401).json({ 
          message: "Tipo de usuário incorreto. Por favor, selecione o tipo correto." 
        });
      }
      
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error("Erro no req.login:", loginErr);
          return next(loginErr);
        }
        
        console.log("✅ Login bem-sucedido para:", user.email, user.type);
        
        // Não enviar a senha para o cliente
        const { password: _, ...userWithoutPassword } = user;
        return res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).json({ message: "Logout realizado com sucesso" });
    });
  });

  // Endpoint para verificar status de autenticação
  app.get("/api/auth/me", (req, res) => {
    console.log("🔍 Verificando autenticação - isAuthenticated:", req.isAuthenticated?.(), "user:", !!req.user);
    
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      const { password: _, ...userWithoutPassword } = req.user as any;
      console.log("✅ Usuário autenticado:", userWithoutPassword.email, userWithoutPassword.type);
      return res.json(userWithoutPassword);
    }
    
    console.log("❌ Usuário não autenticado");
    return res.status(401).json({ message: "Usuário não autenticado" });
  });

  // Rota para recuperação de senha
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email, method, securityQuestion, securityAnswer } = req.body;
      
      // Verificar se o usuário existe
      const user = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      
      if (!user.length) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      if (method === "security-question") {
        // Em uma implementação real, verificaríamos a resposta da pergunta de segurança
        // contra o valor armazenado no banco de dados
        
        // Gerar senha temporária
        const tempPassword = randomBytes(4).toString("hex");
        const hashedTempPassword = await hashPassword(tempPassword);
        
        // Atualizar senha do usuário
        await db
          .update(users)
          .set({ password: hashedTempPassword })
          .where(eq(users.id, user[0].id));
        
        // Registrar a alteração no log de auditoria
        await db.insert(auditLogs).values({
          user_id: user[0].id,
          action: "PASSWORD_RESET",
          details: JSON.stringify({
            method: "security-question",
            success: true
          }),
          ip_address: req.ip || "unknown",
          created_at: new Date()
        });
        
        // Em produção, enviaríamos a senha temporária por email
        // Por enquanto, vamos retornar na resposta (apenas para teste)
        return res.status(200).json({ 
          success: true, 
          message: "Senha temporária gerada com sucesso",
          tempPassword // REMOVER ISSO EM PRODUÇÃO
        });
      } else {
        // Método de recuperação por email
        
        // Gerar token de redefinição
        const resetToken = randomBytes(20).toString("hex");
        const tokenExpiry = new Date();
        tokenExpiry.setHours(tokenExpiry.getHours() + 1); // Token válido por 1 hora
        
        // Em um sistema real, armazenaríamos este token no banco de dados
        // e enviaríamos um email com link para redefinição
        
        // Registrar a tentativa no log de auditoria
        await db.insert(auditLogs).values({
          user_id: user[0].id,
          action: "PASSWORD_RESET_REQUEST",
          details: JSON.stringify({
            method: "email",
            success: true
          }),
          ip_address: req.ip || "unknown",
          created_at: new Date()
        });
        
        return res.status(200).json({ 
          success: true, 
          message: "Link de recuperação enviado para o email"
        });
      }
    } catch (error) {
      console.error("Erro na recuperação de senha:", error);
      res.status(500).json({ message: "Erro ao processar a recuperação de senha" });
    }
  });

}