import { eq, ne, desc, asc, and, or, sql, like, inArray, isNull, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users, partners, categories, categoryFields,
  quotes, quoteViews, quoteSubmissions, reviews, portfolios, chatMessages,
  products, orders, siteSettings, projectManagement,
  userConsents, coupons, userCoupons,
  walletTransactions, pointBatches, walletSettings, signupBonusCampaigns, mainBanners
} from "../drizzle/schema";
import type {
  Partner, InsertPartner, Category, CategoryField,
  Quote, InsertQuote, QuoteView, QuoteSubmission,
  Review, Portfolio, Product, Order, SiteSetting, ProjectManagement,
  UserConsent, InsertUserConsent, Coupon, InsertCoupon, UserCoupon, InsertUserCoupon,
  MainBanner, InsertMainBanner
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

// 아이디(username)로 조회 - 자체 로그인용
export async function getUserByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;
  const r = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return r[0];
}

// 이메일 중복 확인 — 대소문자 무시, 탈퇴(deletedAt) 계정 제외
export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const r = await db.select({ id: users.id }).from(users)
    .where(and(
      sql`LOWER(${users.email}) = ${email.trim().toLowerCase()}`,
      isNull(users.deletedAt),
    )).limit(1);
  return r[0];
}

// 휴대전화 중복 확인 — 하이픈/공백 무시한 숫자 기준, 탈퇴(deletedAt) 계정 제외
export async function getUserByPhoneDigits(digits: string) {
  const db = await getDb();
  if (!db) return undefined;
  const r = await db.select({ id: users.id }).from(users)
    .where(and(
      sql`REPLACE(REPLACE(${users.phone}, '-', ''), ' ', '') = ${digits}`,
      isNull(users.deletedAt),
    )).limit(1);
  return r[0];
}

// 자체 회원가입 (아이디+비번)
export async function createLocalUser(data: {
  username: string;
  passwordHash: string;
  name: string;
  email: string;
  phone: string;
  landline?: string;
  securityQuestion: string;
  securityAnswerHash: string;
}) {
  const db = await getDb();
  if (!db) return null;
  // openId는 local_ 접두사로 고유 부여
  const openId = `local_${data.username}`;
  await db.insert(users).values({
    openId,
    username: data.username,
    passwordHash: data.passwordHash,
    name: data.name,
    email: data.email,
    phone: data.phone,
    landline: data.landline || null,
    loginMethod: "local",
    securityQuestion: data.securityQuestion,
    securityAnswerHash: data.securityAnswerHash,
    lastSignedIn: new Date(),
  });
  return openId;
}

// 비밀번호 재설정
export async function updateUserPassword(userId: number, passwordHash: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
}

