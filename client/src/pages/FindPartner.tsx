import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Search, Star, MapPin, Award, Building2, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { REGIONS, GRADE_LABELS } from "@shared/constants";

export default function FindPartner() {
  const [searchRegion, setSearchRegion] = useState("");
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState("rating");

  const { data: partners, isLoading } = trpc.partners.list.useQuery();

  const filtered = useMemo(() => {
    if (!partners) return [];
    let result = [...partners];
    if (searchRegion) {
      result = result.filter((p) => (p.regions as string[] || []).includes(searchRegion));
    }
    if (searchText) {
      result = result.filter((p) =>
        p.companyName.toLowerCase().includes(searchText.toLowerCase()) ||
        (p.shortIntro || "").toLowerCase().includes(searchText.toLowerCase())
      );
    }
    if (sortBy === "rating") result.sort((a, b) => Number(b.avgRating || 0) - Number(a.avgRating || 0));
    else if (sortBy === "reviews") result.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
    else if (sortBy === "recent") result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return result;
  }, [partners, searchRegion, searchText, sortBy]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="container">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">파트너 찾기</h1>
            <p className="text-muted-foreground">지역과 전문 분야를 기준으로 최적의 파트너를 찾아보세요</p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="업체명 또는 키워드 검색"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={searchRegion} onValueChange={setSearchRegion}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="전체 지역" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 지역</SelectItem>
                {REGIONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">평점순</SelectItem>
                <SelectItem value="reviews">리뷰순</SelectItem>
                <SelectItem value="recent">최신순</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Building2 className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">검색 결과가 없습니다</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((partner) => (
                <Link key={partner.id} href={`/partner/${partner.id}`}>
                  <Card className="border-border/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer h-full">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          {partner.logoUrl ? (
                            <img src={partner.logoUrl} alt="" className="w-full h-full rounded-xl object-cover" />
                          ) : (
                            <Building2 className="w-6 h-6 text-primary" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-foreground truncate">{partner.companyName}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-1">{partner.shortIntro || "환기·닥트 전문 시공업체"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{Number(partner.avgRating || 0).toFixed(1)}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">리뷰 {partner.reviewCount || 0}건</span>
                        <Badge variant="secondary" className="text-xs">
                          <Award className="w-3 h-3 mr-1" />
                          {GRADE_LABELS[partner.grade || "bronze"]}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="truncate">{(partner.regions as string[] || []).join(", ") || "전국"}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
