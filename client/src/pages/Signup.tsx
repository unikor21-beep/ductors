import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { UserPlus, Check, X, Loader2, Wind } from "lucide-react";
import { toast } from "sonner";
import { SIGNUP_BG_DEFAULT, SETTING_KEYS } from "@shared/constants";
import { AREA_CODES, formatMobileInput, isValidMobile, formatLandlineLocal, composeLandline } from "@shared/phone";

const SECURITY_QUESTIONS = [
  "어머니의 성함은?",
  "졸업한 초등학교 이름은?",
  "가장 좋아하는 음식은?",
  "어릴 적 별명은?",
  "첫 반려동물의 이름은?",
];

export default function Signup() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) navigate("/");
  }, [loading, isAuthenticated, navigate]);

  // 관리자가 설정한 가입 페이지 배경
  const { data: signupBgSetting } = trpc.settings.get.useQuery(
    { key: SETTING_KEYS.SIGNUP_BG },
    { staleTime: 5 * 60 * 1000 }
  );
  const signupBg = signupBgSetting || SIGNUP_BG_DEFAULT;

  // 약관 동의
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const agreeAll = agreeTerms && agreePrivacy && agreeMarketing;
  const canAgree = agreeTerms && agreePrivacy;
  const handleAgreeAll = (checked: boolean) => {
    setAgreeTerms(checked); setAgreePrivacy(checked); setAgreeMarketing(checked);
  };

  // 가입 폼
  const [form, setForm] = useState({
    username: "", password: "", passwordConfirm: "", name: "", email: "",
    mobile: "", landlineArea: "02", landlineLocal: "",
    securityQuestion: SECURITY_QUESTIONS[0], securityAnswer: "",
  });
  const [usernameChecked, setUsernameChecked] = useState<boolean | null>(null);

  const checkUsername = trpc.auth.checkUsername.useQuery({ username: form.username }, { enabled: false });
  const handleCheckUsername = async () => {
    if (form.username.length < 4) { toast.error("아이디는 4자 이상이어야 합니다"); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(form.username)) { toast.error("아이디는 영문/숫자/밑줄만 가능합니다"); return; }
    const result = await checkUsername.refetch();
    if (result.data?.available) { setUsernameChecked(true); toast.success("사용 가능한 아이디입니다"); }
    else { setUsernameChecked(false); toast.error("이미 사용 중인 아이디입니다"); }
  };

  const signup = trpc.auth.signup.useMutation({
    onSuccess: () => { toast.success("회원가입이 완료되었습니다"); window.location.href = "/"; },
    onError: (e) => toast.error(e.message),
  });

  const passwordMatch = form.password && form.password === form.passwordConfirm;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const formValid = usernameChecked === true && passwordMatch && form.password.length >= 8
    && form.name && emailValid && isValidMobile(form.mobile) && form.securityAnswer;

  const handleSubmit = () => {
    if (!canAgree) { toast.error("필수 약관에 동의해주세요"); return; }
    if (usernameChecked !== true) { toast.error("아이디 중복확인을 해주세요"); return; }
    if (!passwordMatch) { toast.error("비밀번호가 일치하지 않습니다"); return; }
    if (form.password.length < 8) { toast.error("비밀번호는 8자 이상이어야 합니다"); return; }
    if (!emailValid) { toast.error("올바른 이메일을 입력하세요"); return; }
    if (!isValidMobile(form.mobile)) { toast.error("휴대전화 번호를 정확히 입력하세요"); return; }
    signup.mutate({
      username: form.username, password: form.password, name: form.name,
      email: form.email, phone: form.mobile,
      landline: composeLandline(form.landlineArea, form.landlineLocal) || undefined,
      securityQuestion: form.securityQuestion, securityAnswer: form.securityAnswer,
    });
  };

  // SNS 가입 (필수 약관 동의 후)
  const handleSocialSignup = () => {
    if (!canAgree) { toast.error("먼저 아래 필수 약관에 동의해주세요"); return; }
    window.location.href = getLoginUrl();
  };
  const snsClass = (base: string) => `w-full flex items-center justify-center gap-3 h-11 rounded-xl font-medium text-sm transition-all ${canAgree ? base : "opacity-50 cursor-not-allowed"}`;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-16">
        <div className="grid md:grid-cols-2 min-h-[calc(100vh-4rem)]">
          {/* 왼쪽: 브랜드 이미지 패널 (데스크톱만) */}
          <div
            className="hidden md:flex relative items-center justify-center p-12 text-white"
            style={{
              backgroundImage: `linear-gradient(135deg, rgba(20,83,45,0.92), rgba(22,101,52,0.82)), url(${signupBg})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="max-w-sm">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/15 backdrop-blur mb-6">
                <Wind className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-3xl font-bold leading-snug mb-3">덕터스와 함께<br />시작하세요</h2>
              <p className="text-white/80 text-lg mb-8">Good Air, Better Life!</p>
              <ul className="space-y-3 text-white/90 text-sm">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 shrink-0" /> 환기·닥트 시공 견적을 한 번에 비교</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 shrink-0" /> 검증된 파트너 업체와 안전하게 매칭</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 shrink-0" /> 가입은 1분이면 충분합니다</li>
              </ul>
            </div>
          </div>

          {/* 오른쪽: 가입 (SNS 먼저 → 폼) */}
          <div className="flex items-center justify-center p-6 md:p-12">
            <div className="w-full max-w-md py-8">
              <h1 className="text-2xl font-bold mb-1">회원가입</h1>
              <p className="text-muted-foreground text-sm mb-6">SNS로 빠르게, 또는 아이디로 가입하세요</p>

              <div className="space-y-4">
                {/* 약관 동의 (먼저 — SNS·아이디 가입 모두 동의 필요) */}
                <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 space-y-2.5">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-border/40">
                    <Checkbox id="agree-all" checked={agreeAll} onCheckedChange={(c) => handleAgreeAll(c === true)} />
                    <label htmlFor="agree-all" className="text-sm font-semibold cursor-pointer">전체 동의</label>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Checkbox id="agree-terms" checked={agreeTerms} onCheckedChange={(c) => setAgreeTerms(c === true)} />
                    <label htmlFor="agree-terms" className="text-sm cursor-pointer flex-1"><span className="text-red-500 font-medium">[필수]</span> 서비스 이용약관 동의</label>
                    <Link href="/terms" className="text-xs text-primary hover:underline">보기</Link>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Checkbox id="agree-privacy" checked={agreePrivacy} onCheckedChange={(c) => setAgreePrivacy(c === true)} />
                    <label htmlFor="agree-privacy" className="text-sm cursor-pointer flex-1"><span className="text-red-500 font-medium">[필수]</span> 개인정보 수집·이용 동의</label>
                    <Link href="/privacy" className="text-xs text-primary hover:underline">보기</Link>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Checkbox id="agree-marketing" checked={agreeMarketing} onCheckedChange={(c) => setAgreeMarketing(c === true)} />
                    <label htmlFor="agree-marketing" className="text-sm cursor-pointer flex-1"><span className="text-muted-foreground font-medium">[선택]</span> 마케팅 정보 수신 동의</label>
                    <Link href="/marketing" className="text-xs text-primary hover:underline">보기</Link>
                  </div>
                  {!canAgree && <p className="text-xs text-red-500 pt-0.5">필수 약관에 동의하면 가입을 진행할 수 있습니다</p>}
                </div>

                {/* SNS 가입 */}
                <button onClick={handleSocialSignup} disabled={!canAgree} className={snsClass("hover:opacity-90")} style={{ backgroundColor: "#FEE500", color: "#191919" }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 3C5.58 3 2 5.79 2 9.21c0 2.17 1.45 4.08 3.64 5.18l-.93 3.41c-.08.3.26.54.52.37l4.07-2.68c.23.02.46.03.7.03 4.42 0 8-2.79 8-6.21S14.42 3 10 3z" fill="#191919"/></svg>
                  카카오로 가입
                </button>
                <button onClick={handleSocialSignup} disabled={!canAgree} className={snsClass("text-white hover:opacity-90")} style={{ backgroundColor: "#03C75A" }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M13.36 10.53L6.4 3H3v14h3.64V9.47L13.6 17H17V3h-3.64v7.53z" fill="white"/></svg>
                  네이버로 가입
                </button>
                <button onClick={handleSocialSignup} disabled={!canAgree} className={snsClass("border border-border bg-white text-foreground hover:bg-gray-50")}>
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
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">또는 아이디로 가입</span>
                </div>

                {/* 아이디 가입 폼 */}
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">아이디 *</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="영문/숫자 4~20자"
                      autoComplete="off"
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

                <div>
                  <Label className="text-sm font-medium mb-1.5 block">비밀번호 *</Label>
                  <Input type="password" placeholder="8자 이상" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">비밀번호 확인 *</Label>
                  <Input type="password" placeholder="비밀번호 재입력" autoComplete="new-password" value={form.passwordConfirm} onChange={(e) => setForm({ ...form, passwordConfirm: e.target.value })} />
                  {form.passwordConfirm && !passwordMatch && <p className="text-xs text-destructive mt-1">비밀번호가 일치하지 않습니다</p>}
                  {passwordMatch && <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><Check className="w-3 h-3" /> 일치</p>}
                </div>
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">이름 *</Label>
                  <Input placeholder="이름" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">이메일 *</Label>
                  <Input type="email" placeholder="example@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  {form.email && !emailValid && (
                    <p className="text-xs text-destructive mt-1">올바른 이메일 형식이 아닙니다 (예: name@email.com)</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">휴대전화 *</Label>
                  <Input
                    placeholder="010-0000-0000"
                    inputMode="numeric"
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: formatMobileInput(e.target.value) })}
                  />
                  {form.mobile && !isValidMobile(form.mobile) && (
                    <p className="text-xs text-destructive mt-1">휴대전화 번호를 정확히 입력하세요 (예: 010-1234-5678)</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">전화번호 <span className="text-xs text-muted-foreground font-normal">(선택)</span></Label>
                  <div className="flex gap-2">
                    <Select value={form.landlineArea} onValueChange={(v) => setForm({ ...form, landlineArea: v })}>
                      <SelectTrigger className="w-24 shrink-0"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {AREA_CODES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="123-4567"
                      inputMode="numeric"
                      value={form.landlineLocal}
                      onChange={(e) => setForm({ ...form, landlineLocal: formatLandlineLocal(e.target.value) })}
                    />
                  </div>
                </div>
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

                {/* 가입 버튼 (밝은 그린) */}
                <Button
                  className="w-full h-12 rounded-xl gap-2"
                  disabled={!canAgree || !formValid || signup.isPending}
                  onClick={handleSubmit}
                >
                  {signup.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  회원가입
                </Button>

                <p className="text-center text-sm text-muted-foreground pt-2">
                  이미 계정이 있으신가요?{" "}
                  <Link href="/login" className="text-primary font-medium hover:underline">로그인</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
