import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link, useLocation } from "wouter";
import { useEffect } from "react";
import { LogIn } from "lucide-react";

export default function Login() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/");
    }
  }, [loading, isAuthenticated, navigate]);

  const handleSocialLogin = (provider: string) => {
    // All social logins go through Manus OAuth
    // The provider parameter is for future direct social integration
    window.location.href = getLoginUrl();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
        <div className="w-full max-w-md px-4">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
              <span className="text-white font-bold text-xl">D</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">로그인</h1>
            <p className="text-muted-foreground text-sm">덕터스에 오신 것을 환영합니다</p>
          </div>

          <Card className="border-border/50 shadow-lg">
            <CardContent className="p-6 space-y-4">
              {/* Social Login Buttons */}
              <button
                onClick={() => handleSocialLogin("kakao")}
                className="w-full flex items-center justify-center gap-3 h-12 rounded-xl font-medium text-sm transition-all hover:opacity-90"
                style={{ backgroundColor: "#FEE500", color: "#191919" }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 3C5.58 3 2 5.79 2 9.21c0 2.17 1.45 4.08 3.64 5.18l-.93 3.41c-.08.3.26.54.52.37l4.07-2.68c.23.02.46.03.7.03 4.42 0 8-2.79 8-6.21S14.42 3 10 3z" fill="#191919"/>
                </svg>
                카카오로 로그인
              </button>

              <button
                onClick={() => handleSocialLogin("naver")}
                className="w-full flex items-center justify-center gap-3 h-12 rounded-xl font-medium text-sm text-white transition-all hover:opacity-90"
                style={{ backgroundColor: "#03C75A" }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M13.36 10.53L6.4 3H3v14h3.64V9.47L13.6 17H17V3h-3.64v7.53z" fill="white"/>
                </svg>
                네이버로 로그인
              </button>

              <button
                onClick={() => handleSocialLogin("google")}
                className="w-full flex items-center justify-center gap-3 h-12 rounded-xl font-medium text-sm border border-border bg-white text-foreground transition-all hover:bg-gray-50"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M19.6 10.23c0-.68-.06-1.36-.17-2.02H10v3.84h5.38a4.6 4.6 0 01-2 3.02v2.5h3.24c1.89-1.74 2.98-4.3 2.98-7.34z" fill="#4285F4"/>
                  <path d="M10 20c2.7 0 4.96-.9 6.62-2.43l-3.24-2.5c-.9.6-2.04.95-3.38.95-2.6 0-4.8-1.76-5.58-4.12H1.08v2.58A9.99 9.99 0 0010 20z" fill="#34A853"/>
                  <path d="M4.42 11.9A6.01 6.01 0 014.1 10c0-.66.12-1.3.32-1.9V5.52H1.08A9.99 9.99 0 000 10c0 1.61.39 3.14 1.08 4.48l3.34-2.58z" fill="#FBBC05"/>
                  <path d="M10 3.98c1.47 0 2.78.5 3.82 1.5l2.86-2.86C14.96.99 12.7 0 10 0A9.99 9.99 0 001.08 5.52l3.34 2.58C5.2 5.74 7.4 3.98 10 3.98z" fill="#EA4335"/>
                </svg>
                Google로 로그인
              </button>

              <div className="relative my-2">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
                  또는
                </span>
              </div>

              {/* 아이디 로그인 */}
              <Link href="/login-local" className="block">
                <Button className="w-full h-12 rounded-xl gap-2 text-sm font-medium">
                  <LogIn className="w-4 h-4" />
                  아이디로 로그인
                </Button>
              </Link>

              {/* Sign Up Link */}
              <div className="text-center pt-2">
                <p className="text-sm text-muted-foreground">
                  아직 계정이 없으신가요?{" "}
                  <Link href="/signup" className="text-primary font-medium hover:underline">
                    회원가입
                  </Link>
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
