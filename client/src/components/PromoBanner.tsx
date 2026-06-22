import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BANNER_POSITION_CLASS } from "@shared/constants";

// 메인페이지 프로모션 배너 (활성 배너 없으면 아무것도 렌더하지 않음 → 평소 화면 영향 없음)
export default function PromoBanner() {
  const { data: banners } = trpc.banners.list.useQuery(undefined, { staleTime: 5 * 60 * 1000 });
  const [idx, setIdx] = useState(0);

  const list = banners ?? [];
  const count = list.length;

  // 배너가 2개 이상이면 6초마다 자동 슬라이드
  useEffect(() => {
    if (count <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % count), 6000);
    return () => clearInterval(t);
  }, [count]);

  // 활성 배너가 없으면 섹션 자체를 그리지 않음
  if (count === 0) return null;

  const safeIdx = idx % count;
  const b = list[safeIdx];
  const posClass = BANNER_POSITION_CLASS[b.buttonPosition] ?? BANNER_POSITION_CLASS.bc;

  const go = (n: number) => setIdx((n + count) % count);

  return (
    <section className="w-full bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="relative w-full overflow-hidden rounded-2xl shadow-sm">
          <img
            src={b.imageUrl}
            alt="프로모션 배너"
            className="w-full h-auto object-cover block"
          />

          {/* 링크가 있을 때만 버튼 오버레이 (9분할 위치) */}
          {b.linkUrl && (
            <div className={`absolute ${posClass}`}>
              <Link href={b.linkUrl}>
                <Button size="lg" className="shadow-lg">
                  {b.buttonText || "자세히 보기"}
                </Button>
              </Link>
            </div>
          )}

          {/* 배너가 여러 개일 때만 좌우 화살표 + 인디케이터 */}
          {count > 1 && (
            <>
              <button
                type="button"
                aria-label="이전 배너"
                onClick={() => go(safeIdx - 1)}
                className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1.5 transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                aria-label="다음 배너"
                onClick={() => go(safeIdx + 1)}
                className="absolute top-1/2 right-2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1.5 transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {list.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`${i + 1}번 배너로`}
                    onClick={() => setIdx(i)}
                    className={`w-2 h-2 rounded-full transition ${i === safeIdx ? "bg-white" : "bg-white/50"}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
