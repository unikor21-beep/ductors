import { eq, desc, asc, and, sql, like, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users, partners, categories, categoryFields,
  quotes, quoteViews, quoteSubmissions, reviews, portfolios,
  products, orders, siteSettings, projectManagement
} from "../drizzle/schema";
import type {
  Partner, InsertPartner, Category, CategoryField,
  Quote, InsertQuote, QuoteView, QuoteSubmission,
  Review, Portfolio, Product, Order, SiteSetting, ProjectManagement
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (e) { console.warn("[DB] Failed:", e); _db = null; }
  }
  return _db;
}

// ===================== USERS =====================
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod", "phone", "profileImage"] as const;
  textFields.forEach((f) => { const v = user[f]; if (v !== undefined) { (values as any)[f] = v ?? null; updateSet[f] = v ?? null; } });
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; } else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const r = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return r[0];
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserRole(userId: number, role: "user" | "admin" | "partner") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

// ===================== PARTNERS =====================
export async function createPartner(data: Omit<InsertPartner, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(partners).values(data as any).$returningId();
  return result.id;
}

export async function getPartnerByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const r = await db.select().from(partners).where(eq(partners.userId, userId)).limit(1);
  return r[0] || null;
}

export async function getPartnerById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const r = await db.select().from(partners).where(eq(partners.id, id)).limit(1);
  return r[0] || null;
}

export async function getApprovedPartners(region?: string) {
  const db = await getDb();
  if (!db) return [];
  let q = db.select().from(partners).where(eq(partners.status, "approved")).orderBy(desc(partners.avgRating));
  return q;
}

export async function getAllPartners() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(partners).orderBy(desc(partners.createdAt));
}

export async function updatePartner(id: number, data: Partial<InsertPartner>) {
  const db = await getDb();
  if (!db) return;
  await db.update(partners).set(data as any).where(eq(partners.id, id));
}

export async function updatePartnerStatus(id: number, status: "pending" | "approved" | "rejected" | "suspended") {
  const db = await getDb();
  if (!db) return;
  await db.update(partners).set({ status }).where(eq(partners.id, id));
}

export async function updatePartnerCredits(id: number, credits: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(partners).set({ viewCredits: credits }).where(eq(partners.id, id));
}

// ===================== CATEGORIES =====================
export async function getActiveCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.sortOrder));
}

export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).orderBy(asc(categories.sortOrder));
}

export async function createCategory(data: { name: string; icon?: string; description?: string; sortOrder?: number }) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(categories).values(data as any).$returningId();
  return result.id;
}

export async function updateCategory(id: number, data: Partial<Category>) {
  const db = await getDb();
  if (!db) return;
  await db.update(categories).set(data as any).where(eq(categories.id, id));
}

export async function deleteCategory(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(categories).set({ isActive: false }).where(eq(categories.id, id));
}

// ===================== CATEGORY FIELDS =====================
export async function getFieldsByCategory(categoryId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categoryFields).where(and(eq(categoryFields.categoryId, categoryId), eq(categoryFields.isActive, true))).orderBy(asc(categoryFields.sortOrder));
}

export async function createCategoryField(data: any) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(categoryFields).values(data).$returningId();
  return result.id;
}

export async function updateCategoryField(id: number, data: any) {
  const db = await getDb();
  if (!db) return;
  await db.update(categoryFields).set(data).where(eq(categoryFields.id, id));
}

export async function deleteCategoryField(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(categoryFields).set({ isActive: false }).where(eq(categoryFields.id, id));
}

// ===================== QUOTES =====================
export async function createQuote(data: Omit<InsertQuote, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(quotes).values(data as any).$returningId();
  return result.id;
}

export async function getQuoteById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const r = await db.select().from(quotes).where(eq(quotes.id, id)).limit(1);
  return r[0] || null;
}

export async function getQuotesByCustomer(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(quotes).where(eq(quotes.customerId, customerId)).orderBy(desc(quotes.createdAt));
}

export async function getPublicQuotes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(quotes).where(eq(quotes.type, "public")).orderBy(desc(quotes.createdAt));
}

export async function getDesignatedQuotes(partnerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(quotes).where(and(eq(quotes.type, "designated"), eq(quotes.designatedPartnerId, partnerId))).orderBy(desc(quotes.createdAt));
}

export async function getAllQuotes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(quotes).orderBy(desc(quotes.createdAt));
}

export async function updateQuoteStatus(id: number, status: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(quotes).set({ status: status as any }).where(eq(quotes.id, id));
}

