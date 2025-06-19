import { pgTable, text, serial, integer, numeric, boolean, timestamp, uniqueIndex, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User types enum
export const UserType = {
  CLIENT: "client",
  MERCHANT: "merchant",
  ADMIN: "admin",
} as const;

export type UserTypeValues = typeof UserType[keyof typeof UserType];

// Transaction status enum
export const TransactionStatus = {
  COMPLETED: "completed",
  PENDING: "pending",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
} as const;

export type TransactionStatusValues = typeof TransactionStatus[keyof typeof TransactionStatus];

// Payment methods enum
export const PaymentMethod = {
  CASH: "cash",
  CREDIT_CARD: "credit_card",
  DEBIT_CARD: "debit_card",
  CASHBACK: "cashback",
  PIX: "pix",
} as const;

export type PaymentMethodValues = typeof PaymentMethod[keyof typeof PaymentMethod];

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  username: text("username").unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  country: text("country"),
  country_code: text("country_code"),
  type: text("type").notNull(),
  status: text("status").notNull().default("active"),
  photo: text("photo"),
  security_question: text("security_question"),
  security_answer: text("security_answer"),
  invitation_code: text("invitation_code"),
  referral_code: text("referral_code"),
  referred_by: integer("referred_by"),
  referral_level: text("referral_level"),
  password_updated: boolean("password_updated").default(false),
  created_at: timestamp("created_at").notNull().defaultNow(),
  last_login: timestamp("last_login"),
});

// Merchants table (extends users)
export const merchants = pgTable("merchants", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  store_name: text("store_name").notNull(),
  logo: text("logo"),
  category: text("category").notNull(),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  country: text("country"),
  company_logo: text("company_logo"),
  commission_rate: numeric("commission_rate").notNull().default("2.0"),
  approved: boolean("approved").notNull().default(false),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

// Cashback balances
export const cashbacks = pgTable("cashbacks", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  balance: numeric("balance").notNull().default("0.0"),
  total_earned: numeric("total_earned").notNull().default("0.0"),
  total_spent: numeric("total_spent").notNull().default("0.0"),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// Products/Services
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  merchant_id: integer("merchant_id").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  price: numeric("price").notNull(),
  category: text("category"),
  inventory_count: integer("inventory_count"),
  active: boolean("active").notNull().default(true),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

// Transactions
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  merchant_id: integer("merchant_id").notNull().references(() => merchants.id),
  amount: numeric("amount").notNull(),
  cashback_amount: numeric("cashback_amount").notNull(),
  description: text("description"),
  status: text("status").notNull().default("completed"),
  payment_method: text("payment_method").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  // Origem da transação (manual ou qrcode)
  source: text("source").default("manual"),
  // ID do QR code associado à transação (se houver)
  qr_code_id: text("qr_code_id"),
  // Optional fields that might not be in all database instances
  manual_amount: numeric("manual_amount"),
  notes: text("notes"),
});

