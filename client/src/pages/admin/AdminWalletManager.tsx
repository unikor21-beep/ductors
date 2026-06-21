/**
 * AdminWalletManager - 관리자 지갑 관리
 * 1. 열람 가격/구독료 설정
 * 2. 파트너 토큰 수동 충전
 * 3. 파트너 포인트 프로모션 지급
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Coins, Gift, Settings, Save, Loader2 } from "lucide-react";

function formatWon(n: number) {
  return (n ?? 0).toLocaleString("ko-KR");
}

export default function AdminWalletManager() {
  const utils = trpc.useUtils();
  const { data: settings } = trpc.admin.walletSettings.useQuery();
  const { data: partners = [] } = trpc.partners.listAll.useQuery();

  // 가격 설정 입력값
  const [prices, setPrices] = useState<Record<string, string>>({});
  const priceVal = (key: string, fallback: number) =>
    prices[key] !== undefined ? prices[key] : String((settings as any)?.[key] ?? fallback);

  const updateSetting = trpc.admin.updateWalletSetting.useMutation({
    onSuccess: () => { toast.success("설정이 저장되었습니다"); utils.admin.walletSettings.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  // 충전/지급 입력값
  const [selectedPartner, setSelectedPartner] = useState<string>("");
  const [chargeAmount, setChargeAmount] = useState("");
  const [pointAmount, setPointAmount] = useState("");
  const [pointDays, setPointDays] = useState("30");
  const [pointReason, setPointReason] = useState("");

  const chargeToken = trpc.admin.chargeToken.useMutation({
    onSuccess: (r) => {
      toast.success(`토큰 충전 완료 (잔액: ${formatWon(r.newBalance ?? 0)}원)`);
      setChargeAmount("");
      utils.partners.listAll.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const grantPoint = trpc.admin.grantPoint.useMutation({
    onSuccess: (r) => {
      toast.success(`포인트 지급 완료 (잔액: ${formatWon(r.newBalance ?? 0)}원)`);
      setPointAmount(""); setPointReason("");
      utils.partners.listAll.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const approvedPartners = (partners as any[]).filter((p) => p.status === "approved");

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
            { key: "designatedViewPrice", label: "지정 견적 열람가", fallback: 50000, desc: "고객이 파트너를 지정한 견적 열람 시" },
            { key: "publicViewPrice", label: "공개 견적 열람가", fallback: 10000, desc: "공개로 올라온 견적 열람 시" },
            { key: "monthlySubscription", label: "월 구독료", fallback: 50000, desc: "무제한 열람 월정액" },
          ].map((item) => (
            <div key={item.key} className="flex items-end gap-3">
              <div className="flex-1">
                <Label className="text-sm font-medium mb-1.5 block">
                  {item.label}
                  <span className="ml-2 text-xs text-muted-foreground font-normal">{item.desc}</span>
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={priceVal(item.key, item.fallback)}
                    onChange={(e) => setPrices({ ...prices, [item.key]: e.target.value })}
                    className="max-w-40"
                  />
                  <span className="text-sm text-muted-foreground">원</span>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateSetting.mutate({ key: item.key as any, value: Number(priceVal(item.key, item.fallback)) })}
                disabled={updateSetting.isPending}
              >
                <Save className="w-3.5 h-3.5 mr-1" /> 저장
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 파트너 선택 (공통) */}
      <Card className="border-primary/20 bg-primary/5 shadow-sm">
        <CardContent className="p-5">
          <Label className="text-sm font-medium mb-2 block">대상 파트너 선택</Label>
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
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 2. 토큰 충전 */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-500" /> 토큰 수동 충전
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {[10000, 30000, 50000, 100000, 300000].map((amt) => (
                <Button key={amt} size="sm" variant="outline"
                  onClick={() => setChargeAmount(String(amt))}
                  className={chargeAmount === String(amt) ? "border-primary text-primary" : ""}
                >
                  {(amt / 10000)}만원
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input type="number" placeholder="충전 금액" value={chargeAmount} onChange={(e) => setChargeAmount(e.target.value)} />
              <span className="text-sm text-muted-foreground shrink-0">원</span>
            </div>
            <Button
              className="w-full"
              disabled={!selectedPartner || !chargeAmount || chargeToken.isPending}
              onClick={() => chargeToken.mutate({ partnerId: Number(selectedPartner), amount: Number(chargeAmount) })}
            >
              {chargeToken.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Coins className="w-4 h-4 mr-1" />}
              토큰 충전
            </Button>
          </CardContent>
        </Card>

        {/* 3. 포인트 지급 */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Gift className="w-4 h-4 text-pink-500" /> 프로모션 포인트 지급
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Input type="number" placeholder="지급 포인트" value={pointAmount} onChange={(e) => setPointAmount(e.target.value)} />
              <span className="text-sm text-muted-foreground shrink-0">원</span>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">유효기간</Label>
              <Select value={pointDays} onValueChange={setPointDays}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1일</SelectItem>
                  <SelectItem value="10">10일</SelectItem>
                  <SelectItem value="30">30일</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input placeholder="지급 사유 (예: 신규가입 축하)" value={pointReason} onChange={(e) => setPointReason(e.target.value)} />
            <Button
              className="w-full"
              variant="secondary"
              disabled={!selectedPartner || !pointAmount || grantPoint.isPending}
              onClick={() => grantPoint.mutate({
                partnerId: Number(selectedPartner),
                amount: Number(pointAmount),
                validDays: Number(pointDays),
                reason: pointReason || "프로모션 지급",
              })}
            >
              {grantPoint.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Gift className="w-4 h-4 mr-1" />}
              포인트 지급
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 파트너 잔액 현황 */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">파트너 잔액 현황</CardTitle>
        </CardHeader>
        <CardContent>
          {approvedPartners.length === 0 ? (
            <p className="text-center text-muted-foreground py-6 text-sm">승인된 파트너가 없습니다</p>
          ) : (
            <div className="space-y-2">
              {approvedPartners.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0">
                  <span className="text-sm font-medium">{p.companyName}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs text-amber-600 border-amber-200">
                      토큰 {formatWon(p.tokenBalance)}
                    </Badge>
                    <Badge variant="outline" className="text-xs text-pink-500 border-pink-200">
                      포인트 {formatWon(p.pointBalance)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
