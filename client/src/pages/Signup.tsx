import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "wouter";
import { useState } from "react";
import { UserPlus, Building2, User, ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function Signup() {
  const { isAuthenticated, loading } = useAuth();
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const [agreeAll, setAgreeAll] = useState(false);

  const handleAgreeAll = (checked: boolean) => {
    setAgreeAll(checked);
    setAgreeTerms(checked);
    setAgreePrivacy(checked);
    setAgreeMarketing(checked);
  };

  const handleIndividualChange = (field: "terms" | "privacy" | "marketing", checked: boolean) => {
    if (field === "terms") setAgreeTerms(checked);
    if (field === "privacy") setAgreePrivacy(checked);
    if (field === "marketing") setAgreeMarketing(checked);
    const newTerms = field === "terms" ? checked : agreeTerms;
    const newPrivacy = field === "privacy" ? checked : agreePrivacy;
    const newMarketing = field === "marketing" ? checked : agreeMarketing;
    setAgreeAll(newTerms && newPrivacy && newMarketing);
  };

  const canProceed = agreeTerms && agreePrivacy;

  const handleSignup = () => {
    if (!canProceed) { toast.error("필수 약관에 동의해주세요"); return; }
    window.location.href = getLoginUrl();
  };

  // 이미 로그인된 경우
  if (!loading && isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
          <div className="w-full max-w-md px-4">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-100 mb-4">
                <CheckCircle2 className="w-7 h-7 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold mb-2">이미 로그인되어 있습니다</h1>
              <p className="text-muted-foreground text-sm">아래에서 원하시는 서비스를 이용하세요</p>
            </div>
            <Card className="border-border/50 shadow-lg">
              <CardContent className="p-6 space-y-3">
                <Link href="/partner-register">
                  <Button className="w-full h-12 rounded-xl gap-2 text-sm font-medium">
                    <Building2 className="w-4 h-4" />
                    파트너 가입 신청
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </Button>
                </Link>
                <Link href="/quote-request">
                  <Button variant="outline" className="w-full h-12 rounded-xl gap-2 text-sm font-medium">
                    <UserPlus className="w-4 h-4" />
                    견적 의뢰하기
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </Button>
                </Link>
                <Link href="/mypage">
                  <Button variant="outline" className="w-full h-12 rounded-xl gap-2 text-sm font-medium">
                    <User className="w-4 h-4" />
                    마이페이지
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
        <div className="w-full max-w-md px-4">
          {/* 로고 & 타이틀 */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
              <span className="text-white font-bold text-xl">D</span>
            </div>
            <h1 className="text-2xl font-bold mb-2">회원가입</h1>
            <p className="text-muted-foreground text-sm">간편하게 가입하고 덕터스를 시작하세요</p>
          </div>

          {/* 약관 동의 */}
          <Card className="border-border/50 shadow-sm mb-4">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3 pb-3 border-b border-border/50">
                <Checkbox id="agree-all" checked={agreeAll} onCheckedChange={(c) => handleAgreeAll(c === true)} />
                <label htmlFor="agree-all" className="text-sm font-semibold cursor-pointer">전체 동의</label>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox id="agree-terms" checked={agreeTerms} onCheckedChange={(c) => handleIndividualChange("terms", c === true)} className="mt-0.5" />
                <div className="flex-1">
                  <label htmlFor="agree-terms" className="text-sm cursor-pointer">
                    <span className="text-red-500 font-medium">[필수]</span> 서비스 이용약관 동의
                  </label>
                  <Link href="/terms" className="text-xs text-primary hover:underline ml-2">보기</Link>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox id="agree-privacy" checked={agreePrivacy} onCheckedChange={(c) => handleIndividualChange("privacy", c === true)} className="mt-0.5" />
                <div className="flex-1">
                  <label htmlFor="agree-privacy" className="text-sm cursor-pointer">
                    <span className="text-red-500 font-medium">[필수]</span> 개인정보 수집·이용 동의
                  </label>
                  <Link href="/privacy" className="text-xs text-primary hover:underline ml-2">보기</Link>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox id="agree-marketing" checked={agreeMarketing} onCheckedChange={(c) => handleIndividualChange("marketing", c === true)} className="mt-0.5" />
                <div className="flex-1">
                  <label htmlFor="agree-marketing" className="text-sm cursor-pointer">
                    <span className="text-muted-foreground font-medium">[선택]</span> 마케팅 정보 수신 동의
                  </label>
                  <Link href="/marketing" className="text-xs text-primary hover:underline ml-2">보기</Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 가입 버튼 */}
          <Card className="border-border/50 shadow-lg">
            <CardContent className="p-6 space-y-4">
              {/* 카카오 */}
              <button
                onClick={handleSignup}
                disabled={!canProceed}
                className={`w-full flex items-center justify-center gap-3 h-12 rounded-xl font-medium text-sm transition-all ${canProceed ? "hover:opacity-90" : "opacity-50 cursor-not-allowed"}`}
                style={{ backgroundColor: "#FEE500", color: "#191919" }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 3C5.58 3 2 5.79 2 9.21c0 2.17 1.45 4.08 3.64 5.18l-.93 3.41c-.08.3.26.54.52.37l4.07-2.68c.23.02.46.03.7.03 4.42 0 8-2.79 8-6.21S14.42 3 10 3z" fill="#191919"/>
                </svg>
                카카오로 가입
              </button>

              {/* 네이버 */}
              <button
                onClick={handleSignup}
                disabled={!canProceed}
                className={`w-full flex items-center justify-center gap-3 h-12 rounded-xl font-medium text-sm text-white transition-all ${canProceed ? "hover:opacity-90" : "opacity-50 cursor-not-allowed"}`}
                style={{ backgroundColor: "#03C75A" }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M13.36 10.53L6.4 3H3v14h3.64V9.47L13.6 17H17V3h-3.64v7.53z" fill="white"/>
                </svg>
                네이버로 가입
              </button>

              {/* 구글 */}
              <button
                onClick={handleSignup}
                disabled={!canProceed}
                className={`w-full flex items-center justify-center gap-3 h-12 rounded-xl font-medium text-sm border border-border bg-white text-foreground transition-all ${canProceed ? "hover:bg-gray-50" : "opacity-50 cursor-not-allowed"}`}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M19.6 10.23c0-.68-.06-1.36-.17-2.02H10v3.84h5.38a4.6 4.6 0 01-2 3.02v2.5h3.24c1.89-1.74 2.98-4.3 2.98-7.34z" fill="#4285F4"/>
                  <path d="M10 20c2.7 0 4.96-.9 6.62-2.43l-3.24-2.5c-.9.6-2.04.95-3.38.95-2.6 0-4.8-1.76-5.58-4.12H1.08v2.58A9.99 9.99 0 0010 20z" fill="#34A853"/>
                  <path d="M4.42 11.9A6.01 6.01 0 014.1 10c0-.66.12-1.3.32-1.9V5.52H1.08A9.99 9.99 0 000 10c0 1.61.39 3.14 1.08 4.48l3.34-2.58z" fill="#FBBC05"/>
                  <path d="M10 3.98c1.47 0 2.78.5 3.82 1.5l2.86-2.86C14.96.99 12.7 0 10 0A9.99 9.99 0 001.08 5.52l3.34 2.58C5.2 5.74 7.4 3.98 10 3.98z" fill="#EA4335"/>
                </svg>
                Google로 가입
              </button>

              <div className="relative my-2">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">또는</span>
              </div>

              <Button onClick={handleSignup} disabled={!canProceed} className="w-full h-12 rounded-xl gap-2 text-sm font-medium">
                <UserPlus className="w-4 h-4" />
                이메일로 가입
              </Button>

              {!canProceed && (
                <p className="text-xs text-red-500 text-center">필수 약관에 동의해야 가입을 진행할 수 있습니다</p>
              )}

              <div className="text-center pt-2">
                <p className="text-sm text-muted-foreground">
                  이미 계정이 있으신가요?{" "}
                  <Link href="/login" className="text-primary font-medium hover:underline">로그인</Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
