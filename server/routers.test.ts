import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createUserContext(overrides?: Partial<AuthenticatedUser>): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-001",
    email: "user@test.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  return createUserContext({ id: 99, openId: "admin-001", role: "admin", name: "Admin" });
}

function createPartnerContext(): TrpcContext {
  return createUserContext({ id: 50, openId: "partner-001", role: "partner", name: "Partner User" });
}

describe("auth.me", () => {
  it("returns null for unauthenticated user", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user object for authenticated user", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.name).toBe("Test User");
    expect(result?.role).toBe("user");
  });
});

describe("categories.list", () => {
  it("returns categories for public user (no auth required)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    // This should not throw - it's a public procedure
    const result = await caller.categories.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("products.list", () => {
  it("returns active products for public user", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.products.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("partners.list", () => {
  it("returns approved partners for public user", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.partners.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("quotes.publicList", () => {
  it("returns public quotes", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.quotes.publicList();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("admin procedures - access control", () => {
  it("rejects non-admin from admin.stats", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.stats()).rejects.toThrow();
  });

  it("rejects non-admin from admin.users", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.users()).rejects.toThrow();
  });

  it("rejects unauthenticated from admin.stats", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.stats()).rejects.toThrow();
  });

  it("allows admin to access stats", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.stats();
    expect(result).toBeDefined();
    expect(typeof result.users).toBe("number");
    expect(typeof result.partners).toBe("number");
    expect(typeof result.quotes).toBe("number");
  });

  it("allows admin to access users list", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.users();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("partner procedures - access control", () => {
  it("rejects unauthenticated from partner register", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.partners.register({ companyName: "Test Co" })
    ).rejects.toThrow();
  });
});

describe("quotes - access control", () => {
  it("rejects unauthenticated from creating quotes", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.quotes.create({
        type: "public",
        title: "Test Quote",
      })
    ).rejects.toThrow();
  });

  it("rejects unauthenticated from myQuotes", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.quotes.myQuotes()).rejects.toThrow();
  });
});

describe("settings", () => {
  it("allows public access to get setting", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.settings.get({ key: "nonexistent" });
    // Should return null or undefined for non-existent key
    expect(result === null || result === undefined).toBe(true);
  });

  it("rejects non-admin from setting values", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.settings.set({ key: "test", value: "val" })
    ).rejects.toThrow();
  });
});

describe("reviews - access control", () => {
  it("allows public access to reviews by partner", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.reviews.byPartner({ partnerId: 999 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("rejects unauthenticated from creating reviews", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.reviews.create({ quoteId: 1, partnerId: 1, rating: 5 })
    ).rejects.toThrow();
  });
});

describe("portfolios - access control", () => {
  it("allows public access to portfolios by partner", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.portfolios.byPartner({ partnerId: 999 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("rejects non-partner from creating portfolios", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.portfolios.create({ title: "Test Portfolio" })
    ).rejects.toThrow();
  });
});
