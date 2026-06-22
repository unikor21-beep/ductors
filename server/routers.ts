import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";
import * as db from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import { hashPassword, verifyPassword } from "./_core/password";
import { isPasswordValid } from "@shared/password";
import { sdk } from "./_core/sdk";

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

    // 비밀번호 변경 알림 표시 여부 (90일 경과 + 로컬 비번 계정만)
    passwordReminder: protectedProcedure.query(async ({ ctx }) => {
      const u = await db.getUserById(ctx.user.id);
      const remind = !!(u && u.passwordHash && u.passwordRemindAt && new Date() >= new Date(u.passwordRemindAt));
      return { remind };
    }),

    // "다음에 바꾸기" — 90일 뒤 다시 알림
    snoozePasswordReminder: protectedProcedure.mutation(async ({ ctx }) => {
      await db.snoozePasswordReminder(ctx.user.id);
      return { success: true };
    }),

    // 비밀번호 변경 (현재 비밀번호 확인 후 변경)
    changePassword: protectedProcedure
      .input(z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(8, "비밀번호는 8자 이상").refine(isPasswordValid, "영문·숫자·특수문자 조합 8~20자, 연속·반복 문자는 사용할 수 없습니다"),
      }))
      .mutation(async ({ ctx, input }) => {
        const u = await db.getUserById(ctx.user.id);
        if (!u || !u.passwordHash) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "SNS 계정은 비밀번호를 변경할 수 없습니다" });
        }
        const valid = await verifyPassword(input.currentPassword, u.passwordHash);
        if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "현재 비밀번호가 일치하지 않습니다" });
        if (await verifyPassword(input.newPassword, u.passwordHash)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "이전과 다른 비밀번호를 사용해 주세요" });
        }
        const newHash = await hashPassword(input.newPassword);
        await db.updateUserPassword(u.id, newHash);
        return { success: true };
      }),

    // 고객 프로필 수정 (이름/이메일/휴대전화/유선/보안질문)
    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().min(1, "이름을 입력하세요").optional(),
        email: z.string().email("올바른 이메일 형식이 아닙니다").optional().or(z.literal("")),
        phone: z.string().optional(),
        landline: z.string().optional(),
        securityQuestion: z.string().optional(),
        securityAnswer: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // 이메일 중복 (본인 제외)
        if (input.email) {
          const e = await db.getUserByEmail(input.email);
          if (e && e.id !== ctx.user.id) throw new TRPCError({ code: "CONFLICT", message: "이미 사용 중인 이메일입니다" });
        }
        // 휴대전화 중복 (본인 제외)
        if (input.phone) {
          const digits = input.phone.replace(/\D/g, "");
          if (digits.length >= 10) {
            const p = await db.getUserByPhoneDigits(digits);
            if (p && p.id !== ctx.user.id) throw new TRPCError({ code: "CONFLICT", message: "이미 가입된 전화번호입니다" });
          }
        }
        // 보안 답변은 입력된 경우에만 갱신(해시)
        const securityAnswerHash = input.securityAnswer && input.securityAnswer.trim()
          ? await hashPassword(input.securityAnswer.trim().toLowerCase()) : undefined;
        await db.updateUserProfile(ctx.user.id, {
          name: input.name,
          email: input.email || undefined,
          phone: input.phone,
          landline: input.landline !== undefined ? (input.landline || null) : undefined,
          securityQuestion: input.securityQuestion,
          securityAnswerHash,
        });
        return { success: true };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),

    // 아이디 중복 확인
    checkUsername: publicProcedure
      .input(z.object({ username: z.string().min(4).max(20) }))
      .query(async ({ input }) => {
        const existing = await db.getUserByUsername(input.username);
        return { available: !existing };
      }),

    // 휴대전화 중복 확인
    checkPhone: publicProcedure
      .input(z.object({ phone: z.string() }))
      .query(async ({ input }) => {
        const digits = input.phone.replace(/\D/g, "");
        if (digits.length < 10) return { available: true };
        const existing = await db.getUserByPhoneDigits(digits);
        return { available: !existing };
      }),

    // 이메일 중복 확인
    checkEmail: publicProcedure
      .input(z.object({ email: z.string() }))
      .query(async ({ input }) => {
        const email = input.email.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { available: true };
        const existing = await db.getUserByEmail(email);
        return { available: !existing };
      }),

    // 자체 회원가입 (아이디 + 비밀번호)
    signup: publicProcedure
      .input(z.object({
        username: z.string().min(4, "아이디는 4자 이상").max(20, "아이디는 20자 이하")
          .regex(/^[a-zA-Z0-9_]+$/, "아이디는 영문/숫자/밑줄만 가능"),
        password: z.string().min(8, "비밀번호는 8자 이상").refine(isPasswordValid, "영문·숫자·특수문자 조합 8~20자, 연속·반복 문자는 사용할 수 없습니다"),
        name: z.string().min(1, "이름을 입력하세요"),
        email: z.string().email("올바른 이메일 형식이 아닙니다"),
        phone: z.string().min(1, "휴대전화를 입력하세요"),
        landline: z.string().optional(),
        securityQuestion: z.string().min(1, "보안 질문을 선택하세요"),
        securityAnswer: z.string().min(1, "보안 질문 답을 입력하세요"),
      }))
      .mutation(async ({ ctx, input }) => {
        // 아이디 중복 확인
        const existing = await db.getUserByUsername(input.username);
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "이미 사용 중인 아이디입니다" });
        }
        // 휴대전화 중복 확인
        const phoneDigits = input.phone.replace(/\D/g, "");
        if (phoneDigits.length >= 10 && await db.getUserByPhoneDigits(phoneDigits)) {
          throw new TRPCError({ code: "CONFLICT", message: "이미 가입된 전화번호입니다" });
        }
        // 이메일 중복 확인
        if (await db.getUserByEmail(input.email)) {
          throw new TRPCError({ code: "CONFLICT", message: "이미 가입된 이메일입니다" });
        }
        // 비밀번호 + 보안답변 해싱
        const passwordHash = await hashPassword(input.password);
        const securityAnswerHash = await hashPassword(input.securityAnswer.trim().toLowerCase());

        const openId = await db.createLocalUser({
          username: input.username,
          passwordHash,
          name: input.name,
          email: input.email,
          phone: input.phone,
          landline: input.landline,
          securityQuestion: input.securityQuestion,
          securityAnswerHash,
        });
        if (!openId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "가입 처리 중 오류" });

        // 세션 발급 (자동 로그인)
        const sessionToken = await sdk.createSessionToken(openId, { name: input.name, expiresInMs: ONE_YEAR_MS });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        return { success: true };
      }),

    // 자체 로그인
    login: publicProcedure
      .input(z.object({ username: z.string(), password: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserByUsername(input.username);
        if (!user || !user.passwordHash) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "아이디 또는 비밀번호가 일치하지 않습니다" });
        }
        const valid = await verifyPassword(input.password, user.passwordHash);
        if (!valid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "아이디 또는 비밀번호가 일치하지 않습니다" });
        }
        // 탈퇴한 회원 차단
        if (user.deletedAt) {
          throw new TRPCError({ code: "FORBIDDEN", message: "탈퇴한 계정입니다. 재가입은 고객센터로 문의해주세요." });
        }
        // 세션 발급
        const sessionToken = await sdk.createSessionToken(user.openId, { name: user.name || "", expiresInMs: ONE_YEAR_MS });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        return { success: true, role: user.role };
      }),

    // 비밀번호 찾기 1단계: 아이디 입력 → 보안 질문 반환
    getSecurityQuestion: publicProcedure
      .input(z.object({ username: z.string() }))
      .query(async ({ input }) => {
        const user = await db.getUserByUsername(input.username);
        if (!user || !user.securityQuestion) {
          throw new TRPCError({ code: "NOT_FOUND", message: "해당 아이디를 찾을 수 없습니다" });
        }
        return { question: user.securityQuestion };
      }),

    // 아이디 찾기: 이름 + 이메일 확인 → 아이디 안내
    findUsername: publicProcedure
      .input(z.object({ name: z.string().min(1), email: z.string().email() }))
      .query(async ({ input }) => {
        const u = await db.getUsernameByEmail(input.email);
        if (!u || !u.username || (u.name || "").trim() !== input.name.trim()) {
          throw new TRPCError({ code: "NOT_FOUND", message: "일치하는 계정을 찾을 수 없습니다. 이름과 이메일을 확인해 주세요." });
        }
        return { username: u.username };
      }),

    // 비밀번호 찾기 2단계: 보안 답변 확인 → 비밀번호 재설정
    resetPassword: publicProcedure
      .input(z.object({
        username: z.string(),
        securityAnswer: z.string(),
        newPassword: z.string().min(8, "비밀번호는 8자 이상").refine(isPasswordValid, "영문·숫자·특수문자 조합 8~20자, 연속·반복 문자는 사용할 수 없습니다"),
      }))
      .mutation(async ({ input }) => {
        const user = await db.getUserByUsername(input.username);
        if (!user || !user.securityAnswerHash) {
          throw new TRPCError({ code: "NOT_FOUND", message: "해당 아이디를 찾을 수 없습니다" });
        }
        // 보안 답변 검증
        const valid = await verifyPassword(input.securityAnswer.trim().toLowerCase(), user.securityAnswerHash);
        if (!valid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "보안 질문의 답이 일치하지 않습니다" });
        }
        // 비밀번호 재설정
        const newHash = await hashPassword(input.newPassword);
        await db.updateUserPassword(user.id, newHash);
        return { success: true };
      }),

    // 탈퇴 가능 여부 + 잔액/진행건 확인
    getWithdrawInfo: protectedProcedure.query(async ({ ctx }) => {
      const activeAsCustomer = await db.countActiveQuotesByCustomer(ctx.user.id);
      const partner = await db.getPartnerByUserId(ctx.user.id);
      let tokenBalance = 0;
      let pointBalance = 0;
      let activeAsPartner = 0;
      if (partner) {
        tokenBalance = partner.tokenBalance ?? 0;
        pointBalance = partner.pointBalance ?? 0;
        activeAsPartner = await db.countActiveJobsByPartner(partner.id);
      }
      const activeQuotes = activeAsCustomer + activeAsPartner;
      return {
        activeQuotes,
        isPartner: !!partner,
        tokenBalance,
        pointBalance,
        canWithdraw: activeQuotes === 0,
      };
    }),

    // 회원 탈퇴 (Soft Delete)
    withdraw: protectedProcedure
      .input(z.object({ reason: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const partner = await db.getPartnerByUserId(ctx.user.id);
        // 진행중 거래(고객 견적 + 파트너 시공)가 있으면 탈퇴 차단
        const activeAsCustomer = await db.countActiveQuotesByCustomer(ctx.user.id);
        const activeAsPartner = partner ? await db.countActiveJobsByPartner(partner.id) : 0;
        const active = activeAsCustomer + activeAsPartner;
        if (active > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `진행 중인 거래가 ${active}건 있습니다. 완료 후 탈퇴할 수 있습니다.`,
          });
        }
        // 탈퇴 처리 (계정 비활성화)
        await db.deactivateUser(ctx.user.id, input.reason);
        // 파트너인 경우 상태를 '정지'로 → 파트너 찾기·지정 견적에서 제외 (기록은 보존)
        if (partner) {
          await db.updatePartnerStatus(partner.id, "suspended");
        }
        // 세션 쿠키 제거
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
        return { success: true };
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

  // ===================== MAIN BANNERS (메인 프로모션 배너) =====================
  banners: router({
    // 공개: 메인페이지 노출용 (활성 + 기간 충족만)
    list: publicProcedure.query(async () => db.getActiveBanners()),
    // 관리자: 전체 목록
    listAll: adminProcedure.query(async () => db.getAllBanners()),
    create: adminProcedure.input(z.object({
      imageUrl: z.string().min(1, "배너 이미지를 업로드하세요"),
      linkUrl: z.string().optional(),
      buttonText: z.string().optional(),
      buttonPosition: z.enum(["tl", "tc", "tr", "ml", "mc", "mr", "bl", "bc", "br"]).optional(),
      sortOrder: z.number().optional(),
      startsAt: z.date().nullable().optional(),
      endsAt: z.date().nullable().optional(),
    })).mutation(async ({ input }) => {
      const id = await db.createBanner(input);
      return { id };
    }),
    update: adminProcedure.input(z.object({
      id: z.number(),
      imageUrl: z.string().optional(),
      linkUrl: z.string().nullable().optional(),
      buttonText: z.string().nullable().optional(),
      buttonPosition: z.enum(["tl", "tc", "tr", "ml", "mc", "mr", "bl", "bc", "br"]).optional(),
      sortOrder: z.number().optional(),
      isActive: z.boolean().optional(),
      startsAt: z.date().nullable().optional(),
      endsAt: z.date().nullable().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateBanner(id, data as any);
      return { success: true };
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteBanner(input.id);
      return { success: true };
    }),
    swapOrder: adminProcedure.input(z.object({ idA: z.number(), idB: z.number() })).mutation(async ({ input }) => {
      await db.swapBannerOrder(input.idA, input.idB);
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
    myQuotes: protectedProcedure.query(async ({ ctx }) => db.getQuotesByCustomerWithCounts(ctx.user.id)),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => db.getQuoteById(input.id)),
    // 파트너용 상세 (열람한 견적만 의뢰자 정보 포함)
    detailForPartner: partnerProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      if (!ctx.partner) throw new TRPCError({ code: "NOT_FOUND" });
      // 열람 여부 확인 - 열람하지 않았으면 의뢰자 정보 제외
      const viewed = await db.hasViewedQuote(input.id, ctx.partner.id);
      if (!viewed) {
        // 지정 견적은 본인 지정이면 열람 전이라도 접근 가능하나, 의뢰자 정보는 열람 후에만
        const q = await db.getQuoteById(input.id);
        return q ? { ...q, customer: null } : null;
      }
      return db.getQuoteWithCustomer(input.id);
    }),
    publicList: publicProcedure.query(async ({ ctx }) => {
      // 파트너로 로그인한 경우: 지역+카테고리 매칭된 견적만
      if (ctx.user) {
        const partner = await db.getPartnerByUserId(ctx.user.id);
        if (partner) return db.getMatchedPublicQuotes(partner.id);
      }
      // 비로그인/일반 사용자: 전체 공개 견적
      return db.getPublicQuotes();
    }),
    designatedList: partnerProcedure.query(async ({ ctx }) => {
      if (!ctx.partner) return [];
      return db.getDesignatedQuotes(ctx.partner.id);
    }),
    submissions: protectedProcedure.input(z.object({ quoteId: z.number() })).query(async ({ ctx, input }) => {
      const quote = await db.getQuoteById(input.quoteId);
      if (!quote) return [];
      if (quote.customerId !== ctx.user.id && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "조회 권한이 없습니다" });
      return db.getSubmissionsByQuote(input.quoteId);
    }),
    updateStatus: protectedProcedure.input(z.object({ id: z.number(), status: z.string() })).mutation(async ({ input }) => {
      await db.updateQuoteStatus(input.id, input.status);
      return { success: true };
    }),
    // 고객: 파트너 선정 (나머지 자동 탈락 → 매칭) + 선정 파트너에게 알림
    selectSubmission: protectedProcedure.input(z.object({ submissionId: z.number(), quoteId: z.number() })).mutation(async ({ ctx, input }) => {
      const quote = await db.getQuoteById(input.quoteId);
      if (!quote || quote.customerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "권한이 없습니다" });
      const sub = await db.getSubmissionById(input.submissionId);
      if (!sub || sub.quoteId !== input.quoteId) throw new TRPCError({ code: "NOT_FOUND", message: "견적 제출을 찾을 수 없습니다" });
      await db.updateSubmissionStatus(input.submissionId, "selected");
      await db.rejectOtherSubmissions(input.quoteId, input.submissionId);
      await db.updateQuoteStatus(input.quoteId, "matched");
      await db.sendChatMessage({ quoteId: input.quoteId, partnerId: sub.partnerId, senderRole: "customer", senderId: ctx.user.id, message: "[견적 선정] 고객님이 회원님의 견적을 선정했습니다. 시공 일정을 협의해 주세요." });
      return { success: true };
    }),
    // 고객: 아무와도 진행 안 함 (종결)
    closeWithoutPartner: protectedProcedure.input(z.object({ quoteId: z.number() })).mutation(async ({ ctx, input }) => {
      const quote = await db.getQuoteById(input.quoteId);
      if (!quote || quote.customerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "권한이 없습니다" });
      const closePid = await db.getSelectedPartnerId(input.quoteId);
      await db.rejectAllSubmissions(input.quoteId);
      await db.updateQuoteStatus(input.quoteId, "cancelled");
      // 선정 파트너가 있던 거래가 취소된 경우 등급 재평가(취소율 반영)
      if (closePid) await db.evaluateAndUpdatePartnerGrade(closePid);
      return { success: true };
    }),
    // 고객: 시공 완료 (매칭/시공중 → 완료) + 선정 파트너에게 알림
    completeWork: protectedProcedure.input(z.object({ quoteId: z.number() })).mutation(async ({ ctx, input }) => {
      const quote = await db.getQuoteById(input.quoteId);
      if (!quote || quote.customerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "권한이 없습니다" });
      if (quote.status !== "matched" && quote.status !== "in_progress") throw new TRPCError({ code: "BAD_REQUEST", message: "파트너 선정 후 시공 완료 처리할 수 있습니다" });
      await db.updateQuoteStatus(input.quoteId, "completed");
      // 선정 파트너 등급 자동 재평가 (완료 건수 반영)
      const completedPid = (await db.getSelectedPartnerId(input.quoteId)) ?? quote.designatedPartnerId ?? null;
      if (completedPid) await db.evaluateAndUpdatePartnerGrade(completedPid);
      // 파트너 알림은 리뷰 등록 시 [리뷰 등록] 메시지로 통합 발송됨 (별도 시공완료 메시지 없음)
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
            // 이미 가입된 사업자번호인지 확인
            const dup = await db.getPartnerByBusinessNumber(bno);
            if (dup) {
              return { ok: false, status: "duplicate", message: "이미 가입된 사업자번호입니다." };
            }
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
      // 사업자번호 중복 확인
      if (input.businessNumber) {
        const bnoDigits = input.businessNumber.replace(/\D/g, "");
        if (bnoDigits.length === 10 && await db.getPartnerByBusinessNumber(bnoDigits)) {
          throw new TRPCError({ code: "CONFLICT", message: "이미 가입된 사업자번호입니다" });
        }
      }
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
      try {
        const id = await db.createPartner({ ...input, userId: ctx.user.id, latitude, longitude });
        await db.updateUserRole(ctx.user.id, "partner");
        return { id };
      } catch (e: any) {
        console.error("[파트너등록] 저장 실패:", e?.code, e?.sqlMessage || e?.message);
        // 첨부 컬럼 용량(LONGTEXT) 미적용 등 데이터 길이 초과
        if (e?.code === "ER_DATA_TOO_LONG" || /too long/i.test(e?.sqlMessage || e?.message || "")) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "첨부 파일 저장 용량 설정이 필요합니다. 관리자에게 문의해 주세요. (DB 컬럼 확장 스크립트 미실행)" });
        }
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "가입 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." });
      }
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
    // 견적 열람 (토큰/포인트 차감)
    viewQuote: partnerProcedure.input(z.object({ quoteId: z.number() })).mutation(async ({ ctx, input }) => {
      if (!ctx.partner) throw new TRPCError({ code: "NOT_FOUND" });
      const partner = ctx.partner;

      // 이미 열람한 견적인지 먼저 확인 (재열람은 무료)
      const already = await db.hasViewedQuote(input.quoteId, partner.id);
      if (already) {
        return { alreadyViewed: true };
      }

      // 월 구독자는 무제한 열람
      const hasSubscription = partner.subscriptionType === "monthly_view" && partner.subscriptionExpiry && new Date(partner.subscriptionExpiry) > new Date();
      if (hasSubscription) {
        await db.recordQuoteView(input.quoteId, partner.id);
        return { alreadyViewed: false };
      }

      // 견적 종류에 따라 가격 결정 (지정/공개)
      const quote = await db.getQuoteById(input.quoteId);
      if (!quote) throw new TRPCError({ code: "NOT_FOUND", message: "견적을 찾을 수 없습니다" });
      const settings = await db.getWalletSettings();
      const viewType = quote.type === "designated" ? "designated" : "public";
      const cost = viewType === "designated" ? settings.designatedViewPrice : settings.publicViewPrice;

      // 토큰/포인트 차감 (포인트 먼저 → 토큰)
      const deduct = await db.deductForView(partner.id, cost, input.quoteId, viewType);
      if (!deduct.ok) {
        if (deduct.reason === "insufficient") {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: `잔액이 부족합니다. (필요: ${cost.toLocaleString()}, 보유: ${(deduct.have ?? 0).toLocaleString()}) 토큰을 충전해주세요.`,
          });
        }
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "열람 처리 중 오류가 발생했습니다" });
      }

      await db.recordQuoteView(input.quoteId, partner.id);
      return { alreadyViewed: false };
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
      // 고객에게 견적 도착 알림 (파트너 → 고객)
      const amountText = input.amount && input.amount.trim() ? ` 견적 금액: ${input.amount.trim()}.` : "";
      await db.sendChatMessage({
        quoteId: input.quoteId,
        partnerId: ctx.partner.id,
        senderRole: "partner",
        senderId: ctx.partner.userId,
        message: `[견적 도착] ${ctx.partner.companyName} 업체가 견적을 보냈습니다.${amountText} 받은 견적에서 확인해 주세요.`,
      });
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
      if (product.type === "subscription" && product.durationDays) {
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
      // 승인 전 현재 상태 확인 (이미 approved면 보너스 중복 방지)
      const before = await db.getPartnerById(input.id);
      await db.updatePartnerStatus(input.id, input.status);
      // 새로 승인된 경우에만 신규가입 보너스 자동 적용
      let bonus = null;
      if (input.status === "approved" && before?.status !== "approved") {
        bonus = await db.applySignupBonusIfEligible(input.id);
      }
      return { success: true, bonus };
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
      const { completed: completedCount } = await db.getPartnerJobStats(ctx.partner.id);
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

  // ===================== CHAT (채팅) =====================
  chat: router({
    // 메시지 전송
    send: protectedProcedure
      .input(z.object({ quoteId: z.number(), partnerId: z.number(), message: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const quote = await db.getQuoteById(input.quoteId);
        if (!quote) throw new TRPCError({ code: "NOT_FOUND", message: "견적을 찾을 수 없습니다" });

        // 발신자 역할 판별 + 권한 체크
        let senderRole: "customer" | "partner";
        let senderId: number;
        const myPartner = await db.getPartnerByUserId(ctx.user.id);

        if (quote.customerId === ctx.user.id) {
          // 고객 (본인 의뢰)
          senderRole = "customer";
          senderId = ctx.user.id;
        } else if (myPartner && myPartner.id === input.partnerId) {
          // 파트너 (본인 방)
          senderRole = "partner";
          senderId = myPartner.id;
        } else {
          throw new TRPCError({ code: "FORBIDDEN", message: "채팅 권한이 없습니다" });
        }

        // 파트너 선정 후에는 선정된 파트너와만 채팅 유지
        const selectedPartnerId = await db.getSelectedPartnerId(input.quoteId);
        if (selectedPartnerId && input.partnerId !== selectedPartnerId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "선정된 파트너와만 채팅할 수 있습니다" });
        }

        await db.sendChatMessage({ quoteId: input.quoteId, partnerId: input.partnerId, senderRole, senderId, message: input.message });
        return { success: true };
      }),

    // 특정 채팅방 메시지 목록
    messages: protectedProcedure
      .input(z.object({ quoteId: z.number(), partnerId: z.number() }))
      .query(async ({ ctx, input }) => {
        const quote = await db.getQuoteById(input.quoteId);
        if (!quote) return [];
        const myPartner = await db.getPartnerByUserId(ctx.user.id);
        // 권한: 본인 의뢰 고객이거나, 본인 방 파트너
        const allowed = quote.customerId === ctx.user.id || (myPartner && myPartner.id === input.partnerId);
        if (!allowed) throw new TRPCError({ code: "FORBIDDEN" });
        return db.getChatMessages(input.quoteId, input.partnerId);
      }),

    // 고객용: 한 의뢰의 채팅방 목록 (견적 보낸 파트너들)
    roomsByQuote: protectedProcedure
      .input(z.object({ quoteId: z.number() }))
      .query(async ({ ctx, input }) => {
        const quote = await db.getQuoteById(input.quoteId);
        if (!quote || quote.customerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        return db.getChatRoomsByQuote(input.quoteId);
      }),

    // 파트너용: 내가 참여한 채팅방 목록
    roomsByPartner: partnerProcedure.query(async ({ ctx }) => {
      if (!ctx.partner) return [];
      return db.getChatRoomsByPartner(ctx.partner.id);
    }),

    // 읽음 처리 (채팅방 열 때)
    markRead: protectedProcedure
      .input(z.object({ quoteId: z.number(), partnerId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const quote = await db.getQuoteById(input.quoteId);
        if (!quote) return { success: false };
        const myPartner = await db.getPartnerByUserId(ctx.user.id);
        let readerRole: "customer" | "partner";
        if (quote.customerId === ctx.user.id) readerRole = "customer";
        else if (myPartner && myPartner.id === input.partnerId) readerRole = "partner";
        else throw new TRPCError({ code: "FORBIDDEN" });
        await db.markChatRead(input.quoteId, input.partnerId, readerRole);
        return { success: true };
      }),
  }),

  // ===================== REVIEWS =====================
  reviews: router({
    create: protectedProcedure.input(z.object({ quoteId: z.number(), partnerId: z.number(), rating: z.number().min(1).max(5), content: z.string().optional() })).mutation(async ({ ctx, input }) => {
      const quote = await db.getQuoteById(input.quoteId);
      if (!quote || quote.customerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "권한이 없습니다" });
      if (quote.status !== "completed") throw new TRPCError({ code: "BAD_REQUEST", message: "시공 완료 후 리뷰를 작성할 수 있습니다" });
      const selectedPartnerId = await db.getSelectedPartnerId(input.quoteId);
      if (selectedPartnerId !== input.partnerId) throw new TRPCError({ code: "BAD_REQUEST", message: "선정한 파트너에게만 리뷰를 남길 수 있습니다" });
      const existing = await db.getReviewByQuote(input.quoteId, ctx.user.id);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "이미 리뷰를 작성했습니다" });
      const id = await db.createReview({ ...input, customerId: ctx.user.id });
      // 파트너에게 시공완료+별점+후기 통합 알림
      const stars = "★".repeat(input.rating) + "☆".repeat(5 - input.rating);
      const reviewMsg = `[리뷰 등록] 고객님이 시공 완료 처리했습니다.\n별점: ${stars} (${input.rating}/5)`
        + (input.content && input.content.trim() ? `\n"${input.content.trim()}"` : "");
      await db.sendChatMessage({ quoteId: input.quoteId, partnerId: input.partnerId, senderRole: "customer", senderId: ctx.user.id, message: reviewMsg });
      // Auto-evaluate partner grade after new review
      const gradeResult = await db.evaluateAndUpdatePartnerGrade(input.partnerId);
      return { id, gradeChanged: gradeResult.changed, newGrade: gradeResult.newGrade };
    }),
    // 이 견적에 내가 남긴 리뷰 (있으면 반환)
    myReviewForQuote: protectedProcedure.input(z.object({ quoteId: z.number() })).query(async ({ ctx, input }) => db.getReviewByQuote(input.quoteId, ctx.user.id)),
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

    // ===== 일괄 포인트 지급 =====
    bulkGrantPoint: adminProcedure
      .input(z.object({
        partnerIds: z.array(z.number()).min(1),
        amount: z.number().min(1),
        validDays: z.number().min(1),
        reason: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const count = await db.bulkGrantPoint(input.partnerIds, input.amount, input.validDays, input.reason || "일괄 지급");
        return { success: true, count };
      }),

    // ===== 신규가입 보너스 캠페인 =====
    signupCampaigns: adminProcedure.query(async () => db.getSignupBonusCampaigns()),
    createSignupCampaign: adminProcedure
      .input(z.object({
        name: z.string(),
        bonusAmount: z.number().min(1),
        validDays: z.number().min(1),
        startsAt: z.string(),  // ISO 날짜 문자열
        endsAt: z.string(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createSignupBonusCampaign({
          name: input.name,
          bonusAmount: input.bonusAmount,
          validDays: input.validDays,
          startsAt: new Date(input.startsAt),
          endsAt: new Date(input.endsAt),
        });
        return { success: true, id };
      }),
    toggleSignupCampaign: adminProcedure
      .input(z.object({ id: z.number(), isActive: z.boolean() }))
      .mutation(async ({ input }) => {
        await db.toggleSignupBonusCampaign(input.id, input.isActive);
        return { success: true };
      }),
    deleteSignupCampaign: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteSignupBonusCampaign(input.id);
        return { success: true };
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
