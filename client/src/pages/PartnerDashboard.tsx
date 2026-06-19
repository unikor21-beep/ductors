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
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { FileText, Eye, Send, Briefcase, CreditCard, Loader2, Clock, Award, AlertCircle, Package, TrendingUp, Star, CheckCircle2, ArrowUp } from "lucide-react";
import { QUOTE_STATUS_LABELS, GRADE_LABELS, GRADE_COLORS } from "@shared/constants";
import PortfolioManager from "@/components/PortfolioManager";

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
  const { data: gradeProgress } = trpc.partners.gradeProgress.useQuery(undefined, { enabled: isAuthenticated && !!partner });

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

  // Grade progress calculations
  const completedProgressPercent = gradeProgress?.nextRequiredCompleted
    ? Math.min(100, Math.round((gradeProgress.completedCount / gradeProgress.nextRequiredCompleted) * 100))
    : 100;
  const ratingProgressPercent = gradeProgress?.nextRequiredRating
    ? Math.min(100, Math.round((gradeProgress.avgRating / gradeProgress.nextRequiredRating) * 100))
    : 100;

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

          {/* Grade Progress Card */}
          {gradeProgress && (
            <Card className="border-border/50 shadow-sm mb-6 overflow-hidden">
              <div className="h-1" style={{ background: `linear-gradient(to right, ${GRADE_COLORS[gradeProgress.currentGrade]}, ${gradeProgress.nextGrade ? GRADE_COLORS[gradeProgress.nextGrade] : GRADE_COLORS[gradeProgress.currentGrade]})` }} />
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-foreground">등급 현황</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: GRADE_COLORS[gradeProgress.currentGrade] }} />
                    <span className="font-bold text-foreground">{GRADE_LABELS[gradeProgress.currentGrade]}</span>
                    {gradeProgress.nextGrade && (
                      <>
                        <ArrowUp className="w-4 h-4 text-muted-foreground" />
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: GRADE_COLORS[gradeProgress.nextGrade] }} />
                        <span className="text-sm text-muted-foreground">{GRADE_LABELS[gradeProgress.nextGrade]}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Completed Projects */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-muted-foreground">시공 완료</span>
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        {gradeProgress.completedCount}건
                        {gradeProgress.nextRequiredCompleted !== null && (
                          <span className="text-muted-foreground font-normal"> / {gradeProgress.nextRequiredCompleted}건</span>
                        )}
                      </span>
                    </div>
                    <Progress value={completedProgressPercent} className="h-2" />
                    {gradeProgress.nextRequiredCompleted !== null && gradeProgress.completedCount < gradeProgress.nextRequiredCompleted && (
                      <p className="text-xs text-muted-foreground mt-1">
                        다음 등급까지 {gradeProgress.nextRequiredCompleted - gradeProgress.completedCount}건 남음
                      </p>
                    )}
                    {completedProgressPercent >= 100 && gradeProgress.nextGrade && (
                      <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> 조건 충족</p>
                    )}
                  </div>

                  {/* Average Rating */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-muted-foreground">평균 평점</span>
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        {gradeProgress.avgRating.toFixed(1)}점
                        {gradeProgress.nextRequiredRating !== null && (
                          <span className="text-muted-foreground font-normal"> / {gradeProgress.nextRequiredRating}점</span>
                        )}
                      </span>
                    </div>
                    <Progress value={ratingProgressPercent} className="h-2" />
                    {gradeProgress.nextRequiredRating !== null && gradeProgress.avgRating < gradeProgress.nextRequiredRating && (
                      <p className="text-xs text-muted-foreground mt-1">
                        다음 등급까지 {(gradeProgress.nextRequiredRating - gradeProgress.avgRating).toFixed(1)}점 필요
                      </p>
                    )}
                    {ratingProgressPercent >= 100 && gradeProgress.nextGrade && (
                      <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> 조건 충족</p>
                    )}
                  </div>
                </div>

                {!gradeProgress.nextGrade && (
                  <div className="mt-4 text-center py-2 bg-primary/5 rounded-lg">
                    <p className="text-sm font-medium text-primary">최고 등급에 도달했습니다!</p>
                  </div>
                )}

                {gradeProgress.nextGrade && completedProgressPercent >= 100 && ratingProgressPercent >= 100 && (
                  <div className="mt-4 text-center py-2 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-green-700">모든 조건을 충족했습니다. 다음 활동 시 등급이 자동 승급됩니다.</p>
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    리뷰 수: {gradeProgress.reviewCount}건 | 등급은 시공 완료 또는 리뷰 등록 시 자동으로 재평가됩니다.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs value={activeTab} onValueChange={(v) => navigate(`/dashboard/${v}`)}>
            <TabsList className="bg-muted/50 flex-wrap h-auto gap-1">
              <TabsTrigger value="leads">견적 리드</TabsTrigger>
              <TabsTrigger value="submissions">제출 견적</TabsTrigger>
              <TabsTrigger value="projects">현장 관리</TabsTrigger>
              <TabsTrigger value="portfolios">포트폴리오</TabsTrigger>
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

            {/* Portfolios */}
            <TabsContent value="portfolios" className="mt-4">
              <PortfolioManager />
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