// ===================== QUOTE VIEWS =====================
export async function recordQuoteView(quoteId: number, partnerId: number) {
  const db = await getDb();
  if (!db) return null;
  const existing = await db.select().from(quoteViews).where(and(eq(quoteViews.quoteId, quoteId), eq(quoteViews.partnerId, partnerId))).limit(1);
  if (existing.length > 0) return { alreadyViewed: true, id: existing[0].id };
  const [result] = await db.insert(quoteViews).values({ quoteId, partnerId }).$returningId();
  return { alreadyViewed: false, id: result.id };
}

export async function getQuoteViewsByPartner(partnerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(quoteViews).where(eq(quoteViews.partnerId, partnerId)).orderBy(desc(quoteViews.viewedAt));
}

// ===================== QUOTE SUBMISSIONS =====================
export async function createQuoteSubmission(data: { quoteId: number; partnerId: number; amount?: string; description?: string; estimatedDays?: number; attachments?: string[] }) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(quoteSubmissions).values(data as any).$returningId();
  return result.id;
}

export async function getSubmissionsByQuote(quoteId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(quoteSubmissions).where(eq(quoteSubmissions.quoteId, quoteId)).orderBy(desc(quoteSubmissions.createdAt));
}

export async function getSubmissionsByPartner(partnerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(quoteSubmissions).where(eq(quoteSubmissions.partnerId, partnerId)).orderBy(desc(quoteSubmissions.createdAt));
}

export async function updateSubmissionStatus(id: number, status: "submitted" | "selected" | "rejected") {
  const db = await getDb();
  if (!db) return;
  await db.update(quoteSubmissions).set({ status }).where(eq(quoteSubmissions.id, id));
}

// ===================== REVIEWS =====================
export async function createReview(data: { quoteId: number; customerId: number; partnerId: number; rating: number; content?: string }) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(reviews).values(data as any).$returningId();
  // Update partner avg rating
  const allReviews = await db.select().from(reviews).where(eq(reviews.partnerId, data.partnerId));
  const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
  await db.update(partners).set({ avgRating: avg.toFixed(2), reviewCount: allReviews.length }).where(eq(partners.id, data.partnerId));
  return result.id;
}

export async function getReviewsByPartner(partnerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reviews).where(and(eq(reviews.partnerId, partnerId), eq(reviews.isVisible, true))).orderBy(desc(reviews.createdAt));
}

export async function getAllReviews() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reviews).orderBy(desc(reviews.createdAt));
}

export async function toggleReviewVisibility(id: number, isVisible: boolean) {
  const db = await getDb();
  if (!db) return;
  await db.update(reviews).set({ isVisible }).where(eq(reviews.id, id));
}

// ===================== PORTFOLIOS =====================
export async function createPortfolio(data: { partnerId: number; title: string; description?: string; images?: string[]; categoryId?: number; region?: string }) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(portfolios).values(data as any).$returningId();
  return result.id;
}

export async function getPortfoliosByPartner(partnerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(portfolios).where(eq(portfolios.partnerId, partnerId)).orderBy(desc(portfolios.createdAt));
}

export async function getApprovedPortfoliosByPartner(partnerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(portfolios).where(and(eq(portfolios.partnerId, partnerId), eq(portfolios.status, "approved"))).orderBy(desc(portfolios.createdAt));
}

export async function getAllPortfolios() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(portfolios).orderBy(desc(portfolios.createdAt));
}

export async function updatePortfolioStatus(id: number, status: "pending" | "approved" | "rejected") {
  const db = await getDb();
  if (!db) return;
  await db.update(portfolios).set({ status }).where(eq(portfolios.id, id));
}

// ===================== PRODUCTS =====================
export async function getActiveProducts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(eq(products.isActive, true)).orderBy(asc(products.sortOrder));
}

export async function getAllProducts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).orderBy(asc(products.sortOrder));
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const r = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return r[0] || null;
}

export async function updateProduct(id: number, data: Partial<Product>) {
  const db = await getDb();
  if (!db) return;
  await db.update(products).set(data as any).where(eq(products.id, id));
}

// ===================== ORDERS =====================
export async function createOrder(data: { partnerId: number; productId: number; amount: string }) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(orders).values({ ...data, status: "completed" } as any).$returningId();
  return result.id;
}

export async function getOrdersByPartner(partnerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).where(eq(orders.partnerId, partnerId)).orderBy(desc(orders.createdAt));
}

export async function getAllOrders() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).orderBy(desc(orders.createdAt));
}

