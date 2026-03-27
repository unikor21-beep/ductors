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

describe("partners.updateGrade - access control", () => {
  it("rejects non-admin from updating partner grade", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.partners.updateGrade({ id: 1, grade: "gold" })
    ).rejects.toThrow();
  });

  it("rejects unauthenticated from updating partner grade", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.partners.updateGrade({ id: 1, grade: "silver" })
    ).rejects.toThrow();
  });

  it("allows admin to update partner grade", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.partners.updateGrade({ id: 1, grade: "gold" });
    expect(result).toEqual({ success: true });
  });
});

describe("auto grade calculation (pure logic)", () => {
  it("returns bronze for 0 completed and 0 rating", async () => {
    const { calculateGrade } = await import("./db");
    expect(calculateGrade(0, 0)).toBe("bronze");
  });

  it("returns bronze for low completed count even with high rating", async () => {
    const { calculateGrade } = await import("./db");
    expect(calculateGrade(2, 5.0)).toBe("bronze");
  });

  it("returns silver for 3+ completed and 3.5+ rating", async () => {
    const { calculateGrade } = await import("./db");
    expect(calculateGrade(3, 3.5)).toBe("silver");
  });

  it("returns silver for 5 completed and 3.8 rating", async () => {
    const { calculateGrade } = await import("./db");
    expect(calculateGrade(5, 3.8)).toBe("silver");
  });

  it("returns gold for 10+ completed and 4.0+ rating", async () => {
    const { calculateGrade } = await import("./db");
    expect(calculateGrade(10, 4.0)).toBe("gold");
  });

  it("returns gold for 25 completed and 4.3 rating", async () => {
    const { calculateGrade } = await import("./db");
    expect(calculateGrade(25, 4.3)).toBe("gold");
  });

  it("returns platinum for 30+ completed and 4.5+ rating", async () => {
    const { calculateGrade } = await import("./db");
    expect(calculateGrade(30, 4.5)).toBe("platinum");
  });

  it("returns platinum for 100 completed and 4.9 rating", async () => {
    const { calculateGrade } = await import("./db");
    expect(calculateGrade(100, 4.9)).toBe("platinum");
  });

  it("returns silver when completed is enough for gold but rating is too low", async () => {
    const { calculateGrade } = await import("./db");
    expect(calculateGrade(15, 3.5)).toBe("silver");
  });

  it("returns bronze when rating is high but completed is too low", async () => {
    const { calculateGrade } = await import("./db");
    expect(calculateGrade(1, 4.8)).toBe("bronze");
  });

  it("returns gold when completed is enough for platinum but rating is not", async () => {
    const { calculateGrade } = await import("./db");
    expect(calculateGrade(50, 4.2)).toBe("gold");
  });
});

describe("grade rules data", () => {
  it("GRADE_RULES has 4 entries in descending order", async () => {
    const { GRADE_RULES } = await import("./db");
    expect(GRADE_RULES).toHaveLength(4);
    expect(GRADE_RULES[0].grade).toBe("platinum");
    expect(GRADE_RULES[1].grade).toBe("gold");
    expect(GRADE_RULES[2].grade).toBe("silver");
    expect(GRADE_RULES[3].grade).toBe("bronze");
  });

  it("platinum requires highest thresholds", async () => {
    const { GRADE_RULES } = await import("./db");
    const platinum = GRADE_RULES.find(r => r.grade === "platinum")!;
    expect(platinum.minCompleted).toBe(30);
    expect(platinum.minRating).toBe(4.5);
  });

  it("bronze requires no minimum", async () => {
    const { GRADE_RULES } = await import("./db");
    const bronze = GRADE_RULES.find(r => r.grade === "bronze")!;
    expect(bronze.minCompleted).toBe(0);
    expect(bronze.minRating).toBe(0);
  });
});

describe("partners.gradeRules - public access", () => {
  it("returns grade rules for public user", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.partners.gradeRules();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(4);
    expect(result[0].grade).toBe("platinum");
  });
});