// 고객 프로필 수정 (이름/이메일/전화번호)
export async function updateUserProfile(userId: number, data: { name?: string; email?: string; phone?: string }) {
  const db = await getDb();
  if (!db) return;
  const updates: Record<string, unknown> = {};
  if (data.name !== undefined) updates.name = data.name;
  if (data.email !== undefined) updates.email = data.email;
  if (data.phone !== undefined) updates.phone = data.phone;
  if (Object.keys(updates).length === 0) return;
  await db.update(users).set(updates).where(eq(users.id, userId));
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
  // 정렬: ① 평점 높은순 (단, 리뷰 0건 신규 파트너는 3.0 기본점으로 취급)
  //       ② 평점 같으면 리뷰 많은순
  const sortRating = sql`CASE WHEN ${partners.reviewCount} = 0 OR ${partners.reviewCount} IS NULL THEN 3.0 ELSE ${partners.avgRating} END`;
  return db.select().from(partners)
    .where(eq(partners.status, "approved"))
    .orderBy(desc(sortRating), desc(partners.reviewCount));
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

export async function createCategory(data: { name: string; parentId?: number; icon?: string; description?: string; sortOrder?: number }) {
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
  // 진짜 삭제: 대분류를 지우면 그 아래 소분류도 함께 완전 삭제
  await db.delete(categories).where(eq(categories.parentId, id));
  await db.delete(categories).where(eq(categories.id, id));
}

// 두 카테고리의 순서(sortOrder)를 맞바꾼다
export async function swapCategoryOrder(idA: number, idB: number) {
  const db = await getDb();
  if (!db) return;
  const rows = await db.select().from(categories).where(inArray(categories.id, [idA, idB]));
  const a = rows.find((r) => r.id === idA);
  const b = rows.find((r) => r.id === idB);
  if (!a || !b) return;
  // sortOrder가 같거나 NULL이면 id 기반으로 임시 부여 후 swap
  const orderA = a.sortOrder ?? a.id;
  const orderB = b.sortOrder ?? b.id;
  const tempA = orderA === orderB ? orderA - 1 : orderA;
  await db.update(categories).set({ sortOrder: orderB }).where(eq(categories.id, idA));
  await db.update(categories).set({ sortOrder: tempA }).where(eq(categories.id, idB));
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

// 목록 조회용 컬럼셋 — 거대한 첨부사진(attachments)은 제외해 목록이 무거워/깨지지 않게 함.
// (attachments는 상세조회 getQuoteById/getQuoteWithCustomer 에서만 가져옴)
const quoteListColumns = {
  id: quotes.id,
  customerId: quotes.customerId,
  categoryId: quotes.categoryId,
  type: quotes.type,
  designatedPartnerId: quotes.designatedPartnerId,
  title: quotes.title,
  description: quotes.description,
  region: quotes.region,
  address: quotes.address,
  formData: quotes.formData,
  status: quotes.status,
  createdAt: quotes.createdAt,
  updatedAt: quotes.updatedAt,
};

export async function getQuoteById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const r = await db.select().from(quotes).where(eq(quotes.id, id)).limit(1);
  return r[0] || null;
}

// 견적 + 의뢰자 정보 (파트너가 열람한 견적 상세용)
export async function getQuoteWithCustomer(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [quote] = await db.select().from(quotes).where(eq(quotes.id, id)).limit(1);
  if (!quote) return null;
  const [customer] = await db.select().from(users).where(eq(users.id, quote.customerId)).limit(1);
  return {
    ...quote,
    customer: customer ? { name: customer.name, phone: customer.phone, landline: customer.landline, email: customer.email } : null,
  };
}

export async function getQuotesByCustomer(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select(quoteListColumns).from(quotes).where(eq(quotes.customerId, customerId)).orderBy(desc(quotes.createdAt));
}

// 고객의 진행중 견적 개수 (매칭됨/진행중 = 정산 안 끝난 거래)
export async function countActiveQuotesByCustomer(customerId: number) {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select({ count: sql<number>`count(*)` }).from(quotes)
    .where(and(
      eq(quotes.customerId, customerId),
      inArray(quotes.status, ["matched", "in_progress"])
    ));
  return rows[0]?.count ?? 0;
}

// 회원 탈퇴 처리 (Soft Delete - 데이터 보관, 로그인 차단)
export async function deactivateUser(userId: number, reason?: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users)
    .set({ deletedAt: new Date(), deactivatedReason: reason ?? null })
    .where(eq(users.id, userId));
}

export async function getPublicQuotes() {
  const db = await getDb();
  if (!db) return [];
  return db.select(quoteListColumns).from(quotes).where(eq(quotes.type, "public")).orderBy(desc(quotes.createdAt));
}

// 파트너 맞춤 공개 견적 (지역 + 카테고리 매칭)
// - 지역: 견적 region의 시/도가 파트너 활동지역과 겹치면 매칭 (구 단위 우선, 없으면 시/도)
// - 카테고리: 견적의 대분류가 파트너 전문분야(specialties=대분류ID)에 포함되면 매칭
export async function getMatchedPublicQuotes(partnerId: number) {
  const db = await getDb();
  if (!db) return [];

  const [partner] = await db.select().from(partners).where(eq(partners.id, partnerId));
  if (!partner) return [];

  const partnerRegions = (partner.regions as string[]) || [];
  const partnerSpecialties = (partner.specialties as string[]) || []; // 대분류 카테고리 ID(문자열)

  // 전체 공개 견적
  const allPublic = await db.select(quoteListColumns).from(quotes)
    .where(eq(quotes.type, "public"))
    .orderBy(desc(quotes.createdAt));

  // 카테고리 부모 매핑 (소분류 → 대분류)
  const allCats = await db.select().from(categories);
  const parentOf = (catId: number | null): number | null => {
    if (!catId) return null;
    const cat = allCats.find((c) => c.id === catId);
    if (!cat) return null;
    return cat.parentId ?? cat.id; // 부모 있으면 부모, 없으면 자기 자신(이미 대분류)
  };

  // 파트너가 활동지역/전문분야를 아예 설정 안 했으면 전체 노출 (초기 상태 배려)
  const hasRegionFilter = partnerRegions.length > 0;
  const hasCategoryFilter = partnerSpecialties.length > 0;

  return allPublic.filter((q) => {
    // 1) 지역 매칭
    if (hasRegionFilter && q.region) {
      const quoteSido = q.region.split(" ")[0]; // "서울 광진구" → "서울"
      const regionMatch = partnerRegions.some((pr) => {
        // 구 단위 정확 매칭 OR 시/도 단위 매칭
        return pr === q.region || pr.split(" ")[0] === quoteSido;
      });
      if (!regionMatch) return false;
    }

    // 2) 카테고리 매칭 (견적 대분류가 파트너 전문분야에 포함)
    if (hasCategoryFilter && q.categoryId) {
      const quoteParent = parentOf(q.categoryId);
      const catMatch = partnerSpecialties.some((s) => String(s) === String(quoteParent) || String(s) === String(q.categoryId));
      if (!catMatch) return false;
    }

    return true;
  });
}