// Transaction Items
export const transactionItems = pgTable("transaction_items", {
  id: serial("id").primaryKey(),
  transaction_id: integer("transaction_id").notNull().references(() => transactions.id, { onDelete: "cascade" }),
  product_id: integer("product_id").references(() => products.id),
  product_name: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  price: numeric("price").notNull(),
  user_id: integer("user_id").references(() => users.id),
  item_type: text("item_type"), // Para identificar os diferentes tipos de itens (cashback, comissão, etc.)
  amount: numeric("amount"),
  description: text("description"),
  status: text("status").default("completed"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

// Transfers
export const transfers = pgTable("transfers", {
  id: serial("id").primaryKey(),
  from_user_id: integer("from_user_id").notNull().references(() => users.id),
  to_user_id: integer("to_user_id").notNull().references(() => users.id),
  amount: numeric("amount").notNull(),
  description: text("description"),
  status: text("status").notNull().default("completed"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  type: text("type"),
});

// Referrals
export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrer_id: integer("referrer_id").notNull().references(() => users.id),
  referred_id: integer("referred_id").notNull().references(() => users.id),
  bonus: numeric("bonus").notNull(),
  status: text("status").notNull().default("pending"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

// QR Codes
export const qrCodes = pgTable("qr_codes", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  code: text("code").notNull().unique(),
  amount: numeric("amount"),
  description: text("description"),
  type: text("type").notNull().default("payment"), // payment, login, etc
  data: text("data"), // JSON data for the QR code
  status: text("status").notNull().default("active"), // active, used, expired
  expires_at: timestamp("expires_at"),
  used_at: timestamp("used_at"),
  used_by: integer("used_by").references(() => users.id),
  used: boolean("used").notNull().default(false), // mantido para compatibilidade
  created_at: timestamp("created_at").notNull().defaultNow(),
});

// System settings
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// Commission settings
export const commissionSettings = pgTable("commission_settings", {
  id: serial("id").primaryKey(),
  platform_fee: numeric("platform_fee").notNull().default("5.0"),
  merchant_commission: numeric("merchant_commission").notNull().default("2.0"),
  client_cashback: numeric("client_cashback").notNull().default("2.0"),
  referral_bonus: numeric("referral_bonus").notNull().default("1.0"),
  min_withdrawal: numeric("min_withdrawal").notNull().default("20.0"),
  max_cashback_bonus: numeric("max_cashback_bonus").notNull().default("10.0"),
  withdrawal_fee: numeric("withdrawal_fee").notNull().default("5.0"),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
  updated_by: integer("updated_by").references(() => users.id),
});

// Audit logs
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  details: text("details"),
  ip_address: text("ip_address"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, created_at: true, last_login: true });

export const insertMerchantSchema = createInsertSchema(merchants)
  .omit({ id: true, created_at: true });

export const insertTransactionSchema = createInsertSchema(transactions)
  .omit({ id: true, created_at: true });

export const insertTransferSchema = createInsertSchema(transfers)
  .omit({ id: true, created_at: true });

export const insertProductSchema = createInsertSchema(products)
  .omit({ id: true, created_at: true });

export const insertQRCodeSchema = createInsertSchema(qrCodes)
  .omit({ id: true, created_at: true, used: true });

export const insertCommissionSettingsSchema = createInsertSchema(commissionSettings)
  .omit({ id: true, updated_at: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Merchant = typeof merchants.$inferSelect;
export type InsertMerchant = z.infer<typeof insertMerchantSchema>;

export type Cashback = typeof cashbacks.$inferSelect;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export const insertTransactionItemSchema = createInsertSchema(transactionItems)
  .omit({ id: true, created_at: true });

export type TransactionItem = typeof transactionItems.$inferSelect;
export type InsertTransactionItem = z.infer<typeof insertTransactionItemSchema>;

export type Transfer = typeof transfers.$inferSelect;
export type InsertTransfer = z.infer<typeof insertTransferSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type QRCode = typeof qrCodes.$inferSelect;
export type InsertQRCode = z.infer<typeof insertQRCodeSchema>;

export type Setting = typeof settings.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type CommissionSetting = typeof commissionSettings.$inferSelect;
export type InsertCommissionSetting = z.infer<typeof insertCommissionSettingsSchema>;

export type BrandSetting = typeof brandSettings.$inferSelect;
export type InsertBrandSetting = z.infer<typeof insertBrandSettingsSchema>;

// Tabela de configurações de marca
export const brandSettings = pgTable("brand_settings", {
  id: serial("id").primaryKey(),
  logo_url: text("logo_url"),
  favicon_url: text("favicon_url"),
  app_name: text("app_name").notNull().default("Vale Cashback"),
  primary_color: text("primary_color").notNull().default("#0066B3"),
  secondary_color: text("secondary_color").notNull().default("#FF7700"),
  app_description: text("app_description"),
  login_background_url: text("login_background_url"),
  auto_apply: boolean("auto_apply").default(false),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
  updated_by: integer("updated_by").references(() => users.id)
});

// Schema para inserção de configurações de marca
export const insertBrandSettingsSchema = createInsertSchema(brandSettings)
  .omit({ id: true, updated_at: true });

// Tipos de notificações
export const NotificationType = {
  TRANSACTION: "transaction",
  CASHBACK: "cashback",
  TRANSFER: "transfer",
  REFERRAL: "referral",
  SYSTEM: "system",
  WITHDRAWAL: "withdrawal"
} as const;

export type NotificationTypeValues = typeof NotificationType[keyof typeof NotificationType];

// Status de solicitação de saque
export const WithdrawalStatus = {
  PENDING: "pending",
  COMPLETED: "completed",
  REJECTED: "rejected",
  CANCELLED: "cancelled"
} as const;

export type WithdrawalStatusValues = typeof WithdrawalStatus[keyof typeof WithdrawalStatus];

// Tabela de notificações
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull().$type<NotificationTypeValues>(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false).notNull(),
  data: text("data"),
  created_at: timestamp("created_at").defaultNow().notNull()
});

// Schema para inserção de notificações
export const insertNotificationSchema = createInsertSchema(notifications)
  .omit({ id: true, created_at: true });

// Tipo de notificação
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Tabela de solicitações de saque
export const withdrawalRequests = pgTable("withdrawal_requests", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  amount: numeric("amount").notNull(),
  status: text("status").notNull().default("pending").$type<WithdrawalStatusValues>(),
  notes: text("notes"),
  bank_name: text("bank_name"),
  account_number: text("account_number"),
  account_holder: text("account_holder"),
  processed_by: integer("processed_by").references(() => users.id),
  processed_at: timestamp("processed_at"),
  created_at: timestamp("created_at").defaultNow().notNull()
});

// Schema para inserção de solicitações de saque
export const insertWithdrawalRequestSchema = createInsertSchema(withdrawalRequests)
  .omit({ id: true, status: true, processed_by: true, processed_at: true, created_at: true });

// Tipo de solicitação de saque
export type WithdrawalRequest = typeof withdrawalRequests.$inferSelect;
export type InsertWithdrawalRequest = z.infer<typeof insertWithdrawalRequestSchema>;

// Tabela de bônus de usuários
export const userBonuses = pgTable("user_bonuses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull().default("0.00"),
  type: text("type").notNull().default("signup_bonus"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  usedAt: timestamp("used_at"),
  isUsed: boolean("is_used").default(false).notNull(),
});

// Schema de inserção para bônus
export const insertUserBonusSchema = createInsertSchema(userBonuses).omit({
  id: true,
  createdAt: true,
});

// Tipos para bônus
export type UserBonus = typeof userBonuses.$inferSelect;
export type InsertUserBonus = z.infer<typeof insertUserBonusSchema>;

// Tabela de tokens de redefinição de senha
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: text("token").notNull().unique(),
  expires_at: timestamp("expires_at").notNull(),
  used_at: timestamp("used_at"),
  is_used: boolean("is_used").default(false).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Schema de inserção para tokens de redefinição
export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  created_at: true,
});

// Tipos para tokens de redefinição
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;

// Tabela de notificações do sistema
export const systemNotifications = pgTable("system_notifications", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  type: text("type").notNull(), // 'password_reset', 'welcome', 'security_alert'
  title: text("title").notNull(),
  message: text("message").notNull(),
  read_at: timestamp("read_at"),
  sent_at: timestamp("sent_at").defaultNow().notNull(),
  is_read: boolean("is_read").default(false).notNull(),
  metadata: text("metadata"), // JSON string para dados adicionais
});

// Schema de inserção para notificações
export const insertSystemNotificationSchema = createInsertSchema(systemNotifications).omit({
  id: true,
  sent_at: true,
});

// Tipos para notificações
export type SystemNotification = typeof systemNotifications.$inferSelect;
export type InsertSystemNotification = z.infer<typeof insertSystemNotificationSchema>;
