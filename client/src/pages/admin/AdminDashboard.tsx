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
import { toast } from "sonner";
import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { BarChart3, Users, Building2, FileText, Star, Package, Loader2, ShieldAlert } from "lucide-react";
import { QUOTE_STATUS_LABELS, PARTNER_STATUS_LABELS } from "@shared/constants";

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

  const updatePartnerStatus = trpc.partners.updateStatus.useMutation({
    onSuccess: () => toast.success("파트너 상태가 변경되었습니다"),
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
            </TabsList>

            {/* Stats */}
            <TabsContent value="stats" className="mt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "전체 회원", value: stats?.users || 0, icon: Users, color: "text-blue-600 bg-blue-50" },
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
            <TabsContent value="users" className="mt-4">
              <Card className="border-border/50 shadow-sm">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="text-left p-3 font-medium">ID</th>
                          <th className="text-left p-3 font-medium">이름</th>
                          <th className="text-left p-3 font-medium">이메일</th>
                          <th className="text-left p-3 font-medium">역할</th>
                          <th className="text-left p-3 font-medium">가입일</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(allUsers || []).map((u) => (
                          <tr key={u.id} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="p-3">{u.id}</td>
                            <td className="p-3 font-medium">{u.name || "-"}</td>
                            <td className="p-3 text-muted-foreground">{u.email || "-"}</td>
                            <td className="p-3"><Badge variant="secondary">{u.role}</Badge></td>
                            <td className="p-3 text-muted-foreground">{new Date(u.createdAt).toLocaleDateString("ko-KR")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Partners */}
            <TabsContent value="partners" className="mt-4 space-y-3">
              {(allPartners || []).map((p) => (
                <Card key={p.id} className="border-border/50 shadow-sm">
                  <CardContent className="p-5 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground">{p.companyName}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{p.representativeName || "-"} | {p.phone || "-"}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant={p.status === "approved" ? "default" : "secondary"}>
                        {PARTNER_STATUS_LABELS[p.status] || p.status}
                      </Badge>
                      <Select
                        value={p.status}
                        onValueChange={(v) => updatePartnerStatus.mutate({ id: p.id, status: v as any })}
                      >
                        <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">대기</SelectItem>
                          <SelectItem value="approved">승인</SelectItem>
                          <SelectItem value="rejected">거부</SelectItem>
                          <SelectItem value="suspended">정지</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Quotes */}
            <TabsContent value="quotes" className="mt-4">
              <Card className="border-border/50 shadow-sm">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="text-left p-3 font-medium">ID</th>
                          <th className="text-left p-3 font-medium">제목</th>
                          <th className="text-left p-3 font-medium">유형</th>
                          <th className="text-left p-3 font-medium">지역</th>
                          <th className="text-left p-3 font-medium">상태</th>
                          <th className="text-left p-3 font-medium">등록일</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(allQuotes || []).map((q) => (
                          <tr key={q.id} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="p-3">{q.id}</td>
                            <td className="p-3 font-medium">{q.title}</td>
                            <td className="p-3"><Badge variant="outline">{q.type === "public" ? "공개" : "지정"}</Badge></td>
                            <td className="p-3 text-muted-foreground">{q.region || "-"}</td>
                            <td className="p-3"><Badge variant="secondary">{QUOTE_STATUS_LABELS[q.status] || q.status}</Badge></td>
                            <td className="p-3 text-muted-foreground">{new Date(q.createdAt).toLocaleDateString("ko-KR")}</td>
                          </tr>
                        ))}
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
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
