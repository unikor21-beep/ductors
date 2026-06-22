import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useEffect, useState, lazy, Suspense } from "react";
import { useParams, useLocation } from "wouter";
import { BarChart3, Users, Building2, FileText, Star, Package, Loader2, ShieldAlert, ImageIcon, ExternalLink, AlertCircle, Search, Mail, Phone, MapPin, Hash, Calendar } from "lucide-react";
import { QUOTE_STATUS_LABELS, QUOTE_STATUS_COLOR, PARTNER_STATUS_LABELS, PARTNER_STATUS_BADGE, GRADE_LABELS, GRADE_COLORS, ROLE_LABELS, ROLE_BADGE_STYLE, loginMethodLabel, REGIONS } from "@shared/constants";

const BackgroundManager = lazy(() => import("./BackgroundManager"));
const BannerManager = lazy(() => import("./BannerManager"));
const CategoryManager = lazy(() => import("./CategoryManager"));
const AdminWalletManager = lazy(() => import("./AdminWalletManager"));

export default function AdminDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const params = useParams<{ tab?: string }>();
  const [, navigate] = useLocation();
  const activeTab = params.tab || "stats";

  const { data: stats } = trpc.admin.stats.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: allUsers } = trpc.admin.users.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" && activeTab === "users" });
  const { data: allPartners } = trpc.partners.listAll.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" && activeTab === "partners" });
  const { data: allQuotes } = trpc.quotes.listAll.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" && activeTab === "quotes" });
  const { data: allReviews } = trpc.reviews.listAll.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" && activeTab === "reviews" });
  const { data: allProducts } = trpc.products.listAll.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" && activeTab === "products" });

  const utils = trpc.useUtils();

  // 검색(필터)
  const [userSearch, setUserSearch] = useState("");
  const [userRole, setUserRole] = useState<"all" | "user" | "partner" | "admin">("all");
  const [partnerSearch, setPartnerSearch] = useState("");
  // 파트너 다중 선택 필터 (지역·등급·승인상태)
  const [pStatuses, setPStatuses] = useState<string[]>([]);
  const [pGrades, setPGrades] = useState<string[]>([]);
  const [pRegions, setPRegions] = useState<string[]>([]);
  const toggleIn = (arr: string[], set: (v: string[]) => void, v: string) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const partnerFiltersActive = pStatuses.length + pGrades.length + pRegions.length > 0;

  // 견적 필터 (유형·공사유형·지역 다중)
  const [qType, setQType] = useState<"all" | "public" | "designated">("all");
  const [qCategories, setQCategories] = useState<string[]>([]);
  const [qRegions, setQRegions] = useState<string[]>([]);
  const quoteFiltersActive = qType !== "all" || qCategories.length + qRegions.length > 0;

  // 파트너 상세 모달 + 카테고리(전문분야) 매핑
  const [detailPartner, setDetailPartner] = useState<any | null>(null);
  const { data: allCategories } = trpc.categories.list.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const categoryName = (id: any) => (allCategories || []).find((c: any) => String(c.id) === String(id))?.name || String(id);

  // 사업자등록증(data URL)을 Blob으로 변환해 새 창에서 열기 (브라우저의 data: 직접 이동 차단 우회)
  const openCert = (dataUrl: string) => {
    try {
      const [meta, b64] = dataUrl.split(",");
      const mime = meta.match(/data:(.*?);/)?.[1] || "application/octet-stream";
      const bin = atob(b64);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      const url = URL.createObjectURL(new Blob([arr], { type: mime }));
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      toast.error("파일을 열 수 없습니다");
    }
  };
  const norm = (v: any) => String(v ?? "").toLowerCase();
  const uq = userSearch.trim().toLowerCase();
  const filteredUsers = (allUsers || []).filter((u: any) =>
    (userRole === "all" || u.role === userRole) &&
    (!uq || [u.name, u.username, u.email, u.phone, String(u.id)].some((f) => norm(f).includes(uq)))
  );
  const pq = partnerSearch.trim().toLowerCase();
  const filteredPartners = (allPartners || []).filter((p: any) =>
    (pStatuses.length === 0 || pStatuses.includes(p.status)) &&
    (pGrades.length === 0 || pGrades.includes(p.grade || "bronze")) &&
    (pRegions.length === 0 || (Array.isArray(p.regions) && p.regions.some((r: string) => pRegions.includes(r)))) &&
    (!pq || [p.companyName, p.representativeName, p.phone, p.email, p.businessNumber, String(p.id)].some((f) => norm(f).includes(pq)))
  );

  // 견적 필터링
  const quoteCategoryOptions = Array.from(new Set((allQuotes || []).map((q: any) => q.categoryName).filter(Boolean))) as string[];
  const filteredQuotes = (allQuotes || []).filter((q: any) =>
    (qType === "all" || q.type === qType) &&
    (qCategories.length === 0 || qCategories.includes(q.categoryName)) &&
    (qRegions.length === 0 || qRegions.some((s) => (q.region || "").startsWith(s)))
  );

  const updatePartnerStatus = trpc.partners.updateStatus.useMutation({
    onSuccess: () => { toast.success("파트너 상태가 변경되었습니다"); utils.partners.listAll.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const updatePartnerGrade = trpc.partners.updateGrade.useMutation({
    onSuccess: () => { toast.success("파트너 등급이 변경되었습니다"); utils.partners.listAll.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const toggleReview = trpc.reviews.toggleVisibility.useMutation({
    onSuccess: () => toast.success("리뷰 상태가 변경되었습니다"),
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) window.location.href = getLoginUrl();
  }, [loading, isAuthenticated]);

  if (loading) return null;
  if (!isAuthenticated) return null;

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col"><Header />
        <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
          <div className="text-center">
            <ShieldAlert className="w-12 h-12 text-destructive/50 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">접근 권한이 없습니다</h2>
            <p className="text-muted-foreground mb-6">관리자만 접근할 수 있는 페이지입니다</p>
            <Button onClick={() => navigate("/")}>홈으로</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-6xl">
          <h1 className="text-2xl font-bold text-foreground mb-6">관리자 대시보드</h1>

          <Tabs value={activeTab} onValueChange={(v) => navigate(`/admin/${v}`)}>
            <TabsList className="bg-muted/50 flex-wrap h-auto gap-1">
              <TabsTrigger value="stats">통계</TabsTrigger>
              <TabsTrigger value="users">회원</TabsTrigger>
              <TabsTrigger value="partners">파트너</TabsTrigger>
              <TabsTrigger value="quotes">견적</TabsTrigger>
              <TabsTrigger value="reviews">리뷰</TabsTrigger>
              <TabsTrigger value="products">상품</TabsTrigger>
              <TabsTrigger value="categories">카테고리</TabsTrigger>
              <TabsTrigger value="wallet">지갑 관리</TabsTrigger>
              <TabsTrigger value="backgrounds">배경 관리</TabsTrigger>
              <TabsTrigger value="banners">배너 관리</TabsTrigger>
            </TabsList>

            {/* Stats */}
            <TabsContent value="stats" className="mt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "전체 회원", value: stats?.users || 0, icon: Users, color: "text-lime-700 bg-lime-50" },
                  { label: "파트너", value: stats?.partners || 0, icon: Building2, color: "text-green-600 bg-green-50" },
                  { label: "견적 요청", value: stats?.quotes || 0, icon: FileText, color: "text-purple-600 bg-purple-50" },
                  { label: "리뷰", value: stats?.reviews || 0, icon: Star, color: "text-yellow-600 bg-yellow-50" },
                ].map((s, i) => (
                  <Card key={i} className="border-border/50 shadow-sm">
                    <CardContent className="p-5">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${s.color}`}>
                        <s.icon className="w-5 h-5" />
                      </div>
                      <div className="text-2xl font-bold text-foreground">{s.value}</div>
                      <div className="text-sm text-muted-foreground">{s.label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Users */}
            <TabsContent value="users" className="mt-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2 justify-between">
                <div className="flex gap-1.5">
                  {([["all", "전체"], ["user", "고객"], ["partner", "파트너"], ["admin", "관리자"]] as const).map(([key, label]) => (
                    <Button key={key} size="sm" variant={userRole === key ? "default" : "outline"} onClick={() => setUserRole(key)}>
                      {label}{key !== "all" && ` (${(allUsers || []).filter((u: any) => u.role === key).length})`}
                    </Button>
                  ))}
                </div>
                <div className="relative w-full sm:w-auto sm:min-w-[280px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="이름·아이디·이메일·전화번호 검색"
                    className="pl-9"
                  />
                </div>
              </div>
              <Card className="border-border/50 shadow-sm">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="text-left p-3 font-medium">ID</th>
                          <th className="text-left p-3 font-medium">이름</th>
                          <th className="text-left p-3 font-medium">아이디</th>
                          <th className="text-left p-3 font-medium">이메일</th>
                          <th className="text-left p-3 font-medium">전화번호</th>
                          <th className="text-left p-3 font-medium">가입일</th>
                          <th className="text-left p-3 font-medium">가입 방식</th>
                          <th className="text-left p-3 font-medium">역할</th>
                          <th className="text-left p-3 font-medium">상태</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((u: any) => (
                          <tr key={u.id} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="p-3">{u.id}</td>
                            <td className="p-3 font-medium">{u.name || "-"}</td>
                            <td className="p-3 text-muted-foreground">{u.username || "-"}</td>
                            <td className="p-3 text-muted-foreground">{u.email || "-"}</td>
                            <td className="p-3 text-muted-foreground">{u.phone || "-"}</td>
                            <td className="p-3 text-muted-foreground">{new Date(u.createdAt).toLocaleDateString("ko-KR")}</td>
                            <td className="p-3">
                              <Badge variant="outline" className={u.loginMethod && u.loginMethod !== "local" ? "border-amber-300 text-amber-700" : ""}>
                                {loginMethodLabel(u.loginMethod)}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <span className="text-[11px] font-medium px-2 py-0.5 rounded"
                                style={{ backgroundColor: ROLE_BADGE_STYLE[u.role]?.bg, color: ROLE_BADGE_STYLE[u.role]?.color }}>
                                {ROLE_LABELS[u.role] || u.role}
                              </span>
                            </td>
                            <td className="p-3">
                              {(() => {
                                const st = u.deletedAt ? { label: "탈퇴", color: "#dc2626" }
                                  : u.role === "partner"
                                    ? (u.partnerStatus === "pending" ? { label: "대기", color: "#86efac" }
                                      : u.partnerStatus === "rejected" ? { label: "거절", color: "#f97316" }
                                      : u.partnerStatus === "suspended" ? { label: "정지", color: "#dc2626" }
                                      : { label: "정상", color: "#16a34a" })
                                    : { label: "정상", color: "#16a34a" };
                                return (
                                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: st.color }} />
                                    {st.label}
                                  </span>
                                );
                              })()}
                            </td>
                          </tr>
                        ))}
                        {filteredUsers.length === 0 && (
                          <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">검색 결과가 없습니다</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Partners */}
            <TabsContent value="partners" className="mt-4 space-y-3">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={partnerSearch}
                  onChange={(e) => setPartnerSearch(e.target.value)}
                  placeholder="업체명·대표자·전화번호·사업자번호 검색"
                  className="pl-9"
                />
              </div>

              {/* 다중 선택 필터 */}
              <Card className="border-border/50 shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">필터 <span className="text-muted-foreground font-normal">(여러 개 선택 가능)</span></span>
                    {partnerFiltersActive && (
                      <button onClick={() => { setPStatuses([]); setPGrades([]); setPRegions([]); }} className="text-xs text-primary hover:underline">필터 초기화</button>
                    )}
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-muted-foreground w-16 shrink-0 pt-1.5">승인상태</span>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(PARTNER_STATUS_LABELS).map(([k, label]) => (
                        <button key={k} onClick={() => toggleIn(pStatuses, setPStatuses, k)}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${pStatuses.includes(k) ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-muted"}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-muted-foreground w-16 shrink-0 pt-1.5">등급</span>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(GRADE_LABELS).map(([k, label]) => (
                        <button key={k} onClick={() => toggleIn(pGrades, setPGrades, k)}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-colors flex items-center gap-1 ${pGrades.includes(k) ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-muted"}`}>
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: GRADE_COLORS[k] }} />{label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-muted-foreground w-16 shrink-0 pt-1.5">지역</span>
                    <div className="flex flex-wrap gap-1.5">
                      {REGIONS.map((r) => (
                        <button key={r} onClick={() => toggleIn(pRegions, setPRegions, r)}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${pRegions.includes(r) ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-muted"}`}>
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground pt-1">{filteredPartners.length}개 파트너</p>
                </CardContent>
              </Card>

              {filteredPartners.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">검색 결과가 없습니다</div>
              )}
              {filteredPartners.map((p: any) => (
                <Card key={p.id} className="border-border/50 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <div className="min-w-0">
                        <h3 onClick={() => setDetailPartner(p)} className="font-semibold text-foreground hover:text-primary cursor-pointer">
                          {p.companyName}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">{p.representativeName || "-"} | {p.phone || "-"}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 inline-flex items-center gap-1.5">
                          사업자번호: {p.businessNumber || "-"}
                          {p.businessLicenseUrl ? (
                            <span title="사업자등록증 첨부됨" className="inline-flex"><FileText className="w-3.5 h-3.5 text-primary" /></span>
                          ) : (
                            <span title="사업자등록증 미첨부" className="inline-flex"><AlertCircle className="w-3.5 h-3.5 text-amber-500" /></span>
                          )}
                        </p>
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${PARTNER_STATUS_BADGE[p.status]?.className || "bg-secondary text-secondary-foreground"}`}
                        style={{ backgroundColor: PARTNER_STATUS_BADGE[p.status]?.bg, color: PARTNER_STATUS_BADGE[p.status]?.color }}>
                        {PARTNER_STATUS_LABELS[p.status] || p.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap border-t border-border/50 pt-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">승인 상태:</span>
                        <Select
                          value={p.status}
                          onValueChange={(v) => updatePartnerStatus.mutate({ id: p.id, status: v as any })}
                        >
                          <SelectTrigger className="w-28 h-9"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">대기</SelectItem>
                            <SelectItem value="approved">승인</SelectItem>
                            <SelectItem value="rejected">거부</SelectItem>
                            <SelectItem value="suspended">정지</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">등급:</span>
                        <Select
                          value={p.grade || "bronze"}
                          onValueChange={(v) => updatePartnerGrade.mutate({ id: p.id, grade: v as any })}
                        >
                          <SelectTrigger className="w-32 h-9">
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: GRADE_COLORS[p.grade || "bronze"] }} />
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bronze">
                              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: GRADE_COLORS.bronze }} />브론즈</div>
                            </SelectItem>
                            <SelectItem value="silver">
                              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: GRADE_COLORS.silver }} />실버</div>
                            </SelectItem>
                            <SelectItem value="gold">
                              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: GRADE_COLORS.gold }} />골드</div>
                            </SelectItem>
                            <SelectItem value="platinum">
                              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: GRADE_COLORS.platinum }} />플래티넘</div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Quotes */}
            <TabsContent value="quotes" className="mt-4 space-y-3">
              {/* 필터 */}
              <Card className="border-border/50 shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">필터 <span className="text-muted-foreground font-normal">(여러 개 선택 가능)</span></span>
                    {quoteFiltersActive && (
                      <button onClick={() => { setQType("all"); setQCategories([]); setQRegions([]); }} className="text-xs text-primary hover:underline">필터 초기화</button>
                    )}
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-muted-foreground w-16 shrink-0 pt-1.5">견적유형</span>
                    <div className="flex flex-wrap gap-1.5">
                      {([["all", "전체"], ["public", "공개"], ["designated", "지정"]] as const).map(([k, label]) => (
                        <button key={k} onClick={() => setQType(k)}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${qType === k ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-muted"}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {quoteCategoryOptions.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-muted-foreground w-16 shrink-0 pt-1.5">공사유형</span>
                      <div className="flex flex-wrap gap-1.5">
                        {quoteCategoryOptions.map((c) => (
                          <button key={c} onClick={() => toggleIn(qCategories, setQCategories, c)}
                            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${qCategories.includes(c) ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-muted"}`}>
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-muted-foreground w-16 shrink-0 pt-1.5">지역</span>
                    <div className="flex flex-wrap gap-1.5">
                      {REGIONS.map((r) => (
                        <button key={r} onClick={() => toggleIn(qRegions, setQRegions, r)}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${qRegions.includes(r) ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-muted"}`}>
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground pt-1">{filteredQuotes.length}건</p>
                </CardContent>
              </Card>

              <Card className="border-border/50 shadow-sm">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="text-left p-3 font-medium">아이디</th>
                          <th className="text-left p-3 font-medium">등록일</th>
                          <th className="text-left p-3 font-medium">제목</th>
                          <th className="text-left p-3 font-medium">공사유형</th>
                          <th className="text-left p-3 font-medium">견적유형</th>
                          <th className="text-left p-3 font-medium">지역</th>
                          <th className="text-left p-3 font-medium">상태</th>
                          <th className="text-left p-3 font-medium">매칭 파트너</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredQuotes.map((q: any) => {
                          const matchedPartner = q.selectedPartnerName || ((["matched", "in_progress", "completed"].includes(q.status)) ? q.designatedPartnerName : null);
                          const sc = QUOTE_STATUS_COLOR[q.status];
                          return (
                            <tr key={q.id} className="border-b border-border/50 hover:bg-muted/30">
                              <td className="p-3 text-muted-foreground">{q.customerUsername || q.customerName || "-"}</td>
                              <td className="p-3 text-muted-foreground">{new Date(q.createdAt).toLocaleDateString("ko-KR")}</td>
                              <td className="p-3 font-medium">{q.title}</td>
                              <td className="p-3 text-muted-foreground">{q.categoryName || "-"}</td>
                              <td className="p-3">
                                <span className="text-xs font-medium px-2 py-0.5 rounded border bg-white"
                                  style={{ color: q.type === "public" ? "#2563eb" : "#ea580c", borderColor: q.type === "public" ? "#bfdbfe" : "#fed7aa" }}>
                                  {q.type === "public" ? "공개" : "지정"}
                                </span>
                              </td>
                              <td className="p-3 text-muted-foreground">{q.region || "-"}</td>
                              <td className="p-3">
                                <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ backgroundColor: sc?.bg, color: sc?.color }}>
                                  {QUOTE_STATUS_LABELS[q.status] || q.status}
                                </span>
                              </td>
                              <td className="p-3 text-muted-foreground">{matchedPartner || "-"}</td>
                            </tr>
                          );
                        })}
                        {filteredQuotes.length === 0 && (
                          <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">견적이 없습니다</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reviews */}
            <TabsContent value="reviews" className="mt-4 space-y-3">
              {(allReviews || []).map((r) => (
                <Card key={r.id} className="border-border/50 shadow-sm">
                  <CardContent className="p-5 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted"}`} />
                        ))}
                      </div>
                      <p className="text-sm text-foreground">{r.content || "내용 없음"}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(r.createdAt).toLocaleDateString("ko-KR")}</p>
                    </div>
                    <Button
                      size="sm"
                      variant={r.isVisible ? "outline" : "default"}
                      onClick={() => toggleReview.mutate({ id: r.id, isVisible: !r.isVisible })}
                    >
                      {r.isVisible ? "숨기기" : "공개"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Products */}
            <TabsContent value="products" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(allProducts || []).map((p) => (
                  <Card key={p.id} className="border-border/50 shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-foreground">{p.name}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{p.description}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-bold">{Number(p.price).toLocaleString()}원</span>
                        <Badge variant={p.isActive ? "default" : "secondary"}>{p.isActive ? "활성" : "비활성"}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Categories */}
            <TabsContent value="categories" className="mt-4">
              <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>}>
                <CategoryManager />
              </Suspense>
            </TabsContent>

            {/* Wallet */}
            <TabsContent value="wallet" className="mt-4">
              <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>}>
                <AdminWalletManager />
              </Suspense>
            </TabsContent>

            {/* Backgrounds */}
            <TabsContent value="backgrounds" className="mt-4">
              <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>}>
                <BackgroundManager />
              </Suspense>
            </TabsContent>

            {/* Banners */}
            <TabsContent value="banners" className="mt-4">
              <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>}>
                <BannerManager />
              </Suspense>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* 파트너 신청 정보 상세 모달 */}
      <Dialog open={!!detailPartner} onOpenChange={(o) => !o && setDetailPartner(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>파트너 신청 정보</DialogTitle>
          </DialogHeader>
          {detailPartner && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex items-start gap-2"><Building2 className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" /><span className="text-muted-foreground w-20 shrink-0">업체명</span><span className="font-medium">{detailPartner.companyName || "-"}</span></div>
                <div className="flex items-start gap-2"><Hash className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" /><span className="text-muted-foreground w-20 shrink-0">사업자번호</span><span className="font-medium">{detailPartner.businessNumber || "-"}</span></div>
                <div className="flex items-start gap-2"><Users className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" /><span className="text-muted-foreground w-20 shrink-0">대표자명</span><span className="font-medium">{detailPartner.representativeName || "-"}</span></div>
                <div className="flex items-start gap-2"><Phone className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" /><span className="text-muted-foreground w-20 shrink-0">연락처</span><span className="font-medium">{detailPartner.phone || "-"}</span></div>
                <div className="flex items-start gap-2"><Mail className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" /><span className="text-muted-foreground w-20 shrink-0">이메일</span><span className="font-medium break-all">{detailPartner.email || "-"}</span></div>
                <div className="flex items-start gap-2"><MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" /><span className="text-muted-foreground w-20 shrink-0">주소</span><span className="font-medium">{detailPartner.address || "-"}</span></div>
                <div className="flex items-start gap-2"><Calendar className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" /><span className="text-muted-foreground w-20 shrink-0">신청일</span><span className="font-medium">{detailPartner.createdAt ? new Date(detailPartner.createdAt).toLocaleString("ko-KR") : "-"}</span></div>
              </div>

              {detailPartner.shortIntro && (
                <div className="text-sm"><span className="text-muted-foreground">한줄 소개</span><p className="mt-1">{detailPartner.shortIntro}</p></div>
              )}
              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs text-muted-foreground w-full">전문 분야</span>
                {(detailPartner.specialties || []).length ? (detailPartner.specialties || []).map((s: any) => (
                  <Badge key={s} variant="secondary">{categoryName(s)}</Badge>
                )) : <span className="text-sm">-</span>}
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs text-muted-foreground w-full">가능 지역</span>
                {(detailPartner.regions || []).length ? (detailPartner.regions || []).map((r: any) => (
                  <Badge key={r} variant="outline">{r}</Badge>
                )) : <span className="text-sm">-</span>}
              </div>

              {/* 사업자등록증 */}
              <div className="border-t border-border/50 pt-3">
                <p className="text-sm font-medium mb-2">사업자등록증</p>
                {detailPartner.businessLicenseUrl ? (
                  String(detailPartner.businessLicenseUrl).startsWith("data:image") ? (
                    <div className="space-y-2">
                      <img src={detailPartner.businessLicenseUrl} alt="사업자등록증" className="max-w-full rounded-lg border" />
                      <Button size="sm" variant="outline" onClick={() => openCert(detailPartner.businessLicenseUrl)}>
                        <ExternalLink className="w-4 h-4 mr-1" /> 새 창에서 크게 보기
                      </Button>
                    </div>
                  ) : (
                    <Button variant="outline" onClick={() => openCert(detailPartner.businessLicenseUrl)}>
                      <FileText className="w-4 h-4 mr-1" /> 사업자등록증 열기 (PDF)
                    </Button>
                  )
                ) : (
                  <p className="text-sm text-amber-500 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> 미첨부</p>
                )}
              </div>

              {/* 승인 처리 */}
              <div className="flex gap-2 border-t border-border/50 pt-3">
                <Button className="flex-1" onClick={() => { updatePartnerStatus.mutate({ id: detailPartner.id, status: "approved" }); setDetailPartner(null); }}>승인</Button>
                <Button variant="outline" className="flex-1" onClick={() => { updatePartnerStatus.mutate({ id: detailPartner.id, status: "rejected" }); setDetailPartner(null); }}>거부</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
