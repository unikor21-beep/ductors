// 전화번호 포맷/검증 공용 유틸 (클라이언트·서버 공용)

// 지역번호 목록 (유선 전화번호용)
export const AREA_CODES = [
  "02", "031", "032", "033", "041", "042", "043", "044",
  "051", "052", "053", "054", "055",
  "061", "062", "063", "064", "070",
];

const onlyDigits = (s: string) => (s || "").replace(/\D/g, "");

// 휴대전화 입력 포맷 → 010-XXXX-XXXX
export function formatMobileInput(input: string): string {
  const d = onlyDigits(input).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

// 휴대전화 유효성 (010 등 + 10~11자리)
export function isValidMobile(input: string): boolean {
  const d = onlyDigits(input);
  return /^01[0-9]\d{7,8}$/.test(d);
}

// 유선 로컬번호(지역번호 제외) 포맷 → XXX-XXXX 또는 XXXX-XXXX
export function formatLandlineLocal(input: string): string {
  const d = onlyDigits(input).slice(0, 8);
  if (d.length <= 4) return d;
  const last = d.slice(-4);
  const first = d.slice(0, d.length - 4);
  return `${first}-${last}`;
}

// 지역번호 + 로컬번호 → 전체 유선번호 (로컬 비면 "")
export function composeLandline(areaCode: string, local: string): string {
  const l = (local || "").trim();
  if (!l) return "";
  return `${areaCode}-${l}`;
}

// 유선 로컬번호 유효성 (입력했다면 6~8자리)
export function isValidLandlineLocal(local: string): boolean {
  const d = onlyDigits(local);
  return d.length >= 6 && d.length <= 8;
}

// 표시용: 저장된 값을 보기 좋게 (하이픈 없으면 자동 부여)
export function formatPhoneDisplay(raw: string | null | undefined): string {
  if (!raw) return "";
  if (raw.includes("-")) return raw; // 이미 포맷됨
  const d = onlyDigits(raw);
  if (!d) return raw;
  if (d.startsWith("02")) {
    if (d.length === 9) return `02-${d.slice(2, 5)}-${d.slice(5)}`;
    if (d.length === 10) return `02-${d.slice(2, 6)}-${d.slice(6)}`;
    return raw;
  }
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return raw;
}