export async function getDesignatedQuotes(partnerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select(quoteListColumns).from(quotes).where(and(eq(quotes.type, "designated"), eq(quotes.designatedPartnerId, partnerId))).orderBy(desc(quotes.createdAt));
}

export async function getAllQuotes() {
  const db = await getDb();
  if (!db) return [];
  return db.select(quoteListColumns).from(quotes).orderBy(desc(quotes.createdAt));
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

// 이미 열람했는지 확인 (차감 전 중복 체크용)
export async function hasViewedQuote(quoteId: number, partnerId: number) {
  const db = await getDb();
  if (!db) return false;
  const existing = await db.select().from(quoteViews).where(and(eq(quoteViews.quoteId, quoteId), eq(quoteViews.partnerId, partnerId))).limit(1);
  return existing.length > 0;
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
  const subs = await db.select({
    id: quoteSubmissions.id,
    quoteId: quoteSubmissions.quoteId,
    partnerId: quoteSubmissions.partnerId,
    amount: quoteSubmissions.amount,
    description: quoteSubmissions.description,
    estimatedDays: quoteSubmissions.estimatedDays,
    status: quoteSubmissions.status,
    createdAt: quoteSubmissions.createdAt,
  }).from(quoteSubmissions).where(eq(quoteSubmissions.quoteId, quoteId)).orderBy(desc(quoteSubmissions.createdAt));
  if (subs.length === 0) return [];
  // 파트너 정보
  const partnerIds = subs.map((s) => s.partnerId).filter((v, i, a) => a.indexOf(v) === i);
  const ps = await db.select().from(partners).where(inArray(partners.id, partnerIds));
  const pMap = new Map(ps.map((p) => [p.id, p]));
  // 파트너별 미읽음(파트너→고객) 메시지 수
  const unreadRows = await db.select({
    partnerId: chatMessages.partnerId,
    cnt: sql<number>`count(*)`,
  }).from(chatMessages)
    .where(and(
      eq(chatMessages.quoteId, quoteId),
      eq(chatMessages.senderRole, "partner"),
      eq(chatMessages.isRead, false),
    ))
    .groupBy(chatMessages.partnerId);
  const unreadMap = new Map(unreadRows.map((r) => [r.partnerId, Number(r.cnt)]));
  return subs.map((s) => {
    const p = pMap.get(s.partnerId);
    return {
      ...s,
      partner: p ? { id: p.id, companyName: p.companyName, logoUrl: p.logoUrl, avgRating: p.avgRating, reviewCount: p.reviewCount } : null,
      unreadCount: unreadMap.get(s.partnerId) ?? 0,
    };
  });
}

// 고객 견적 목록 + 제출건수 + 미읽음 채팅수 (마이페이지 카드용)
export async function getQuotesByCustomerWithCounts(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  const list = await db.select(quoteListColumns).from(quotes)
    .where(eq(quotes.customerId, customerId)).orderBy(desc(quotes.createdAt));
  if (list.length === 0) return [];
  const quoteIds = list.map((q) => q.id);
  const subRows = await db.select({ quoteId: quoteSubmissions.quoteId, cnt: sql<number>`count(*)` })
    .from(quoteSubmissions).where(inArray(quoteSubmissions.quoteId, quoteIds))
    .groupBy(quoteSubmissions.quoteId);
  const subMap = new Map(subRows.map((r) => [r.quoteId, Number(r.cnt)]));
  const unreadRows = await db.select({ quoteId: chatMessages.quoteId, cnt: sql<number>`count(*)` })
    .from(chatMessages).where(and(
      inArray(chatMessages.quoteId, quoteIds),
      eq(chatMessages.senderRole, "partner"),
      eq(chatMessages.isRead, false),
    )).groupBy(chatMessages.quoteId);
  const unreadMap = new Map(unreadRows.map((r) => [r.quoteId, Number(r.cnt)]));
  return list.map((q) => ({
    ...q,
    submissionCount: subMap.get(q.id) ?? 0,
    unreadCount: unreadMap.get(q.id) ?? 0,
  }));
}

// 채팅 읽음 처리 — 읽는 사람(readerRole)이 상대가 보낸 메시지를 읽음으로
export async function markChatRead(quoteId: number, partnerId: number, readerRole: "customer" | "partner") {
  const db = await getDb();
  if (!db) return;
  const senderRole = readerRole === "customer" ? "partner" : "customer";
  await db.update(chatMessages).set({ isRead: true }).where(and(
    eq(chatMessages.quoteId, quoteId),
    eq(chatMessages.partnerId, partnerId),
    eq(chatMessages.senderRole, senderRole),
    eq(chatMessages.isRead, false),
  ));
}

// ===================== CHAT (채팅) =====================
// 메시지 전송
export async function sendChatMessage(data: {
  quoteId: number;
  partnerId: number;
  senderRole: "customer" | "partner";
  senderId: number;
  message: string;
}) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(chatMessages).values(data).$returningId();
  return result.id;
}

