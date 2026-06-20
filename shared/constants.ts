export const HERO_BG_DEFAULT = "https://d2xsxph8kpxj0f.cloudfront.net/310519663479103170/gMHKJMqLGKEuTWonMkyMmm/hero-bg_46a8fe44.jpg";
export const PARTNERS_BG_DEFAULT = "https://d2xsxph8kpxj0f.cloudfront.net/310519663479103170/gMHKJMqLGKEuTWonMkyMmm/partners-bg_37107067.jpg";
export const SECTION3_BG_DEFAULT = "https://d2xsxph8kpxj0f.cloudfront.net/310519663479103170/gMHKJMqLGKEuTWonMkyMmm/section3-bg_0c2b4001.jpeg";

// 서울 → 광역시(가나다순) → 도(인구수순) → 세종/제주
export const REGIONS = [
  "서울",
  "광주", "대구", "대전", "부산", "울산", "인천",  // 광역시 가나다순
  "경기", "경남", "경북", "전남", "전북", "충남", "충북", "강원",  // 도 인구수순
  "세종", "제주"
];

// 그룹 구분 (Select 구분선용)
export const REGION_GROUPS = {
  특별시: ["서울"],
  광역시: ["광주", "대구", "대전", "부산", "울산", "인천"],
  도: ["경기", "경남", "경북", "전남", "전북", "충남", "충북", "강원"],
  특별자치: ["세종", "제주"],
} as const;

export const QUOTE_STATUS_LABELS: Record<string, string> = {
  registered: "요청 등록",
  pending: "열람 전",
  viewed: "열람 완료",
  quoted: "견적 제출",
  reviewing: "고객 검토 중",
  matched: "매칭 완료",
  in_progress: "시공 진행 중",
  completed: "거래 완료",
  cancelled: "취소",
};

export const PARTNER_STATUS_LABELS: Record<string, string> = {
  pending: "승인 대기",
  approved: "승인 완료",
  rejected: "승인 거부",
  suspended: "정지",
};

export const GRADE_LABELS: Record<string, string> = {
  bronze: "브론즈",
  silver: "실버",
  gold: "골드",
  platinum: "플래티넘",
};

export const GRADE_COLORS: Record<string, string> = {
  bronze: "#CD7F32",
  silver: "#C0C0C0",
  gold: "#FFD700",
  platinum: "#E5E4E2",
};

// Site settings keys for admin-managed background images
export const SETTING_KEYS = {
  HERO_BG: "hero_bg_url",
  SECTION3_BG: "section3_bg_url",
} as const;
