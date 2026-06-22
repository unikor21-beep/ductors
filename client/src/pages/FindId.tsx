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
import { UserSearch, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";

export default function FindId() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const find = trpc.auth.findUsername.useQuery(
    { name, email },
    { enabled: false }
  );

  const handleFind = async () => {
    if (!name.trim()) { toast.error("이름을 입력하세요"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error("올바른 이메일을 입력하세요"); return; }
    const r = await find.refetch();
    if (r.data?.maskedUsername) {
      setResult(r.data.maskedUsername);
    } else if (r.error) {
      setResult(null);
      toast.error(r.error.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
        <div className="w-full max-w-md px-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
              <UserSearch className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">아이디 찾기</h1>
            <p className="text-muted-foreground text-sm">가입 시 입력한 이름과 이메일로 아이디를 찾습니다</p>
          </div>

          <Card className="border-border/50 shadow-lg">
            <CardContent className="p-6 space-y-4">
              {result ? (
                <>
                  <div className="p-4 bg-muted/40 rounded-xl text-center">
                    <CheckCircle2 className="w-7 h-7 text-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-1">회원님의 아이디</p>
                    <p className="text-xl font-bold tracking-wide">{result}</p>
                    <p className="text-xs text-muted-foreground mt-2">보안을 위해 일부만 표시됩니다</p>
                  </div>
                  <div className="flex gap-2">
                    <Link href="/login" className="flex-1">
                      <Button className="w-full h-11 rounded-xl">로그인하기</Button>
                    </Link>
                    <Link href="/find-password" className="flex-1">
                      <Button variant="outline" className="w-full h-11 rounded-xl">비밀번호 찾기</Button>
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label className="text-sm font-medium mb-1.5 block">이름</Label>
                    <Input placeholder="가입 시 입력한 이름" value={name} onChange={(e) => setName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleFind()} />
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-1.5 block">이메일</Label>
                    <Input type="email" placeholder="example@email.com" value={email} onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleFind()} />
                  </div>
                  <Button className="w-full h-12 rounded-xl gap-2" disabled={find.isFetching} onClick={handleFind}>
                    {find.isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    아이디 찾기
                  </Button>
                </>
              )}

              <p className="text-center text-sm text-muted-foreground pt-2 border-t border-border/40">
                <Link href="/login" className="text-primary hover:underline">로그인으로 돌아가기</Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
