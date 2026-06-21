import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useParams } from "wouter";
import { Star, MapPin, Award, Building2, FileText, Phone, Mail, Loader2, ArrowLeft } from "lucide-react";
import PartnerAvatar from "@/components/PartnerAvatar";
import { GRADE_LABELS, GRADE_COLORS } from "@shared/constants";

export default function PartnerDetail() {
  const params = useParams<{ id: string }>();
  const partnerId = Number(params.id);

  const { data: partner, isLoading } = trpc.partners.getById.useQuery({ id: partnerId });
  const { data: reviews } = trpc.reviews.byPartner.useQuery({ partnerId });
  const { data: portfolios } = trpc.portfolios.byPartner.useQuery({ partnerId });
  const { data: allCategories } = trpc.categories.list.useQuery();

  // 전문분야 값이 카테고리 ID(숫자)면 이름으로 변환, 아니면 그대로 (옛날 텍스트 호환)
  const specialtyLabel = (s: string) => {
    const cat = (allCategories || []).find((c: any) => String(c.id) === String(s));
    return cat ? cat.name : s;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center pt-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center pt-16">
          <p className="text-muted-foreground">파트너를 찾을 수 없습니다</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-4xl">
          <Link href="/find-partner">
            <span className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 cursor-pointer">
              <ArrowLeft className="w-4 h-4" /> 파트너 목록으로
            </span>
          </Link>

          {/* Profile Header */}
          <Card className="border-border/50 shadow-sm mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start gap-5">
                <PartnerAvatar logoUrl={partner.logoUrl} companyName={partner.companyName} size="lg" />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-foreground">{partner.companyName}</h1>
                    <Badge style={{ backgroundColor: GRADE_COLORS[partner.grade || "bronze"] + "20", color: GRADE_COLORS[partner.grade || "bronze"] }}>
                      <Award className="w-3 h-3 mr-1" />
                      {GRADE_LABELS[partner.grade || "bronze"]}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mb-3">{partner.shortIntro || "환기·닥트 전문 시공업체"}</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{Number(partner.avgRating || 0).toFixed(1)}</span>
                      <span className="text-muted-foreground">({partner.reviewCount || 0}건)</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {(partner.regions as string[] || []).join(", ") || "전국"}
                    </div>
                    {partner.phone && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        {partner.phone}
                      </div>
                    )}
                  </div>
                </div>
                <Link href={`/quote-request?type=designated&partner=${partner.id}`}>
                  <Button className="gap-2 shrink-0">
                    <FileText className="w-4 h-4" />
                    지정 견적 요청
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="intro" className="space-y-4">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="intro">업체 소개</TabsTrigger>
              <TabsTrigger value="portfolio">포트폴리오 ({portfolios?.length || 0})</TabsTrigger>
              <TabsTrigger value="reviews">리뷰 ({reviews?.length || 0})</TabsTrigger>
            </TabsList>

            <TabsContent value="intro">
              <Card className="border-border/50 shadow-sm">
                <CardContent className="p-6">
                  <div className="prose prose-sm max-w-none">
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                      {partner.description || "업체 소개가 아직 등록되지 않았습니다."}
                    </p>
                  </div>
                  {partner.specialties && (partner.specialties as string[]).length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-sm font-semibold text-foreground mb-3">전문 분야</h3>
                      <div className="flex flex-wrap gap-2">
                        {Array.from(new Set((partner.specialties as string[]).map(specialtyLabel))).map((label) => (
                          <Badge key={label} variant="secondary">{label}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="portfolio">
              {portfolios && portfolios.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {portfolios.map((p) => (
                    <Card key={p.id} className="border-border/50 shadow-sm overflow-hidden">
                      {p.images && (p.images as string[])[0] && (
                        <div className="aspect-video bg-muted">
                          <img src={(p.images as string[])[0]} alt={p.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-foreground mb-1">{p.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">등록된 포트폴리오가 없습니다</div>
              )}
            </TabsContent>

            <TabsContent value="reviews">
              {reviews && reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <Card key={r.id} className="border-border/50 shadow-sm">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted"}`} />
                          ))}
                          <span className="text-xs text-muted-foreground ml-2">
                            {new Date(r.createdAt).toLocaleDateString("ko-KR")}
                          </span>
                        </div>
                        <p className="text-sm text-foreground">{r.content || "리뷰 내용이 없습니다."}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">등록된 리뷰가 없습니다</div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