// 특정 채팅방(의뢰+파트너) 메시지 목록
export async function getChatMessages(quoteId: number, partnerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatMessages)
    .where(and(eq(chatMessages.quoteId, quoteId), eq(chatMessages.partnerId, partnerId)))
    .orderBy(asc(chatMessages.createdAt));
}

// 한 의뢰의 모든 채팅방 목록 (고객용 - 견적 보낸 파트너들)
// 각 방의 마지막 메시지 + 파트너 정보 포함
export async function getChatRoomsByQuote(quoteId: number) {
  const db = await getDb();
  if (!db) return [];
  // 이 의뢰에 메시지를 보낸 파트너 목록
  const msgs = await db.select().from(chatMessages)
    .where(eq(chatMessages.quoteId, quoteId))
    .orderBy(desc(chatMessages.createdAt));
  // 파트너별로 그룹핑 (마지막 메시지)
  const roomMap = new Map<number, any>();
  for (const m of msgs) {
    if (!roomMap.has(m.partnerId)) {
      roomMap.set(m.partnerId, { partnerId: m.partnerId, lastMessage: m.message, lastAt: m.createdAt });
    }
  }
  // 파트너 정보 붙이기
  const rooms = [];
  for (const [partnerId, room] of roomMap) {
    const [p] = await db.select().from(partners).where(eq(partners.id, partnerId));
    rooms.push({ ...room, partner: p ? { id: p.id, companyName: p.companyName, logoUrl: p.logoUrl, avgRating: p.avgRating, reviewCount: p.reviewCount } : null });
  }
  return rooms;
}

// 파트너가 참여한 채팅방 목록 (파트너용)
export async function getChatRoomsByPartner(partnerId: number) {
  const db = await getDb();
  if (!db) return [];
  const msgs = await db.select().from(chatMessages)
    .where(eq(chatMessages.partnerId, partnerId))
    .orderBy(desc(chatMessages.createdAt));
  const roomMap = new Map<number, any>();
  for (const m of msgs) {
    if (!roomMap.has(m.quoteId)) {
      roomMap.set(m.quoteId, { quoteId: m.quoteId, lastMessage: m.message, lastAt: m.createdAt });
    }
  }
  const rooms = [];
  for (const [quoteId, room] of roomMap) {
    const [q] = await db.select().from(quotes).where(eq(quotes.id, quoteId));
    rooms.push({ ...room, quote: q ? { id: q.id, title: q.title, region: q.region } : null });
  }
  return rooms;
}


export async function getSubmissionsByPartner(partnerId: number) {
  const db = await getDb();
  if (!db) return [];
  const subs = await db.select({
    id: quoteSubmissions.id,
    quoteId: quoteSubmissions.quoteId,
    partnerId: quoteSubmissions.partnerId,
    amount: quoteSubmissions.amount,
    description: quoteSubmissions.description,
    estimatedDays: quoteSubmissions.estimatedDays,
    status: quoteSubmissions.status,
    createdAt: quoteSubmissions.createdAt,
  }).from(quoteSubmissions).where(eq(quoteSubmissions.partnerId, partnerId)).orderBy(desc(quoteSubmissions.createdAt));
  if (subs.length === 0) return [];
  const quoteIds = subs.map((s) => s.quoteId);
  // 견적 기본 정보
  const qs = await db.select({
    id: quotes.id, title: quotes.title, region: quotes.region,
    status: quotes.status, type: quotes.type, createdAt: quotes.createdAt,
  }).from(quotes).where(inArray(quotes.id, quoteIds));
  const qMap = new Map(qs.map((q) => [q.id, q]));
  // 미읽음(고객→파트너) 메시지 수
  const unreadRows = await db.select({ quoteId: chatMessages.quoteId, cnt: sql<number>`count(*)` })
    .from(chatMessages).where(and(
      inArray(chatMessages.quoteId, quoteIds),
      eq(chatMessages.partnerId, partnerId),
      eq(chatMessages.senderRole, "customer"),
      eq(chatMessages.isRead, false),
    )).groupBy(chatMessages.quoteId);
  const unreadMap = new Map(unreadRows.map((r) => [r.quoteId, Number(r.cnt)]));
  // 고객이 이 파트너에게 리뷰를 남겼는지 (B방식 '시공 완료' 표시용)
  const revRows = await db.select({ quoteId: reviews.quoteId }).from(reviews)
    .where(and(inArray(reviews.quoteId, quoteIds), eq(reviews.partnerId, partnerId)));
  const reviewedIds = revRows.map((r) => r.quoteId);
  return subs.map((s) => ({
    ...s,
    quote: qMap.get(s.quoteId) || null,
    unreadCount: unreadMap.get(s.quoteId) ?? 0,
    reviewed: reviewedIds.includes(s.quoteId),
  }));
}

