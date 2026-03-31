import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowRight, Users, Eye, FileText, BarChart3, Shield, Star } from "lucide-react";
import { PARTNERS_BG_DEFAULT } from "@shared/constants";

const BENEFITS = [
  { icon: Eye, title: "검증된 고객 리드", desc: "실제 시공이 필요한 고객의 견적 요청만 전달합니다" },
  { icon: FileText, title: "견적 제출 시스템", desc: "열람권으로 고객 정보를 확인하고 견적을 제출하세요" },
  { icon: BarChart3, title: "대시보드 관리", desc: "견적, 현장, 일정을 한 곳에서 효율적으로 관리합니다" },
  { icon: Shield, title: "등급 시스템", desc: "활동에 따라 등급이 올라가며 더 많은 혜택을 받습니다" },
  { icon: Star, title: "리뷰 & 포트폴리오", desc: "고객 리뷰와 시공 사례로 신뢰도를 높이세요" },
  { icon: Users, title: "지정 견적", desc: "고객이 직접 파트너를 지정하여 견적을 요청할 수 있습니다" },
];

export default function PartnersInfo() {
  const { isAuthenticated } = useAuth();

  // 로그인된 사용자는 파트너 가입 신청 폼으로, 미로그인 사용자는 회원가입으로
  const registerHref = isAuthenticated ? "/partner-register" : "/signup";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Hero */}
      <section
        className="relative min-h-[50vh] flex items-center justify-center pt-16"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0.4)), url(${PARTNERS_BG_DEFAULT})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="container text-center text-white relative z-10">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">덕터스 파트너스</h1>
          <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
            환기·닥트 전문 시공업체를 위한 고객 매칭 플랫폼
          </p>
          <Link href={registerHref}>
            <Button size="lg" className="gap-2 px-8 py-6 rounded-xl text-base bg-white text-gray-900 hover:bg-white/90">
              파트너 가입 신청 <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-3">파트너스 혜택</h2>
            <p className="text-muted-foreground">덕터스 파트너가 되면 이런 혜택을 받을 수 있습니다</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {BENEFITS.map((b, i) => (
              <Card key={i} className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <b.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{b.title}</h3>
                  <p className="text-sm text-muted-foreground">{b.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary/5">
        <div className="container text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">지금 바로 시작하세요</h2>
          <p className="text-muted-foreground mb-8">파트너 가입 신청 후 관리자 승인을 거쳐 활동을 시작할 수 있습니다</p>
          <Link href={registerHref}>
            <Button size="lg" className="gap-2 px-8">
              파트너 가입 신청 <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
