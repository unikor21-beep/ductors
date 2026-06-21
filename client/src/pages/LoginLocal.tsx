import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { LogIn, Loader2 } from "lucide-react";

export default function LoginLocal() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const login = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      toast.success("로그인되었습니다");
      // 역할에 따라 이동: 파트너→대시보드, 관리자→관리자, 고객→홈
      if (data.role === "partner") {
        window.location.href = "/dashboard";
      } else if (data.role === "admin") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/";
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const handleLogin = () => {
    if (!username || !password) { toast.error("아이디와 비밀번호를 입력하세요"); return; }
    login.mutate({ username, password });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
        <div className="w-full max-w-md px-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
              <LogIn className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">아이디 로그인</h1>
            <p className="text-muted-foreground text-sm">아이디와 비밀번호로 로그인합니다</p>
          </div>

          <Card className="border-border/50 shadow-lg">
            <CardContent className="p-6 space-y-4">
              <div>
                <Label className="text-sm font-medium mb-1.5 block">아이디</Label>
                <Input placeholder="아이디" value={username} onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
              </div>
              <div>
                <Label className="text-sm font-medium mb-1.5 block">비밀번호</Label>
                <Input type="password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
              </div>

              <Button className="w-full h-12 rounded-xl gap-2" disabled={login.isPending} onClick={handleLogin}>
                {login.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                로그인
              </Button>

              <div className="flex items-center justify-between text-sm">
                <Link href="/login" className="text-muted-foreground hover:underline">소셜 로그인</Link>
                <Link href="/find-password" className="text-muted-foreground hover:underline">비밀번호 찾기</Link>
              </div>

              <p className="text-center text-sm text-muted-foreground pt-2 border-t border-border/40">
                계정이 없으신가요? <Link href="/signup-local" className="text-primary hover:underline">회원가입</Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
