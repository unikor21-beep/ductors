/**
 * PartnerAvatar - 파트너 아바타 컴포넌트
 * 로고 있으면 로고, 없으면 회사명 첫 글자를 구글 스타일로 표시
 */

type Props = {
  logoUrl?: string | null;
  companyName: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

// 회사명 기반 고정 색상 (구글 스타일 - 항상 같은 회사는 같은 색)
const COLORS = [
  { bg: "#4285F4", text: "#fff" }, // 구글 블루
  { bg: "#EA4335", text: "#fff" }, // 구글 레드
  { bg: "#34A853", text: "#fff" }, // 구글 그린
  { bg: "#FBBC05", text: "#fff" }, // 구글 옐로우
  { bg: "#8B5CF6", text: "#fff" }, // 퍼플
  { bg: "#06B6D4", text: "#fff" }, // 시안
  { bg: "#F97316", text: "#fff" }, // 오렌지
  { bg: "#EC4899", text: "#fff" }, // 핑크
];

function getColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

const SIZE_MAP = {
  sm: { outer: "w-10 h-10", text: "text-base font-bold" },
  md: { outer: "w-14 h-14", text: "text-xl font-bold" },
  lg: { outer: "w-20 h-20", text: "text-3xl font-bold" },
};

export default function PartnerAvatar({ logoUrl, companyName, size = "md", className = "" }: Props) {
  const { outer, text } = SIZE_MAP[size];
  const firstChar = companyName?.trim()?.[0] ?? "?";
  const color = getColor(companyName || "");

  if (logoUrl) {
    return (
      <div className={`${outer} rounded-xl overflow-hidden shrink-0 ${className}`}>
        <img src={logoUrl} alt={companyName} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`${outer} rounded-xl shrink-0 flex items-center justify-center ${className}`}
      style={{ backgroundColor: color.bg }}
    >
      <span className={text} style={{ color: color.text }}>
        {firstChar}
      </span>
    </div>
  );
}
