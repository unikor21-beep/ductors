import { useAuth } from "@/_core/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { FileText, Search, Wind, ArrowRight, Calculator, Users, Shield, Star, Zap } from "lucide-react";
import { HERO_BG_DEFAULT, SECTION3_BG_DEFAULT, SETTING_KEYS } from "@shared/constants";
import { trpc } from "@/lib/trpc";
import { useMemo, useEffect } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  // 파트너가 로그인 직후 홈에 도착하면 대시보드로 1회 이동
  useEffect(() => {
    // user 정보가 아직 로딩 중이면 대기
    if (loading) return;

    const justLoggedIn = sessionStorage.getItem("justLoggedIn") === "1"
      || new URLSearchParams(window.location.search).get("justLoggedIn") === "1";
    if (!justLoggedIn) return;

    // 로그인 직후인데 아직 user가 안 잡혔으면 다음 렌더까지 대기 (신호 유지)
    if (!user) return;

    // 신호 소비
    sessionStorage.removeItem("justLoggedIn");
    if (window.location.search.includes("justLoggedIn")) {
      window.history.replaceState({}, "", "/");
    }

    // 파트너면 대시보드, 관리자면 관리자 페이지로 이동
    if (user.role === "partner") {
      navigate("/dashboard");
    } else if (user.role === "admin") {
      navigate("/admin");
    }
  }, [loading, user, navigate]);

  // Fetch admin-managed background images from DB settings
  const { data: heroBgSetting } = trpc.settings.get.useQuery(
    { key: SETTING_KEYS.HERO_BG },
    { staleTime: 5 * 60 * 1000 }
  );
  const { data: section3BgSetting } = trpc.settings.get.useQuery(
    { key: SETTING_KEYS.SECTION3_BG },
    { staleTime: 5 * 60 * 1000 }
  );

  const heroBg = heroBgSetting || HERO_BG_DEFAULT;
  const section3Bg = section3BgSetting || SECTION3_BG_DEFAULT;

  const heroStyle = useMemo(() => ({
    backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0.4)), url(${heroBg})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  }), [heroBg]);

  const section3Style = useMemo(() => ({
    backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.5)), url(${section3Bg})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  }), [section3Bg]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Section 1: Hero - Customer Entry */}
      <section
        className="relative min-h-[85vh] flex items-center justify-center pt-16"
        style={heroStyle}
      >
        <div className="container text-center text-white relative z-10">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight tracking-tight">
              환기·닥트 시공<br />
              <span className="text-lime-300">전문가를 만나보세요</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-10 font-light">
              견적 의뢰부터 시공 완료까지, 덕터스가 함께합니다
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user?.role === "partner" ? (
                <Button size="lg" disabled className="w-full sm:w-auto gap-3 text-base px-8 py-6 rounded-xl bg-white/40 text-gray-900/40 shadow-lg cursor-not-allowed">
                  <FileText className="w-5 h-5" />
                  견적의뢰 (파트너 불가)
                </Button>
              ) : (
                <Link href="/quote-request">
                  <Button size="lg" className="w-full sm:w-auto gap-3 text-base px-8 py-6 rounded-xl bg-white text-gray-900 hover:bg-white/90 shadow-lg">
                    <FileText className="w-5 h-5" />
                    견적의뢰
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              )}
              <Link href="/find-partner">
                <Button size="lg" variant="outline" className="w-full sm:w-auto gap-3 text-base px-8 py-6 rounded-xl border-white/30 text-white hover:bg-white/10 bg-transparent">
                  <Search className="w-5 h-5" />
                  파트너찾기
                </Button>
              </Link>
            </div>
          </div>
        </div>
        {/* Gradient fade to white */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Section 2: Ventilation Calculator */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Calculator className="w-4 h-4" />
              환기설계 계산기
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              간편한 환기설계 계산
            </h2>
            <p className="text-lg text-muted-foreground">
              건물 유형과 면적만 입력하면 필요 환기량을 바로 확인할 수 있습니다
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm text-center hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-lime-50 flex items-center justify-center mx-auto mb-4">
                  <Wind className="w-6 h-6 text-lime-700" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">환기량 계산</h3>
                <p className="text-sm text-muted-foreground">건물 유형별 필요 환기량을 자동으로 산출</p>
              </div>
              <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm text-center hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">즉시 결과</h3>
                <p className="text-sm text-muted-foreground">입력 즉시 결과를 확인하고 견적에 활용</p>
              </div>
              <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm text-center hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">무료 사용</h3>
                <p className="text-sm text-muted-foreground">비회원도 자유롭게 환기설계 계산 가능</p>
              </div>
            </div>
            <div className="text-center">
              <Link href="/ventilation">
                <Button size="lg" className="gap-2 px-8 py-6 rounded-xl text-base">
                  <Calculator className="w-5 h-5" />
                  환기설계 시작하기
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Partners Entry */}
      <section
        className="relative py-24 md:py-32"
        style={section3Style}
      >
        <div className="container text-center text-white relative z-10">
          <div className="max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 text-white text-sm font-medium mb-6">
              <Users className="w-4 h-4" />
              파트너스
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              덕터스 파트너가 되어보세요
            </h2>
            <p className="text-lg text-white/80 mb-8 font-light">
              검증된 고객 리드를 통해 안정적인 매출을 확보하세요
            </p>
            <div className="grid grid-cols-3 gap-4 mb-10 max-w-md mx-auto">
              <div className="text-center">
                <div className="text-2xl font-bold text-lime-300">100+</div>
                <div className="text-xs text-white/60 mt-1">등록 파트너</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-lime-300">500+</div>
                <div className="text-xs text-white/60 mt-1">월 견적 요청</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-lime-300">4.8</div>
                <div className="text-xs text-white/60 mt-1 flex items-center justify-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  평균 평점
                </div>
              </div>
            </div>
            <Link href="/partners-info">
              <Button size="lg" className="gap-2 px-8 py-6 rounded-xl text-base bg-white text-gray-900 hover:bg-white/90 shadow-lg">
                파트너스 자세히 알아보기
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
