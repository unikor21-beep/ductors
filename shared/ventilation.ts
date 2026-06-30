/**
 * 덕터스 환기 사양 계산 로직 (1차: 일반 7종)
 *
 * ⚠️ 본 계산기는 "설계 참고용 추정치"이며 인허가용 설계가 아닙니다.
 *    정확한 설계는 기계설비기술자 검토가 필요합니다.
 *
 * [근거 표준]
 * - 건축물의 설비기준 등에 관한 규칙 제11조 (공동주택 0.5회/h, 다중이용시설 인원당 산정)
 * - 기계설비 기술기준 매뉴얼 (주방 후드 면풍속 기준)
 * - ASHRAE 62.1 / Fundamentals (환기횟수·압력손실)
 * - Darcy-Weisbach 식 + SMACNA/ASHRAE 국부손실계수
 */

// ── 용도 정의 ───────────────────────────────────────────────
export type UsageType =
  | "residential"   // 주거
  | "office"        // 사무실·상업
  | "kitchen"       // 일반주방
  | "bbq"           // 한국식 BBQ
  | "factory"       // 공장·작업장
  | "bathroom"      // 화장실·욕실
  | "warehouse";    // 창고

export type CalcMethod = "ach" | "occupancy" | "hood_face" | "bbq_table";

export interface UsageSpec {
  value: UsageType;
  label: string;
  method: CalcMethod;
  /** 권장 환기횟수 ACH (회/h). 방식이 ach 계열일 때 사용 */
  ach?: number;
  /** ACH 근거 메모 */
  achNote?: string;
  /** 배기 전용 여부 (화장실 등 → 급기 경고 대신 음압 안내) */
  exhaustOnly?: boolean;
  /** 급기 보충 경고 필요 여부 (주방·BBQ) */
  makeupAirWarning?: boolean;
}

/**
 * 용도별 사양.
 * ACH 값은 실무 권장 범위의 보수적 중앙값을 채택(법정 최소가 있는 경우 그 값).
 * - 주거: 건축물 설비기준 규칙 제11조 법정 최소 0.5회/h
 * - 사무실/상업: 인원당 25㎥/h 원칙(다중이용시설), 체적 ACH 5는 보조 하한
 * - 주방/BBQ: 후드 면풍속 방식
 * - 공장/화장실/창고: 실무 권장 ACH (출처: 환기횟수 권장표)
 */
export const USAGE_SPECS: UsageSpec[] = [
  { value: "residential", label: "주거", method: "ach", ach: 0.5, achNote: "건축물 설비기준 규칙 법정 최소 0.5회/h" },
  { value: "office", label: "사무실·상업", method: "occupancy", ach: 6, achNote: "다중이용시설 인원당 25㎥/h 원칙, 체적 6회/h 보조" },
  { value: "kitchen", label: "일반주방", method: "hood_face", achNote: "후드 개구면적 × 면풍속(상업용 0.5m/s)", makeupAirWarning: true },
  { value: "bbq", label: "한국식 BBQ(고깃집)", method: "bbq_table", achNote: "테이블 후드 × 면풍속 × 동시사용률", makeupAirWarning: true },
  { value: "factory", label: "공장·작업장", method: "ach", ach: 15, achNote: "작업장 권장 10~20회/h 중앙값" },
  { value: "bathroom", label: "화장실·욕실", method: "ach", ach: 12, achNote: "화장실 권장 10~15회/h 중앙값", exhaustOnly: true },
  { value: "warehouse", label: "창고", method: "ach", ach: 3, achNote: "창고·보관 권장 2~4회/h 중앙값" },
];

// ── 상수 (공인 기준값) ──────────────────────────────────────
const AIR_DENSITY = 1.2;            // 공기밀도 kg/m³ (20°C 표준)
const KITCHEN_FACE_VELOCITY = 0.5;  // 상업용 주방 후드 면풍속 m/s (기계설비 기준 상한)
const OCCUPANCY_RATE = 25;          // 다중이용시설 인원당 환기량 ㎥/인·h (설비규칙)
const ELBOW_K = 0.3;                // 90° 엘보 국부손실계수 (ASHRAE/SMACNA 대표값)
const ROUGHNESS = { galvanized: 0.00009, flexible: 0.003 }; // 절대거칠기 m (아연도금/플렉시블)
const PA_TO_MMAQ = 1 / 9.80665;     // 1 mmAq = 9.80665 Pa

