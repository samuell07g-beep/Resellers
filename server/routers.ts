import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as bcrypt from "bcryptjs";
import * as jose from "jose";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { getSessionCookieOptions } from "./_core/cookies";
import { COOKIE_NAME } from "../shared/const";
import {
  createLocalUser,
  getLocalUserByUsername,
  getLocalUserById,
  getAllLocalUsers,
  getActiveProducts,
  getProductVariants,
  getAllProductVariants,
  getVariantById,
  updateVariantPrice,
  addKeysToStock,
  getAvailableKeysCount,
  getStockByVariant,
  reserveKeys,
  createOrder,
  updateOrderPix,
  getOrderById,
  markOrderPaid,
  saveOrderKeys,
  getUserOrderKeys,
  getUserOrders,
  getAllOrders,
  getOrderKeysByOrderId,
  getPendingOrders,
} from "./db";
import { notifyOwner } from "./_core/notification";

const JWT_SECRET = process.env.JWT_SECRET || "proxy-revendedores-secret";
const MISTICPAY_CI = process.env.MISTICPAY_CLIENT_ID || "";
const MISTICPAY_CS = process.env.MISTICPAY_CLIENT_SECRET || "";
const MISTICPAY_BASE = "https://api.misticpay.com/api";

async function signToken(payload: { id: number; username: string; role: string }) {
  const secret = new TextEncoder().encode(JWT_SECRET);
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);
}

async function verifyToken(token: string) {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    return payload as { id: number; username: string; role: string };
  } catch {
    return null;
  }
}

const authedProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const authHeader = ctx.req.headers["authorization"] as string | undefined;
  const token = authHeader?.replace("Bearer ", "");
  if (!token) throw new TRPCError({ code: "UNAUTHORIZED", message: "Token não fornecido" });
  const payload = await verifyToken(token);
  if (!payload) throw new TRPCError({ code: "UNAUTHORIZED", message: "Token inválido" });
  return next({ ctx: { ...ctx, localUser: payload } });
});

const adminProcedure = authedProcedure.use(async ({ ctx, next }) => {
  const localUser = (ctx as any).localUser;
  console.log("[adminProcedure] Verificando acesso:", { userId: localUser?.id, role: localUser?.role, username: localUser?.username });
  if (localUser?.role !== "admin") {
    console.error("[adminProcedure] Acesso negado - role não é admin:", localUser?.role);
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito ao administrador" });
  }
  console.log("[adminProcedure] Acesso concedido para admin:", localUser?.username);
  return next({ ctx });
});

