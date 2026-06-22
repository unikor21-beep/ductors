import { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Download, TrendingUp, FileText, Users, Building2, Coins } from "lucide-react";
import { QUOTE_STATUS_LABELS, GRADE_LABELS, PARTNER_STATUS_LABELS, ROLE_LABELS } from "@shared/constants";

type Range = { from?: string; to?: string };

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function startOfYear() {
  return `${new Date().getFullYear()}-01-01`;
}
function startOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
const num = (n: number) => (n || 0).toLocaleString("ko-KR");

// 분포 막대 (라이브러리 없이 CSS로)
function DistBar({ data, labelMap, color = "#16a34a" }: { data: Record<string, number>; labelMap?: Record<string, string>; color?: string }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map((e) => e[1]));
  if (entries.length === 0) return <p className="text-sm text-muted-foreground">데이터 없음</p>;
  return (
    <div className="space-y-2">
      {entries.map(([k, v]) => (
        <div key={k} className="flex items-center gap-2 text-sm">
          <span className="w-24 shrink-0 text-muted-foreground truncate">{labelMap?.[k] || k}</span>
          <div className="flex-1 bg-muted rounded h-5 overflow-hidden">
            <div className="h-full rounded" style={{ width: `${(v / max) * 100}%`, backgroundColor: color, minWidth: v > 0 ? "2px" : 0 }} />
          </div>
          <span className="w-10 shrink-0 text-right font-medium">{num(v)}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminAnalytics() {
  const [range, setRange] = useState<Range>({});
  const [preset, setPreset] = useState<"all" | "year" | "month" | "custom">("all");

  const { data, isLoading } = trpc.admin.analytics.useQuery(range);
  const rawExport = trpc.admin.rawExport.useQuery(undefined, { enabled: false });

  function applyPreset(p: "all" | "year" | "month") {
    setPreset(p);
    if (p === "all") setRange({});
    else if (p === "year") setRange({ from: startOfYear(), to: todayStr() });
    else if (p === "month") setRange({ from: startOfMonth(), to: todayStr() });
  }

  const rangeLabel = useMemo(() => {
    if (!range.from && !range.to) return "전체 기간";
    return `${range.from || "처음"} ~ ${range.to || "오늘"}`;
  }, [range]);

  // 기간 필터(클라이언트) — raw export
  function inRange(d: any) {
    const t = new Date(d).getTime();
    if (range.from && t < new Date(range.from + "T00:00:00").getTime()) return false;
    if (range.to && t > new Date(range.to + "T23:59:59").getTime()) return false;
    return true;
  }

  async function handleExport() {
    const res = await rawExport.refetch();
    const raw = res.data;
    if (!raw) return;
    const fmt = (d: any) => (d ? new Date(d).toLocaleString("ko-KR") : "");

    const quotesRows = raw.quotes.filter((q: any) => inRange(q.createdAt)).map((q: any) => ({
      ID: q.id,
      의뢰자아이디: q.customerUsername || q.customerName || "",
      제목: q.title,
      공사유형: q.categoryName || "",
      견적유형: q.type === "public" ? "공개" : "지정",
      지역: q.region || "",
      상태: QUOTE_STATUS_LABELS[q.status] || q.status,
      매칭파트너: q.selectedPartnerName || q.designatedPartnerName || "",
      등록일: fmt(q.createdAt),
    }));
    const usersRows = raw.users.filter((u: any) => inRange(u.createdAt)).map((u: any) => ({
      ID: u.id,
      아이디: u.username || "",
      이름: u.name || "",
      이메일: u.email || "",
      역할: ROLE_LABELS[u.role] || u.role,
      가입일: fmt(u.createdAt),
      탈퇴여부: u.deletedAt ? "탈퇴" : "",
    }));
    const partnersRows = raw.partners.filter((p: any) => inRange(p.createdAt)).map((p: any) => ({
      ID: p.id,
      회사명: p.companyName || "",
      대표자: p.representativeName || "",
      사업자번호: p.businessNumber || "",
      등급: GRADE_LABELS[p.grade || "bronze"] || p.grade,
      승인상태: PARTNER_STATUS_LABELS[p.status] || p.status,
      평점: p.avgRating || "0",
      리뷰수: p.reviewCount || 0,
      토큰잔액: p.tokenBalance || 0,
      가입일: fmt(p.createdAt),
    }));
    const txRows = raw.transactions.filter((t: any) => inRange(t.createdAt)).map((t: any) => ({
      ID: t.id,
      파트너ID: t.partnerId,
      구분: { charge: "충전", deduct: "차감", expire: "소멸", refund: "환불" }[t.type as string] || t.type,
      금액: t.amount,
      관련견적: t.relatedQuoteId || "",
      일시: fmt(t.createdAt),
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(quotesRows), "견적");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(usersRows), "회원");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(partnersRows), "파트너");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(txRows), "토큰내역");
    const tag = range.from || range.to ? `_${range.from || "처음"}_${range.to || "오늘"}` : "_전체";
    XLSX.writeFile(wb, `덕터스_데이터${tag}.xlsx`);
  }

  return (
    <div className="space-y-4">
      {/* 기간 선택 + 엑셀 */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-sm font-medium">기간 <span className="text-muted-foreground font-normal">({rangeLabel})</span></span>
            <Button size="sm" onClick={handleExport} disabled={rawExport.isFetching}>
              {rawExport.isFetching ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />}
              엑셀 다운로드 (기간 적용)
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {([["all", "전체"], ["year", "올해"], ["month", "이번 달"]] as const).map(([k, label]) => (
              <button key={k} onClick={() => applyPreset(k)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${preset === k ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-muted"}`}>
                {label}
              </button>
            ))}
            <div className="flex items-center gap-1.5 ml-2">
              <Input type="date" value={range.from || ""} onChange={(e) => { setPreset("custom"); setRange((r) => ({ ...r, from: e.target.value })); }} className="h-8 w-auto text-xs" />
              <span className="text-muted-foreground text-xs">~</span>
              <Input type="date" value={range.to || ""} onChange={(e) => { setPreset("custom"); setRange((r) => ({ ...r, to: e.target.value })); }} className="h-8 w-auto text-xs" />
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading || !data ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          {/* 핵심 지표 카드 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "견적 의뢰", value: num(data.quotes.total), sub: "건", icon: FileText, color: "text-purple-600 bg-purple-50" },
              { label: "매칭 성공률", value: pct(data.quotes.matchRate), sub: "매칭 이상", icon: TrendingUp, color: "text-green-600 bg-green-50" },
              { label: "거래 완료율", value: pct(data.quotes.completeRate), sub: "완료", icon: TrendingUp, color: "text-lime-700 bg-lime-50" },
              { label: "취소율", value: pct(data.quotes.cancelRate), sub: "취소", icon: TrendingUp, color: "text-red-600 bg-red-50" },
            ].map((s, i) => (
              <Card key={i} className="border-border/50 shadow-sm">
                <CardContent className="p-4">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${s.color}`}><s.icon className="w-4 h-4" /></div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-bold text-foreground">{s.value}</p>
                  <p className="text-[11px] text-muted-foreground">{s.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 수익(토큰 기준) — 1단계 */}
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-1">
                <Coins className="w-4 h-4 text-amber-600" />
                <h3 className="font-semibold">수익 / 결제 현황</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4">⚠️ PG 미연동 — 현재는 <b>토큰 충전·차감 기록</b> 기준입니다. 실 매출은 PG 연동 후 전환됩니다.</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-lg bg-muted/40"><p className="text-xs text-muted-foreground">총 충전(토큰)</p><p className="text-lg font-bold">{num(data.tokens.charge)}</p></div>
                <div className="p-3 rounded-lg bg-muted/40"><p className="text-xs text-muted-foreground">총 차감(열람 등)</p><p className="text-lg font-bold">{num(data.tokens.deduct)}</p></div>
                <div className="p-3 rounded-lg bg-muted/40"><p className="text-xs text-muted-foreground">환불</p><p className="text-lg font-bold">{num(data.tokens.refund)}</p></div>
                <div className="p-3 rounded-lg bg-muted/40"><p className="text-xs text-muted-foreground">거래 건수</p><p className="text-lg font-bold">{num(data.tokens.txCount)}</p></div>
              </div>
            </CardContent>
          </Card>

          {/* 분포들 */}
          <div className="grid md:grid-cols-2 gap-3">
            <Card className="border-border/50 shadow-sm"><CardContent className="p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-purple-600" />상태별 견적</h3>
              <DistBar data={data.quotes.byStatus} labelMap={QUOTE_STATUS_LABELS} color="#7c3aed" />
            </CardContent></Card>

            <Card className="border-border/50 shadow-sm"><CardContent className="p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-blue-600" />견적유형</h3>
              <DistBar data={{ 공개: data.quotes.byType.public, 지정: data.quotes.byType.designated }} color="#2563eb" />
            </CardContent></Card>

            <Card className="border-border/50 shadow-sm"><CardContent className="p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-green-600" />공사유형별</h3>
              <DistBar data={data.quotes.byCategory} color="#16a34a" />
            </CardContent></Card>

            <Card className="border-border/50 shadow-sm"><CardContent className="p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-cyan-600" />지역별 (시/도)</h3>
              <DistBar data={data.quotes.byRegion} color="#0891b2" />
            </CardContent></Card>

            <Card className="border-border/50 shadow-sm"><CardContent className="p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-lime-700" />신규 회원 {num(data.users.newUsers)}명</h3>
              <DistBar data={data.users.byRole} labelMap={ROLE_LABELS} color="#65a30d" />
            </CardContent></Card>

            <Card className="border-border/50 shadow-sm"><CardContent className="p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Building2 className="w-4 h-4 text-emerald-600" />파트너 등급 (전체 {num(data.partners.total)})</h3>
              <DistBar data={data.partners.byGrade} labelMap={GRADE_LABELS} color="#059669" />
            </CardContent></Card>
          </div>
        </>
      )}
    </div>
  );
}
