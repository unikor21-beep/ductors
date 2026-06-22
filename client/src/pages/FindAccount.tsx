import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { KeyRound, Loader2, ArrowRight, CheckCircle2, UserSearch } from "lucide-react";

export default function FindAccount() {
  const params = useParams<{ tab?: string }>();
  const [, navigate] = useLocation();
  const initialTab = params.tab === "pw" ? "pw" : "id";
  const [tab, setTab] = useState<"id" | "pw">(initialTab);

  // ===== 아이디 찾기 =====
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [foundId, setFoundId] = useState<string | null>(null);

  const findId = trpc.auth.findUsername.useQuery({ name, email }, { enabled: false });

  const handleFindId = async () => {
    if (!name.trim()) { toast.error("이름을 입력하세요"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error("올바른 이메일을 입력하세요"); return; }
    const r = await findId.refetch();
    if (r.data?.username) setFoundId(r.data.username);
    else if (r.error) { setFoundId(null); toast.error(r.error.message); }
  };

  // ===== 비밀번호 찾기 =====
  const [step, setStep] = useState<1 | 2>(1);
  const [username, setUsername] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");

  const getQuestion = trpc.auth.getSecurityQuestion.useQuery({ username }, { enabled: false });

  const handleFindQuestion = async () => {
    if (!username) { toast.error("아이디를 입력하세요"); return; }
    const r = await getQuestion.refetch();
    if (r.data?.question) { setQuestion(r.data.question); setStep(2); }
    else if (r.error) toast.error(r.error.message);
  };

  const resetPassword = trpc.auth.resetPassword.useMutation({
    onSuccess: () => { toast.success("비밀번호가 재설정되었습니다. 새 비밀번호로 로그인하세요"); navigate("/login"); },
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
            <h1 className="text-2xl font-bold mb-2">계정 찾기</h1>
            <p className="text-muted-foreground text-sm">아이디 또는 비밀번호를 찾을 수 있습니다</p>
          </div>

          <Card className="border-border/50 shadow-lg">
            <CardContent className="p-6">
              <Tabs value={tab} onValueChange={(v) => setTab(v as "id" | "pw")}>
                <TabsList className="grid grid-cols-2 w-full mb-5">
                  <TabsTrigger value="id">아이디 찾기</TabsTrigger>
                  <TabsTrigger value="pw">비밀번호 찾기</TabsTrigger>
                </TabsList>

                {/* 아이디 찾기 */}
                <TabsContent value="id" className="space-y-4 mt-0">
                  {foundId ? (
                    <>
                      <div className="p-4 bg-muted/40 rounded-xl text-center">
                        <CheckCircle2 className="w-7 h-7 text-primary mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-1">회원님의 아이디</p>
                        <p className="text-xl font-bold tracking-wide">{foundId}</p>
                      </div>
                      <div className="flex gap-2">
                        <Link href="/login" className="flex-1">
                          <Button className="w-full h-11 rounded-xl">로그인하기</Button>
                        </Link>
                        <Button variant="outline" className="flex-1 h-11 rounded-xl"
                          onClick={() => { setUsername(foundId); setTab("pw"); }}>
                          비밀번호 찾기
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-muted-foreground">가입 시 입력한 이름과 이메일로 아이디를 찾습니다.</p>
                      <div>
                        <Label className="text-sm font-medium mb-1.5 block">이름</Label>
                        <Input placeholder="가입 시 입력한 이름" autoComplete="off" value={name}
                          onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleFindId()} />
                      </div>
                      <div>
                        <Label className="text-sm font-medium mb-1.5 block">이메일</Label>
                        <Input type="email" placeholder="example@email.com" autoComplete="off" value={email}
                          onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleFindId()} />
                      </div>
                      <Button className="w-full h-12 rounded-xl gap-2" disabled={findId.isFetching} onClick={handleFindId}>
                        {findId.isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserSearch className="w-4 h-4" />}
                        아이디 찾기
                      </Button>
                    </>
                  )}
                </TabsContent>

                {/* 비밀번호 찾기 */}
                <TabsContent value="pw" className="space-y-4 mt-0">
                  {step === 1 ? (
                    <>
                      <p className="text-xs text-muted-foreground">가입한 아이디를 입력하면 보안 질문이 표시됩니다.</p>
                      <div>
                        <Label className="text-sm font-medium mb-1.5 block">아이디</Label>
                        <Input placeholder="아이디" autoComplete="off" value={username}
                          onChange={(e) => setUsername(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleFindQuestion()} />
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
                        <Input placeholder="보안 질문 답변" autoComplete="off" value={answer} onChange={(e) => setAnswer(e.target.value)} />
                      </div>
                      <div className="pt-2 border-t border-border/40">
                        <Label className="text-sm font-medium mb-1.5 block">새 비밀번호</Label>
                        <Input type="password" placeholder="8자 이상" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-sm font-medium mb-1.5 block">새 비밀번호 확인</Label>
                        <Input type="password" placeholder="비밀번호 재입력" autoComplete="new-password" value={newPasswordConfirm} onChange={(e) => setNewPasswordConfirm(e.target.value)} />
                        {newPasswordConfirm && !passwordMatch && <p className="text-xs text-destructive mt-1">비밀번호가 일치하지 않습니다</p>}
                      </div>
                      <Button className="w-full h-12 rounded-xl gap-2" disabled={resetPassword.isPending} onClick={handleReset}>
                        {resetPassword.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                        비밀번호 재설정
                      </Button>
                    </>
                  )}
                </TabsContent>
              </Tabs>

              <p className="text-center text-sm text-muted-foreground pt-4 mt-4 border-t border-border/40">
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
