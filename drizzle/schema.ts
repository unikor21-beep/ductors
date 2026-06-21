import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json, decimal, bigint } from "drizzle-orm/mysql-core";

// ============================================================
// 1. USERS (확장)
// ============================================================
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  username: varchar("username", { length: 50 }).unique(),
  passwordHash: text("passwordHash"),
  securityQuestion: varchar("securityQuestion", { length: 200 }),
  securityAnswerHash: text("securityAnswerHash"),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "partner"]).default("user").notNull(),
  profileImage: text("profileImage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  deletedAt: timestamp("deletedAt"),
  deactivatedReason: varchar("deactivatedReason", { length: 500 }),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================================
// 2. PARTNERS (파트너스 업체 정보)
// ============================================================
export const partners = mysqlTable("partners", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  companyName: varchar("companyName", { length: 200 }).notNull(),
  businessNumber: varchar("businessNumber", { length: 20 }),
  representativeName: varchar("representativeName", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  logoUrl: text("logoUrl"),
  shortIntro: varchar("shortIntro", { length: 500 }),
  description: text("description"),
  regions: json("regions").$type<string[]>(),
  specialties: json("specialties").$type<string[]>(),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "suspended"]).default("pending").notNull(),
  avgRating: decimal("avgRating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: int("reviewCount").default(0),
  grade: mysqlEnum("grade", ["bronze", "silver", "gold", "platinum"]).default("bronze"),
  responseRate: int("responseRate").default(0),
  viewCredits: int("viewCredits").default(0),
  tokenBalance: int("tokenBalance").default(0).notNull(),
  pointBalance: int("pointBalance").default(0).notNull(),
  subscriptionType: mysqlEnum("subscriptionType", ["none", "monthly_view", "monthly_design"]).default("none"),
  subscriptionExpiry: timestamp("subscriptionExpiry"),
  designCredits: int("designCredits").default(0),
  businessLicenseUrl: text("businessLicenseUrl"),
  address: text("address"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Partner = typeof partners.$inferSelect;
export type InsertPartner = typeof partners.$inferInsert;

// ============================================================
// 3. CATEGORIES (카테고리 - 관리자 커스터마이징)
// ============================================================
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  parentId: int("parentId"),
  name: varchar("name", { length: 200 }).notNull(),
  icon: varchar("icon", { length: 100 }),
  description: text("description"),
  sortOrder: int("sortOrder").default(0),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Category = typeof categories.$inferSelect;

// ============================================================
// 4. CATEGORY FORM FIELDS (카테고리별 질문 항목)
// ============================================================
export const categoryFields = mysqlTable("categoryFields", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("categoryId").notNull(),
  label: varchar("label", { length: 300 }).notNull(),
  fieldType: mysqlEnum("fieldType", ["text", "number", "select", "multiselect", "image", "file"]).notNull(),
  options: json("options").$type<string[]>(),
  isRequired: boolean("isRequired").default(false),
  sortOrder: int("sortOrder").default(0),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CategoryField = typeof categoryFields.$inferSelect;

// ============================================================
// 5. QUOTES (견적 요청)
// ============================================================
export const quotes = mysqlTable("quotes", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  categoryId: int("categoryId"),
  type: mysqlEnum("type", ["public", "designated"]).default("public").notNull(),
  designatedPartnerId: int("designatedPartnerId"),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  region: varchar("region", { length: 200 }),
  address: text("address"),
  formData: json("formData").$type<Record<string, unknown>>(),
  attachments: json("attachments").$type<string[]>(),
  status: mysqlEnum("status", [
    "registered", "pending", "viewed", "quoted", "reviewing", "matched", "in_progress", "completed", "cancelled"
  ]).default("registered").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = typeof quotes.$inferInsert;

// ============================================================
// 6. QUOTE VIEWS (견적 열람 기록)
// ============================================================
export const quoteViews = mysqlTable("quoteViews", {
  id: int("id").autoincrement().primaryKey(),
  quoteId: int("quoteId").notNull(),
  partnerId: int("partnerId").notNull(),
  creditUsed: int("creditUsed").default(1),
  viewedAt: timestamp("viewedAt").defaultNow().notNull(),
});

export type QuoteView = typeof quoteViews.$inferSelect;

// ============================================================
// 7. QUOTE SUBMISSIONS (파트너 견적 제출)
// ============================================================
export const quoteSubmissions = mysqlTable("quoteSubmissions", {
  id: int("id").autoincrement().primaryKey(),
  quoteId: int("quoteId").notNull(),
  partnerId: int("partnerId").notNull(),
  amount: decimal("amount", { precision: 12, scale: 0 }),
  description: text("description"),
  estimatedDays: int("estimatedDays"),
  attachments: json("attachments").$type<string[]>(),
  status: mysqlEnum("status", ["submitted", "selected", "rejected"]).default("submitted").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type QuoteSubmission = typeof quoteSubmissions.$inferSelect;

// ============================================================
// 8. REVIEWS (리뷰)
// ============================================================
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  quoteId: int("quoteId").notNull(),
  customerId: int("customerId").notNull(),
  partnerId: int("partnerId").notNull(),
  rating: int("rating").notNull(),
  content: text("content"),
  isVisible: boolean("isVisible").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;

// ============================================================
// 9. PORTFOLIOS (포트폴리오)
// ============================================================
export const portfolios = mysqlTable("portfolios", {
  id: int("id").autoincrement().primaryKey(),
  partnerId: int("partnerId").notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  description: text("description"),
  images: json("images").$type<string[]>(),
  categoryId: int("categoryId"),
  region: varchar("region", { length: 200 }),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Portfolio = typeof portfolios.$inferSelect;

// ============================================================
// 10. PRODUCTS (상품 - 열람권, 구독권, 설계지원)
// ============================================================
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  type: mysqlEnum("type", ["view_credit", "subscription", "design_support"]).notNull(),
  price: decimal("price", { precision: 10, scale: 0 }).notNull(),
  creditAmount: int("creditAmount"),
  durationDays: int("durationDays"),
  description: text("description"),
  isActive: boolean("isActive").default(true),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Product = typeof products.$inferSelect;

// ============================================================
// 11. ORDERS (주문/결제)
// ============================================================
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  partnerId: int("partnerId").notNull(),
  productId: int("productId").notNull(),
  amount: decimal("amount", { precision: 10, scale: 0 }).notNull(),
  status: mysqlEnum("status", ["pending", "completed", "cancelled", "refunded"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Order = typeof orders.$inferSelect;

// ============================================================
// 12. SITE SETTINGS (사이트 설정 - 메인 배경 등)
// ============================================================
export const siteSettings = mysqlTable("siteSettings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("settingKey", { length: 100 }).notNull().unique(),
  settingValue: text("settingValue"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SiteSetting = typeof siteSettings.$inferSelect;

// ============================================================
// 13. PROJECT MANAGEMENT (파트너 현장 관리)
// ============================================================
export const projectManagement = mysqlTable("projectManagement", {
  id: int("id").autoincrement().primaryKey(),
  partnerId: int("partnerId").notNull(),
  quoteId: int("quoteId").notNull(),
  submissionId: int("submissionId"),
  location: text("location"),
  scheduledDate: timestamp("scheduledDate"),
  scheduledTime: varchar("scheduledTime", { length: 50 }),
  status: mysqlEnum("status", ["scheduled", "in_progress", "completed", "cancelled"]).default("scheduled").notNull(),
  memo: text("memo"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProjectManagement = typeof projectManagement.$inferSelect;

// ============================================================
// 1-1. USER CONSENTS (사용자 동의 정보)
// ============================================================
export const userConsents = mysqlTable("userConsents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  termsAgreed: boolean("termsAgreed").default(false).notNull(),
  privacyAgreed: boolean("privacyAgreed").default(false).notNull(),
  marketingAgreed: boolean("marketingAgreed").default(false).notNull(),
  marketingAgreedAt: timestamp("marketingAgreedAt"),
  marketingDisagreedAt: timestamp("marketingDisagreedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserConsent = typeof userConsents.$inferSelect;
export type InsertUserConsent = typeof userConsents.$inferInsert;

// ============================================================
// 12. COUPONS (쿠폰 정의)
// ============================================================
export const coupons = mysqlTable("coupons", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  discountType: mysqlEnum("discountType", ["percentage", "fixed", "free_credit"]).notNull(),
  discountValue: int("discountValue").notNull(),
  minOrderAmount: int("minOrderAmount").default(0),
  maxUses: int("maxUses"),
  usedCount: int("usedCount").default(0),
  targetType: mysqlEnum("targetType", ["all", "marketing_agreed", "new_user", "partner"]).default("all").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = typeof coupons.$inferInsert;

// ============================================================
// 12-1. USER COUPONS (사용자별 쿠폰 발급/사용 이력)
// ============================================================
export const userCoupons = mysqlTable("userCoupons", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  couponId: int("couponId").notNull(),
  status: mysqlEnum("status", ["available", "used", "expired"]).default("available").notNull(),
  usedAt: timestamp("usedAt"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserCoupon = typeof userCoupons.$inferSelect;
export type InsertUserCoupon = typeof userCoupons.$inferInsert;

// ============================================================
// 14. WALLET (지갑 - 토큰/포인트 거래내역)
// ============================================================
// 잔액(tokenBalance/pointBalance)은 partners 테이블에 추가됨
// 이 테이블은 모든 충전/차감/지급/만료 내역을 기록
export const walletTransactions = mysqlTable("walletTransactions", {
  id: int("id").autoincrement().primaryKey(),
  partnerId: int("partnerId").notNull(),
  // token=유료충전 사이버머니, point=프로모션 지급 사이버머니
  currency: mysqlEnum("currency", ["token", "point"]).notNull(),
  // charge=충전/지급(+), deduct=열람차감(-), expire=포인트만료(-), refund=환불
  type: mysqlEnum("type", ["charge", "deduct", "expire", "refund"]).notNull(),
  amount: int("amount").notNull(),          // 변동 금액 (양수)
  balanceAfter: int("balanceAfter").notNull(), // 거래 후 잔액
  description: varchar("description", { length: 300 }), // "지정 견적 열람", "프로모션 지급" 등
  relatedQuoteId: int("relatedQuoteId"),    // 열람 차감 시 관련 견적
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type InsertWalletTransaction = typeof walletTransactions.$inferInsert;

// ============================================================
// 14-1. POINT BATCHES (포인트 배치 - 유효기간 관리)
// ============================================================
// 포인트는 지급 건마다 유효기간이 다름 → 배치 단위로 관리
// 차감 시 먼저 만료되는 배치부터 차감 (FIFO)
export const pointBatches = mysqlTable("pointBatches", {
  id: int("id").autoincrement().primaryKey(),
  partnerId: int("partnerId").notNull(),
  amount: int("amount").notNull(),          // 지급된 포인트 양
  remaining: int("remaining").notNull(),    // 남은 포인트 양
  reason: varchar("reason", { length: 300 }), // 지급 사유 (프로모션명 등)
  expiresAt: timestamp("expiresAt").notNull(), // 만료 일시
  isExpired: boolean("isExpired").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PointBatch = typeof pointBatches.$inferSelect;
export type InsertPointBatch = typeof pointBatches.$inferInsert;

// ============================================================
// 14-2. WALLET SETTINGS (지갑 가격 설정 - 관리자)
// ============================================================
// 관리자가 설정하는 열람 가격, 구독료 등 (key-value)
// designatedViewPrice=지정열람가, publicViewPrice=공개열람가, monthlySubscription=월구독료
export const walletSettings = mysqlTable("walletSettings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("settingKey", { length: 100 }).notNull().unique(),
  settingValue: int("settingValue").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WalletSetting = typeof walletSettings.$inferSelect;

// ============================================================
// 14-3. SIGNUP BONUS CAMPAIGNS (신규가입 자동 보너스 캠페인)
// ============================================================
// 관리자가 기간을 설정해두면, 그 기간 내 승인된 신규 파트너에게 자동으로 포인트 지급
export const signupBonusCampaigns = mysqlTable("signupBonusCampaigns", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),  // 캠페인명 (예: "6월 신규파트너 환영")
  bonusAmount: int("bonusAmount").notNull(),          // 지급 포인트
  validDays: int("validDays").notNull(),              // 포인트 유효기간 (일)
  startsAt: timestamp("startsAt").notNull(),          // 캠페인 시작
  endsAt: timestamp("endsAt").notNull(),              // 캠페인 종료
  isActive: boolean("isActive").default(true).notNull(),
  grantedCount: int("grantedCount").default(0).notNull(), // 지급된 건수
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SignupBonusCampaign = typeof signupBonusCampaigns.$inferSelect;
export type InsertSignupBonusCampaign = typeof signupBonusCampaigns.$inferInsert;
