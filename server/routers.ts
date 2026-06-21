import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";
import * as db from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

// Admin guard middleware
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "관리자 권한이 필요합니다" });
  return next({ ctx });
});

// Partner guard middleware
const partnerProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "partner" && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "파트너 권한이 필요합니다" });
  const partner = await db.getPartnerByUserId(ctx.user.id);
  if (!partner && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "파트너 등록이 필요합니다" });
  return next({ ctx: { ...ctx, partner } });
});

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

  // ===================== CATEGORIES =====================
  categories: router({
    list: publicProcedure.query(async () => db.getActiveCategories()),
    listAll: adminProcedure.query(async () => db.getAllCategories()),
    fields: publicProcedure.input(z.object({ categoryId: z.number() })).query(async ({ input }) => db.getFieldsByCategory(input.categoryId)),
    create: adminProcedure.input(z.object({ name: z.string(), parentId: z.number().optional(), icon: z.string().optional(), description: z.string().optional(), sortOrder: z.number().optional() })).mutation(async ({ input }) => {
      const id = await db.createCategory(input);
      return { id };
    }),
    update: adminProcedure.input(z.object({ id: z.number(), name: z.string().optional(), parentId: z.number().nullable().optional(), icon: z.string().optional(), description: z.string().optional(), sortOrder: z.number().optional(), isActive: z.boolean().optional() })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateCategory(id, data as any);
      return { success: true };
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteCategory(input.id);
      return { success: true };
    }),
    swapOrder: adminProcedure.input(z.object({ idA: z.number(), idB: z.number() })).mutation(async ({ input }) => {
      await db.swapCategoryOrder(input.idA, input.idB);
      return { success: true };
    }),
    createField: adminProcedure.input(z.object({ categoryId: z.number(), label: z.string(), fieldType: z.enum(["text", "number", "select", "multiselect", "image", "file"]), options: z.array(z.string()).optional(), isRequired: z.boolean().optional(), sortOrder: z.number().optional() })).mutation(async ({ input }) => {
      const id = await db.createCategoryField(input);
      return { id };
    }),
    updateField: adminProcedure.input(z.object({ id: z.number(), label: z.string().optional(), fieldType: z.enum(["text", "number", "select", "multiselect", "image", "file"]).optional(), options: z.array(z.string()).optional(), isRequired: z.boolean().optional(), sortOrder: z.number().optional() })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateCategoryField(id, data);
      return { success: true };
    }),
    deleteField: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteCategoryField(input.id);
      return { success: true };
    }),
  }),

  // ===================== QUOTES =====================
  quotes: router({
    create: protectedProcedure.input(z.object({
      categoryId: z.number().optional(),
      type: z.enum(["public", "designated"]),
      designatedPartnerId: z.number().optional(),
      title: z.string(),
      description: z.string().optional(),
      region: z.string().optional(),
      address: z.string().optional(),
      formData: z.record(z.string(), z.unknown()).optional(),
      attachments: z.array(z.string()).optional(),
    })).mutation(async ({ ctx, input }) => {
      const id = await db.createQuote({ ...input, customerId: ctx.user.id, formData: input.formData || {}, attachments: input.attachments || [] });
      return { id };
    }),
    myQuotes: protectedProcedure.query(async ({ ctx }) => db.getQuotesByCustomer(ctx.user.id)),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => db.getQuoteById(input.id)),
    publicList: publicProcedure.query(async () => db.getPublicQuotes()),
    designatedList: partnerProcedure.query(async ({ ctx }) => {
      if (!ctx.partner) return [];
      return db.getDesignatedQuotes(ctx.partner.id);
    }),
    submissions: protectedProcedure.input(z.object({ quoteId: z.number() })).query(async ({ input }) => db.getSubmissionsByQuote(input.quoteId)),
    updateStatus: protectedProcedure.input(z.object({ id: z.number(), status: z.string() })).mutation(async ({ input }) => {
      await db.updateQuoteStatus(input.id, input.status);
      return { success: true };
    }),
    selectSubmission: protectedProcedure.input(z.object({ submissionId: z.number(), quoteId: z.number() })).mutation(async ({ input }) => {
      await db.updateSubmissionStatus(input.submissionId, "selected");
      await db.updateQuoteStatus(input.quoteId, "matched");
      return { success: true };
    }),
    // Admin
    listAll: adminProcedure.query(async () => db.getAllQuotes()),
  }),

  // ===================== PARTNERS =====================
  partners: router({
    // 사업자등록번호 진위/상태 확인 (국세청 API)
    verifyBusinessNumber: protectedProcedure
      .input(z.object({ businessNumber: z.string() }))
      .mutation(async ({ input }) => {
        const serviceKey = process.env.NTS_API_KEY;
        if (!serviceKey) {
          return { ok: false, status: "no_key", message: "사업자 인증 서비스가 설정되지 않았습니다. 관리자에게 문의하세요." };
        }
        // 숫자만 추출 (하이픈 제거)
        const bno = input.businessNumber.replace(/[^0-9]/g, "");
        if (bno.length !== 10) {
          return { ok: false, status: "invalid_format", message: "사업자등록번호는 숫자 10자리여야 합니다." };
        }
        try {
          const res = await fetch(
            `https://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey=${serviceKey}&returnType=JSON`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json", "Accept": "application/json" },
              body: JSON.stringify({ b_no: [bno] }),
            }
          );
          const data = await res.json();
          const item = data?.data?.[0];
          if (!item || !item.b_stt_cd) {
            return { ok: false, status: "not_found", message: "국세청에 등록되지 않은 사업자등록번호입니다." };
          }
          // b_stt_cd: 01=계속사업자, 02=휴업자, 03=폐업자
          if (item.b_stt_cd === "01") {
            return { ok: true, status: "active", message: `정상 사업자입니다 (${item.tax_type})`, taxType: item.tax_type };
          } else if (item.b_stt_cd === "02") {
            return { ok: false, status: "closed_temp", message: "휴업 중인 사업자입니다." };
          } else if (item.b_stt_cd === "03") {
            return { ok: false, status: "closed", message: "폐업한 사업자입니다." };
          }
          return { ok: false, status: "unknown", message: item.b_stt || "확인할 수 없습니다." };
        } catch (e) {
          console.error("[사업자인증] API 오류:", e);
          return { ok: false, status: "error", message: "인증 서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요." };
        }
      }),

    register: protectedProcedure.input(z.object({
      companyName: z.string(),
      businessNumber: z.string().optional(),
      representativeName: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      shortIntro: z.string().optional(),
      description: z.string().optional(),
      regions: z.array(z.string()).optional(),
      specialties: z.array(z.string()).optional(),
      address: z.string().optional(),
      businessLicenseUrl: z.string().optional(),
      logoUrl: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const existing = await db.getPartnerByUserId(ctx.user.id);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "이미 파트너 등록이 되어있습니다" });
      // Geocode address if provided
      let latitude: string | undefined;
      let longitude: string | undefined;
      if (input.address) {
        try {
          const { makeRequest } = await import("./_core/map");
          const geo = await makeRequest<{ results: Array<{ geometry: { location: { lat: number; lng: number } } }>; status: string }>("/maps/api/geocode/json", { address: input.address });
          if (geo.status === "OK" && geo.results[0]) {
            latitude = String(geo.results[0].geometry.location.lat);
            longitude = String(geo.results[0].geometry.location.lng);
          }
        } catch (e) {
          console.warn("[Geocode] Failed to geocode address:", e);
        }
      }
      const id = await db.createPartner({ ...input, userId: ctx.user.id, latitude, longitude });
      await db.updateUserRole(ctx.user.id, "partner");
      return { id };
    }),
    me: protectedProcedure.query(async ({ ctx }) => db.getPartnerByUserId(ctx.user.id)),
    getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => db.getPartnerById(input.id)),
    list: publicProcedure.query(async () => db.getApprovedPartners()),
    update: partnerProcedure.input(z.object({
      companyName: z.string().optional(),
      shortIntro: z.string().optional(),
      description: z.string().optional(),
      regions: z.array(z.string()).optional(),
      specialties: z.array(z.string()).optional(),
      logoUrl: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      address: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      if (!ctx.partner) throw new TRPCError({ code: "NOT_FOUND" });
      // Geocode address if changed
      let updateData: any = { ...input };
      if (input.address) {
        try {
          const { makeRequest } = await import("./_core/map");
          const geo = await makeRequest<{ results: Array<{ geometry: { location: { lat: number; lng: number } } }>; status: string }>("/maps/api/geocode/json", { address: input.address });
          if (geo.status === "OK" && geo.results[0]) {
            updateData.latitude = String(geo.results[0].geometry.location.lat);
            updateData.longitude = String(geo.results[0].geometry.location.lng);
          }
        } catch (e) {
          console.warn("[Geocode] Failed to geocode address:", e);
        }
      }
      await db.updatePartner(ctx.partner.id, updateData);
      return { success: true };
    }),
    // View quote with credit deduction
    viewQuote: partnerProcedure.input(z.object({ quoteId: z.number() })).mutation(async ({ ctx, input }) => {
      if (!ctx.partner) throw new TRPCError({ code: "NOT_FOUND" });
      const partner = ctx.partner;
      const hasSubscription = partner.subscriptionType === "monthly_view" && partner.subscriptionExpiry && new Date(partner.subscriptionExpiry) > new Date();
      if (!hasSubscription && (partner.viewCredits || 0) <= 0) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "열람권이 부족합니다. 열람권을 구매해주세요." });
      }
      const result = await db.recordQuoteView(input.quoteId, partner.id);
      if (result && !result.alreadyViewed && !hasSubscription) {
        await db.updatePartnerCredits(partner.id, (partner.viewCredits || 0) - 1);
      }
      return { alreadyViewed: result?.alreadyViewed || false };
    }),
    submitQuote: partnerProcedure.input(z.object({
      quoteId: z.number(),
      amount: z.string().optional(),
      description: z.string().optional(),
      estimatedDays: z.number().optional(),
      attachments: z.array(z.string()).optional(),
    })).mutation(async ({ ctx, input }) => {
      if (!ctx.partner) throw new TRPCError({ code: "NOT_FOUND" });
      const id = await db.createQuoteSubmission({ ...input, partnerId: ctx.partner.id });
      await db.updateQuoteStatus(input.quoteId, "quoted");
      return { id };
    }),
    mySubmissions: partnerProcedure.query(async ({ ctx }) => {
      if (!ctx.partner) return [];
      return db.getSubmissionsByPartner(ctx.partner.id);
    }),
    myViews: partnerProcedure.query(async ({ ctx }) => {
      if (!ctx.partner) return [];
      return db.getQuoteViewsByPartner(ctx.partner.id);
    }),
    // Purchase product
    purchaseProduct: partnerProcedure.input(z.object({ productId: z.number() })).mutation(async ({ ctx, input }) => {
      if (!ctx.partner) throw new TRPCError({ code: "NOT_FOUND" });
      const product = await db.getProductById(input.productId);
      if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "상품을 찾을 수 없습니다" });
      await db.createOrder({ partnerId: ctx.partner.id, productId: product.id, amount: String(product.price) });
      if (product.type === "view_credit" && product.creditAmount) {
        await db.updatePartnerCredits(ctx.partner.id, (ctx.partner.viewCredits || 0) + product.creditAmount);
      } else if (product.type === "subscription" && product.durationDays) {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + product.durationDays);
        await db.updatePartner(ctx.partner.id, { subscriptionType: "monthly_view", subscriptionExpiry: expiry } as any);
      } else if (product.type === "design_support") {
        if (product.durationDays) {
          const expiry = new Date();
          expiry.setDate(expiry.getDate() + product.durationDays);
          await db.updatePartner(ctx.partner.id, { subscriptionType: "monthly_design", subscriptionExpiry: expiry } as any);
        } else if (product.creditAmount) {
          await db.updatePartner(ctx.partner.id, { designCredits: (ctx.partner.designCredits || 0) + product.creditAmount } as any);
        }
      }
      return { success: true };
    }),
    myOrders: partnerProcedure.query(async ({ ctx }) => {
      if (!ctx.partner) return [];
      return db.getOrdersByPartner(ctx.partner.id);
    }),
    // Admin
    listAll: adminProcedure.query(async () => db.getAllPartners()),
    updateStatus: adminProcedure.input(z.object({ id: z.number(), status: z.enum(["pending", "approved", "rejected", "suspended"]) })).mutation(async ({ input }) => {
      await db.updatePartnerStatus(input.id, input.status);
      return { success: true };
    }),
    updateGrade: adminProcedure.input(z.object({ id: z.number(), grade: z.enum(["bronze", "silver", "gold", "platinum"]) })).mutation(async ({ input }) => {
      await db.updatePartnerGrade(input.id, input.grade);
      return { success: true };
    }),
    // Grade rules info (public)
    gradeRules: publicProcedure.query(() => db.GRADE_RULES),
    // Partner grade progress (for partner dashboard)
    gradeProgress: partnerProcedure.query(async ({ ctx }) => {
      if (!ctx.partner) return null;
      const completedCount = await db.getCompletedProjectCount(ctx.partner.id);
      const avgRating = parseFloat(String(ctx.partner.avgRating || "0"));
      const currentGrade = ctx.partner.grade || "bronze";
      const calculatedGrade = db.calculateGrade(completedCount, avgRating);
      // Find next grade target
      const currentRuleIndex = db.GRADE_RULES.findIndex(r => r.grade === currentGrade);
      const nextRule = currentRuleIndex > 0 ? db.GRADE_RULES[currentRuleIndex - 1] : null;
      return {
        currentGrade,
        calculatedGrade,
        completedCount,
        avgRating,
        reviewCount: ctx.partner.reviewCount || 0,
        nextGrade: nextRule?.grade || null,
        nextRequiredCompleted: nextRule?.minCompleted || null,
        nextRequiredRating: nextRule?.minRating || null,
      };
    }),

    // ===== 지갑 (파트너 본인) =====
    wallet: partnerProcedure.query(async ({ ctx }) => {
      if (!ctx.partner) return null;
      return db.getWallet(ctx.partner.id);
    }),
    walletTransactions: partnerProcedure.query(async ({ ctx }) => {
      if (!ctx.partner) return [];
      return db.getWalletTransactions(ctx.partner.id);
    }),
  }),

  // ===================== REVIEWS =====================
  reviews: router({
    create: protectedProcedure.input(z.object({ quoteId: z.number(), partnerId: z.number(), rating: z.number().min(1).max(5), content: z.string().optional() })).mutation(async ({ ctx, input }) => {
      const id = await db.createReview({ ...input, customerId: ctx.user.id });
      // Auto-evaluate partner grade after new review
      const gradeResult = await db.evaluateAndUpdatePartnerGrade(input.partnerId);
      return { id, gradeChanged: gradeResult.changed, newGrade: gradeResult.newGrade };
    }),
    byPartner: publicProcedure.input(z.object({ partnerId: z.number() })).query(async ({ input }) => db.getReviewsByPartner(input.partnerId)),
    listAll: adminProcedure.query(async () => db.getAllReviews()),
    toggleVisibility: adminProcedure.input(z.object({ id: z.number(), isVisible: z.boolean() })).mutation(async ({ input }) => {
      await db.toggleReviewVisibility(input.id, input.isVisible);
      return { success: true };
    }),
  }),

  // ===================== PORTFOLIOS =====================
  portfolios: router({
    create: partnerProcedure.input(z.object({ title: z.string(), description: z.string().optional(), images: z.array(z.string()).optional(), categoryId: z.number().optional(), region: z.string().optional() })).mutation(async ({ ctx, input }) => {
      if (!ctx.partner) throw new TRPCError({ code: "NOT_FOUND" });
      const id = await db.createPortfolio({ ...input, partnerId: ctx.partner.id });
      return { id };
    }),
    myPortfolios: partnerProcedure.query(async ({ ctx }) => {
      if (!ctx.partner) return [];
      return db.getPortfoliosByPartner(ctx.partner.id);
    }),
    byPartner: publicProcedure.input(z.object({ partnerId: z.number() })).query(async ({ input }) => db.getApprovedPortfoliosByPartner(input.partnerId)),
    update: partnerProcedure.input(z.object({ id: z.number(), title: z.string(), description: z.string().optional(), images: z.array(z.string()).optional(), categoryId: z.number().optional(), region: z.string().optional() })).mutation(async ({ ctx, input }) => {
      if (!ctx.partner) throw new TRPCError({ code: "NOT_FOUND" });
      const existing = await db.getPortfolioById(input.id);
      if (!existing || existing.partnerId !== ctx.partner.id) throw new TRPCError({ code: "FORBIDDEN", message: "본인의 포트폴리오만 수정할 수 있습니다" });
      const { id, ...rest } = input;
      await db.updatePortfolio(id, rest);
      return { success: true };
    }),
    delete: partnerProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      if (!ctx.partner) throw new TRPCError({ code: "NOT_FOUND" });
      const existing = await db.getPortfolioById(input.id);
      if (!existing || existing.partnerId !== ctx.partner.id) throw new TRPCError({ code: "FORBIDDEN", message: "본인의 포트폴리오만 삭제할 수 있습니다" });
      await db.deletePortfolio(input.id);
      return { success: true };
    }),
    listAll: adminProcedure.query(async () => db.getAllPortfolios()),
    updateStatus: adminProcedure.input(z.object({ id: z.number(), status: z.enum(["pending", "approved", "rejected"]) })).mutation(async ({ input }) => {
      await db.updatePortfolioStatus(input.id, input.status);
      return { success: true };
    }),
  }),

  // ===================== PRODUCTS =====================
  products: router({
    list: publicProcedure.query(async () => db.getActiveProducts()),
    listAll: adminProcedure.query(async () => db.getAllProducts()),
    update: adminProcedure.input(z.object({ id: z.number(), name: z.string().optional(), price: z.string().optional(), creditAmount: z.number().optional(), durationDays: z.number().optional(), description: z.string().optional(), isActive: z.boolean().optional(), sortOrder: z.number().optional() })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateProduct(id, data as any);
      return { success: true };
    }),
  }),

  // ===================== PROJECTS (현장 관리) =====================
  projects: router({
    create: partnerProcedure.input(z.object({ quoteId: z.number(), submissionId: z.number().optional(), location: z.string().optional(), scheduledDate: z.string().optional(), scheduledTime: z.string().optional(), memo: z.string().optional() })).mutation(async ({ ctx, input }) => {
      if (!ctx.partner) throw new TRPCError({ code: "NOT_FOUND" });
      const id = await db.createProject({ ...input, partnerId: ctx.partner.id, scheduledDate: input.scheduledDate ? new Date(input.scheduledDate) : undefined });
      return { id };
    }),
    myProjects: partnerProcedure.query(async ({ ctx }) => {
      if (!ctx.partner) return [];
      return db.getProjectsByPartner(ctx.partner.id);
    }),
    update: partnerProcedure.input(z.object({ id: z.number(), location: z.string().optional(), scheduledDate: z.string().optional(), scheduledTime: z.string().optional(), status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]).optional(), memo: z.string().optional() })).mutation(async ({ ctx, input }) => {
      const { id, scheduledDate, ...rest } = input;
      await db.updateProject(id, { ...rest, ...(scheduledDate ? { scheduledDate: new Date(scheduledDate) } : {}) } as any);
      // Auto-evaluate partner grade when project status changes to completed
      let gradeResult = null;
      if (input.status === "completed" && ctx.partner) {
        gradeResult = await db.evaluateAndUpdatePartnerGrade(ctx.partner.id);
      }
      return { success: true, gradeChanged: gradeResult?.changed || false, newGrade: gradeResult?.newGrade };
    }),
  }),

  // ===================== SETTINGS =====================
  settings: router({
    get: publicProcedure.input(z.object({ key: z.string() })).query(async ({ input }) => db.getSetting(input.key)),
    getAll: publicProcedure.query(async () => db.getAllSettings()),
    set: adminProcedure.input(z.object({ key: z.string(), value: z.string() })).mutation(async ({ input }) => {
      await db.setSetting(input.key, input.value);
      return { success: true };
    }),
  }),

  // ===================== ADMIN =====================
  admin: router({
    stats: adminProcedure.query(async () => db.getStats()),
    users: adminProcedure.query(async () => db.getAllUsers()),
    updateUserRole: adminProcedure.input(z.object({ userId: z.number(), role: z.enum(["user", "admin", "partner"]) })).mutation(async ({ input }) => {
      await db.updateUserRole(input.userId, input.role);
      return { success: true };
    }),
    orders: adminProcedure.query(async () => db.getAllOrders()),

    // ===== 지갑 관리 (관리자) =====
    // 가격 설정 조회
    walletSettings: adminProcedure.query(async () => db.getWalletSettings()),
    // 가격 설정 변경
    updateWalletSetting: adminProcedure
      .input(z.object({ key: z.enum(["designatedViewPrice", "publicViewPrice", "monthlySubscription"]), value: z.number().min(0) }))
      .mutation(async ({ input }) => {
        await db.setWalletSetting(input.key, input.value);
        return { success: true };
      }),
    // 파트너 토큰 수동 충전
    chargeToken: adminProcedure
      .input(z.object({ partnerId: z.number(), amount: z.number().min(1), description: z.string().optional() }))
      .mutation(async ({ input }) => {
        const newBalance = await db.chargeToken(input.partnerId, input.amount, input.description || "관리자 수동 충전");
        return { success: true, newBalance };
      }),
    // 파트너 포인트 지급 (프로모션)
    grantPoint: adminProcedure
      .input(z.object({ partnerId: z.number(), amount: z.number().min(1), validDays: z.number().min(1), reason: z.string().optional() }))
      .mutation(async ({ input }) => {
        const newBalance = await db.grantPoint(input.partnerId, input.amount, input.validDays, input.reason || "프로모션 지급");
        return { success: true, newBalance };
      }),
    // 특정 파트너 지갑 조회
    partnerWallet: adminProcedure
      .input(z.object({ partnerId: z.number() }))
      .query(async ({ input }) => {
        const wallet = await db.getWallet(input.partnerId);
        const transactions = await db.getWalletTransactions(input.partnerId, 20);
        return { wallet, transactions };
      }),
  }),

  // ===================== GEOCODE (public) =====================
  geocode: router({
    fromAddress: publicProcedure.input(z.object({ address: z.string() })).query(async ({ input }) => {
      try {
        const { makeRequest } = await import("./_core/map");
        const geo = await makeRequest<{ results: Array<{ geometry: { location: { lat: number; lng: number } }; formatted_address: string }>; status: string }>("/maps/api/geocode/json", { address: input.address });
        if (geo.status === "OK" && geo.results[0]) {
          return { lat: geo.results[0].geometry.location.lat, lng: geo.results[0].geometry.location.lng, formattedAddress: geo.results[0].formatted_address };
        }
        return null;
      } catch {
        return null;
      }
    }),
  }),

  // ===================== CONSENTS =====================
  consents: router({
    me: protectedProcedure.query(async ({ ctx }) => db.getUserConsent(ctx.user.id)),
    update: protectedProcedure.input(z.object({
      termsAgreed: z.boolean().optional(),
      privacyAgreed: z.boolean().optional(),
      marketingAgreed: z.boolean().optional(),
    })).mutation(async ({ ctx, input }) => {
      const data: any = {};
      if (input.termsAgreed !== undefined) data.termsAgreed = input.termsAgreed;
      if (input.privacyAgreed !== undefined) data.privacyAgreed = input.privacyAgreed;
      if (input.marketingAgreed !== undefined) {
        data.marketingAgreed = input.marketingAgreed;
        data.marketingAgreedAt = input.marketingAgreed ? new Date() : null;
        data.marketingDisagreedAt = !input.marketingAgreed ? new Date() : null;
      }
      await db.upsertUserConsent(ctx.user.id, data);
      return { success: true };
    }),
  }),

  // ===================== COUPONS =====================
  coupons: router({
    list: publicProcedure.query(async () => db.getActiveCoupons()),
    myAvailable: protectedProcedure.query(async ({ ctx }) => db.getAvailableUserCoupons(ctx.user.id)),
    myAll: protectedProcedure.query(async ({ ctx }) => db.getUserCoupons(ctx.user.id)),
    // Admin
    listAll: adminProcedure.query(async () => db.getAllCoupons()),
    create: adminProcedure.input(z.object({
      name: z.string(),
      description: z.string().optional(),
      discountType: z.enum(["percentage", "fixed", "free_credit"]),
      discountValue: z.number(),
      minOrderAmount: z.number().optional(),
      maxUses: z.number().optional(),
      targetType: z.enum(["all", "marketing_agreed", "new_user", "partner"]).optional(),
      expiresAt: z.string().optional(),
    })).mutation(async ({ input }) => {
      const id = await db.createCoupon({
        ...input,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
        targetType: input.targetType || "all",
      } as any);
      return { id };
    }),
    update: adminProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      isActive: z.boolean().optional(),
      expiresAt: z.string().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateCoupon(id, {
        ...data,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      } as any);
      return { success: true };
    }),
    issueToMarketingUsers: adminProcedure.input(z.object({
      couponId: z.number(),
      expiresAt: z.string().optional(),
    })).mutation(async ({ input }) => {
      const count = await db.issueMarketingCouponToAgreedUsers(
        input.couponId,
        input.expiresAt ? new Date(input.expiresAt) : undefined
      );
      return { count };
    }),
  }),

  // ===================== FILE UPLOAD =====================
  upload: router({
    getPresignedUrl: protectedProcedure.input(z.object({ filename: z.string(), contentType: z.string() })).mutation(async ({ input }) => {
      const ext = input.filename.split(".").pop() || "bin";
      const key = `uploads/${nanoid()}.${ext}`;
      return { key, uploadUrl: key };
    }),
    // Admin image upload (base64 → S3)
    adminUploadImage: adminProcedure.input(z.object({
      base64: z.string(),
      contentType: z.string(),
      filename: z.string(),
    })).mutation(async ({ input }) => {
      const ext = input.filename.split(".").pop() || "jpg";
      const key = `site-backgrounds/${nanoid()}.${ext}`;
      const buffer = Buffer.from(input.base64, "base64");
      const { url } = await storagePut(key, buffer, input.contentType);
      return { url };
    }),
  }),
});

export type AppRouter = typeof appRouter;
