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
export const SIGNUP_BG_DEFAULT = "https://images.unsplash.com/photo-1615309662243-70f6df917b59?auto=format&fit=crop&w=1600&q=80";

export const SETTING_KEYS = {
  HERO_BG: "hero_bg_url",
  SECTION3_BG: "section3_bg_url",
  SIGNUP_BG: "signup_bg_url",
} as const;

// 메인 배너 버튼 9분할 위치 (관리자 선택 + 표시 공용)
export const BANNER_POSITIONS = [
  { key: "tl", label: "상-좌" }, { key: "tc", label: "상-중" }, { key: "tr", label: "상-우" },
  { key: "ml", label: "중-좌" }, { key: "mc", label: "중-중" }, { key: "mr", label: "중-우" },
  { key: "bl", label: "하-좌" }, { key: "bc", label: "하-중" }, { key: "br", label: "하-우" },
] as const;

// 위치 key → 절대배치 Tailwind 클래스
export const BANNER_POSITION_CLASS: Record<string, string> = {
  tl: "top-4 left-4",
  tc: "top-4 left-1/2 -translate-x-1/2",
  tr: "top-4 right-4",
  ml: "top-1/2 left-4 -translate-y-1/2",
  mc: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
  mr: "top-1/2 right-4 -translate-y-1/2",
  bl: "bottom-4 left-4",
  bc: "bottom-4 left-1/2 -translate-x-1/2",
  br: "bottom-4 right-4",
};

// 역할 라벨 (헤더 뱃지·관리자 표 공용 — 용어 통일)
export const ROLE_LABELS: Record<string, string> = {
  user: "고객",
  partner: "파트너",
  admin: "관리자",
};

// 가입 방식 라벨 (loginMethod 기준)
export const LOGIN_METHOD_LABELS: Record<string, string> = {
  local: "일반",
  kakao: "카카오",
  naver: "네이버",
  google: "구글",
};
export const loginMethodLabel = (m?: string | null) => m ? (LOGIN_METHOD_LABELS[m] || "SNS") : "-";

// 역할 뱃지 스타일 (헤더 뱃지·관리자 표 공용 — inline 색으로 통일해 어디서나 동일)
// 고객=초록, 파트너=로고 라임(#84cc16), 관리자=보라
export const ROLE_BADGE_STYLE: Record<string, { bg: string; color: string }> = {
  user: { bg: "#dcfce7", color: "#15803d" },
  partner: { bg: "#84cc16", color: "#ffffff" },
  admin: { bg: "#f3e8ff", color: "#7e22ce" },
};

// 보안 질문 (가입·정보수정 공용)
export const SECURITY_QUESTIONS = [
  "어머니의 성함은?",
  "졸업한 초등학교 이름은?",
  "가장 좋아하는 음식은?",
  "어릴 적 별명은?",
  "첫 반려동물의 이름은?",
];

// 파트너 승인 상태 뱃지 스타일 (관리자 표)
// 승인 완료=초록, 승인 대기=회색(기존), 승인 거부=주황, 정지=빨강(흰 글씨)
export const PARTNER_STATUS_BADGE: Record<string, { className: string; bg?: string; color?: string }> = {
  approved: { className: "bg-primary text-primary-foreground" },
  pending: { className: "bg-secondary text-secondary-foreground" },
  rejected: { className: "", bg: "#f97316", color: "#ffffff" },
  suspended: { className: "", bg: "#dc2626", color: "#ffffff" },
};