export async function updateSubmissionStatus(id: number, status: "submitted" | "selected" | "rejected") {
  const db = await getDb();
  if (!db) return;
  await db.update(quoteSubmissions).set({ status }).where(eq(quoteSubmissions.id, id));
}

// 견적 제출 1건 조회 (선정 권한 검증용)
export async function getSubmissionById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [s] = await db.select().from(quoteSubmissions).where(eq(quoteSubmissions.id, id)).limit(1);
  return s || null;
}

// 선정된 1건 외 나머지 제출 모두 탈락 처리
export async function rejectOtherSubmissions(quoteId: number, keepId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(quoteSubmissions).set({ status: "rejected" })
    .where(and(eq(quoteSubmissions.quoteId, quoteId), ne(quoteSubmissions.id, keepId)));
}

// 모든 제출 탈락 (아무와도 진행 안 함)
export async function rejectAllSubmissions(quoteId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(quoteSubmissions).set({ status: "rejected" })
    .where(eq(quoteSubmissions.quoteId, quoteId));
}

// 선정된 파트너 ID (없으면 null)
export async function getSelectedPartnerId(quoteId: number): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  const [s] = await db.select({ partnerId: quoteSubmissions.partnerId }).from(quoteSubmissions)
    .where(and(eq(quoteSubmissions.quoteId, quoteId), eq(quoteSubmissions.status, "selected"))).limit(1);
  return s?.partnerId ?? null;
}

// 이 견적에 고객이 남긴 리뷰 (1회 제한·UI 표시용)
export async function getReviewByQuote(quoteId: number, customerId: number) {
  const db = await getDb();
  if (!db) return null;
  const [r] = await db.select().from(reviews)
    .where(and(eq(reviews.quoteId, quoteId), eq(reviews.customerId, customerId))).limit(1);
  return r || null;
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

export async function getPortfolioById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(portfolios).where(eq(portfolios.id, id));
  return rows[0] ?? null;
}

export async function updatePortfolio(
  id: number,
  data: { title?: string; description?: string; images?: string[]; categoryId?: number; region?: string },
) {
  const db = await getDb();
  if (!db) return;
  // 파트너가 내용을 수정하면 다시 검수 대기 상태로 되돌린다
  await db.update(portfolios).set({ ...data, status: "pending" } as any).where(eq(portfolios.id, id));
}

export async function deletePortfolio(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(portfolios).where(eq(portfolios.id, id));
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

// ===================== USER CONSENTS =====================
export async function upsertUserConsent(userId: number, data: Partial<InsertUserConsent>) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(userConsents).where(eq(userConsents.userId, userId)).limit(1);
  if (existing.length > 0) {
    await db.update(userConsents).set(data as any).where(eq(userConsents.userId, userId));
  } else {
    await db.insert(userConsents).values({ userId, ...data } as any);
  }
}

export async function getUserConsent(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const r = await db.select().from(userConsents).where(eq(userConsents.userId, userId)).limit(1);
  return r[0] || null;
}

// ===================== COUPONS =====================
export async function createCoupon(data: Omit<InsertCoupon, "id" | "createdAt">) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(coupons).values(data as any).$returningId();
  return result.id;
}

export async function getCouponById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const r = await db.select().from(coupons).where(eq(coupons.id, id)).limit(1);
  return r[0] || null;
}

export async function getActiveCoupons() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(coupons).where(and(eq(coupons.isActive, true), or(sql`${coupons.expiresAt} IS NULL`, sql`${coupons.expiresAt} > NOW()`)));
}

export async function getAllCoupons() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(coupons).orderBy(desc(coupons.createdAt));
}

