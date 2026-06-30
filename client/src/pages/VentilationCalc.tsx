import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { useState, useMemo } from "react";
import { Wind, RotateCcw, AlertTriangle, ChevronDown, Info } from "lucide-react";
import {
  calculateVentilation, USAGE_SPECS, BBQ_DEFAULTS,
  type UsageType, type CalcInput, type CalcResult,
} from "@shared/ventilation";

export default function VentilationCalc() {
  const [usage, setUsage] = useState<UsageType | "">("");
  const [width, setWidth] = useState("");
  const [depth, setDepth] = useState("");
  const [height, setHeight] = useState("2.7");
  const [margin, setMargin] = useState(30);

  const [occupants, setOccupants] = useState("");
  const [hoodArea, setHoodArea] = useState("");
  const [bbqTables, setBbqTables] = useState("");
  const [bbqDetailOpen, setBbqDetailOpen] = useState(false);
  const [bbqHoodArea, setBbqHoodArea] = useState(String(BBQ_DEFAULTS.hoodArea));
  const [bbqVelocity, setBbqVelocity] = useState(String(BBQ_DEFAULTS.faceVelocity));
  const [bbqDiversity, setBbqDiversity] = useState(String(BBQ_DEFAULTS.diversityRate));

  const [ductShape, setDuctShape] = useState<"round" | "rect">("round");
  const [ductDiameter, setDuctDiameter] = useState("250");
  const [ductW, setDuctW] = useState("300");
  const [ductH, setDuctH] = useState("200");
  const [ductLength, setDuctLength] = useState("5");
  const [elbowCount, setElbowCount] = useState("2");
  const [ductMaterial, setDuctMaterial] = useState<"galvanized" | "flexible">("galvanized");

  const [result, setResult] = useState<CalcResult | null>(null);

  const spec = USAGE_SPECS.find((s) => s.value === usage);

  // 권장 덕트 직경 가이드 (풍속 ~6m/s 기준 역산)
  const suggestedDiameter = useMemo(() => {
    if (!result) return null;
    const Q = result.recommendedAirflow / 3600;
    const D = Math.sqrt((4 * Q) / (Math.PI * 6)) * 1000;
    return Math.ceil(D / 10) * 10;
  }, [result]);

  const calculate = () => {
    if (!usage || !width || !depth) return;
    const input: CalcInput = {
      usage, width: Number(width), depth: Number(depth), height: Number(height) || 2.7,
      marginPct: margin,
      occupants: Number(occupants) || 0,
      hoodArea: Number(hoodArea) || 0,
      bbqTables: Number(bbqTables) || 0,
      bbqHoodArea: Number(bbqHoodArea) || BBQ_DEFAULTS.hoodArea,
      bbqFaceVelocity: Number(bbqVelocity) || BBQ_DEFAULTS.faceVelocity,
      bbqDiversity: Number(bbqDiversity) || BBQ_DEFAULTS.diversityRate,
      ductShape,
      ductDiameter: Number(ductDiameter) || 0,
      ductWidth: Number(ductW) || 0,
      ductHeightMm: Number(ductH) || 0,
      ductLength: Number(ductLength) || 0,
      elbowCount: Number(elbowCount) || 0,
      ductMaterial,
    };
    setResult(calculateVentilation(input));
  };

  const reset = () => {
    setUsage(""); setWidth(""); setDepth(""); setHeight("2.7"); setMargin(30);
    setOccupants(""); setHoodArea(""); setBbqTables(""); setResult(null);
  };

  const fmt = (n: number) => n.toLocaleString("ko-KR");

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <Header />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
            <Wind className="w-3.5 h-3.5" /> 환기 사양 계산기
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">필요 풍량·정압 계산</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            설치 조건을 입력하면 공인 기준에 따라 필요 풍량과 정압을 계산합니다.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* ── 입력부 ── */}
          <div className="lg:col-span-2 space-y-5">
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-3"><CardTitle className="text-base">설치 조건</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm mb-1.5 block">설치 용도</Label>
                  <Select value={usage} onValueChange={(v) => setUsage(v as UsageType)}>
                    <SelectTrigger><SelectValue placeholder="용도를 선택하세요" /></SelectTrigger>
                    <SelectContent>
                      {USAGE_SPECS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div><Label className="text-xs mb-1.5 block text-muted-foreground">가로(m)</Label><Input type="number" value={width} onChange={(e) => setWidth(e.target.value)} placeholder="0" /></div>
                  <div><Label className="text-xs mb-1.5 block text-muted-foreground">세로(m)</Label><Input type="number" value={depth} onChange={(e) => setDepth(e.target.value)} placeholder="0" /></div>
                  <div><Label className="text-xs mb-1.5 block text-muted-foreground">높이(m)</Label><Input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="2.7" /></div>
                </div>
                {width && depth && height && (
                  <p className="text-xs text-primary bg-primary/5 rounded-lg px-3 py-2">
                    체적 = {(Number(width) * Number(depth) * Number(height)).toFixed(1)} ㎥
                  </p>
                )}

                {/* 용도별 추가 입력 */}
                {spec?.method === "occupancy" && (
                  <div><Label className="text-sm mb-1.5 block">재실 인원수</Label><Input type="number" value={occupants} onChange={(e) => setOccupants(e.target.value)} placeholder="명" /></div>
                )}
                {spec?.method === "hood_face" && (
                  <div><Label className="text-sm mb-1.5 block">후드 개구면적 (㎡)</Label><Input type="number" value={hoodArea} onChange={(e) => setHoodArea(e.target.value)} placeholder="예: 1.5" /></div>
                )}
                {spec?.method === "bbq_table" && (
                  <div className="space-y-3">
                    <div><Label className="text-sm mb-1.5 block">테이블 수</Label><Input type="number" value={bbqTables} onChange={(e) => setBbqTables(e.target.value)} placeholder="개" /></div>
                    <button type="button" onClick={() => setBbqDetailOpen(!bbqDetailOpen)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${bbqDetailOpen ? "rotate-180" : ""}`} /> 상세 설정 (후드·면풍속·동시율)
                    </button>
                    {bbqDetailOpen && (
                      <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-muted/40">
                        <div><Label className="text-[11px] mb-1 block text-muted-foreground">후드면적㎡</Label><Input type="number" value={bbqHoodArea} onChange={(e) => setBbqHoodArea(e.target.value)} /></div>
                        <div><Label className="text-[11px] mb-1 block text-muted-foreground">면풍속m/s</Label><Input type="number" value={bbqVelocity} onChange={(e) => setBbqVelocity(e.target.value)} /></div>
                        <div><Label className="text-[11px] mb-1 block text-muted-foreground">동시율</Label><Input type="number" value={bbqDiversity} onChange={(e) => setBbqDiversity(e.target.value)} /></div>
                        <p className="col-span-3 text-[10px] text-muted-foreground">※ 실무 대표값입니다. 현장에 맞게 조절하세요.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* 여유율 슬라이더 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm">여유율(마진)</Label>
                    <span className="text-sm font-semibold text-primary">{margin}%</span>
                  </div>
                  <Slider value={[margin]} onValueChange={(v) => setMargin(v[0])} min={0} max={50} step={5} />
                </div>
              </CardContent>
            </Card>

            {/* 덕트 입력 */}
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-3"><CardTitle className="text-base">덕트 정보 <span className="text-xs font-normal text-muted-foreground">(정압 계산용)</span></CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs mb-1.5 block text-muted-foreground">덕트 형상</Label>
                    <Select value={ductShape} onValueChange={(v) => setDuctShape(v as "round" | "rect")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="round">원형</SelectItem><SelectItem value="rect">사각</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs mb-1.5 block text-muted-foreground">재질</Label>
                    <Select value={ductMaterial} onValueChange={(v) => setDuctMaterial(v as "galvanized" | "flexible")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="galvanized">아연도금</SelectItem><SelectItem value="flexible">플렉시블</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
                {ductShape === "round" ? (
                  <div><Label className="text-xs mb-1.5 block text-muted-foreground">덕트 직경(mm)</Label><Input type="number" value={ductDiameter} onChange={(e) => setDuctDiameter(e.target.value)} /></div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label className="text-xs mb-1.5 block text-muted-foreground">가로(mm)</Label><Input type="number" value={ductW} onChange={(e) => setDuctW(e.target.value)} /></div>
                    <div><Label className="text-xs mb-1.5 block text-muted-foreground">세로(mm)</Label><Input type="number" value={ductH} onChange={(e) => setDuctH(e.target.value)} /></div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div><Label className="text-xs mb-1.5 block text-muted-foreground">덕트 길이(m)</Label><Input type="number" value={ductLength} onChange={(e) => setDuctLength(e.target.value)} /></div>
                  <div><Label className="text-xs mb-1.5 block text-muted-foreground">엘보 개수</Label><Input type="number" value={elbowCount} onChange={(e) => setElbowCount(e.target.value)} /></div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button onClick={calculate} disabled={!usage || !width || !depth} className="flex-1">계산하기</Button>
              <Button onClick={reset} variant="outline" size="icon"><RotateCcw className="w-4 h-4" /></Button>
            </div>
          </div>

          {/* ── 결과부 ── */}
          <div className="lg:col-span-3">
            {!result ? (
              <Card className="border-border/60 border-dashed h-full min-h-[400px] flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Wind className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">설치 조건을 입력하고 계산하기를 누르세요</p>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* 핵심 결과 2값 */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
                    <CardContent className="pt-5">
                      <p className="text-xs text-muted-foreground mb-1">필요 풍량</p>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-bold text-primary">{fmt(result.recommendedAirflow)}</span>
                        <span className="text-sm text-muted-foreground">CMH</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">이론 {fmt(result.theoreticalAirflow)} · 여유율 {margin}%</p>
                    </CardContent>
                  </Card>
                  <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
                    <CardContent className="pt-5">
                      <p className="text-xs text-muted-foreground mb-1">필요 정압</p>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-bold text-primary">{result.recommendedPressure}</span>
                        <span className="text-sm text-muted-foreground">mmAq</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">이론 {result.theoreticalPressure} · 덕트풍속 {result.ductVelocity}m/s</p>
                    </CardContent>
                  </Card>
                </div>

                {/* 계산 근거 */}
                <Card className="border-border/60">
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Info className="w-4 h-4 text-primary" /> 계산 근거</CardTitle></CardHeader>
                  <CardContent className="space-y-1.5 text-sm text-muted-foreground">
                    <p>· 용도: <span className="text-foreground">{spec?.label}</span> ({spec?.achNote})</p>
                    {result.notes.map((n, i) => <p key={i}>· {n}</p>)}
                    <p>· 체적: {result.volume} ㎥</p>
                    {suggestedDiameter && result.ductVelocity > 8 && (
                      <p className="text-amber-600">· 권장 덕트 직경: 풍속 6m/s 기준 약 Ø{suggestedDiameter}mm 이상</p>
                    )}
                  </CardContent>
                </Card>

                {/* 경고 */}
                {result.warnings.length > 0 && (
                  <Card className="border-amber-200 bg-amber-50/60">
                    <CardContent className="pt-4 space-y-2">
                      {result.warnings.map((w, i) => (
                        <div key={i} className="flex gap-2 text-sm text-amber-800">
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /><span>{w}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* 면책 */}
                <p className="text-xs text-muted-foreground leading-relaxed px-1">
                  ⚠️ 본 결과는 공인 기준(건축물 설비기준 규칙, ASHRAE 등)에 근거한 <strong>설계 참고용 추정치</strong>입니다.
                  표준 대표값을 사용하므로 현장 실측과 차이가 날 수 있으며, 정확한 인허가 설계는 기계설비기술자의 검토가 필요합니다.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