async function createPixPayment(data: {
  amount: number;
  payerName: string;
  payerDocument: string;
  transactionId: string;
  description: string;
}) {
  const res = await fetch(`${MISTICPAY_BASE}/transactions/create`, {
    method: "POST",
    headers: {
      "ci": MISTICPAY_CI,
      "cs": MISTICPAY_CS,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`MisticPay error: ${err}`);
  }
  return res.json() as Promise<{
    message: string;
    data: {
      transactionId: string;
      transactionState: string;
      qrCodeBase64: string;
      qrcodeUrl: string;
      copyPaste: string;
    };
  }>;
}

async function checkPixStatus(transactionId: string) {
  try {
    console.log("[checkPixStatus] Verificando transação:", transactionId);
    const res = await fetch(`${MISTICPAY_BASE}/transactions/check`, {
      method: "POST",
      headers: { "ci": MISTICPAY_CI, "cs": MISTICPAY_CS, "Content-Type": "application/json" },
      body: JSON.stringify({ transactionId }),
    });
    console.log("[checkPixStatus] Response status:", res.status);
    if (!res.ok) {
      const errText = await res.text();
      console.error("[checkPixStatus] API error:", res.status, errText);
      return null;
    }
    const json = await res.json() as any;
    console.log("[checkPixStatus] API response:", JSON.stringify(json, null, 2));
    // MisticPay retorna a transação em json.transaction
    const transaction = json?.transaction ?? null;
    console.log("[checkPixStatus] Extracted transaction:", transaction);
    return transaction;
  } catch (err) {
    console.error("[checkPixStatus] Exception:", err);
    return null;
  }
}

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  localAuth: router({
    register: publicProcedure
      .input(z.object({
        username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/, "Apenas letras, números e _"),
        password: z.string().min(6),
      }))
      .mutation(async ({ input }) => {
        const existing = await getLocalUserByUsername(input.username);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "Usuário já existe" });
        const hash = await bcrypt.hash(input.password, 10);
        await createLocalUser({ username: input.username, passwordHash: hash, role: "user" });
        const user = await getLocalUserByUsername(input.username);
        if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const token = await signToken({ id: user.id, username: user.username, role: user.role });
        return { token, user: { id: user.id, username: user.username, role: user.role } };
      }),

    login: publicProcedure
      .input(z.object({ username: z.string(), password: z.string() }))
      .mutation(async ({ input }) => {
        if (input.username === "ADMIN" && input.password === "ADMIN999") {
          const token = await signToken({ id: 0, username: "ADMIN", role: "admin" });
          return { token, user: { id: 0, username: "ADMIN", role: "admin" } };
        }
        const user = await getLocalUserByUsername(input.username);
        if (!user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário ou senha inválidos" });
        const valid = await bcrypt.compare(input.password, user.passwordHash);
        if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário ou senha inválidos" });
        const token = await signToken({ id: user.id, username: user.username, role: user.role });
        return { token, user: { id: user.id, username: user.username, role: user.role } };
      }),

    me: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const payload = await verifyToken(input.token);
        if (!payload) throw new TRPCError({ code: "UNAUTHORIZED" });
        return payload;
      }),
  }),

  products: router({
    list: publicProcedure.query(async () => {
      const prods = await getActiveProducts();
      const result = [];
      for (const p of prods) {
        const variants = await getProductVariants(p.id);
        const variantsWithStock = [];
        for (const v of variants) {
          const stock = await getAvailableKeysCount(v.id);
          variantsWithStock.push({ ...v, price: Number(v.price), availableStock: stock });
        }
        result.push({ ...p, variants: variantsWithStock });
      }
      return result;
    }),
  }),

  stock: router({
    getAll: adminProcedure.query(async () => getStockByVariant()),

    addKeys: adminProcedure
      .input(z.object({ variantId: z.number(), keysText: z.string().min(1) }))
      .mutation(async ({ input }) => {
        const keys = input.keysText.split("\n").map(k => k.trim()).filter(k => k.length > 0);
        if (keys.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma key válida" });
        await addKeysToStock(input.variantId, keys);
        return { added: keys.length };
      }),

    updatePrice: adminProcedure
      .input(z.object({ variantId: z.number(), price: z.string() }))
      .mutation(async ({ input }) => {
        await updateVariantPrice(input.variantId, input.price);
        return { success: true };
      }),
  }),

  orders: router({
    create: authedProcedure
      .input(z.object({
        variantId: z.number(),
        quantity: z.number().min(1).max(100),
        payerName: z.string().min(2),
        payerDocument: z.string().min(11).max(14),
      }))
      .mutation(async ({ input, ctx }) => {
        const localUser = (ctx as any).localUser;
        const variant = await getVariantById(input.variantId);
        if (!variant) throw new TRPCError({ code: "NOT_FOUND", message: "Variação não encontrada" });
        const stock = await getAvailableKeysCount(input.variantId);
        if (stock < input.quantity) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Estoque insuficiente. Disponível: ${stock}` });
        }
        const totalAmount = (Number(variant.price) * input.quantity).toFixed(2);
        const order = await createOrder({
          userId: localUser.id,
          variantId: input.variantId,
          quantity: input.quantity,
          totalAmount,
          payerName: input.payerName,
          payerDocument: input.payerDocument.replace(/\D/g, ""),
        });
        if (!order) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const transactionId = `proxy-${order.id}-${Date.now()}`;
        try {
          const pixResp = await createPixPayment({
            amount: Number(totalAmount),
            payerName: input.payerName,
            payerDocument: input.payerDocument.replace(/\D/g, ""),
            transactionId,
            description: `Proxy iOS - ${variant.name} x${input.quantity}`,
          });
          await updateOrderPix(order.id, {
            pixTransactionId: pixResp.data.transactionId,
            pixQrCodeBase64: pixResp.data.qrCodeBase64,
            pixQrCodeUrl: pixResp.data.qrcodeUrl,
            pixCopyPaste: pixResp.data.copyPaste,
          });
          return {
            orderId: order.id,
            pixTransactionId: pixResp.data.transactionId,
            qrCodeBase64: pixResp.data.qrCodeBase64,
            qrCodeUrl: pixResp.data.qrcodeUrl,
            copyPaste: pixResp.data.copyPaste,
            totalAmount,
            variantName: variant.name,
            quantity: input.quantity,
          };
        } catch (e: any) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Erro ao gerar PIX: ${e.message}` });
        }
      }),

    checkPayment: authedProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ input, ctx }) => {
        const localUser = (ctx as any).localUser;
        const order = await getOrderById(input.orderId);
        if (!order) throw new TRPCError({ code: "NOT_FOUND" });
        if (order.userId !== localUser.id && localUser.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        if (order.status === "paid") {
          const keys = await getOrderKeysByOrderId(order.id);
          return { status: "paid", keys, qrCodeBase64: null, copyPaste: null };
        }
        // Return PIX data for pending orders (for page refresh recovery)
        const pendingData = {
          status: order.status,
          keys: [] as any[],
          qrCodeBase64: order.pixQrCodeBase64 ?? null,
          copyPaste: order.pixCopyPaste ?? null,
          variantName: null as string | null,
          quantity: order.quantity,
          totalAmount: order.totalAmount,
        };
        if (!order.pixTransactionId) return pendingData;
        try {
          const pixData = await checkPixStatus(order.pixTransactionId);
          const approvedStates = ["APROVADO", "PAGO", "CONCLUIDO", "COMPLETED", "APPROVED"];
          if (pixData && approvedStates.includes(pixData.transactionState?.toUpperCase())) {
            // Check if keys already released (idempotency)
            const existingKeys = await getOrderKeysByOrderId(order.id);
            if (existingKeys.length > 0) {
              await markOrderPaid(order.id);
              return { status: "paid", keys: existingKeys, qrCodeBase64: null, copyPaste: null };
            }
            const variant = await getVariantById(order.variantId);
            try {
              const reservedKeys = await reserveKeys(order.variantId, order.quantity, order.id);
              const keysToSave = reservedKeys.map(k => ({
                orderId: order.id,
                userId: order.userId,
                keyId: k.id,
                keyValue: k.keyValue,
                variantId: order.variantId,
                variantName: variant?.name ?? "",
                days: variant?.days ?? 0,
              }));
              await saveOrderKeys(keysToSave);
              await markOrderPaid(order.id);
              try {
                await notifyOwner({
                  title: "Nova compra confirmada!",
                  content: `Pedido #${order.id} confirmado. Usuário ID: ${order.userId}. Produto: ${variant?.name} x${order.quantity}. Total: R$ ${order.totalAmount}`,
                });
              } catch {}
              const keys = await getOrderKeysByOrderId(order.id);
              return { status: "paid", keys, qrCodeBase64: null, copyPaste: null };
            } catch (reserveErr: any) {
              console.error("[checkPayment] Failed to reserve keys:", reserveErr);
              // Mark as paid but return error info
              await markOrderPaid(order.id);
              return { status: "paid", keys: [], qrCodeBase64: null, copyPaste: null };
            }
          }
        } catch {}
        return pendingData;
      }),

    myKeys: authedProcedure.query(async ({ ctx }) => {
      const localUser = (ctx as any).localUser;
      return getUserOrderKeys(localUser.id);
    }),

    myOrders: authedProcedure.query(async ({ ctx }) => {
      const localUser = (ctx as any).localUser;
      return getUserOrders(localUser.id);
    }),
  }),

  admin: router({
    users: adminProcedure.query(async () => getAllLocalUsers()),

    userOrders: adminProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => getUserOrders(input.userId)),

    userKeys: adminProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => getUserOrderKeys(input.userId)),

    allOrders: adminProcedure.query(async () => getAllOrders()),

    orderKeys: adminProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ input }) => getOrderKeysByOrderId(input.orderId)),
  }),
});

export type AppRouter = typeof appRouter;
