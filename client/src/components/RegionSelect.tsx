/**
 * RegionSelect - 2단계 지역 선택 컴포넌트
 * 1단계: 시/도 선택
 * 2단계: 구/시/군 선택 (자동 표시)
 */
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// ── 전국 행정구역 데이터 ──────────────────────────────────
export const REGION_DATA: Record<string, string[]> = {
  "서울": [
    "강남구","강동구","강북구","강서구","관악구","광진구","구로구","금천구",
    "노원구","도봉구","동대문구","동작구","마포구","서대문구","서초구","성동구",
    "성북구","송파구","양천구","영등포구","용산구","은평구","종로구","중구","중랑구"
  ],
  "경기": [
    "가평군","고양시","과천시","광명시","광주시","구리시","군포시","김포시",
    "남양주시","동두천시","부천시","성남시","수원시","시흥시","안산시","안성시",
    "안양시","양주시","양평군","여주시","연천군","오산시","용인시","의왕시",
    "의정부시","이천시","파주시","평택시","포천시","하남시","화성시"
  ],
  "인천": [
    "강화군","계양구","남동구","동구","미추홀구","부평구","서구","연수구","옹진군","중구"
  ],
  "부산": [
    "강서구","금정구","기장군","남구","동구","동래구","부산진구","북구","사상구",
    "사하구","서구","수영구","연제구","영도구","중구","해운대구"
  ],
  "대구": [
    "군위군","남구","달서구","달성군","동구","북구","서구","수성구","중구"
  ],
  "광주": [
    "광산구","남구","동구","북구","서구"
  ],
  "대전": [
    "대덕구","동구","서구","유성구","중구"
  ],
  "울산": [
    "남구","동구","북구","울주군","중구"
  ],
  "세종": [
    "세종시 전체"
  ],
  "강원": [
    "강릉시","고성군","동해시","삼척시","속초시","양구군","양양군","영월군",
    "원주시","인제군","정선군","철원군","춘천시","태백시","평창군","홍천군",
    "화천군","횡성군"
  ],
  "충북": [
    "괴산군","단양군","보은군","영동군","옥천군","음성군","제천시","증평군",
    "진천군","청주시","충주시"
  ],
  "충남": [
    "계룡시","공주시","금산군","논산시","당진시","보령시","부여군","서산시",
    "서천군","아산시","예산군","천안시","청양군","태안군","홍성군"
  ],
  "전북": [
    "고창군","군산시","김제시","남원시","무주군","부안군","순창군","완주군",
    "익산시","임실군","장수군","전주시","정읍시","진안군"
  ],
  "전남": [
    "강진군","고흥군","곡성군","광양시","구례군","나주시","담양군","목포시",
    "무안군","보성군","순천시","신안군","여수시","영광군","영암군","완도군",
    "장성군","장흥군","진도군","함평군","해남군","화순군"
  ],
  "경북": [
    "경산시","경주시","고령군","구미시","김천시","문경시","봉화군","상주시",
    "성주군","안동시","영덕군","영양군","영주시","영천시","예천군","울릉군",
    "울진군","의성군","청도군","청송군","칠곡군","포항시"
  ],
  "경남": [
    "거제시","거창군","고성군","김해시","남해군","밀양시","사천시","산청군",
    "양산시","의령군","진주시","창녕군","창원시","통영시","하동군","함안군",
    "함양군","합천군"
  ],
  "제주": [
    "서귀포시","제주시"
  ],
};

// 서울 → 광역시(가나다순) → 도(인구수순) → 세종/제주
export const SIDO_LIST = [
  "서울",
  "광주", "대구", "대전", "부산", "울산", "인천",
  "경기", "경남", "경북", "전남", "전북", "충남", "충북", "강원",
  "세종", "제주",
];

// 구분선 위치
export const SIDO_SEPARATORS = new Set(["광주", "경기", "세종"]);
// 광주 앞: 특별시↔광역시 구분
// 경기 앞: 광역시↔도 구분
// 세종 앞: 도↔특별자치 구분

// ── Props ────────────────────────────────────────────────
type Props = {
  value: string;           // "서울 광진구" 또는 "서울" 형태
  onChange: (region: string) => void;
  label?: string;
  required?: boolean;
};

export default function RegionSelect({
  value,
  onChange,
  label = "지역",
  required = false,
}: Props) {
  // value에서 시도/구시군 파싱
  const parseSido = (v: string) => {
    for (const sido of SIDO_LIST) {
      if (v === sido || v.startsWith(sido + " ")) return sido;
    }
    return "";
  };
  const parseSigungu = (v: string, sido: string) => {
    if (!sido || v === sido) return "";
    return v.replace(sido + " ", "");
  };

  const [sido, setSido] = useState(() => parseSido(value));
  const [sigungu, setSigungu] = useState(() => parseSigungu(value, parseSido(value)));

  const subList = sido ? REGION_DATA[sido] ?? [] : [];
  const isSejong = sido === "세종";

  function handleSidoChange(val: string) {
    setSido(val);
    setSigungu("");
    // 세종은 단일 → 바로 확정
    if (val === "세종") {
      onChange("세종");
    } else {
      onChange(val); // 시도만 일단 전달 (구/시 선택 대기)
    }
  }

  function handleSigunguChange(val: string) {
    setSigungu(val);
    onChange(`${sido} ${val}`);
  }

  return (
    <div className="space-y-3">
      {/* 1단계: 시/도 */}
      <div>
        {label && (
          <Label className="text-sm font-medium mb-2 block">
            {label} {required && <span className="text-destructive">*</span>}
          </Label>
        )}
        <Select value={sido} onValueChange={handleSidoChange}>
          <SelectTrigger>
            <SelectValue placeholder="시/도를 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            {SIDO_LIST.map((s) => (
              <div key={s}>
                {SIDO_SEPARATORS.has(s) && (
                  <div className="my-1 border-t border-dashed border-border/60" />
                )}
                <SelectItem value={s}>{s}</SelectItem>
              </div>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 2단계: 구/시/군 (세종 제외) */}
      {sido && !isSejong && (
        <div>
          {label && (
            <Label className="text-sm font-medium mb-2 block">
              구/시/군 {required && <span className="text-destructive">*</span>}
              {!sigungu && <span className="ml-1 text-xs text-amber-500">(구/시/군을 선택해주세요)</span>}
            </Label>
          )}
          <Select value={sigungu} onValueChange={handleSigunguChange}>
            <SelectTrigger>
              <SelectValue placeholder="구/시/군을 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              {subList.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
