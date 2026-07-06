import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
} from "drizzle-orm/mysql-core";

// Tabela de usuários locais (autenticação própria, sem OAuth)
export const localUsers = mysqlTable("local_users", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Tabela de produtos
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Variações de produto (planos)
export const productVariants = mysqlTable("product_variants", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("product_id").notNull(),
  name: varchar("name", { length: 64 }).notNull(), // ex: "1 dia", "7 dias", "30 dias"
  days: int("days").notNull(), // número de dias
  price: decimal("price", { precision: 10, scale: 2 }).notNull(), // preço em reais
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Estoque de keys por variação
export const keysStock = mysqlTable("keys_stock", {
  id: int("id").autoincrement().primaryKey(),
  variantId: int("variant_id").notNull(),
  keyValue: varchar("key_value", { length: 512 }).notNull(),
  used: boolean("used").default(false).notNull(),
  orderId: int("order_id"), // preenchido quando a key for vendida
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  usedAt: timestamp("usedAt"),
});

// Pedidos
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  variantId: int("variant_id").notNull(),
  quantity: int("quantity").notNull().default(1),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "paid", "failed", "expired"]).default("pending").notNull(),
  // Dados do PIX MisticPay
  pixTransactionId: varchar("pix_transaction_id", { length: 128 }),
  pixQrCodeBase64: text("pix_qr_code_base64"),
  pixQrCodeUrl: varchar("pix_qr_code_url", { length: 512 }),
  pixCopyPaste: text("pix_copy_paste"),
  // Dados do pagador (necessário para MisticPay)
  payerName: varchar("payer_name", { length: 128 }),
  payerDocument: varchar("payer_document", { length: 14 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  paidAt: timestamp("paidAt"),
  expiresAt: timestamp("expiresAt"),
});

// Keys liberadas por pedido
export const orderKeys = mysqlTable("order_keys", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("order_id").notNull(),
  userId: int("user_id").notNull(),
  keyId: int("key_id").notNull(),
  keyValue: varchar("key_value", { length: 512 }).notNull(),
  variantId: int("variant_id").notNull(),
  variantName: varchar("variant_name", { length: 64 }).notNull(),
  days: int("days").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Manter tabela users original para compatibilidade com o template (OAuth)
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type LocalUser = typeof localUsers.$inferSelect;
export type InsertLocalUser = typeof localUsers.$inferInsert;
export type Product = typeof products.$inferSelect;
export type ProductVariant = typeof productVariants.$inferSelect;
export type KeyStock = typeof keysStock.$inferSelect;
// Suporte (Tickets)
export const tickets = mysqlTable("tickets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["open", "closed"]).default("open").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Mensagens dos Tickets
export const ticketMessages = mysqlTable("ticket_messages", {
  id: int("id").autoincrement().primaryKey(),
  ticketId: int("ticket_id").notNull(),
  userId: int("user_id").notNull(),
  message: text("message").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type OrderKey = typeof orderKeys.$inferSelect;
export type Ticket = typeof tickets.$inferSelect;
export type TicketMessage = typeof ticketMessages.$inferSelect;
export type InsertTicket = typeof tickets.$inferInsert;
export type InsertTicketMessage = typeof ticketMessages.$inferInsert;
