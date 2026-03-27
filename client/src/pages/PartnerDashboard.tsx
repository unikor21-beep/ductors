import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { FileText, Eye, Send, Briefcase, CreditCard, Loader2, Clock, Award, AlertCircle, Package } from "lucide-react";
import { QUOTE_STATUS_LABELS, GRADE_LABELS } from "@shared/constants";

export default function PartnerDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const params = useParams<{ tab?: string }>();
  const [, navigate] = useLocation();
  const activeTab = params.tab || "leads";

  const { data: partner, isLoading: partnerLoading } = trpc.partners.me.useQuery(undefined, { enabled: isAuthenticated });
  const { data: publicQuotes } = trpc.quotes.publicList.useQuery(undefined, { enabled: isAuthenticated && !!partner });
  const { data: mySubmissions } = trpc.partners.mySubmissions.useQuery(undefined, { enabled: isAuthenticated && !!partner });
  const { data: myViews } = trpc.partners.myViews.useQuery(undefined, { enabled: isAuthenticated && !!partner });
  const { data: myProjects } = trpc.projects.myProjects.useQuery(undefined, { enabled: isAuthenticated && !!partner });
  const { data: products } = trpc.products.list.useQuery(undefined, { enabled: isAuthenticated && !!partner });
  const { data: myOrders } = trpc.partners.myOrders.useQuery(undefined, { enabled: isAuthenticated && !!partner });

  const viewQuote = trpc.partners.viewQuote.useMutation({
    onSuccess: (data) => {
      if (data.alreadyViewed) toast.info("이미 열람한 견적입니다");
      else toast.success("견적을 열람했습니다. 열람권 1개가 차감되었습니다.");
    },
    onError: (e) => toast.error(e.message),
  });

  const submitQuote = trpc.partners.submitQuote.useMutation({
    onSuccess: () => toast.success("견적이 제출되었습니다!"),
    onError: (e) => toast.error(e.message),
  });

  const purchaseProduct = trpc.partners.purchaseProduct.useMutation({
    onSuccess: () => toast.success("구매가 완료되었습니다!"),
    onError: (e) => toast.error(e.message),
  });

  const [submitForm, setSubmitForm] = useState({ quoteId: 0, amount: "", description: "", estimatedDays: 0 });

  useEffect(() => {
    if (!loading && !isAuthenticated) window.location.href = getLoginUrl();
  }, [loading, isAuthenticated]);

  if (loading || !isAuthenticated) return null;

  if (partnerLoading) {
    return (
      <div className="min-h-screen flex flex-col"><Header />
        <div className="flex-1 flex items-center justify-center pt-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen flex flex-col"><Header />
        <main className="flex-1 pt-24 pb-16">
          <div className="container max-w-md text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">파트너 등록이 필요합니다</h2>
            <p className="text-muted-foreground mb-6">파트너 가입 신청 후 관리자 승인을 받으세요</p>
            <Button onClick={() => navigate("/partner-register")}>파트너 가입 신청</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (partner.status === "pending") {
    return (
      <div className="min-h-screen flex flex-col"><Header />
        <main className="flex-1 pt-24 pb-16">
          <div className="container max-w-md text-center">
            <Clock className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">승인 대기 중</h2>
            <p className="text-muted-foreground mb-6">관리자 승인을 기다리고 있습니다. 승인 후 대시보드를 이용할 수 있습니다.</p>
            <Button variant="outline" onClick={() => navigate("/")}>홈으로</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const viewedQuoteIds = new Set((myViews || []).map((v) => v.quoteId));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-5xl">
          {/* Partner Info Bar */}
          <Card className="border-border/50 shadow-sm mb-6">
            <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-foreground">{partner.companyName}</h1>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                  <Badge variant="secondary"><Award className="w-3 h-3 mr-1" />{GRADE_LABELS[partner.grade || "bronze"]}</Badge>
                  <span>열람권: <strong className="text-foreground">{partner.viewCredits || 0}개</strong></span>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/shop")}>
                <CreditCard className="w-4 h-4 mr-2" /> 열람권 구매
              </Button>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={(v) => navigate(`/dashboard/${v}`)}>
            <TabsList className="bg-muted/50 flex-wrap h-auto gap-1">
              <TabsTrigger value="leads">견적 리드</TabsTrigger>
              <TabsTrigger value="submissions">제출 견적</TabsTrigger>
              <TabsTrigger value="projects">현장 관리</TabsTrigger>
              <TabsTrigger value="shop">상품 구매</TabsTrigger>
            </TabsList>

            {/* Leads */}
            <TabsContent value="leads" className="mt-4 space-y-3">
              {!publicQuotes || publicQuotes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">현재 공개된 견적 요청이 없습니다</div>
              ) : (
                publicQuotes.map((q) => {
                  const viewed = viewedQuoteIds.has(q.id);
                  return (
                    <Card key={q.id} className="border-border/50 shadow-sm">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-foreground">{viewed ? q.title : "***"}</h3>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                              <span>{q.region || "미지정"}</span>
                              <span>{new Date(q.createdAt).toLocaleDateString("ko-KR")}</span>
                              <Badge variant="secondary">{QUOTE_STATUS_LABELS[q.status] || q.status}</Badge>
                            </div>
                            {viewed && q.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{q.description}</p>}
                          </div>
                          <div className="flex gap-2 shrink-0">
                            {!viewed && (
                              <Button size="sm" variant="outline" onClick={() => viewQuote.mutate({ quoteId: q.id })} disabled={viewQuote.isPending}>
                                <Eye className="w-4 h-4 mr-1" /> 열람
                              </Button>
                            )}
                            {viewed && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" onClick={() => setSubmitForm({ quoteId: q.id, amount: "", description: "", estimatedDays: 0 })}>
                                    <Send className="w-4 h-4 mr-1" /> 견적 제출
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader><DialogTitle>견적 제출</DialogTitle></DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label className="text-sm mb-2 block">견적 금액</Label>
                                      <Input placeholder="예: 3,000,000" value={submitForm.amount} onChange={(e) => setSubmitForm({ ...submitForm, amount: e.target.value })} />
                                    </div>
                                    <div>
                                      <Label className="text-sm mb-2 block">예상 소요일</Label>
                                      <Input type="number" placeholder="일" value={submitForm.estimatedDays || ""} onChange={(e) => setSubmitForm({ ...submitForm, estimatedDays: Number(e.target.value) })} />
                                    </div>
                                    <div>
                                      <Label className="text-sm mb-2 block">설명</Label>
                                      <Textarea placeholder="견적에 대한 상세 설명" value={submitForm.description} onChange={(e) => setSubmitForm({ ...submitForm, description: e.target.value })} rows={3} />
                                    </div>
                                    <Button className="w-full" onClick={() => submitQuote.mutate(submitForm)} disabled={submitQuote.isPending}>
                                      {submitQuote.isPending ? "제출 중..." : "견적 제출"}
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            {/* Submissions */}
            <TabsContent value="submissions" className="mt-4 space-y-3">
              {!mySubmissions || mySubmissions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">제출한 견적이 없습니다</div>
              ) : (
                mySubmissions.map((s) => (
                  <Card key={s.id} className="border-border/50 shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground">견적 #{s.quoteId}</h3>
                          <p className="text-sm text-muted-foreground mt-1">금액: {s.amount || "미정"} | 소요일: {s.estimatedDays || "-"}일</p>
                        </div>
                        <Badge variant={s.status === "selected" ? "default" : "secondary"}>{s.status === "selected" ? "선정됨" : "대기 중"}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Projects */}
            <TabsContent value="projects" className="mt-4 space-y-3">
              {!myProjects || myProjects.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">등록된 현장이 없습니다</div>
              ) : (
                myProjects.map((p) => (
                  <Card key={p.id} className="border-border/50 shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground">{p.location || `현장 #${p.id}`}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {p.scheduledDate ? new Date(p.scheduledDate).toLocaleDateString("ko-KR") : "일정 미정"}
                          </p>
                        </div>
                        <Badge variant="secondary">{p.status}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Shop */}
            <TabsContent value="shop" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(products || []).map((p) => (
                  <Card key={p.id} className="border-border/50 shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Package className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-foreground">{p.name}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">{p.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-foreground">{Number(p.price).toLocaleString()}원</span>
                        <Button size="sm" onClick={() => purchaseProduct.mutate({ productId: p.id })} disabled={purchaseProduct.isPending}>
                          구매
                        </Button>
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