export async function updateCoupon(id: number, data: Partial<Coupon>) {
  const db = await getDb();
  if (!db) return;
  await db.update(coupons).set(data as any).where(eq(coupons.id, id));
}

// ===================== USER COUPONS =====================
export async function issueUserCoupon(userId: number, couponId: number, expiresAt?: Date) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(userCoupons).values({ userId, couponId, expiresAt } as any).$returningId();
  return result.id;
}

export async function getUserCoupons(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userCoupons).where(eq(userCoupons.userId, userId)).orderBy(desc(userCoupons.createdAt));
}

export async function getAvailableUserCoupons(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userCoupons).where(and(
    eq(userCoupons.userId, userId),
    eq(userCoupons.status, "available"),
    or(sql`${userCoupons.expiresAt} IS NULL`, sql`${userCoupons.expiresAt} > NOW()`)
  )).orderBy(desc(userCoupons.createdAt));
}

export async function markUserCouponAsUsed(userCouponId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(userCoupons).set({ status: "used", usedAt: new Date() }).where(eq(userCoupons.id, userCouponId));
}

// Bulk issue coupons to marketing-agreed users
export async function issueMarketingCouponToAgreedUsers(couponId: number, expiresAt?: Date) {
  const db = await getDb();
  if (!db) return 0;
  
  // Find all users who agreed to marketing
  const agreedUsers = await db.select({ userId: userConsents.userId }).from(userConsents).where(eq(userConsents.marketingAgreed, true));
  
  let count = 0;
  for (const { userId } of agreedUsers) {
    // Check if user already has this coupon
    const existing = await db.select().from(userCoupons).where(and(eq(userCoupons.userId, userId), eq(userCoupons.couponId, couponId))).limit(1);
    if (existing.length === 0) {
      await issueUserCoupon(userId, couponId, expiresAt);
      count++;
    }
  }
  
  // Update coupon's usedCount (for tracking)
  await db.update(coupons).set({ usedCount: sql`${coupons.usedCount} + ${count}` }).where(eq(coupons.id, couponId));
  
  return count;
}

// ============================================================
// WALLET (지갑) 함수
// ============================================================

// 지갑 잔액 조회
export async function getWallet(partnerId: number) {
  const db = await getDb();
  if (!db) return null;
  const [p] = await db.select().from(partners).where(eq(partners.id, partnerId));
  if (!p) return null;
  return {
    tokenBalance: p.tokenBalance ?? 0,
    pointBalance: p.pointBalance ?? 0,
    total: (p.tokenBalance ?? 0) + (p.pointBalance ?? 0),
  };
}

// 거래내역 조회
export async function getWalletTransactions(partnerId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(walletTransactions)
    .where(eq(walletTransactions.partnerId, partnerId))
    .orderBy(desc(walletTransactions.createdAt))
    .limit(limit);
}

// 토큰 충전 (관리자 수동충전 또는 결제 성공 시)
export async function chargeToken(partnerId: number, amount: number, description: string) {
  const db = await getDb();
  if (!db) return null;
  const [p] = await db.select().from(partners).where(eq(partners.id, partnerId));
  if (!p) return null;
  const newBalance = (p.tokenBalance ?? 0) + amount;
  await db.update(partners).set({ tokenBalance: newBalance }).where(eq(partners.id, partnerId));
  await db.insert(walletTransactions).values({
    partnerId, currency: "token", type: "charge", amount,
    balanceAfter: newBalance, description,
  });
  return newBalance;
}

// 포인트 지급 (관리자 프로모션) - 유효기간 배치 생성
export async function grantPoint(partnerId: number, amount: number, validDays: number, reason: string) {
  const db = await getDb();
  if (!db) return null;
  const [p] = await db.select().from(partners).where(eq(partners.id, partnerId));
  if (!p) return null;

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + validDays);

  // 포인트 배치 생성
  await db.insert(pointBatches).values({
    partnerId, amount, remaining: amount, reason, expiresAt,
  });

  const newBalance = (p.pointBalance ?? 0) + amount;
  await db.update(partners).set({ pointBalance: newBalance }).where(eq(partners.id, partnerId));
  await db.insert(walletTransactions).values({
    partnerId, currency: "point", type: "charge", amount,
    balanceAfter: newBalance, description: `${reason} (유효 ${validDays}일)`,
  });
  return newBalance;
}

