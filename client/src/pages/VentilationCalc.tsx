import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { Calculator, Wind, RotateCcw, ArrowRight } from "lucide-react";
import { Link } from "wouter";

const BUILDING_TYPES = [
  { value: "apartment", label: "아파트/주거", rate: 0.5 },
  { value: "office", label: "사무실", rate: 0.7 },
  { value: "restaurant", label: "음식점/주방", rate: 1.5 },
  { value: "factory", label: "공장/산업시설", rate: 2.0 },
  { value: "hospital", label: "병원/의료시설", rate: 1.0 },
  { value: "cleanroom", label: "클린룸", rate: 3.0 },
];

export default function VentilationCalc() {
  const [buildingType, setBuildingType] = useState("");
  const [area, setArea] = useState("");
  const [ceilingHeight, setCeilingHeight] = useState("2.7");
  const [occupants, setOccupants] = useState("");
  const [result, setResult] = useState<{
    volume: number;
    requiredAirflow: number;
    recommendedChanges: number;
    ductDiameter: number;
  } | null>(null);

  const calculate = () => {
    const bt = BUILDING_TYPES.find((b) => b.value === buildingType);
    if (!bt || !area) return;

    const areaM2 = Number(area) * 3.3058;
    const height = Number(ceilingHeight) || 2.7;
    const volume = areaM2 * height;
    const changes = bt.rate;
    const requiredAirflow = volume * changes;
    const occupantFlow = (Number(occupants) || 0) * 30;
    const totalFlow = Math.max(requiredAirflow, occupantFlow);
    const velocity = 5;
    const ductArea = totalFlow / 3600 / velocity;
    const ductDiameter = Math.sqrt(ductArea / Math.PI) * 2 * 1000;

    setResult({
      volume: Math.round(volume * 10) / 10,
      requiredAirflow: Math.round(totalFlow),
      recommendedChanges: changes,
      ductDiameter: Math.round(ductDiameter),
    });
  };

  const reset = () => {
    setBuildingType("");
    setArea("");
    setCeilingHeight("2.7");
    setOccupants("");
    setResult(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-3xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Calculator className="w-4 h-4" />
              무료 사용
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">환기설계 계산기</h1>
            <p className="text-muted-foreground">건물 조건을 입력하면 필요 환기량과 추천 덕트 사이즈를 계산합니다</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wind className="w-5 h-5 text-primary" />
                  조건 입력
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label className="text-sm font-medium mb-2 block">건물 유형 *</Label>
                  <Select value={buildingType} onValueChange={setBuildingType}>
                    <SelectTrigger><SelectValue placeholder="건물 유형을 선택하세요" /></SelectTrigger>
                    <SelectContent>
                      {BUILDING_TYPES.map((bt) => (
                        <SelectItem key={bt.value} value={bt.value}>{bt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">면적 (평) *</Label>
                  <Input type="number" placeholder="예: 30" value={area} onChange={(e) => setArea(e.target.value)} />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">천장 높이 (m)</Label>
                  <Input type="number" step="0.1" value={ceilingHeight} onChange={(e) => setCeilingHeight(e.target.value)} />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">재실 인원 (명)</Label>
                  <Input type="number" placeholder="선택사항" value={occupants} onChange={(e) => setOccupants(e.target.value)} />
                </div>
                <div className="flex gap-3">
                  <Button onClick={calculate} className="flex-1 gap-2" disabled={!buildingType || !area}>
                    <Calculator className="w-4 h-4" /> 계산하기
                  </Button>
                  <Button variant="outline" onClick={reset} className="gap-2">
                    <RotateCcw className="w-4 h-4" /> 초기화
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className={`border-border/50 shadow-sm transition-opacity ${result ? "opacity-100" : "opacity-50"}`}>
              <CardHeader>
                <CardTitle className="text-lg">계산 결과</CardTitle>
              </CardHeader>
              <CardContent>
                {result ? (
                  <div className="space-y-5">
                    <div className="bg-primary/5 rounded-xl p-4">
                      <div className="text-sm text-muted-foreground mb-1">필요 환기량</div>
                      <div className="text-3xl font-bold text-primary">{result.requiredAirflow.toLocaleString()} <span className="text-base font-normal">m³/h</span></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-muted/50 rounded-xl p-4">
                        <div className="text-xs text-muted-foreground mb-1">공간 체적</div>
                        <div className="text-lg font-semibold">{result.volume} m³</div>
                      </div>
                      <div className="bg-muted/50 rounded-xl p-4">
                        <div className="text-xs text-muted-foreground mb-1">권장 환기 횟수</div>
                        <div className="text-lg font-semibold">{result.recommendedChanges}회/h</div>
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-4">
                      <div className="text-xs text-muted-foreground mb-1">추천 덕트 직경</div>
                      <div className="text-lg font-semibold">{result.ductDiameter} mm</div>
                    </div>
                    <Link href="/quote-request">
                      <Button className="w-full gap-2 mt-2">
                        이 조건으로 견적의뢰 <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calculator className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">조건을 입력하고 계산하기를 눌러주세요</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
