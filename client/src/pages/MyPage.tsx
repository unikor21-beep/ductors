import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AddressSearch from "@/components/AddressSearch";
import PartnerAvatar from "@/components/PartnerAvatar";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { useEffect, useState, useRef } from "react";
import { FileText, Loader2, User, ImagePlus, X, Save } from "lucide-react";
import { QUOTE_STATUS_LABELS } from "@shared/constants";
import RegionMultiSelect from "@/components/RegionMultiSelect";
import { toast } from "sonner";

// ── 파트너 마이페이지 ────────────────────────────────────
function PartnerMyPage() {
  const { data: partner, isLoading } = trpc.partners.me.useQuery();
  const utils = trpc.useUtils();
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    companyName: "",
    phone: "",
    email: "",
    shortIntro: "",
    description: "",
    logoUrl: "",
    regions: [] as string[],
  });
  const [zonecode, setZonecode] = useState("");
  const [baseAddress, setBaseAddress] = useState("");
  const [detailAddress, setDetailAddress] = useState("");
  const [initialized, setInitialized] = useState(false);

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
          <RegionMultiSelect
            value={form.regions}
            onChange={(regions) => setForm({ ...form, regions })}
          />
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="w-full gap-2" disabled={updateMut.isPending}>
        {updateMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        변경사항 저장
      </Button>
    </div>
  );
}

// ── 일반 사용자 마이페이지 ───────────────────────────────
function UserMyPage({ userName, userEmail }: { userName: string; userEmail: string }) {
  const { isAuthenticated } = useAuth();
  const { data: myQuotes, isLoading: quotesLoading } = trpc.quotes.myQuotes.useQuery(undefined, { enabled: isAuthenticated });

  return (
    <div className="space-y-5">
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{userName || "사용자"}</h2>
            <p className="text-sm text-muted-foreground">{userEmail}</p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="quotes">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="quotes">내 견적 요청</TabsTrigger>
        </TabsList>
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
                <Card key={q.id} className="border-border/50 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate">{q.title}</h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span>{q.region || "미지정"}</span>
                          <span>{new Date(q.createdAt).toLocaleDateString("ko-KR")}</span>
                        </div>
                      </div>
                      <Badge variant={q.status === "completed" ? "default" : "secondary"} className="shrink-0">
                        {QUOTE_STATUS_LABELS[q.status] || q.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
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
            : <UserMyPage userName={user?.name || ""} userEmail={user?.email || ""} />
          }
        </div>
      </main>
      <Footer />
    </div>
  );
}
