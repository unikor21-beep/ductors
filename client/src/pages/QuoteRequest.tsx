import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { FileText, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { REGIONS } from "@shared/constants";

export default function QuoteRequest() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [quoteType, setQuoteType] = useState<"public" | "designated">("public");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [region, setRegion] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [submitted, setSubmitted] = useState(false);

  const { data: categories } = trpc.categories.list.useQuery();
  const { data: fields } = trpc.categories.fields.useQuery(
    { categoryId: categoryId! },
    { enabled: !!categoryId }
  );
  const createQuote = trpc.quotes.create.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("견적 요청이 등록되었습니다!");
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
            <h2 className="text-2xl font-bold mb-3">견적 요청 완료!</h2>
            <p className="text-muted-foreground mb-8">파트너들이 견적을 검토 후 제출할 예정입니다.</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate("/mypage")} variant="outline">내 견적 확인</Button>
              <Button onClick={() => navigate("/")}>홈으로</Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleSubmit = () => {
    if (!title.trim()) { toast.error("제목을 입력해주세요"); return; }
    if (!region) { toast.error("지역을 선택해주세요"); return; }
    createQuote.mutate({
      type: quoteType,
      categoryId: categoryId || undefined,
      title,
      description,
      region,
      address,
      formData,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-2xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">견적의뢰</h1>
            <p className="text-muted-foreground">필요한 시공 정보를 입력해주세요</p>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>

          {step === 1 && (
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">견적 유형 선택</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <RadioGroup value={quoteType} onValueChange={(v) => setQuoteType(v as "public" | "designated")}>
                  <div className="flex items-start gap-3 p-4 rounded-xl border border-border/50 hover:border-primary/30 transition-colors">
                    <RadioGroupItem value="public" id="public" className="mt-1" />
                    <div>
                      <Label htmlFor="public" className="text-base font-medium cursor-pointer">공개 견적</Label>
                      <p className="text-sm text-muted-foreground mt-1">여러 파트너에게 견적을 받아 비교할 수 있습니다</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-xl border border-border/50 hover:border-primary/30 transition-colors">
                    <RadioGroupItem value="designated" id="designated" className="mt-1" />
                    <div>
                      <Label htmlFor="designated" className="text-base font-medium cursor-pointer">지정 견적</Label>
                      <p className="text-sm text-muted-foreground mt-1">원하는 특정 파트너에게 직접 견적을 요청합니다</p>
                    </div>
                  </div>
                </RadioGroup>

                <div>
                  <Label className="text-sm font-medium mb-2 block">카테고리</Label>
                  <Select onValueChange={(v) => setCategoryId(Number(v))}>
                    <SelectTrigger><SelectValue placeholder="시공 분야를 선택하세요" /></SelectTrigger>
                    <SelectContent>
                      {categories?.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={() => setStep(2)} className="w-full gap-2">
                  다음 <ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">상세 정보 입력</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label className="text-sm font-medium mb-2 block">제목 *</Label>
                  <Input placeholder="예: 아파트 환기 시스템 설치" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">지역 *</Label>
                  <Select value={region} onValueChange={setRegion}>
                    <SelectTrigger><SelectValue placeholder="지역을 선택하세요" /></SelectTrigger>
                    <SelectContent>
                      {REGIONS.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">상세 주소</Label>
                  <Input placeholder="상세 주소를 입력하세요" value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">요청 내용</Label>
                  <Textarea placeholder="시공에 대한 상세 요청사항을 입력해주세요" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
                </div>

                {/* Dynamic Fields */}
                {fields?.map((field) => (
                  <div key={field.id}>
                    <Label className="text-sm font-medium mb-2 block">
                      {field.label} {field.isRequired && <span className="text-destructive">*</span>}
                    </Label>
                    {field.fieldType === "text" && (
                      <Input
                        value={(formData[field.label] as string) || ""}
                        onChange={(e) => setFormData({ ...formData, [field.label]: e.target.value })}
                      />
                    )}
                    {field.fieldType === "number" && (
                      <Input
                        type="number"
                        value={(formData[field.label] as string) || ""}
                        onChange={(e) => setFormData({ ...formData, [field.label]: e.target.value })}
                      />
                    )}
                    {field.fieldType === "select" && (
                      <Select onValueChange={(v) => setFormData({ ...formData, [field.label]: v })}>
                        <SelectTrigger><SelectValue placeholder="선택하세요" /></SelectTrigger>
                        <SelectContent>
                          {(field.options as string[] || []).map((opt) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {field.fieldType === "multiselect" && (
                      <div className="flex flex-wrap gap-3">
                        {(field.options as string[] || []).map((opt) => {
                          const selected = ((formData[field.label] as string[]) || []);
                          return (
                            <label key={opt} className="flex items-center gap-2 text-sm">
                              <Checkbox
                                checked={selected.includes(opt)}
                                onCheckedChange={(checked) => {
                                  const newVal = checked ? [...selected, opt] : selected.filter((s) => s !== opt);
                                  setFormData({ ...formData, [field.label]: newVal });
                                }}
                              />
                              {opt}
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                    <ArrowLeft className="w-4 h-4" /> 이전
                  </Button>
                  <Button onClick={() => setStep(3)} className="flex-1 gap-2">
                    다음 <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">견적 요청 확인</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">견적 유형</span>
                    <span className="font-medium">{quoteType === "public" ? "공개 견적" : "지정 견적"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">제목</span>
                    <span className="font-medium">{title}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">지역</span>
                    <span className="font-medium">{region}</span>
                  </div>
                  {description && (
                    <div className="text-sm">
                      <span className="text-muted-foreground block mb-1">요청 내용</span>
                      <span className="font-medium">{description}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
                    <ArrowLeft className="w-4 h-4" /> 이전
                  </Button>
                  <Button onClick={handleSubmit} className="flex-1 gap-2" disabled={createQuote.isPending}>
                    <FileText className="w-4 h-4" />
                    {createQuote.isPending ? "등록 중..." : "견적 요청 등록"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
