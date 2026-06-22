import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AddressSearch from "@/components/AddressSearch";
import PartnerAvatar from "@/components/PartnerAvatar";
import MyQuoteCard from "@/components/MyQuoteCard";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { useEffect, useState, useRef } from "react";
import { FileText, Loader2, User, ImagePlus, X, Save, AlertTriangle, Check } from "lucide-react";
import { REGIONS, REGION_GROUPS, SECURITY_QUESTIONS } from "@shared/constants";
import { AREA_CODES, formatMobileInput, isValidMobile, formatLandlineLocal, composeLandline } from "@shared/phone";
import { toast } from "sonner";

// ── 파트너 마이페이지 ────────────────────────────────────
function PartnerMyPage() {
  const { data: partner, isLoading } = trpc.partners.me.useQuery();
  const utils = trpc.useUtils();
  const logoInputRef = useRef<HTMLInputElement>(null);

  // 전문분야 = 대분류 카테고리
  const { data: allCategories } = trpc.categories.list.useQuery();
  const parentCategories = (allCategories || []).filter((c: any) => !c.parentId);

  const [form, setForm] = useState({
    companyName: "",
    phone: "",
    email: "",
    shortIntro: "",
    description: "",
    logoUrl: "",
    regions: [] as string[],
    specialties: [] as string[],
  });
  const [zonecode, setZonecode] = useState("");
  const [baseAddress, setBaseAddress] = useState("");
  const [detailAddress, setDetailAddress] = useState("");
  const [initialized, setInitialized] = useState(false);

  // 회원(파트너) 탈퇴
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawConfirmed, setWithdrawConfirmed] = useState(false);
  const { data: withdrawInfo } = trpc.auth.getWithdrawInfo.useQuery(undefined, { enabled: showWithdraw });
  const withdraw = trpc.auth.withdraw.useMutation({
    onSuccess: () => {
      toast.success("탈퇴 처리되었습니다. 그동안 이용해주셔서 감사합니다.");
      setTimeout(() => { window.location.href = "/"; }, 1500);
    },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (partner && !initialized) {
      setForm({
        companyName: partner.companyName || "",
        phone: partner.phone || "",
        email: partner.email || "",
        shortIntro: partner.shortIntro || "",
        description: partner.description || "",
        logoUrl: partner.logoUrl || "",
        regions: (partner.regions as string[]) || [],
        specialties: (partner.specialties as string[]) || [],
      });
      // 주소 파싱
      const addr = partner.address || "";
      const match = addr.match(/^\((\d+)\)\s(.+?)(?:,\s(.+))?$/);
      if (match) {
        setZonecode(match[1] || "");
        setBaseAddress(match[2] || "");
        setDetailAddress(match[3] || "");
      } else {
        setBaseAddress(addr);
      }
      setInitialized(true);
    }
  }, [partner, initialized]);

  const updateMut = trpc.partners.update.useMutation({
    onSuccess: () => {
      toast.success("정보가 수정되었습니다");
      utils.partners.me.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleRegion = (r: string) => {
    setForm((f) => ({
      ...f,
      regions: f.regions.includes(r) ? f.regions.filter((x) => x !== r) : [...f.regions, r],
    }));
  };

  const toggleSpecialty = (s: string) => {
    setForm((f) => ({
      ...f,
      specialties: f.specialties.includes(s) ? f.specialties.filter((x) => x !== s) : [...f.specialties, s],
    }));
  };

  const handleSave = () => {
    const fullAddress = detailAddress
      ? `(${zonecode}) ${baseAddress}, ${detailAddress}`
      : zonecode ? `(${zonecode}) ${baseAddress}` : baseAddress;
    updateMut.mutate({ ...form, address: fullAddress });
  };


  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!partner) return null;

  return (
    <div className="space-y-5">
      {/* 로고 */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader><CardTitle className="text-base">회사 로고</CardTitle></CardHeader>
        <CardContent className="flex items-center gap-5">
          <div
            className="w-20 h-20 rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-colors"
            onClick={() => logoInputRef.current?.click()}
          >
            {form.logoUrl ? (
              <img src={form.logoUrl} alt="로고" className="w-full h-full object-cover" />
            ) : (
              <PartnerAvatar logoUrl={null} companyName={form.companyName || partner.companyName} size="lg" />
            )}
          </div>
          <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => setForm({ ...form, logoUrl: ev.target?.result as string });
              reader.readAsDataURL(file);
              e.target.value = "";
            }}
          />
          <div className="space-y-2">
            <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()}>
              <ImagePlus className="w-4 h-4 mr-1.5" /> 로고 변경
            </Button>
            {form.logoUrl && (
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive block"
                onClick={() => setForm({ ...form, logoUrl: "" })}>
                <X className="w-3.5 h-3.5 mr-1" /> 삭제
              </Button>
            )}
            <p className="text-xs text-muted-foreground">로고 없으면 회사명 첫 글자로 자동 생성됩니다</p>
          </div>
        </CardContent>
      </Card>

      {/* 기본 정보 */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader><CardTitle className="text-base">기본 정보</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">업체명</Label>
              <Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">연락처</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="010-0000-0000" />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">이메일</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium mb-2 block">한줄 소개</Label>
            <Input value={form.shortIntro} onChange={(e) => setForm({ ...form, shortIntro: e.target.value })} placeholder="업체를 한줄로 소개해주세요" />
          </div>
          <div>
            <Label className="text-sm font-medium mb-2 block">상세 소개</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} placeholder="업체 상세 소개" />
          </div>
          <AddressSearch
            zonecode={zonecode} address={baseAddress} detailAddress={detailAddress}
            onAddressChange={(data) => { setZonecode(data.zonecode); setBaseAddress(data.address); }}
            onDetailAddressChange={setDetailAddress}
            label="업체 주소" detailPlaceholder="상세 주소 (동/호수/층 등)"
          />
        </CardContent>
      </Card>

      {/* 활동 지역 */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader><CardTitle className="text-base">활동 지역</CardTitle></CardHeader>
        <CardContent>
          <div className="mb-3">
            <label className="flex items-center gap-1.5 text-sm cursor-pointer font-medium text-primary">
              <Checkbox
                checked={form.regions.length === REGIONS.length}
                onCheckedChange={(v) => setForm({ ...form, regions: v ? [...REGIONS] : [] })}
              />
              전국 (전체 선택)
            </label>
          </div>
          <div className="space-y-3">
            {Object.entries(REGION_GROUPS).map(([group, list], gi) => (
              <div key={group}>
                {gi > 0 && <div className="border-t border-dashed border-border/50 pt-2" />}
                <p className="text-xs text-muted-foreground mb-1.5">{group}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {list.map((r) => (
                    <label key={r} className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <Checkbox checked={form.regions.includes(r)} onCheckedChange={() => toggleRegion(r)} />
                      {r}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 전문 분야 */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">전문 분야</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">선택한 분야의 견적이 견적 리드에 표시됩니다.</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {parentCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground">카테고리를 불러오는 중...</p>
            ) : parentCategories.map((c: any) => (
              <label key={c.id} className="flex items-center gap-1.5 text-sm border border-border rounded-lg px-3 py-2 cursor-pointer hover:bg-muted/30">
                <Checkbox checked={form.specialties.includes(String(c.id))} onCheckedChange={() => toggleSpecialty(String(c.id))} />
                {c.name}
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="w-full gap-2" disabled={updateMut.isPending}>
        {updateMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        변경사항 저장
      </Button>

      {/* 회원 탈퇴 */}
      <Card className="border-destructive/20 shadow-sm">
        <CardHeader><CardTitle className="text-base text-muted-foreground">회원 탈퇴</CardTitle></CardHeader>
        <CardContent>
          {!showWithdraw ? (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                탈퇴 시 계정이 비활성화되며 서비스를 더 이상 이용할 수 없습니다.
              </p>
              <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setShowWithdraw(true)}>
                회원 탈퇴
              </Button>
            </>
          ) : (
            <div className="space-y-3">
              {withdrawInfo && !withdrawInfo.canWithdraw ? (
                <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-700 leading-relaxed">
                    진행 중인 거래가 <strong>{withdrawInfo.activeQuotes}건</strong> 있습니다.
                    모든 거래가 완료된 후 탈퇴할 수 있습니다.
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-2 p-3 bg-destructive/5 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    <div className="text-sm text-foreground leading-relaxed">
                      <strong>탈퇴 전 꼭 확인하세요.</strong>
                      <ul className="list-disc pl-4 mt-1.5 space-y-1 text-muted-foreground">
                        <li>탈퇴 후 계정 정보는 복구할 수 없습니다.</li>
                        {withdrawInfo?.isPartner && (withdrawInfo.tokenBalance > 0 || withdrawInfo.pointBalance > 0) && (
                          <li className="text-destructive">
                            보유 중인 토큰({withdrawInfo.tokenBalance.toLocaleString()}) / 포인트({withdrawInfo.pointBalance.toLocaleString()})는 모두 소멸됩니다.
                          </li>
                        )}
                        <li>관련 법령에 따라 일부 정보는 일정 기간 보관됩니다.</li>
                      </ul>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={withdrawConfirmed} onChange={(e) => setWithdrawConfirmed(e.target.checked)} className="w-4 h-4" />
                    위 내용을 모두 확인했으며 탈퇴에 동의합니다.
                  </label>
                </>
              )}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { setShowWithdraw(false); setWithdrawConfirmed(false); }}>
                  취소
                </Button>
                {withdrawInfo?.canWithdraw && (
                  <Button variant="destructive" className="flex-1" disabled={!withdrawConfirmed || withdraw.isPending} onClick={() => withdraw.mutate({})}>
                    {withdraw.isPending ? "처리 중..." : "탈퇴하기"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── 일반 사용자 마이페이지 ───────────────────────────────
function UserMyPage({ user }: { user: any }) {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const { data: myQuotes, isLoading: quotesLoading } = trpc.quotes.myQuotes.useQuery(undefined, { enabled: isAuthenticated });

  // 정보 수정 폼 (가입과 동일 항목)
  const parseLandline = (raw?: string | null) => {
    const digits = (raw || "").replace(/\D/g, "");
    const area = [...AREA_CODES].sort((a, b) => b.length - a.length).find((a) => digits.startsWith(a));
    if (!area) return { area: "02", local: "" };
    return { area, local: formatLandlineLocal(digits.slice(area.length)) };
  };
  const [profile, setProfile] = useState(() => {
    const ll = parseLandline(user?.landline as any);
    return {
      name: user?.name || "",
      email: user?.email || "",
      mobile: formatMobileInput(user?.phone || ""),
      landlineArea: ll.area,
      landlineLocal: ll.local,
      securityQuestion: (user as any)?.securityQuestion || SECURITY_QUESTIONS[0],
      securityAnswer: "",
    };
  });
  const [profileInit, setProfileInit] = useState(false);
  useEffect(() => {
    if (user && !profileInit) {
      const ll = parseLandline((user as any).landline);
      setProfile((p) => ({
        ...p,
        name: user.name || "",
        email: user.email || "",
        mobile: formatMobileInput(user.phone || ""),
        landlineArea: ll.area,
        landlineLocal: ll.local,
        securityQuestion: (user as any).securityQuestion || SECURITY_QUESTIONS[0],
      }));
      setProfileInit(true);
    }
  }, [user, profileInit]);

  // 검증 + 중복확인 (본인 값은 제외)
  const profEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email);
  const emailChanged = profile.email.trim().toLowerCase() !== (user?.email || "").trim().toLowerCase();
  const profEmailCheck = trpc.auth.checkEmail.useQuery({ email: profile.email }, { enabled: profEmailValid && emailChanged, staleTime: 0 });
  const profEmailTaken = profEmailValid && emailChanged && profEmailCheck.data?.available === false;

  const profMobileValid = isValidMobile(profile.mobile);
  const mobileChanged = profile.mobile.replace(/\D/g, "") !== (user?.phone || "").replace(/\D/g, "");
  const profPhoneCheck = trpc.auth.checkPhone.useQuery({ phone: profile.mobile }, { enabled: profMobileValid && mobileChanged, staleTime: 0 });
  const profPhoneTaken = profMobileValid && mobileChanged && profPhoneCheck.data?.available === false;
  const [showConvertWarning, setShowConvertWarning] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawConfirmed, setWithdrawConfirmed] = useState(false);

  // 탈퇴 가능 여부 (진행중 견적/잔액)
  const { data: withdrawInfo } = trpc.auth.getWithdrawInfo.useQuery(undefined, { enabled: isAuthenticated && showWithdraw });

  const withdraw = trpc.auth.withdraw.useMutation({
    onSuccess: () => {
      toast.success("탈퇴 처리되었습니다. 그동안 이용해주셔서 감사합니다.");
      setTimeout(() => { window.location.href = "/"; }, 1500);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateProfile = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("정보가 수정되었습니다");
      utils.auth.me.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSaveProfile = () => {
    if (!profile.name) { toast.error("이름을 입력하세요"); return; }
    if (!profEmailValid) { toast.error("올바른 이메일을 입력하세요"); return; }
    if (profEmailTaken) { toast.error("이미 사용 중인 이메일입니다"); return; }
    if (!profMobileValid) { toast.error("휴대전화 번호를 정확히 입력하세요"); return; }
    if (profPhoneTaken) { toast.error("이미 가입된 전화번호입니다"); return; }
    updateProfile.mutate({
      name: profile.name,
      email: profile.email,
      phone: profile.mobile,
      landline: composeLandline(profile.landlineArea, profile.landlineLocal) || "",
      securityQuestion: profile.securityQuestion,
      securityAnswer: profile.securityAnswer || undefined,
    });
  };

  return (
    <div className="space-y-5">
      {/* 프로필 헤더 */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{user?.name || "사용자"}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="quotes">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="quotes">내 견적 요청</TabsTrigger>
          <TabsTrigger value="profile">정보 수정</TabsTrigger>
        </TabsList>

        {/* 내 견적 요청 */}
        <TabsContent value="quotes" className="mt-4">
          {quotesLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : !myQuotes || myQuotes.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">아직 견적 요청이 없습니다</p>
              <Link href="/quote-request"><Button>견적 의뢰하기</Button></Link>
            </div>
          ) : (
            <div className="space-y-3">
              {myQuotes.map((q) => (
                <MyQuoteCard key={q.id} q={q} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* 정보 수정 */}
        <TabsContent value="profile" className="mt-4 space-y-5">
          <Card className="border-border/50 shadow-sm">
            <CardHeader><CardTitle className="text-base">내 정보 수정</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-1.5 block">이름</Label>
                <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="이름" />
              </div>
              <div>
                <Label className="text-sm font-medium mb-1.5 block">이메일</Label>
                <Input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} placeholder="email@example.com" />
                {profile.email && !profEmailValid && <p className="text-xs text-destructive mt-1">올바른 이메일 형식이 아닙니다</p>}
                {profEmailTaken && <p className="text-xs text-destructive mt-1">이미 사용 중인 이메일입니다</p>}
              </div>
              <div>
                <Label className="text-sm font-medium mb-1.5 block">휴대전화</Label>
                <Input value={profile.mobile} onChange={(e) => setProfile({ ...profile, mobile: formatMobileInput(e.target.value) })} placeholder="010-0000-0000" inputMode="numeric" />
                {profile.mobile && !profMobileValid && <p className="text-xs text-destructive mt-1">휴대전화 번호를 정확히 입력하세요 (예: 010-1234-5678)</p>}
                {profPhoneTaken && <p className="text-xs text-destructive mt-1">이미 가입된 전화번호입니다</p>}
                {profMobileValid && mobileChanged && !profPhoneTaken && profPhoneCheck.data?.available === true && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><Check className="w-3 h-3" /> 사용 가능한 번호입니다</p>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium mb-1.5 block">전화번호 <span className="text-xs text-muted-foreground font-normal">(선택)</span></Label>
                <div className="flex gap-2">
                  <Select value={profile.landlineArea} onValueChange={(v) => setProfile({ ...profile, landlineArea: v })}>
                    <SelectTrigger className="w-24 shrink-0"><SelectValue /></SelectTrigger>
                    <SelectContent>{AREA_CODES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input className="flex-1" value={profile.landlineLocal} onChange={(e) => setProfile({ ...profile, landlineLocal: formatLandlineLocal(e.target.value) })} placeholder="123-4567" inputMode="numeric" />
                </div>
              </div>
              <div className="pt-2 border-t border-border/40">
                <Label className="text-sm font-medium mb-1.5 block">보안 질문 <span className="text-xs text-muted-foreground font-normal">(비밀번호 찾기에 사용)</span></Label>
                <Select value={profile.securityQuestion} onValueChange={(v) => setProfile({ ...profile, securityQuestion: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SECURITY_QUESTIONS.map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent>
                </Select>
                <Input className="mt-2" value={profile.securityAnswer} onChange={(e) => setProfile({ ...profile, securityAnswer: e.target.value })} placeholder="답변 변경 시에만 입력" autoComplete="off" />
                <p className="text-xs text-muted-foreground mt-1">답변을 비워두면 기존 답변이 유지됩니다.</p>
              </div>
              <Button onClick={handleSaveProfile} className="w-full gap-2" disabled={updateProfile.isPending}>
                {updateProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                변경사항 저장
              </Button>
            </CardContent>
          </Card>

          {/* 파트너 전환 */}
          <Card className="border-primary/20 shadow-sm">
            <CardHeader><CardTitle className="text-base">파트너로 전환</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                시공업체로 활동하시려면 파트너로 전환하세요. 견적을 받고 시공 매칭에 참여할 수 있습니다.
              </p>
              {!showConvertWarning ? (
                <Button variant="outline" className="w-full" onClick={() => setShowConvertWarning(true)}>
                  파트너로 전환하기
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-700 leading-relaxed">
                      <strong>주의:</strong> 파트너로 전환하면 <strong>견적 의뢰 기능을 더 이상 사용할 수 없습니다.</strong>
                      파트너는 견적을 받는 입장이 되며, 고객으로서 견적을 요청하는 기능이 제한됩니다.
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setShowConvertWarning(false)}>
                      취소
                    </Button>
                    <Link href="/partner-register" className="flex-1">
                      <Button className="w-full">파트너 가입 신청 진행</Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 회원 탈퇴 */}
          <Card className="border-destructive/20 shadow-sm">
            <CardHeader><CardTitle className="text-base text-muted-foreground">회원 탈퇴</CardTitle></CardHeader>
            <CardContent>
              {!showWithdraw ? (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    탈퇴 시 계정이 비활성화되며 서비스를 더 이상 이용할 수 없습니다.
                  </p>
                  <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setShowWithdraw(true)}>
                    회원 탈퇴
                  </Button>
                </>
              ) : (
                <div className="space-y-3">
                  {/* 진행 중 견적이 있으면 차단 */}
                  {withdrawInfo && !withdrawInfo.canWithdraw ? (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div className="text-sm text-amber-700 leading-relaxed">
                        진행 중인 견적이 <strong>{withdrawInfo.activeQuotes}건</strong> 있습니다.
                        모든 거래가 완료된 후 탈퇴할 수 있습니다.
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start gap-2 p-3 bg-destructive/5 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                        <div className="text-sm text-foreground leading-relaxed">
                          <strong>탈퇴 전 꼭 확인하세요.</strong>
                          <ul className="list-disc pl-4 mt-1.5 space-y-1 text-muted-foreground">
                            <li>탈퇴 후 계정 정보는 복구할 수 없습니다.</li>
                            {withdrawInfo?.isPartner && (withdrawInfo.tokenBalance > 0 || withdrawInfo.pointBalance > 0) && (
                              <li className="text-destructive">
                                보유 중인 토큰({withdrawInfo.tokenBalance.toLocaleString()}) / 포인트({withdrawInfo.pointBalance.toLocaleString()})는 모두 소멸됩니다.
                              </li>
                            )}
                            <li>관련 법령에 따라 일부 정보는 일정 기간 보관됩니다.</li>
                          </ul>
                        </div>
                      </div>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={withdrawConfirmed} onChange={(e) => setWithdrawConfirmed(e.target.checked)} className="w-4 h-4" />
                        위 내용을 모두 확인했으며 탈퇴에 동의합니다.
                      </label>
                    </>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => { setShowWithdraw(false); setWithdrawConfirmed(false); }}>
                      취소
                    </Button>
                    {withdrawInfo?.canWithdraw && (
                      <Button
                        variant="destructive"
                        className="flex-1"
                        disabled={!withdrawConfirmed || withdraw.isPending}
                        onClick={() => withdraw.mutate({})}
                      >
                        {withdraw.isPending ? "처리 중..." : "탈퇴하기"}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── 메인 ────────────────────────────────────────────────
export default function MyPage() {
  const { user, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [loading, isAuthenticated]);

  if (loading || !isAuthenticated) return null;

  const isPartner = user?.role === "partner";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-2xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">{isPartner ? "파트너 정보 관리" : "마이페이지"}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isPartner ? "파트너 프로필과 회사 정보를 수정할 수 있습니다" : "내 견적 요청을 확인하세요"}
            </p>
          </div>
          {isPartner
            ? <PartnerMyPage />
            : <UserMyPage user={user} />
          }
        </div>
      </main>
      <Footer />
    </div>
  );
}
