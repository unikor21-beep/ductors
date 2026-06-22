import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import PartnerAvatar from "@/components/PartnerAvatar";
import ChatModal from "@/components/ChatModal";
import { ChevronDown, ChevronUp, MessageCircle, Star, Loader2, Inbox } from "lucide-react";

const won = (v: string | number | null | undefined) =>
  v == null || v === "" ? "협의" : `${Number(v).toLocaleString("ko-KR")}원`;

export default function MyQuoteCard({ q }: { q: any }) {
  const [open, setOpen] = useState(false);
  const [chatWith, setChatWith] = useState<{ partnerId: number; name: string } | null>(null);

  const submissionCount: number = q.submissionCount ?? 0;
  const unreadCount: number = q.unreadCount ?? 0;

  // 펼칠 때만 제출 목록 조회
  const { data: submissions, isLoading } = trpc.quotes.submissions.useQuery(
    { quoteId: q.id },
    { enabled: open }
  );
  const { data: categories } = trpc.categories.list.useQuery(undefined, { enabled: open });

  const categoryLabel = (() => {
    if (!q.categoryId || !categories) return null;
    const cat = (categories as any[]).find((c) => c.id === q.categoryId);
    if (!cat) return null;
    if (cat.parentId) {
      const parent = (categories as any[]).find((c) => c.id === cat.parentId);
      return parent ? `${parent.name} › ${cat.name}` : cat.name;
    }
    return cat.name;
  })();

  const formEntries = q.formData
    ? Object.entries(q.formData as Record<string, unknown>).filter(([, v]) => v != null && String(v) !== "")
    : [];

  return (
    <>
      <Card className="border-border/50 shadow-sm overflow-hidden">
        {/* 헤더 (클릭 시 펼침) */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-full text-left hover:bg-muted/30 transition-colors"
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold truncate">{q.title}</h3>
                  {unreadCount > 0 && (
                    <span className="shrink-0 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[11px] font-bold">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                  <span>{q.region || "미지정"}</span>
                  <span>{new Date(q.createdAt).toLocaleDateString("ko-KR")}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {submissionCount > 0 ? (
                  <Badge className="bg-primary text-primary-foreground">견적 {submissionCount}건 도착</Badge>
                ) : (
                  <Badge variant="secondary">대기중</Badge>
                )}
                {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </div>
            </div>
          </CardContent>
        </button>

        {/* 펼친 내용 */}
        {open && (
          <div className="border-t border-border/50 px-5 py-4 space-y-5 bg-muted/10">
            {/* 내가 의뢰한 내용 */}
            <div>
              <Label className="text-sm font-semibold mb-2 block">내가 의뢰한 내용</Label>
              <div className="space-y-2 text-sm">
                {categoryLabel && (
                  <div className="flex gap-2"><span className="text-muted-foreground shrink-0">분류:</span><span>{categoryLabel}</span></div>
                )}
                <div className="flex gap-2"><span className="text-muted-foreground shrink-0">지역:</span><span>{q.region || "미지정"}</span></div>
                {q.address && <div className="flex gap-2"><span className="text-muted-foreground shrink-0">주소:</span><span className="break-words">{q.address}</span></div>}
                <div>
                  <span className="text-muted-foreground">요청 내용:</span>
                  <p className="mt-1 whitespace-pre-wrap bg-background rounded-lg p-3 border border-border/40">{q.description || "상세 내용 없음"}</p>
                </div>
                {formEntries.length > 0 && (
                  <div className="bg-background rounded-lg p-3 border border-border/40 space-y-1.5">
                    {formEntries.map(([key, value]) => (
                      <div key={key} className="flex gap-2">
                        <span className="text-muted-foreground shrink-0">{key}:</span>
                        <span className="break-words">{Array.isArray(value) ? value.join(", ") : String(value)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 받은 견적 */}
            <div>
              <Label className="text-sm font-semibold mb-2 block">받은 견적 {submissionCount > 0 && `(${submissionCount})`}</Label>
              {isLoading ? (
                <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
              ) : !submissions || submissions.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  <Inbox className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                  아직 도착한 견적이 없습니다
                </div>
              ) : (
                <div className="space-y-2.5">
                  {(submissions as any[]).map((s) => (
                    <div key={s.id} className="bg-background rounded-xl border border-border/50 p-3.5">
                      <div className="flex items-start justify-between gap-3">
                        {/* 파트너 → 포트폴리오 */}
                        <Link href={`/partner/${s.partnerId}`} className="flex items-center gap-2.5 min-w-0 group">
                          <PartnerAvatar logoUrl={s.partner?.logoUrl} companyName={s.partner?.companyName || "파트너"} size="sm" />
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate group-hover:text-primary group-hover:underline">
                              {s.partner?.companyName || "파트너"}
                            </p>
                            {s.partner?.avgRating != null && Number(s.partner.avgRating) > 0 && (
                              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                {Number(s.partner.avgRating).toFixed(1)}
                                {s.partner?.reviewCount ? ` (${s.partner.reviewCount})` : ""}
                              </p>
                            )}
                          </div>
                        </Link>
                        {/* 채팅 + 미읽음 */}
                        <Button
                          variant="outline" size="sm"
                          className="shrink-0 relative gap-1.5"
                          onClick={() => setChatWith({ partnerId: s.partnerId, name: s.partner?.companyName || "파트너" })}
                        >
                          <MessageCircle className="w-4 h-4" />
                          채팅
                          {s.unreadCount > 0 && (
                            <span className="absolute -top-2 -right-2 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[11px] font-bold">
                              {s.unreadCount}
                            </span>
                          )}
                        </Button>
                      </div>
                      {/* 견적 금액/내용 */}
                      <div className="mt-3 pt-3 border-t border-border/40 space-y-1 text-sm">
                        <div className="flex items-baseline gap-2">
                          <span className="text-muted-foreground shrink-0">견적 금액:</span>
                          <span className="font-bold text-base text-primary">{won(s.amount)}</span>
                        </div>
                        {s.estimatedDays != null && s.estimatedDays > 0 && (
                          <div className="flex gap-2"><span className="text-muted-foreground shrink-0">예상 기간:</span><span>{s.estimatedDays}일</span></div>
                        )}
                        {s.description && (
                          <div><span className="text-muted-foreground">파트너 메모:</span><p className="mt-0.5 whitespace-pre-wrap">{s.description}</p></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {chatWith && (
        <ChatModal
          quoteId={q.id}
          partnerId={chatWith.partnerId}
          myRole="customer"
          title={`${chatWith.name} 와의 채팅`}
          onClose={() => setChatWith(null)}
        />
      )}
    </>
  );
}
