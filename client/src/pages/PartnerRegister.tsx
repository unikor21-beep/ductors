import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Building2, CheckCircle2 } from "lucide-react";
import { REGIONS } from "@shared/constants";

const SPECIALTIES = ["환기 시스템", "닥트 시공", "공조 설비", "주방 후드", "클린룸", "산업 환기"];

export default function PartnerRegister() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    companyName: "",
    businessNumber: "",
    representativeName: "",
    phone: "",
    email: "",
    shortIntro: "",
    description: "",
    regions: [] as string[],
    specialties: [] as string[],
  });

  const register = trpc.partners.register.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("파트너 가입 신청이 완료되었습니다!");
    },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [loading, isAuthenticated]);

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

  const handleSubmit = () => {
    if (!form.companyName.trim()) { toast.error("업체명을 입력해주세요"); return; }
    register.mutate(form);
  };

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

              <Button onClick={handleSubmit} className="w-full" disabled={register.isPending}>
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