// 열람 차감 (포인트 먼저 → 토큰)
// 반환: { ok: true } 또는 { ok: false, reason: "insufficient" }
export async function deductForView(partnerId: number, cost: number, quoteId: number, viewType: string) {
  const db = await getDb();
  if (!db) return { ok: false, reason: "db_error" };
  const [p] = await db.select().from(partners).where(eq(partners.id, partnerId));
  if (!p) return { ok: false, reason: "not_found" };

  const pointBal = p.pointBalance ?? 0;
  const tokenBal = p.tokenBalance ?? 0;

  // 잔액 부족
  if (pointBal + tokenBal < cost) {
    return { ok: false, reason: "insufficient", needed: cost, have: pointBal + tokenBal };
  }

  let remaining = cost;
  const desc = viewType === "designated" ? "지정 견적 열람" : "공개 견적 열람";

  // 1단계: 포인트 차감 (만료 임박 배치부터 FIFO)
  if (pointBal > 0 && remaining > 0) {
    const usePoint = Math.min(pointBal, remaining);
    // 포인트 배치에서 차감 (만료일 빠른 순)
    const batches = await db.select().from(pointBatches)
      .where(and(
        eq(pointBatches.partnerId, partnerId),
        eq(pointBatches.isExpired, false),
        sql`${pointBatches.remaining} > 0`
      ))
      .orderBy(asc(pointBatches.expiresAt));

    let toDeduct = usePoint;
    for (const batch of batches) {
      if (toDeduct <= 0) break;
      const deduct = Math.min(batch.remaining, toDeduct);
      await db.update(pointBatches)
        .set({ remaining: batch.remaining - deduct })
        .where(eq(pointBatches.id, batch.id));
      toDeduct -= deduct;
    }

    const newPointBal = pointBal - usePoint;
    await db.update(partners).set({ pointBalance: newPointBal }).where(eq(partners.id, partnerId));
    await db.insert(walletTransactions).values({
      partnerId, currency: "point", type: "deduct", amount: usePoint,
      balanceAfter: newPointBal, description: desc, relatedQuoteId: quoteId,
    });
    remaining -= usePoint;
  }

  // 2단계: 토큰 차감 (포인트로 부족한 만큼)
  if (remaining > 0) {
    const newTokenBal = tokenBal - remaining;
    await db.update(partners).set({ tokenBalance: newTokenBal }).where(eq(partners.id, partnerId));
    await db.insert(walletTransactions).values({
      partnerId, currency: "token", type: "deduct", amount: remaining,
      balanceAfter: newTokenBal, description: desc, relatedQuoteId: quoteId,
    });
  }

  return { ok: true };
}

// 만료된 포인트 처리 (배치 작업 - 매일 실행)
export async function expirePoints() {
  const db = await getDb();
  if (!db) return 0;
  const now = new Date();
  const expiredBatches = await db.select().from(pointBatches)
    .where(and(
      eq(pointBatches.isExpired, false),
      sql`${pointBatches.expiresAt} < ${now}`,
      sql`${pointBatches.remaining} > 0`
    ));

  let totalExpired = 0;
  for (const batch of expiredBatches) {
    // 배치를 만료 처리
    await db.update(pointBatches)
      .set({ isExpired: true, remaining: 0 })
      .where(eq(pointBatches.id, batch.id));

    // 파트너 포인트 잔액 차감
    const [p] = await db.select().from(partners).where(eq(partners.id, batch.partnerId));
    if (p) {
      const newBal = Math.max(0, (p.pointBalance ?? 0) - batch.remaining);
      await db.update(partners).set({ pointBalance: newBal }).where(eq(partners.id, batch.partnerId));
      await db.insert(walletTransactions).values({
        partnerId: batch.partnerId, currency: "point", type: "expire", amount: batch.remaining,
        balanceAfter: newBal, description: "포인트 유효기간 만료",
      });
      totalExpired += batch.remaining;
    }
  }
  return totalExpired;
}

// 지갑 설정값 조회
export async function getWalletSettings() {
  const db = await getDb();
  if (!db) return {};
  const rows = await db.select().from(walletSettings);
  const result: Record<string, number> = {};
  rows.forEach((r) => { result[r.settingKey] = r.settingValue; });
  // 기본값
  return {
    designatedViewPrice: result.designatedViewPrice ?? 50000,
    publicViewPrice: result.publicViewPrice ?? 10000,
    monthlySubscription: result.monthlySubscription ?? 50000,
  };
}

// 지갑 설정값 변경 (관리자)
export async function setWalletSetting(key: string, value: number) {
  const db = await getDb();
  if (!db) return;
  const [existing] = await db.select().from(walletSettings).where(eq(walletSettings.settingKey, key));
  if (existing) {
    await db.update(walletSettings).set({ settingValue: value }).where(eq(walletSettings.settingKey, key));
  } else {
    await db.insert(walletSettings).values({ settingKey: key, settingValue: value });
  }
}

// ============================================================
// 신규가입 보너스 캠페인 & 일괄지급 함수
// ============================================================

