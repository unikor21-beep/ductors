/**
 * AdminWalletManager - 관리자 지갑 관리
 * 1. 열람 가격/구독료 설정
 * 2. 토큰 수동 충전
 * 3. 포인트 지급 (개별/일괄)
 * 4. 신규가입 자동 보너스 캠페인
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Coins, Gift, Settings, Save, Loader2, Users, Megaphone, Trash2, Calendar } from "lucide-react";

function formatWon(n: number) {
  return (n ?? 0).toLocaleString("ko-KR");
}

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString("ko-KR", { year: "2-digit", month: "2-digit", day: "2-digit" });
}

export default function AdminWalletManager() {
  const utils = trpc.useUtils();
  const { data: settings } = trpc.admin.walletSettings.useQuery();
  const { data: partners = [] } = trpc.partners.listAll.useQuery();
  const { data: campaigns = [] } = trpc.admin.signupCampaigns.useQuery();

  const approvedPartners = (partners as any[]).filter((p) => p.status === "approved");

  // ===== 가격 설정 =====
  const [prices, setPrices] = useState<Record<string, string>>({});
  const priceVal = (key: string, fallback: number) =>
    prices[key] !== undefined ? prices[key] : String((settings as any)?.[key] ?? fallback);
  const updateSetting = trpc.admin.updateWalletSetting.useMutation({
    onSuccess: () => { toast.success("설정이 저장되었습니다"); utils.admin.walletSettings.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  // ===== 토큰 충전 =====
  const [selectedPartner, setSelectedPartner] = useState<string>("");
  const [chargeAmount, setChargeAmount] = useState("");
  const chargeToken = trpc.admin.chargeToken.useMutation({
    onSuccess: (r) => { toast.success(`토큰 충전 완료 (잔액: ${formatWon(r.newBalance ?? 0)}원)`); setChargeAmount(""); utils.partners.listAll.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  // ===== 일괄 포인트 지급 =====
  const [checkedPartners, setCheckedPartners] = useState<number[]>([]);
  const [bulkAmount, setBulkAmount] = useState("");
  const [bulkDays, setBulkDays] = useState("30");
  const [bulkReason, setBulkReason] = useState("");
  const bulkGrant = trpc.admin.bulkGrantPoint.useMutation({
    onSuccess: (r) => {
      toast.success(`${r.count}개 파트너에게 포인트 지급 완료`);
      setBulkAmount(""); setBulkReason(""); setCheckedPartners([]);
      utils.partners.listAll.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleCheck = (id: number) => {
    setCheckedPartners((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };
  const toggleAll = () => {
    if (checkedPartners.length === approvedPartners.length) setCheckedPartners([]);
    else setCheckedPartners(approvedPartners.map((p) => p.id));
  };

  // ===== 신규가입 캠페인 =====
  const [campName, setCampName] = useState("");
  const [campAmount, setCampAmount] = useState("");
  const [campDays, setCampDays] = useState("30");
  const [campStart, setCampStart] = useState("");
  const [campEnd, setCampEnd] = useState("");
  const createCampaign = trpc.admin.createSignupCampaign.useMutation({
    onSuccess: () => {
      toast.success("캠페인이 생성되었습니다");
      setCampName(""); setCampAmount(""); setCampStart(""); setCampEnd("");
      utils.admin.signupCampaigns.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const toggleCampaign = trpc.admin.toggleSignupCampaign.useMutation({
    onSuccess: () => utils.admin.signupCampaigns.invalidate(),
  });
  const deleteCampaign = trpc.admin.deleteSignupCampaign.useMutation({
    onSuccess: () => { toast.success("삭제되었습니다"); utils.admin.signupCampaigns.invalidate(); },
  });

  return (
    <div className="space-y-5">
      {/* 1. 가격 설정 */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="w-4 h-4" /> 열람 가격 / 구독료 설정
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "designatedViewPrice", label: "지정 견적 열람가", fallback: 50000, desc: "고객이 파트너를 지정한 견적" },
            { key: "publicViewPrice", label: "공개 견적 열람가", fallback: 10000, desc: "공개로 올라온 견적" },
            { key: "monthlySubscription", label: "월 구독료", fallback: 50000, desc: "무제한 열람 월정액" },
          ].map((item) => (
            <div key={item.key} className="flex items-end gap-3">
              <div className="flex-1">
                <Label className="text-sm font-medium mb-1.5 block">
                  {item.label}
                  <span className="ml-2 text-xs text-muted-foreground font-normal">{item.desc}</span>
                </Label>
                <div className="flex items-center gap-2">
                  <Input type="number" value={priceVal(item.key, item.fallback)}
                    onChange={(e) => setPrices({ ...prices, [item.key]: e.target.value })} className="max-w-40" />
                  <span className="text-sm text-muted-foreground">원</span>
                </div>
              </div>
              <Button size="sm" variant="outline"
                onClick={() => updateSetting.mutate({ key: item.key as any, value: Number(priceVal(item.key, item.fallback)) })}
                disabled={updateSetting.isPending}>
                <Save className="w-3.5 h-3.5 mr-1" /> 저장
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 2. 신규가입 자동 보너스 캠페인 */}
      <Card className="border-pink-200/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-pink-500" /> 신규가입 자동 보너스 캠페인
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">설정한 기간 내에 승인되는 신규 파트너에게 자동으로 포인트가 지급됩니다.</p>

          {/* 캠페인 생성 폼 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-muted/30 rounded-lg">
            <div className="sm:col-span-2">
              <Label className="text-xs mb-1 block">캠페인명</Label>
              <Input placeholder="예: 6월 신규파트너 환영" value={campName} onChange={(e) => setCampName(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">지급 포인트</Label>
              <Input type="number" placeholder="30000" value={campAmount} onChange={(e) => setCampAmount(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">포인트 유효기간</Label>
              <Select value={campDays} onValueChange={setCampDays}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1일</SelectItem>
                  <SelectItem value="10">10일</SelectItem>
                  <SelectItem value="30">30일</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">캠페인 시작일</Label>
              <Input type="date" value={campStart} onChange={(e) => setCampStart(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">캠페인 종료일</Label>
              <Input type="date" value={campEnd} onChange={(e) => setCampEnd(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Button className="w-full" variant="secondary"
                disabled={!campName || !campAmount || !campStart || !campEnd || createCampaign.isPending}
                onClick={() => createCampaign.mutate({
                  name: campName, bonusAmount: Number(campAmount), validDays: Number(campDays),
                  startsAt: new Date(campStart).toISOString(),
                  endsAt: new Date(campEnd + "T23:59:59").toISOString(),
                })}>
                {createCampaign.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Megaphone className="w-4 h-4 mr-1" />}
                캠페인 등록
              </Button>
            </div>
          </div>

          {/* 캠페인 목록 */}
          {(campaigns as any[]).length > 0 && (
            <div className="space-y-2">
              {(campaigns as any[]).map((c) => {
                const now = new Date();
                const isLive = c.isActive && new Date(c.startsAt) <= now && new Date(c.endsAt) >= now;
                return (
                  <div key={c.id} className="flex items-center gap-3 p-3 border border-border/50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{c.name}</span>
                        {isLive ? <Badge className="text-[10px] bg-green-500">진행중</Badge>
                          : c.isActive ? <Badge variant="outline" className="text-[10px]">대기/종료</Badge>
                          : <Badge variant="secondary" className="text-[10px]">비활성</Badge>}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <Gift className="w-3 h-3" /> {formatWon(c.bonusAmount)}P ({c.validDays}일)
                        <Calendar className="w-3 h-3 ml-1" /> {formatDate(c.startsAt)}~{formatDate(c.endsAt)}
                        <span className="ml-1">지급 {c.grantedCount}건</span>
                      </div>
                    </div>
                    <Checkbox checked={c.isActive} onCheckedChange={(v) => toggleCampaign.mutate({ id: c.id, isActive: v === true })} />
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive h-8 w-8 p-0"
                      onClick={() => deleteCampaign.mutate({ id: c.id })}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. 토큰 수동 충전 (개별) */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-500" /> 토큰 수동 충전 (개별)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-sm font-medium mb-2 block">대상 파트너</Label>
            <Select value={selectedPartner} onValueChange={setSelectedPartner}>
              <SelectTrigger className="w-full"><SelectValue placeholder="파트너를 선택하세요" /></SelectTrigger>
              <SelectContent>
                {approvedPartners.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.companyName} (토큰 {formatWon(p.tokenBalance)} / 포인트 {formatWon(p.pointBalance)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            {[10000, 30000, 50000, 100000, 300000].map((amt) => (
              <Button key={amt} size="sm" variant="outline" onClick={() => setChargeAmount(String(amt))}
                className={chargeAmount === String(amt) ? "border-primary text-primary" : ""}>
                {(amt / 10000)}만원
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Input type="number" placeholder="충전 금액" value={chargeAmount} onChange={(e) => setChargeAmount(e.target.value)} />
            <span className="text-sm text-muted-foreground shrink-0">원</span>
          </div>
          <Button className="w-full" disabled={!selectedPartner || !chargeAmount || chargeToken.isPending}
            onClick={() => chargeToken.mutate({ partnerId: Number(selectedPartner), amount: Number(chargeAmount) })}>
            {chargeToken.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Coins className="w-4 h-4 mr-1" />}
            토큰 충전
          </Button>
        </CardContent>
      </Card>

      {/* 4. 일괄 포인트 지급 */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> 일괄 포인트 지급
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 지급 설정 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs mb-1 block">지급 포인트</Label>
              <Input type="number" placeholder="10000" value={bulkAmount} onChange={(e) => setBulkAmount(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">유효기간</Label>
              <Select value={bulkDays} onValueChange={setBulkDays}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1일</SelectItem>
                  <SelectItem value="10">10일</SelectItem>
                  <SelectItem value="30">30일</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">지급 사유</Label>
              <Input placeholder="예: 명절 이벤트" value={bulkReason} onChange={(e) => setBulkReason(e.target.value)} />
            </div>
          </div>

          {/* 파트너 체크박스 목록 */}
          <div className="border border-border/50 rounded-lg">
            <div className="flex items-center gap-2 p-3 border-b border-border/40 bg-muted/30">
              <Checkbox checked={approvedPartners.length > 0 && checkedPartners.length === approvedPartners.length} onCheckedChange={toggleAll} />
              <span className="text-sm font-medium">전체 선택</span>
              <span className="text-xs text-muted-foreground ml-auto">{checkedPartners.length}명 선택됨</span>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {approvedPartners.map((p) => (
                <label key={p.id} className="flex items-center gap-3 p-3 border-b border-border/30 last:border-0 cursor-pointer hover:bg-muted/20">
                  <Checkbox checked={checkedPartners.includes(p.id)} onCheckedChange={() => toggleCheck(p.id)} />
                  <span className="text-sm font-medium flex-1">{p.companyName}</span>
                  <Badge variant="outline" className="text-[10px] text-pink-500 border-pink-200">포인트 {formatWon(p.pointBalance)}</Badge>
                </label>
              ))}
            </div>
          </div>

          <Button className="w-full"
            disabled={checkedPartners.length === 0 || !bulkAmount || bulkGrant.isPending}
            onClick={() => bulkGrant.mutate({
              partnerIds: checkedPartners, amount: Number(bulkAmount),
              validDays: Number(bulkDays), reason: bulkReason || "일괄 지급",
            })}>
            {bulkGrant.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Users className="w-4 h-4 mr-1" />}
            선택한 {checkedPartners.length}명에게 일괄 지급
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
