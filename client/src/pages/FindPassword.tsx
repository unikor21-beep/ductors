import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { KeyRound, Loader2, ArrowRight } from "lucide-react";

export default function FindPassword() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<1 | 2>(1);
  const [username, setUsername] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");

  // 1단계: 아이디 → 보안질문 조회
  const getQuestion = trpc.auth.getSecurityQuestion.useQuery(
    { username },
    { enabled: false }
  );

  const handleFindQuestion = async () => {
    if (!username) { toast.error("아이디를 입력하세요"); return; }
    const result = await getQuestion.refetch();
    if (result.data?.question) {
      setQuestion(result.data.question);
      setStep(2);
    } else if (result.error) {
      toast.error(result.error.message);
    }
  };

  // 2단계: 보안답변 + 새 비밀번호
  const resetPassword = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      toast.success("비밀번호가 재설정되었습니다. 새 비밀번호로 로그인하세요");
      navigate("/login");
    },
    onError: (e) => toast.error(e.message),
  });

  const passwordMatch = newPassword && newPassword === newPasswordConfirm;

  const handleReset = () => {
    if (!answer) { toast.error("보안 질문 답을 입력하세요"); return; }
    if (newPassword.length < 8) { toast.error("비밀번호는 8자 이상이어야 합니다"); return; }
    if (!passwordMatch) { toast.error("비밀번호가 일치하지 않습니다"); return; }
    resetPassword.mutate({ username, securityAnswer: answer, newPassword });
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
            <h1 className="text-2xl font-bold mb-2">비밀번호 찾기</h1>
            <p className="text-muted-foreground text-sm">
              {step === 1 ? "가입한 아이디를 입력하세요" : "보안 질문에 답하고 새 비밀번호를 설정하세요"}
            </p>
          </div>

          <Card className="border-border/50 shadow-lg">
            <CardContent className="p-6 space-y-4">
              {step === 1 ? (
                <>
                  <div>
                    <Label className="text-sm font-medium mb-1.5 block">아이디</Label>
                    <Input placeholder="아이디" value={username} onChange={(e) => setUsername(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleFindQuestion()} />
                  </div>
                  <Button className="w-full h-12 rounded-xl gap-2" disabled={getQuestion.isFetching} onClick={handleFindQuestion}>
                    {getQuestion.isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    다음
                  </Button>
                </>
              ) : (
                <>
                  <div className="p-3 bg-muted/40 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">보안 질문</p>
                    <p className="text-sm font-medium">{question}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-1.5 block">답변</Label>
                    <Input placeholder="보안 질문 답변" value={answer} onChange={(e) => setAnswer(e.target.value)} />
                  </div>
                  <div className="pt-2 border-t border-border/40">
                    <Label className="text-sm font-medium mb-1.5 block">새 비밀번호</Label>
                    <Input type="password" placeholder="8자 이상" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-1.5 block">새 비밀번호 확인</Label>
                    <Input type="password" placeholder="비밀번호 재입력" value={newPasswordConfirm} onChange={(e) => setNewPasswordConfirm(e.target.value)} />
                    {newPasswordConfirm && !passwordMatch && <p className="text-xs text-destructive mt-1">비밀번호가 일치하지 않습니다</p>}
                  </div>
                  <Button className="w-full h-12 rounded-xl gap-2" disabled={resetPassword.isPending} onClick={handleReset}>
                    {resetPassword.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                    비밀번호 재설정
                  </Button>
                  <button onClick={() => setStep(1)} className="w-full text-sm text-muted-foreground hover:underline">
                    아이디 다시 입력
                  </button>
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