// 캠페인 목록 조회
export async function getSignupBonusCampaigns() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(signupBonusCampaigns).orderBy(desc(signupBonusCampaigns.createdAt));
}

// 캠페인 생성
export async function createSignupBonusCampaign(data: {
  name: string; bonusAmount: number; validDays: number; startsAt: Date; endsAt: Date;
}) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(signupBonusCampaigns).values(data).$returningId();
  return result.id;
}

// 캠페인 활성/비활성 토글
export async function toggleSignupBonusCampaign(id: number, isActive: boolean) {
  const db = await getDb();
  if (!db) return;
  await db.update(signupBonusCampaigns).set({ isActive }).where(eq(signupBonusCampaigns.id, id));
}

// 캠페인 삭제
export async function deleteSignupBonusCampaign(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(signupBonusCampaigns).where(eq(signupBonusCampaigns.id, id));
}

// 현재 활성 캠페인 찾기 (파트너 승인 시 자동 호출)
// 지금 시각이 캠페인 기간 내이고 활성화된 캠페인
export async function applySignupBonusIfEligible(partnerId: number) {
  const db = await getDb();
  if (!db) return null;
  const now = new Date();
  const campaigns = await db.select().from(signupBonusCampaigns)
    .where(and(
      eq(signupBonusCampaigns.isActive, true),
      sql`${signupBonusCampaigns.startsAt} <= ${now}`,
      sql`${signupBonusCampaigns.endsAt} >= ${now}`
    ))
    .orderBy(desc(signupBonusCampaigns.bonusAmount)) // 여러 개면 가장 큰 혜택
    .limit(1);

  if (campaigns.length === 0) return null;
  const campaign = campaigns[0];

  // 포인트 지급
  await grantPoint(partnerId, campaign.bonusAmount, campaign.validDays, `${campaign.name} (신규가입 보너스)`);

  // 지급 카운트 증가
  await db.update(signupBonusCampaigns)
    .set({ grantedCount: campaign.grantedCount + 1 })
    .where(eq(signupBonusCampaigns.id, campaign.id));

  return { name: campaign.name, amount: campaign.bonusAmount };
}

// 일괄 포인트 지급 (여러 파트너에게 한 번에)
export async function bulkGrantPoint(partnerIds: number[], amount: number, validDays: number, reason: string) {
  let successCount = 0;
  for (const pid of partnerIds) {
    const result = await grantPoint(pid, amount, validDays, reason);
    if (result !== null) successCount++;
  }
  return successCount;
}

// ============================================================
// MAIN BANNERS (메인페이지 프로모션 배너)
// ============================================================

// [공개] 메인페이지 노출용: 활성 + 기간(시작·종료) 충족만, 순서대로
export async function getActiveBanners() {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  return db.select().from(mainBanners)
    .where(and(
      eq(mainBanners.isActive, true),
      or(isNull(mainBanners.startsAt), lte(mainBanners.startsAt, now)),
      or(isNull(mainBanners.endsAt), gte(mainBanners.endsAt, now)),
    ))
    .orderBy(asc(mainBanners.sortOrder), desc(mainBanners.createdAt));
}

// [관리자] 전체 목록 (비활성·기간만료 포함)
export async function getAllBanners() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(mainBanners).orderBy(asc(mainBanners.sortOrder), desc(mainBanners.createdAt));
}

export async function createBanner(data: InsertMainBanner) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(mainBanners).values(data).$returningId();
  return result.id;
}

export async function updateBanner(id: number, data: Partial<MainBanner>) {
  const db = await getDb();
  if (!db) return;
  await db.update(mainBanners).set(data as any).where(eq(mainBanners.id, id));
}

// 하드 삭제 (배너는 종속 데이터가 없어 cascade 불필요)
export async function deleteBanner(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(mainBanners).where(eq(mainBanners.id, id));
}

// 노출 순서 swap (카테고리와 동일 패턴)
export async function swapBannerOrder(idA: number, idB: number) {
  const db = await getDb();
  if (!db) return;
  const rows = await db.select().from(mainBanners).where(inArray(mainBanners.id, [idA, idB]));
  const a = rows.find((r) => r.id === idA);
  const b = rows.find((r) => r.id === idB);
  if (!a || !b) return;
  const orderA = a.sortOrder ?? a.id;
  const orderB = b.sortOrder ?? b.id;
  const tempA = orderA === orderB ? orderA - 1 : orderA;
  await db.update(mainBanners).set({ sortOrder: orderB }).where(eq(mainBanners.id, idA));
  await db.update(mainBanners).set({ sortOrder: tempA }).where(eq(mainBanners.id, idB));
}
