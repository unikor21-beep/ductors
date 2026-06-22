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
import { Building2, CheckCircle2, ImagePlus, X, FileText, AlertCircle } from "lucide-react";
import { REGIONS, REGION_GROUPS } from "@shared/constants";

export default function PartnerRegister() {
  const { isAuthenticated, loading, user } = useAuth();
  const [, navigate] = useLocation();
  const [submitted, setSubmitted] = useState(false);
  const [agreePartnerTerms, setAgreePartnerTerms] = useState(false);
  const [bizVerified, setBizVerified] = useState(false);
  const [bizVerifyMsg, setBizVerifyMsg] = useState("");
  const [addressMatchesBiz, setAddressMatchesBiz] = useState(false);

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
    businessLicenseUrl: "",
  });
  const logoInputRef = useRef<HTMLInputElement>(null);
  const licenseInputRef = useRef<HTMLInputElement>(null);

  // 우편번호 찾기 관련 상태
  const [zonecode, setZonecode] = useState("");
  const [baseAddress, setBaseAddress] = useState("");
  const [detailAddress, setDetailAddress] = useState("");

  // 전문분야 = 대분류 카테고리 (parentId 없는 것)
  const { data: allCategories } = trpc.categories.list.useQuery();
  const parentCategories = (allCategories || []).filter((c: any) => !c.parentId);

  const verifyBiz = trpc.partners.verifyBusinessNumber.useMutation({
    onSuccess: (res) => {
      setBizVerifyMsg(res.message);
      setBizVerified(res.ok);
      if (res.ok) toast.success(res.message);
      else toast.error(res.message);
    },
    onError: () => {
      setBizVerified(false);
      setBizVerifyMsg("인증 중 오류가 발생했습니다.");
      toast.error("인증 중 오류가 발생했습니다.");
    },
  });

  const register = trpc.partners.register.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("파트너 가입 신청이 완료되었습니다!");
    },
    onError: (e) => toast.error(!e.message || e.message.length > 150 ? "신청 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." : e.message),
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/signup");
    }
  }, [loading, isAuthenticated, navigate]);

  // 회원가입 시 제출한 정보(이메일/전화번호/이름)를 자동으로 채움
  const [prefilled, setPrefilled] = useState(false);
  useEffect(() => {
    if (user && !prefilled) {
      setForm((f) => ({
        ...f,
        email: f.email || (user as any).email || "",
        phone: f.phone || (user as any).phone || "",
        representativeName: f.representativeName || (user as any).name || "",
      }));
      setPrefilled(true);
    }
  }, [user, prefilled]);

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
    if (!agreePartnerTerms) { toast.error("파트너 서비스 이용약관에 동의해주세요"); return; }
    if (!form.companyName.trim()) { toast.error("업체명을 입력해주세요"); return; }
    if (!bizVerified) { toast.error("사업자 번호 인증을 완료해주세요"); return; }
    if (!form.businessLicenseUrl) { toast.error("사업자등록증을 첨부해주세요"); return; }
    if (!addressMatchesBiz) { toast.error("사업자등록증 상의 주소와 동일한지 확인해주세요"); return; }
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
                  <Label className="text-sm font-medium mb-2 block">
                    사업자 번호
                    {bizVerified && <span className="ml-2 text-xs text-green-600 font-medium">✓ 인증완료</span>}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={form.businessNumber}
                      onChange={(e) => {
                        setForm({ ...form, businessNumber: e.target.value });
                        setBizVerified(false);
                        setBizVerifyMsg("");
                      }}
                      placeholder="000-00-00000"
                      disabled={bizVerified}
                    />
                    <Button
                      type="button"
                      variant={bizVerified ? "outline" : "default"}
                      onClick={() => verifyBiz.mutate({ businessNumber: form.businessNumber })}
                      disabled={!form.businessNumber || bizVerified || verifyBiz.isPending}
                      className="shrink-0"
                    >
                      {verifyBiz.isPending ? "확인 중..." : bizVerified ? "완료" : "인증"}
                    </Button>
                  </div>
                  {bizVerifyMsg && (
                    <p className={`text-xs mt-1.5 ${bizVerified ? "text-green-600" : "text-destructive"}`}>
                      {bizVerifyMsg}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">대표자명</Label>
                  <Input value={form.representativeName} onChange={(e) => setForm({ ...form, representativeName: e.target.value })} placeholder="대표자명" />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    연락처 <span className="text-xs text-muted-foreground font-normal">(회원정보에서 자동입력, 수정 가능)</span>
                  </Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="010-0000-0000" />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  이메일 <span className="text-xs text-muted-foreground font-normal">(회원정보에서 자동입력, 수정 가능)</span>
                </Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
              </div>

              {/* 사업자등록증 첨부 */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  사업자등록증 첨부 *
                  <span className="ml-2 text-xs text-muted-foreground font-normal">(JPG, PNG, PDF)</span>
                </Label>
                <input
                  ref={licenseInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 10 * 1024 * 1024) { toast.error("파일 크기는 10MB 이하여야 합니다"); return; }
                    const reader = new FileReader();
                    reader.onload = (ev) => setForm({ ...form, businessLicenseUrl: ev.target?.result as string });
                    reader.readAsDataURL(file);
                    e.target.value = "";
                  }}
                />
                {form.businessLicenseUrl ? (
                  <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                    {form.businessLicenseUrl.startsWith("data:image") ? (
                      <img src={form.businessLicenseUrl} alt="사업자등록증" className="w-16 h-16 object-cover rounded-lg border border-border" />
                    ) : (
                      <div className="w-16 h-16 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center shrink-0">
                        <FileText className="w-7 h-7 text-red-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-green-700">첨부 완료</p>
                      <p className="text-xs text-muted-foreground mt-0.5">관리자 검토 후 승인됩니다</p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive shrink-0"
                      onClick={() => setForm({ ...form, businessLicenseUrl: "" })}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => licenseInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-6 flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <FileText className="w-8 h-8" />
                    <span className="text-sm font-medium">사업자등록증 파일 첨부</span>
                    <span className="text-xs">클릭하여 파일 선택 (최대 10MB)</span>
                  </button>
                )}
                <div className="flex items-start gap-2 mt-2 p-2.5 bg-amber-50 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">사업자등록증은 관리자 검토용으로만 사용되며, 승인 후 파트너 활동이 가능합니다.</p>
                </div>
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
                helperText="사업자등록증 상의 사업장 주소를 입력해주세요. 파트너 찾기 지도에 표시됩니다."
              />
              {baseAddress && (
                <label className="flex items-start gap-2 text-sm cursor-pointer -mt-1">
                  <Checkbox checked={addressMatchesBiz} onCheckedChange={(v) => setAddressMatchesBiz(v === true)} className="mt-0.5" />
                  <span className="text-muted-foreground">
                    위 주소가 <strong className="text-foreground">사업자등록증 상의 주소와 동일</strong>함을 확인합니다.
                    <span className="block text-xs mt-0.5">실제 사업장이 다른 경우 그대로 두셔도 되지만, 관리자 승인이 지연될 수 있습니다.</span>
                  </span>
                </label>
              )}

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
              </div>

              <div>
                <Label className="text-sm font-medium mb-3 block">
                  전문 분야 <span className="text-xs text-muted-foreground font-normal">(선택한 분야의 견적을 받아봅니다)</span>
                </Label>
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
                    <Link href="/partner-terms" className="text-xs text-primary hover:underline ml-2">
                      보기
                    </Link>
                    <p className="text-xs text-muted-foreground mt-1">
                      사업자 정보 수집 및 견적 매칭 서비스 이용에 관한 약관입니다.
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground pt-1 leading-relaxed">
                  회원가입 시 동의하신 <Link href="/privacy" className="text-primary hover:underline">개인정보처리방침</Link>에 따라
                  파트너 가입에 필요한 사업자 정보(사업자등록번호, 대표자명, 연락처 등)가 추가로 수집됩니다.
                </p>
              </div>

              <Button onClick={handleSubmit} className="w-full" disabled={register.isPending || !agreePartnerTerms || !addressMatchesBiz}>
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