// BBQ 기본값 (실무 대표값, 사용자 조절 가능)
export const BBQ_DEFAULTS = { hoodArea: 0.2, faceVelocity: 0.5, diversityRate: 0.8 };

// ── 입력/출력 타입 ──────────────────────────────────────────
export interface CalcInput {
  usage: UsageType;
  width: number;        // m
  depth: number;        // m
  height: number;       // m
  marginPct: number;    // 여유율 % (예: 30)
  // 용도별 선택 입력
  occupants?: number;       // 사무실·상업: 인원수
  hoodArea?: number;        // 주방: 후드 개구면적 m²
  bbqTables?: number;       // BBQ: 테이블 수
  bbqHoodArea?: number;     // BBQ: 테이블당 후드면적 m²
  bbqFaceVelocity?: number; // BBQ: 면풍속 m/s
  bbqDiversity?: number;    // BBQ: 동시사용률 0~1
  // 덕트 (정압 계산용)
  ductDiameter: number;     // mm
  ductLength: number;       // m
  elbowCount: number;
  ductShape?: "round" | "rect";
  ductWidth?: number;       // mm (사각)
  ductHeightMm?: number;    // mm (사각)
  ductMaterial?: "galvanized" | "flexible";
}

export interface CalcResult {
  volume: number;            // 체적 ㎥
  theoreticalAirflow: number;// 이론 풍량 CMH
  recommendedAirflow: number;// 권장 풍량 CMH (마진 적용)
  theoreticalPressure: number;// 이론 정압 mmAq
  recommendedPressure: number;// 권장 정압 mmAq (마진² 연동)
  ductVelocity: number;      // 덕트 풍속 m/s (권장 풍량 기준)
  method: CalcMethod;
  notes: string[];
  warnings: string[];
}

// ── 풍량 계산 ───────────────────────────────────────────────
function calcAirflow(input: CalcInput, spec: UsageSpec, volume: number): { flow: number; notes: string[] } {
  const notes: string[] = [];
  let flow = 0;

  switch (spec.method) {
    case "ach": {
      flow = volume * (spec.ach ?? 0);
      notes.push(`체적 ${round1(volume)}㎥ × 환기횟수 ${spec.ach}회/h`);
      break;
    }
    case "occupancy": {
      const byVolume = volume * (spec.ach ?? 0);
      const byOccupancy = (input.occupants ?? 0) * OCCUPANCY_RATE;
      flow = Math.max(byVolume, byOccupancy);
      notes.push(`인원 ${input.occupants ?? 0}명 × ${OCCUPANCY_RATE}㎥/인·h = ${Math.round(byOccupancy)}`);
      notes.push(`체적 기준 ${Math.round(byVolume)} 과 비교해 큰 값 채택`);
      break;
    }
    case "hood_face": {
      const area = input.hoodArea ?? 0;
      flow = area * KITCHEN_FACE_VELOCITY * 3600;
      notes.push(`후드면적 ${area}㎡ × 면풍속 ${KITCHEN_FACE_VELOCITY}m/s × 3600`);
      break;
    }
    case "bbq_table": {
      const tables = input.bbqTables ?? 0;
      const hoodArea = input.bbqHoodArea ?? BBQ_DEFAULTS.hoodArea;
      const v = input.bbqFaceVelocity ?? BBQ_DEFAULTS.faceVelocity;
      const diversity = input.bbqDiversity ?? BBQ_DEFAULTS.diversityRate;
      const perTable = hoodArea * v * 3600;
      flow = perTable * tables * diversity;
      notes.push(`테이블당 ${Math.round(perTable)} CMH (후드 ${hoodArea}㎡ × ${v}m/s × 3600)`);
      notes.push(`× 테이블 ${tables}개 × 동시율 ${diversity}`);
      break;
    }
  }
  return { flow, notes };
}

