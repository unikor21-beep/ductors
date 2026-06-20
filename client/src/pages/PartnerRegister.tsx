import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AddressSearch from "@/components/AddressSearch";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "wouter";
import { Building2, CheckCircle2, ImagePlus, X } from "lucide-react";
import { REGIONS } from "@shared/constants";

const SPECIALTIES = ["환기 시스템", "닥트 시공", "공조 설비", "주방 후드", "클린룸", "산업 환기"];

export default function PartnerRegister() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [submitted, setSubmitted] = useState(false);
  const [agreePartnerTerms, setAgreePartnerTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  const [form, setForm] = useState({
    companyName: "",
    businessNumber: "",
    representativeName: "",
    phone: "",
    email: "",
    address: "",
    shortIntro: "",
    description: "",
    regions: [] as string[],
    specialties: [] as string[],
    logoUrl: "",
  });
  const logoInputRef = useRef<HTMLInputElement>(null);

  // 우편번호 찾기 관련 상태
  const [zonecode, setZonecode] = useState("");
  const [baseAddress, setBaseAddress] = useState("");
  const [detailAddress, setDetailAddress] = useState("");

  const register = trpc.partners.register.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("파트너 가입 신청이 완료되었습니다!");
    },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/signup");
    }
  }, [loading, isAuthenticated, navigate]);

  if (loading) return null;
  if (!isAuthenticated) return null;

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pt-16 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-3">가입 신청 완료!</h2>
            <p className="text-muted-foreground mb-8">관리자 승인 후 파트너 활동을 시작할 수 있습니다.</p>
            <Button onClick={() => navigate("/")}>홈으로</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const toggleRegion = (r: string) => {
    setForm((f) => ({
      ...f,
      regions: f.regions.includes(r) ? f.regions.filter((x) => x !== r) : [...f.regions, r],
    }));
  };

  const handleSubmit = () => {
    if (!agreePartnerTerms || !agreePrivacy) { toast.error("필수 약관에 동의해주세요"); return; }
    if (!form.companyName.trim()) { toast.error("업체명을 입력해주세요"); return; }
    // 주소를 합쳐서 전송
    const fullAddress = detailAddress
      ? `(${zonecode}) ${baseAddress}, ${detailAddress}`
      : zonecode ? `(${zonecode}) ${baseAddress}` : baseAddress;
    register.mutate({ ...form, address: fullAddress });
  };

  const toggleSpecialty = (s: string) => {
    setForm((f) => ({
      ...f,
      specialties: f.specialties.includes(s) ? f.specialties.filter((x) => x !== s) : [...f.specialties, s],
    }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-2xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">파트너 가입 신청</h1>
            <p className="text-muted-foreground">사업자 정보를 입력하여 파트너 가입을 신청하세요</p>
          </div>

          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                사업자 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* 회사 로고 업로드 */}
              <div>
                <Label className="text-sm font-medium mb-2 block">회사 로고 <span className="text-xs text-muted-foreground font-normal">(선택)</span></Label>
                <div className="flex items-center gap-4">
                  <div
                    className="w-24 h-24 rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-colors bg-muted/30"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    {form.logoUrl ? (
                      <img src={form.logoUrl} alt="로고" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <ImagePlus className="w-6 h-6 text-muted-foreground mb-1" />
                        <span className="text-xs text-muted-foreground">로고 업로드</span>
                      </>
                    )}
                  </div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => setForm({ ...form, logoUrl: ev.target?.result as string });
                      reader.readAsDataURL(file);
                      e.target.value = "";
                    }}
                  />
                  <div className="space-y-1.5">
                    <p className="text-sm text-muted-foreground">파트너 찾기 화면에 표시되는 회사 대표 이미지입니다.</p>
                    <p className="text-xs text-muted-foreground">권장: 정사각형 이미지 (JPG, PNG)</p>
                    {form.logoUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-destructive hover:text-destructive px-2"
                        onClick={() => setForm({ ...form, logoUrl: "" })}
                      >
                        <X className="w-3 h-3 mr-1" /> 삭제
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">업체명 *</Label>
                  <Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} placeholder="업체명" />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">사업자 번호</Label>
                  <Input value={form.businessNumber} onChange={(e) => setForm({ ...form, businessNumber: e.target.value })} placeholder="000-00-00000" />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">대표자명</Label>
                  <Input value={form.representativeName} onChange={(e) => setForm({ ...form, representativeName: e.target.value })} placeholder="대표자명" />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">연락처</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="010-0000-0000" />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">이메일</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
              </div>

              {/* 우편번호 찾기 주소 입력 */}
              <AddressSearch
                zonecode={zonecode}
                address={baseAddress}
                detailAddress={detailAddress}
                onAddressChange={(data) => {
                  setZonecode(data.zonecode);
                  setBaseAddress(data.address);
                }}
                onDetailAddressChange={setDetailAddress}
                label="업체 주소"
                detailPlaceholder="상세 주소 (동/호수/층 등)"
                helperText="입력하신 주소는 파트너 찾기 지도에 표시됩니다"
              />

              <div>
                <Label className="text-sm font-medium mb-2 block">한줄 소개</Label>
                <Input value={form.shortIntro} onChange={(e) => setForm({ ...form, shortIntro: e.target.value })} placeholder="업체를 한줄로 소개해주세요" />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">상세 소개</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="업체에 대한 상세 소개" rows={4} />
              </div>

              <div>
                <Label className="text-sm font-medium mb-3 block">활동 지역</Label>
                <div className="flex flex-wrap gap-2">
                  {REGIONS.map((r) => (
                    <label key={r} className="flex items-center gap-1.5 text-sm">
                      <Checkbox checked={form.regions.includes(r)} onCheckedChange={() => toggleRegion(r)} />
                      {r}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-3 block">전문 분야</Label>
                <div className="flex flex-wrap gap-2">
                  {SPECIALTIES.map((s) => (
                    <label key={s} className="flex items-center gap-1.5 text-sm">
                      <Checkbox checked={form.specialties.includes(s)} onCheckedChange={() => toggleSpecialty(s)} />
                      {s}
                    </label>
                  ))}
                </div>
              </div>

              {/* 파트너 약관 동의 */}
              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-foreground mb-1">파트너 가입 약관 동의</p>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="partner-terms"
                    checked={agreePartnerTerms}
                    onCheckedChange={(checked) => setAgreePartnerTerms(checked === true)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <label htmlFor="partner-terms" className="text-sm text-foreground cursor-pointer">
                      <span className="text-red-500 font-medium">[필수]</span> 파트너 서비스 이용약관 동의
                    </label>
                    <Link href="/terms" className="text-xs text-primary hover:underline ml-2">
                      보기
                    </Link>
                    <p className="text-xs text-muted-foreground mt-1">
                      사업자 정보 수집 및 견적 매칭 서비스 이용에 관한 약관입니다.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="partner-privacy"
                    checked={agreePrivacy}
                    onCheckedChange={(checked) => setAgreePrivacy(checked === true)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <label htmlFor="partner-privacy" className="text-sm text-foreground cursor-pointer">
                      <span className="text-red-500 font-medium">[필수]</span> 개인정보 수집·이용 동의
                    </label>
                    <Link href="/privacy" className="text-xs text-primary hover:underline ml-2">
                      보기
                    </Link>
                    <p className="text-xs text-muted-foreground mt-1">
                      사업자등록번호, 대표자명, 연락처 등 사업자 정보의 수집·이용에 동의합니다.
                    </p>
                  </div>
                </div>
              </div>

              <Button onClick={handleSubmit} className="w-full" disabled={register.isPending || (!agreePartnerTerms || !agreePrivacy)}>
                {register.isPending ? "신청 중..." : "파트너 가입 신청"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
