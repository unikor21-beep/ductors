import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState } from "react";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { UserPlus, Check, X, Loader2 } from "lucide-react";

const SECURITY_QUESTIONS = [
  "어머니의 성함은?",
  "졸업한 초등학교 이름은?",
  "가장 좋아하는 음식은?",
  "어릴 적 별명은?",
  "첫 반려동물의 이름은?",
];

export default function SignupLocal() {
  const [, navigate] = useLocation();
  const [form, setForm] = useState({
    username: "",
    password: "",
    passwordConfirm: "",
    name: "",
    phone: "",
    securityQuestion: SECURITY_QUESTIONS[0],
    securityAnswer: "",
  });
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [usernameChecked, setUsernameChecked] = useState<boolean | null>(null);

  // 아이디 중복확인
  const checkUsername = trpc.auth.checkUsername.useQuery(
    { username: form.username },
    { enabled: false }
  );

  const handleCheckUsername = async () => {
    if (form.username.length < 4) { toast.error("아이디는 4자 이상이어야 합니다"); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(form.username)) { toast.error("아이디는 영문/숫자/밑줄만 가능합니다"); return; }
    const result = await checkUsername.refetch();
    if (result.data?.available) {
      setUsernameChecked(true);
      toast.success("사용 가능한 아이디입니다");
    } else {
      setUsernameChecked(false);
      toast.error("이미 사용 중인 아이디입니다");
    }
  };

  const signup = trpc.auth.signup.useMutation({
    onSuccess: () => {
      toast.success("회원가입이 완료되었습니다");
      window.location.href = "/";
    },
    onError: (e) => toast.error(e.message),
  });

  const passwordMatch = form.password && form.password === form.passwordConfirm;
  const canSubmit = usernameChecked === true && passwordMatch && form.password.length >= 8
    && form.name && form.securityAnswer && agreeTerms && agreePrivacy;

  const handleSubmit = () => {
    if (usernameChecked !== true) { toast.error("아이디 중복확인을 해주세요"); return; }
    if (!passwordMatch) { toast.error("비밀번호가 일치하지 않습니다"); return; }
    if (form.password.length < 8) { toast.error("비밀번호는 8자 이상이어야 합니다"); return; }
    if (!agreeTerms || !agreePrivacy) { toast.error("필수 약관에 동의해주세요"); return; }
    signup.mutate({
      username: form.username,
      password: form.password,
      name: form.name,
      phone: form.phone || undefined,
      securityQuestion: form.securityQuestion,
      securityAnswer: form.securityAnswer,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
        <div className="w-full max-w-md px-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
              <UserPlus className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">아이디로 회원가입</h1>
            <p className="text-muted-foreground text-sm">소셜 계정 없이 직접 가입합니다</p>
          </div>

          <Card className="border-border/50 shadow-lg">
            <CardContent className="p-6 space-y-4">
              {/* 아이디 */}
              <div>
                <Label className="text-sm font-medium mb-1.5 block">아이디 *</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="영문/숫자 4~20자"
                    value={form.username}
                    onChange={(e) => { setForm({ ...form, username: e.target.value }); setUsernameChecked(null); }}
                  />
                  <Button type="button" variant="outline" onClick={handleCheckUsername} disabled={!form.username || checkUsername.isFetching} className="shrink-0">
                    {checkUsername.isFetching ? "확인 중" : "중복확인"}
                  </Button>
                </div>
                {usernameChecked === true && <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><Check className="w-3 h-3" /> 사용 가능</p>}
                {usernameChecked === false && <p className="text-xs text-destructive mt-1 flex items-center gap-1"><X className="w-3 h-3" /> 사용 불가</p>}
              </div>

              {/* 비밀번호 */}
              <div>
                <Label className="text-sm font-medium mb-1.5 block">비밀번호 *</Label>
                <Input type="password" placeholder="8자 이상" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              <div>
                <Label className="text-sm font-medium mb-1.5 block">비밀번호 확인 *</Label>
                <Input type="password" placeholder="비밀번호 재입력" value={form.passwordConfirm} onChange={(e) => setForm({ ...form, passwordConfirm: e.target.value })} />
                {form.passwordConfirm && !passwordMatch && <p className="text-xs text-destructive mt-1">비밀번호가 일치하지 않습니다</p>}
                {passwordMatch && <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><Check className="w-3 h-3" /> 일치</p>}
              </div>

              {/* 이름 */}
              <div>
                <Label className="text-sm font-medium mb-1.5 block">이름 *</Label>
                <Input placeholder="이름" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>

              {/* 전화번호 (선택) */}
              <div>
                <Label className="text-sm font-medium mb-1.5 block">전화번호 <span className="text-xs text-muted-foreground font-normal">(선택)</span></Label>
                <Input placeholder="010-0000-0000" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>

              {/* 보안 질문 */}
              <div className="pt-2 border-t border-border/40">
                <Label className="text-sm font-medium mb-1.5 block">보안 질문 * <span className="text-xs text-muted-foreground font-normal">(비밀번호 찾기에 사용)</span></Label>
                <Select value={form.securityQuestion} onValueChange={(v) => setForm({ ...form, securityQuestion: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SECURITY_QUESTIONS.map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input className="mt-2" placeholder="답변 입력" value={form.securityAnswer} onChange={(e) => setForm({ ...form, securityAnswer: e.target.value })} />
              </div>

              {/* 약관 동의 */}
              <div className="pt-2 border-t border-border/40 space-y-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={agreeTerms} onCheckedChange={(v) => setAgreeTerms(v === true)} />
                  <span><span className="text-destructive font-medium">[필수]</span> 서비스 이용약관 동의</span>
                  <Link href="/terms" className="text-xs text-primary hover:underline ml-auto">보기</Link>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={agreePrivacy} onCheckedChange={(v) => setAgreePrivacy(v === true)} />
                  <span><span className="text-destructive font-medium">[필수]</span> 개인정보 수집·이용 동의</span>
                  <Link href="/privacy" className="text-xs text-primary hover:underline ml-auto">보기</Link>
                </label>
              </div>

              <Button className="w-full h-12 rounded-xl gap-2" disabled={!canSubmit || signup.isPending} onClick={handleSubmit}>
                {signup.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                회원가입
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                이미 계정이 있으신가요? <Link href="/login" className="text-primary hover:underline">로그인</Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
