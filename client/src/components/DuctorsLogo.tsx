type DuctorsLogoProps = {
  className?: string;
  size?: number;
};

/**
 * Ductors 워드마크 로고 (임시: 웹폰트 텍스트 버전).
 * 정식 오픈 전 상표 등록 원본 파일(SVG/PNG)로 교체 예정.
 * 밝은 초록 브랜드 컬러를 고정으로 사용한다.
 */
export default function DuctorsLogo({ className, size = 22 }: DuctorsLogoProps) {
  return (
    <span
      className={className}
      style={{
        fontFamily:
          "'Pretendard Variable', Pretendard, system-ui, -apple-system, sans-serif",
        fontWeight: 700,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: "-0.045em",
        color: "#84cc16",
        userSelect: "none",
      }}
    >
      ductors
    </span>
  );
}
