import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { KeyRound, Loader2, Check, X } from "lucide-react";
import { checkPassword, isPasswordValid, PASSWORD_RULES } from "@shared/password";

export default function ChangePassword() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/login");
  }, [loading, isAuthenticated, navigate]);

  const checks = checkPassword(next);
  const strong = isPasswordValid(next);
  const match = next && next === confirm;

  const change = trpc.auth.changePassword.useMutation({
    onSuccess: () => { toast.success("비밀번호가 변경되었습니다"); navigate("/mypage"); },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = () => {
    if (!current) { toast.error("현재 비밀번호를 입력하세요"); return; }
    if (!strong) { toast.error("새 비밀번호 조건을 확인해주세요"); return; }
    if (!match) { toast.error("새 비밀번호가 일치하지 않습니다"); return; }
    change.mutate({ currentPassword: current, newPassword: next });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
        <div className="w-full max-w-md px-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
              <KeyRound className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">비밀번호 변경</h1>
            <p className="text-muted-foreground text-sm">안전을 위해 주기적으로 변경하는 것을 권장합니다</p>
          </div>

          <Card className="border-border/50 shadow-lg">
            <CardContent className="p-6 space-y-4">
              <div>
                <Label className="text-sm font-medium mb-1.5 block">현재 비밀번호</Label>
                <Input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
              </div>
              <div className="pt-2 border-t border-border/40">
                <Label className="text-sm font-medium mb-1.5 block">새 비밀번호</Label>
                <Input type="password" placeholder="영문·숫자·특수문자 조합 8~20자" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
                {next && (
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2">
                    {PASSWORD_RULES.map((r) => {
                      const ok = checks[r.key];
                      return (
                        <span key={r.key} className={`text-xs flex items-center gap-1 ${ok ? "text-green-600" : "text-muted-foreground"}`}>
                          {ok ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} {r.label}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium mb-1.5 block">새 비밀번호 확인</Label>
                <Input type="password" placeholder="비밀번호 재입력" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                {confirm && !match && <p className="text-xs text-destructive mt-1">비밀번호가 일치하지 않습니다</p>}
              </div>
              <Button className="w-full h-12 rounded-xl gap-2" disabled={change.isPending || !strong || !match || !current} onClick={handleSubmit}>
                {change.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                비밀번호 변경
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
