import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AddressSearch from "@/components/AddressSearch";
import CategorySelect from "@/components/CategorySelect";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import { FileText, ArrowRight, ArrowLeft, CheckCircle2, Building2, Star, Award, ImagePlus, X } from "lucide-react";
import { REGIONS, GRADE_LABELS, GRADE_COLORS } from "@shared/constants";

export default function QuoteRequest() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const searchString = useSearch();

  // Parse URL params: ?type=designated&partner=123
  const urlParams = useMemo(() => new URLSearchParams(searchString), [searchString]);
  const urlPartnerId = useMemo(() => {
    const p = urlParams.get("partner");
    return p ? Number(p) : null;
  }, [urlParams]);
  const urlType = useMemo(() => {
    const t = urlParams.get("type");
    return t === "designated" ? "designated" : null;
  }, [urlParams]);

  const [step, setStep] = useState(1);
  const [quoteType, setQuoteType] = useState<"public" | "designated">(
    urlType === "designated" || urlPartnerId ? "designated" : "public"
  );
  const [designatedPartnerId, setDesignatedPartnerId] = useState<number | null>(urlPartnerId);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [region, setRegion] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [zonecode, setZonecode] = useState("");
  const [baseAddress, setBaseAddress] = useState("");
  const [detailAddress, setDetailAddress] = useState("");
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [submitted, setSubmitted] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch designated partner info if partnerId is provided
  const { data: designatedPartner } = trpc.partners.getById.useQuery(
    { id: designatedPartnerId! },
    { enabled: !!designatedPartnerId }
  );

  const { data: categories = [] } = trpc.categories.list.useQuery();
  // 선택한 카테고리 라벨 계산
  const selectedCategoryLabel = useMemo(() => {
    if (!categoryId) return null;
    const cat = (categories as any[]).find((c) => c.id === categoryId);
    if (!cat) return null;
    const parent = cat.parentId ? (categories as any[]).find((c) => c.id === cat.parentId) : null;
    return parent ? `${parent.name} › ${cat.name}` : cat.name;
  }, [categoryId, categories]);
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
            <p className="text-muted-foreground mb-8">
              {quoteType === "designated" && designatedPartner
                ? `${designatedPartner.companyName}에 지정 견적을 요청했습니다.`
                : "파트너들이 견적을 검토 후 제출할 예정입니다."}
            </p>
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
    const fullAddress = detailAddress
      ? `(${zonecode}) ${baseAddress}, ${detailAddress}`
      : zonecode ? `(${zonecode}) ${baseAddress}` : address;
    createQuote.mutate({
      type: quoteType,
      categoryId: categoryId || undefined,
      title,
      description,
      region,
      address: fullAddress,
      formData,
      designatedPartnerId: quoteType === "designated" ? designatedPartnerId || undefined : undefined,
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
                <RadioGroup value={quoteType} onValueChange={(v) => {
                  setQuoteType(v as "public" | "designated");
                  if (v === "public") setDesignatedPartnerId(null);
                }}>
                  <div className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${quoteType === "public" ? "border-primary/50 bg-primary/5" : "border-border/50 hover:border-primary/30"}`}>
                    <RadioGroupItem value="public" id="public" className="mt-1" />
                    <div>
                      <Label htmlFor="public" className="text-base font-medium cursor-pointer">공개 견적</Label>
                      <p className="text-sm text-muted-foreground mt-1">여러 파트너에게 견적을 받아 비교할 수 있습니다</p>
                    </div>
                  </div>
                  <div className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${quoteType === "designated" ? "border-primary/50 bg-primary/5" : "border-border/50 hover:border-primary/30"}`}>
                    <RadioGroupItem value="designated" id="designated" className="mt-1" />
                    <div>
                      <Label htmlFor="designated" className="text-base font-medium cursor-pointer">지정 견적</Label>
                      <p className="text-sm text-muted-foreground mt-1">원하는 특정 파트너에게 직접 견적을 요청합니다</p>
                    </div>
                  </div>
                </RadioGroup>

                {/* Designated Partner Info Card */}
                {quoteType === "designated" && designatedPartner && (
                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                    <p className="text-xs font-medium text-primary mb-3">지정 파트너</p>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        {designatedPartner.logoUrl ? (
                          <img src={designatedPartner.logoUrl} alt="" className="w-full h-full rounded-xl object-cover" />
                        ) : (
                          <Building2 className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground truncate">{designatedPartner.companyName}</span>
                          <Badge
                            className="text-[10px] px-1.5 py-0 shrink-0"
                            style={{
                              backgroundColor: GRADE_COLORS[designatedPartner.grade || "bronze"] + "20",
                              color: GRADE_COLORS[designatedPartner.grade || "bronze"],
                            }}
                          >
                            <Award className="w-2.5 h-2.5 mr-0.5" />
                            {GRADE_LABELS[designatedPartner.grade || "bronze"]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs text-muted-foreground">
                            {Number(designatedPartner.avgRating || 0).toFixed(1)} ({designatedPartner.reviewCount || 0}건)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Prompt to select partner if designated but no partner selected */}
                {quoteType === "designated" && !designatedPartnerId && (
                  <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-4 text-center">
                    <p className="text-sm text-amber-700 mb-3">지정할 파트너를 선택해주세요</p>
                    <Button variant="outline" size="sm" onClick={() => navigate("/find-partner")} className="gap-2">
                      <Building2 className="w-4 h-4" />
                      파트너 찾기에서 선택
                    </Button>
                  </div>
                )}

                <CategorySelect
                  value={categoryId}
                  onChange={setCategoryId}
                  label="카테고리"
                />

                <Button
                  onClick={() => setStep(2)}
                  className="w-full gap-2"
                  disabled={
                    (quoteType === "designated" && !designatedPartnerId) ||
                    !categoryId
                  }
                >
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
                {/* 선택한 카테고리 표시 */}
                {selectedCategoryLabel && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg">
                    <span className="text-xs text-muted-foreground">선택한 카테고리:</span>
                    <span className="text-xs font-semibold text-primary">{selectedCategoryLabel}</span>
                  </div>
                )}
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
                <AddressSearch
                  zonecode={zonecode}
                  address={baseAddress}
                  detailAddress={detailAddress}
                  onAddressChange={(data) => {
                    setZonecode(data.zonecode);
                    setBaseAddress(data.address);
                    // 시도 정보로 지역 자동 설정
                    const matchedRegion = REGIONS.find(r => data.sido.includes(r) || r.includes(data.sido));
                    if (matchedRegion) setRegion(matchedRegion);
                    // 전체 주소 업데이트
                    setAddress(`(${data.zonecode}) ${data.address}`);
                  }}
                  onDetailAddressChange={(val) => {
                    setDetailAddress(val);
                    if (baseAddress) {
                      setAddress(`(${zonecode}) ${baseAddress}, ${val}`);
                    }
                  }}
                  label="시공 주소"
                  detailPlaceholder="상세 주소 (동/호수/층 등)"
                  helperText="주소를 입력하면 지역이 자동으로 설정됩니다"
                />
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

                {/* 사진 업로드 (최대 3장) */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">현장 사진 (선택, 최대 3장)</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (!files) return;
                      const remaining = 3 - attachments.length;
                      if (remaining <= 0) { toast.error("사진은 최대 3장까지 올릴 수 있습니다."); return; }
                      const toRead = Array.from(files).slice(0, remaining);
                      toRead.forEach((file) => {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          setAttachments((prev) => [...prev, ev.target?.result as string].slice(0, 3));
                        };
                        reader.readAsDataURL(file);
                      });
                      e.target.value = "";
                    }}
                  />
                  <div className="flex gap-2 flex-wrap">
                    {attachments.map((src, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                        <img src={src} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                          className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5 hover:bg-black/80"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                    {attachments.length < 3 && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-20 h-20 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <ImagePlus className="w-5 h-5" />
                        <span className="text-xs">{attachments.length}/3</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                    <ArrowLeft className="w-4 h-4" /> 이전
                  </Button>
                  <Button
                    onClick={() => {
                      if (!title.trim()) { toast.error("제목을 입력해주세요"); return; }
                      if (!region) { toast.error("지역을 선택해주세요"); return; }
                      setStep(3);
                    }}
                    disabled={!title.trim() || !region}
                    className="flex-1 gap-2"
                  >
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
                  {quoteType === "designated" && designatedPartner && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">지정 파트너</span>
                      <span className="font-medium">{designatedPartner.companyName}</span>
                    </div>
                  )}
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
