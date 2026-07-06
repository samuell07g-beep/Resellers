import { describe, expect, it, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db module
vi.mock("./db", () => ({
  createLocalUser: vi.fn(),
  getLocalUserByUsername: vi.fn(),
  getLocalUserById: vi.fn(),
  getAllLocalUsers: vi.fn(),
  getActiveProducts: vi.fn(),
  getProductVariants: vi.fn(),
  getAllProductVariants: vi.fn(),
  getVariantById: vi.fn(),
  updateVariantPrice: vi.fn(),
  addKeysToStock: vi.fn(),
  getAvailableKeysCount: vi.fn(),
  getStockByVariant: vi.fn(),
  reserveKeys: vi.fn(),
  createOrder: vi.fn(),
  updateOrderPix: vi.fn(),
  getOrderById: vi.fn(),
  markOrderPaid: vi.fn(),
  saveOrderKeys: vi.fn(),
  getUserOrderKeys: vi.fn(),
  getUserOrders: vi.fn(),
  getAllOrders: vi.fn(),
  getOrderKeysByOrderId: vi.fn(),
  getPendingOrders: vi.fn(),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn(),
}));

import * as db from "./db";

function makeCtx(overrides: Partial<TrpcContext> = {}): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
    ...overrides,
  };
}

describe("localAuth.login", () => {
  it("deve fazer login com credenciais de admin fixas", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.localAuth.login({ username: "ADMIN", password: "ADMIN999" });
    expect(result.user.username).toBe("ADMIN");
    expect(result.user.role).toBe("admin");
    expect(result.token).toBeTruthy();
  });

  it("deve rejeitar credenciais inválidas", async () => {
    vi.mocked(db.getLocalUserByUsername).mockResolvedValue(null);
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.localAuth.login({ username: "inexistente", password: "errada" }))
      .rejects.toThrow("Usuário ou senha inválidos");
  });
});

describe("localAuth.register", () => {
  it("deve rejeitar usuário duplicado", async () => {
    vi.mocked(db.getLocalUserByUsername).mockResolvedValue({
      id: 1,
      username: "teste",
      passwordHash: "hash",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.localAuth.register({ username: "teste", password: "senha123" }))
      .rejects.toThrow("Usuário já existe");
  });

  it("deve rejeitar username inválido (menos de 3 chars)", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.localAuth.register({ username: "ab", password: "senha123" }))
      .rejects.toThrow();
  });

  it("deve rejeitar senha muito curta", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.localAuth.register({ username: "usuario", password: "123" }))
      .rejects.toThrow();
  });
});

describe("products.list", () => {
  it("deve retornar lista de produtos com variações e estoque", async () => {
    vi.mocked(db.getActiveProducts).mockResolvedValue([
      { id: 1, name: "Proxy iOS", description: "Proxy para iOS", active: true, createdAt: new Date(), updatedAt: new Date() },
    ]);
    vi.mocked(db.getProductVariants).mockResolvedValue([
      { id: 1, productId: 1, name: "1 Dia", days: 1, price: "5.00", active: true, createdAt: new Date(), updatedAt: new Date() },
    ]);
    vi.mocked(db.getAvailableKeysCount).mockResolvedValue(10);

    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.products.list();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Proxy iOS");
    expect(result[0].variants[0].availableStock).toBe(10);
  });
});

describe("stock.addKeys", () => {
  it("deve exigir autenticação admin", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.stock.addKeys({ variantId: 1, keysText: "key1\nkey2" }))
      .rejects.toThrow();
  });
});

describe("admin.users", () => {
  it("deve exigir autenticação admin", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.admin.users())
      .rejects.toThrow();
  });
});