// ── 정압 계산 (Darcy-Weisbach + 국부손실) ──────────────────
function calcPressure(input: CalcInput, airflowCMH: number): { mmaq: number; velocity: number } {
  // 덕트 상당직경(m)
  let D: number;
  if (input.ductShape === "rect" && input.ductWidth && input.ductHeightMm) {
    // 사각덕트 상당직경: De = 1.3 × (a·b)^0.625 / (a+b)^0.25
    const a = input.ductWidth / 1000;
    const b = input.ductHeightMm / 1000;
    D = 1.3 * Math.pow(a * b, 0.625) / Math.pow(a + b, 0.25);
  } else {
    D = (input.ductDiameter || 0) / 1000;
  }
  if (D <= 0) return { mmaq: 0, velocity: 0 };

  const area = Math.PI * (D / 2) ** 2;          // 단면적 ㎡
  const Q = airflowCMH / 3600;                  // 풍량 ㎥/s
  const v = Q / area;                           // 풍속 m/s
  const dynamicP = 0.5 * AIR_DENSITY * v * v;   // 동압 Pa

  // 마찰계수 f: Swamee-Jain 식 (Colebrook 근사) — Re, 상대거칠기 기반
  const eps = ROUGHNESS[input.ductMaterial ?? "galvanized"];
  const nu = 1.5e-5;                            // 공기 동점성계수 ㎡/s (20°C)
  const Re = (v * D) / nu;
  let f = 0.02;
  if (Re > 0) {
    f = 0.25 / Math.pow(Math.log10(eps / (3.7 * D) + 5.74 / Math.pow(Re, 0.9)), 2);
  }

  const friction = f * (input.ductLength / D) * dynamicP;       // 직관손실 Pa
  const minor = (input.elbowCount || 0) * ELBOW_K * dynamicP;   // 국부손실 Pa
  const totalPa = friction + minor;

  return { mmaq: totalPa * PA_TO_MMAQ, velocity: v };
}

// ── 메인 계산 ───────────────────────────────────────────────
export function calculateVentilation(input: CalcInput): CalcResult {
  const spec = USAGE_SPECS.find((s) => s.value === input.usage)!;
  const volume = input.width * input.depth * input.height;
  const marginFactor = 1 + (input.marginPct || 0) / 100;

  const { flow: theoreticalAirflow, notes: flowNotes } = calcAirflow(input, spec, volume);
  const recommendedAirflow = theoreticalAirflow * marginFactor;

  // 정압: 이론은 이론풍량, 권장은 권장풍량 기준 (압력손실 ∝ 풍량²)
  const theo = calcPressure(input, theoreticalAirflow);
  const reco = calcPressure(input, recommendedAirflow);

  const warnings: string[] = [];
  if (spec.makeupAirWarning) {
    warnings.push("강한 배기 시 음압 방지를 위해 배기량의 80% 이상 급기(보충 외기) 확보가 필요합니다. 급기 설계는 전문가 검토를 권장합니다.");
  }
  if (spec.exhaustOnly) {
    warnings.push("화장실·욕실은 배기 전용(음압 유지)으로 설계하며, 다른 계통과 배기를 합치지 않습니다.");
  }
  if (input.height > 4) {
    warnings.push("천장고 4m 초과 공간은 체적 기준 산정 시 풍량이 과대해질 수 있어, 국소배기 등 전문가 검토를 권장합니다.");
  }
  if (reco.velocity > 8) {
    warnings.push(`덕트 풍속이 ${round1(reco.velocity)}m/s로 높습니다(권장 ~8m/s). 소음·저항 증가 우려가 있어 덕트 직경 확대를 검토하세요.`);
  }

  return {
    volume: round1(volume),
    theoreticalAirflow: Math.round(theoreticalAirflow),
    recommendedAirflow: Math.round(recommendedAirflow),
    theoreticalPressure: round1(theo.mmaq),
    recommendedPressure: round1(reco.mmaq),
    ductVelocity: round1(reco.velocity),
    method: spec.method,
    notes: flowNotes,
    warnings,
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
