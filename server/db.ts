import { eq, and, count, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, localUsers, products, productVariants, keysStock, orders, orderKeys, tickets, ticketMessages } from "../drizzle/schema";
import type { InsertLocalUser, InsertTicket, InsertTicketMessage } from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;
let _dbError: Error | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      console.log("[Database] Attempting to connect to:", process.env.DATABASE_URL.split("@")[1] || "unknown");
      _db = drizzle(process.env.DATABASE_URL);
      console.log("[Database] Connection established successfully");
      _dbError = null;
    } catch (error) {
      _dbError = error as Error;
      console.error("[Database] Failed to connect:", {
        message: _dbError.message,
        code: (_dbError as any).code,
        errno: (_dbError as any).errno,
        sqlState: (_dbError as any).sqlState,
      });
      _db = null;
    }
  }
  if (!_db && _dbError) {
    console.warn("[Database] Still not connected, last error:", _dbError.message);
  }
  return _db;
}

// ─── Local Auth ────────────────────────────────────────────────────────────────

export async function createLocalUser(data: InsertLocalUser) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(localUsers).values(data);
}

export async function getLocalUserByUsername(username: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(localUsers).where(eq(localUsers.username, username)).limit(1);
  return result[0] ?? null;
}

export async function getLocalUserById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(localUsers).where(eq(localUsers.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getAllLocalUsers() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select({
    id: localUsers.id,
    username: localUsers.username,
    role: localUsers.role,
    createdAt: localUsers.createdAt,
  }).from(localUsers).orderBy(localUsers.createdAt);
}

// ─── Products ──────────────────────────────────────────────────────────────────

export async function getActiveProducts() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(products).where(eq(products.active, true));
}

export async function getProductVariants(productId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(productVariants)
    .where(and(eq(productVariants.productId, productId), eq(productVariants.active, true)))
    .orderBy(productVariants.days);
}

export async function getAllProductVariants() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(productVariants).orderBy(productVariants.days);
}

export async function getVariantById(variantId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(productVariants).where(eq(productVariants.id, variantId)).limit(1);
  return result[0] ?? null;
}

export async function updateVariantPrice(variantId: number, price: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(productVariants).set({ price }).where(eq(productVariants.id, variantId));
}

// ─── Keys Stock ────────────────────────────────────────────────────────────────

export async function addKeysToStock(variantId: number, keys: string[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = keys.map(k => ({ variantId, keyValue: k.trim(), used: false }));
  await db.insert(keysStock).values(rows);
}

export async function getAvailableKeysCount(variantId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select({ cnt: count() }).from(keysStock)
    .where(and(eq(keysStock.variantId, variantId), eq(keysStock.used, false)));
  return result[0]?.cnt ?? 0;
}

export async function reserveKeys(variantId: number, quantity: number, orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Buscar keys disponíveis
  const available = await db.select().from(keysStock)
    .where(and(eq(keysStock.variantId, variantId), eq(keysStock.used, false)))
    .limit(quantity);
  if (available.length < quantity) {
    throw new Error("Estoque insuficiente");
  }
  // Marcar como usadas
  const ids = available.map(k => k.id);
  for (const id of ids) {
    await db.update(keysStock)
      .set({ used: true, orderId, usedAt: new Date() })
      .where(eq(keysStock.id, id));
  }
  return available;
}

export async function getStockByVariant() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const variants = await db.select().from(productVariants).orderBy(productVariants.days);
  const result = [];
  for (const v of variants) {
    const available = await getAvailableKeysCount(v.id);
    const totalResult = await db.select({ cnt: count() }).from(keysStock).where(eq(keysStock.variantId, v.id));
    const total = totalResult[0]?.cnt ?? 0;
    result.push({ ...v, availableCount: available, totalCount: total });
  }
  return result;
}

// ─── Orders ────────────────────────────────────────────────────────────────────

export async function createOrder(data: {
  userId: number;
  variantId: number;
  quantity: number;
  totalAmount: string;
  payerName: string;
  payerDocument: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min
  await db.insert(orders).values({ ...data, status: "pending", expiresAt });
  const result = await db.select().from(orders)
    .where(and(eq(orders.userId, data.userId), eq(orders.status, "pending")))
    .orderBy(sql`createdAt DESC`)
    .limit(1);
  return result[0];
}

export async function updateOrderPix(orderId: number, pixData: {
  pixTransactionId: string;
  pixQrCodeBase64: string;
  pixQrCodeUrl: string;
  pixCopyPaste: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(orders).set(pixData).where(eq(orders.id, orderId));
}

export async function getOrderById(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  return result[0] ?? null;
}

export async function markOrderPaid(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(orders).set({ status: "paid", paidAt: new Date() }).where(eq(orders.id, orderId));
}

export async function saveOrderKeys(keys: Array<{
  orderId: number;
  userId: number;
  keyId: number;
  keyValue: string;
  variantId: number;
  variantName: string;
  days: number;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(orderKeys).values(keys);
}

export async function getUserOrderKeys(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(orderKeys)
    .where(eq(orderKeys.userId, userId))
    .orderBy(sql`createdAt DESC`);
}

export async function getUserOrders(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(sql`createdAt DESC`);
}

export async function getAllOrders() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select({
    id: orders.id,
    userId: orders.userId,
    variantId: orders.variantId,
    quantity: orders.quantity,
    totalAmount: orders.totalAmount,
    status: orders.status,
    payerName: orders.payerName,
    createdAt: orders.createdAt,
    paidAt: orders.paidAt,
  }).from(orders).orderBy(sql`createdAt DESC`);
}

export async function getOrderKeysByOrderId(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(orderKeys).where(eq(orderKeys.orderId, orderId));
}

export async function getPendingOrders() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(orders).where(eq(orders.status, "pending"));
}

// ─── Legacy OAuth (manter compatibilidade) ─────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    textFields.forEach(field => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    });
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot get user: database not available"); return undefined; }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function clearVariantStock(variantId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(keysStock).where(eq(keysStock.variantId, variantId));
}

// ─── Support Tickets ───────────────────────────────────────────────────────────

export async function createTicket(data: InsertTicket) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(tickets).values(data);
  const result = await db.select().from(tickets).where(eq(tickets.userId, data.userId)).orderBy(sql`createdAt DESC`).limit(1);
  return result[0];
}

export async function getTicketsByUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(tickets).where(eq(tickets.userId, userId)).orderBy(sql`updatedAt DESC`);
}

export async function getAllTickets() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select({
    id: tickets.id,
    userId: tickets.userId,
    subject: tickets.subject,
    status: tickets.status,
    createdAt: tickets.createdAt,
    updatedAt: tickets.updatedAt,
    username: localUsers.username,
  }).from(tickets)
    .innerJoin(localUsers, eq(tickets.userId, localUsers.id))
    .orderBy(sql`updatedAt DESC`);
}

export async function getTicketById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
  return result[0] ?? null;
}

export async function closeTicket(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(tickets).set({ status: "closed" }).where(eq(tickets.id, id));
}

export async function deleteTicket(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(ticketMessages).where(eq(ticketMessages.ticketId, id));
  await db.delete(tickets).where(eq(tickets.id, id));
}

export async function addTicketMessage(data: InsertTicketMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(ticketMessages).values(data);
  await db.update(tickets).set({ updatedAt: new Date() }).where(eq(tickets.id, data.ticketId));
}

export async function getTicketMessages(ticketId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(ticketMessages).where(eq(ticketMessages.ticketId, ticketId)).orderBy(ticketMessages.createdAt);
}
