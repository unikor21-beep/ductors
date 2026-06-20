/**
 * RegionMultiSelect - 파트너 활동 지역 다중 선택 (2단계)
 * 시/도 탭 선택 → 구/시/군 체크박스 (복수 선택)
 * 선택된 지역: "서울 강남구", "경기 화성시" 등 배열로 관리
 */
import { useState } from "react";
import { REGION_DATA, SIDO_LIST } from "@/components/RegionSelect";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Label } from "@/components/ui/label";

type Props = {
  value: string[];
  onChange: (regions: string[]) => void;
};

export default function RegionMultiSelect({ value, onChange }: Props) {
  const [activeSido, setActiveSido] = useState(SIDO_LIST[0]);

  const subList = REGION_DATA[activeSido] ?? [];
  const isSejong = activeSido === "세종";

  // 현재 시도 전체 선택 여부
  const sidoKey = activeSido; // 세종은 "세종" 단독
  const allSubs = isSejong ? [sidoKey] : subList.map((s) => `${activeSido} ${s}`);
  const selectedInSido = allSubs.filter((k) => value.includes(k));
  const allSelected = allSubs.length > 0 && selectedInSido.length === allSubs.length;

  function toggle(key: string) {
    if (value.includes(key)) {
      onChange(value.filter((v) => v !== key));
    } else {
      onChange([...value, key]);
    }
  }

  function toggleAll() {
    if (allSelected) {
      onChange(value.filter((v) => !allSubs.includes(v)));
    } else {
      const next = [...value];
      allSubs.forEach((k) => { if (!next.includes(k)) next.push(k); });
      onChange(next);
    }
  }

  function removeTag(key: string) {
    onChange(value.filter((v) => v !== key));
  }

  return (
    <div className="space-y-3">
      {/* 선택된 지역 태그 */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((v) => (
            <Badge key={v} variant="secondary" className="text-xs gap-1 pr-1">
              {v}
              <button onClick={() => removeTag(v)} className="hover:text-destructive ml-0.5">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          {value.length > 0 && (
            <button
              onClick={() => onChange([])}
              className="text-xs text-muted-foreground hover:text-destructive underline"
            >
              전체 해제
            </button>
          )}
        </div>
      )}

      <div className="border border-border rounded-xl overflow-hidden">
        <div className="flex">
          {/* 시/도 탭 */}
          <div className="w-24 shrink-0 bg-muted/40 border-r border-border overflow-y-auto max-h-64">
            {SIDO_LIST.map((sido) => {
              const sidoSubs = sido === "세종" ? [sido] : REGION_DATA[sido].map((s) => `${sido} ${s}`);
              const cnt = sidoSubs.filter((k) => value.includes(k)).length;
              return (
                <button
                  key={sido}
                  onClick={() => setActiveSido(sido)}
                  className={`w-full text-left px-3 py-2.5 text-sm transition-colors flex items-center justify-between gap-1 ${
                    activeSido === sido
                      ? "bg-background font-semibold text-primary border-r-2 border-primary -mr-px"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  <span>{sido}</span>
                  {cnt > 0 && (
                    <span className="text-[10px] bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center shrink-0">
                      {cnt}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 구/시/군 체크박스 */}
          <div className="flex-1 p-3 overflow-y-auto max-h-64">
            {isSejong ? (
              <label className="flex items-center gap-2 text-sm cursor-pointer py-1">
                <Checkbox
                  checked={value.includes("세종")}
                  onCheckedChange={() => toggle("세종")}
                />
                세종시 전체
              </label>
            ) : (
              <>
                {/* 전체 선택 */}
                <label className="flex items-center gap-2 text-sm cursor-pointer py-1 mb-1 border-b border-border/50 pb-2">
                  <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                  <span className="font-medium text-primary">{activeSido} 전체</span>
                </label>
                <div className="grid grid-cols-2 gap-x-2">
                  {subList.map((sub) => {
                    const key = `${activeSido} ${sub}`;
                    return (
                      <label key={key} className="flex items-center gap-2 text-sm cursor-pointer py-1">
                        <Checkbox
                          checked={value.includes(key)}
                          onCheckedChange={() => toggle(key)}
                        />
                        {sub}
                      </label>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {value.length > 0 ? `${value.length}개 지역 선택됨` : "활동 가능한 지역을 모두 선택해주세요"}
      </p>
    </div>
  );
}