// ===================== SITE SETTINGS =====================
export async function getSetting(key: string) {
  const db = await getDb();
  if (!db) return null;
  const r = await db.select().from(siteSettings).where(eq(siteSettings.settingKey, key)).limit(1);
  return r[0]?.settingValue || null;
}

export async function setSetting(key: string, value: string) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(siteSettings).where(eq(siteSettings.settingKey, key)).limit(1);
  if (existing.length > 0) {
    await db.update(siteSettings).set({ settingValue: value }).where(eq(siteSettings.settingKey, key));
  } else {
    await db.insert(siteSettings).values({ settingKey: key, settingValue: value });
  }
}

export async function getAllSettings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(siteSettings);
}

// ===================== PROJECT MANAGEMENT =====================
export async function createProject(data: { partnerId: number; quoteId: number; submissionId?: number; location?: string; scheduledDate?: Date; scheduledTime?: string; memo?: string }) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(projectManagement).values(data as any).$returningId();
  return result.id;
}

export async function getProjectsByPartner(partnerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projectManagement).where(eq(projectManagement.partnerId, partnerId)).orderBy(desc(projectManagement.createdAt));
}

export async function updateProject(id: number, data: Partial<ProjectManagement>) {
  const db = await getDb();
  if (!db) return;
  await db.update(projectManagement).set(data as any).where(eq(projectManagement.id, id));
}

// ===================== STATS (Admin) =====================
export async function getStats() {
  const db = await getDb();
  if (!db) return { users: 0, partners: 0, quotes: 0, orders: 0, reviews: 0 };
  const [u] = await db.select({ count: sql<number>`count(*)` }).from(users);
  const [p] = await db.select({ count: sql<number>`count(*)` }).from(partners);
  const [q] = await db.select({ count: sql<number>`count(*)` }).from(quotes);
  const [o] = await db.select({ count: sql<number>`count(*)` }).from(orders);
  const [r] = await db.select({ count: sql<number>`count(*)` }).from(reviews);
  const [v] = await db.select({ count: sql<number>`count(*)` }).from(quoteViews);
  return { users: u.count, partners: p.count, quotes: q.count, orders: o.count, reviews: r.count, views: v.count };
}

// ===================== PARTNER GRADE =====================
export async function updatePartnerGrade(id: number, grade: "bronze" | "silver" | "gold" | "platinum") {
  const db = await getDb();
  if (!db) return;
  await db.update(partners).set({ grade }).where(eq(partners.id, id));
}

// ===================== AUTO GRADE EVALUATION =====================

/** 등급 기준 테이블
 * | 등급       | 시공완료 건수 | 평균 평점 |
 * |-----------|------------|---------|
 * | 브론즈     | 0+         | 0+      |
 * | 실버       | 3+         | 3.5+    |
 * | 골드       | 10+        | 4.0+    |
 * | 플래티넘   | 30+        | 4.5+    |
 */

export const GRADE_RULES = [
  { grade: "platinum" as const, minCompleted: 30, minRating: 4.5 },
  { grade: "gold" as const, minCompleted: 10, minRating: 4.0 },
  { grade: "silver" as const, minCompleted: 3, minRating: 3.5 },
  { grade: "bronze" as const, minCompleted: 0, minRating: 0 },
];

export async function getCompletedProjectCount(partnerId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const [result] = await db.select({ count: sql<number>`count(*)` }).from(projectManagement)
    .where(and(eq(projectManagement.partnerId, partnerId), eq(projectManagement.status, "completed")));
  return result?.count || 0;
}

export function calculateGrade(completedCount: number, avgRating: number): "bronze" | "silver" | "gold" | "platinum" {
  for (const rule of GRADE_RULES) {
    if (completedCount >= rule.minCompleted && avgRating >= rule.minRating) {
      return rule.grade;
    }
  }
  return "bronze";
}

export async function evaluateAndUpdatePartnerGrade(partnerId: number): Promise<{ oldGrade: string; newGrade: string; changed: boolean }> {
  const db = await getDb();
  if (!db) return { oldGrade: "bronze", newGrade: "bronze", changed: false };

  const partner = await getPartnerById(partnerId);
  if (!partner) return { oldGrade: "bronze", newGrade: "bronze", changed: false };

  const completedCount = await getCompletedProjectCount(partnerId);
  const avgRating = parseFloat(String(partner.avgRating || "0"));
  const oldGrade = partner.grade || "bronze";
  const newGrade = calculateGrade(completedCount, avgRating);

  if (newGrade !== oldGrade) {
    await updatePartnerGrade(partnerId, newGrade);
    return { oldGrade, newGrade, changed: true };
  }

  return { oldGrade, newGrade, changed: false };
}
