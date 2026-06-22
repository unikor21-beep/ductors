import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import PartnerAvatar from "@/components/PartnerAvatar";
import ChatModal from "@/components/ChatModal";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, MessageCircle, Star, Loader2, Inbox, Check, CircleSlash } from "lucide-react";

const won = (v: string | number | null | undefined) =>
  v == null || v === "" ? "협의" : `${Number(v).toLocaleString("ko-KR")}원`;

const DECIDED = ["matched", "in_progress", "completed", "cancelled"];

// ----- 리뷰 작성 모달 -----
function ReviewModal({ quoteId, partnerId, partnerName, onClose }: { quoteId: number; partnerId: number; partnerName: string; onClose: () => void }) {
  const utils = trpc.useUtils();
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [content, setContent] = useState("");
  const create = trpc.reviews.create.useMutation({
    onSuccess: () => {
      toast.success("리뷰가 등록되었습니다. 감사합니다!");
      utils.reviews.myReviewForQuote.invalidate({ quoteId });
      utils.quotes.myQuotes.invalidate();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{partnerName} 리뷰 작성</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-sm font-medium mb-2 block">별점</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}>
                  <Star className={`w-8 h-8 ${n <= (hover || rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium mb-1.5 block">후기 <span className="text-xs text-muted-foreground font-normal">(선택)</span></Label>
            <Textarea placeholder="시공은 어떠셨나요? 다른 분들에게 도움이 됩니다." value={content} onChange={(e) => setContent(e.target.value)} rows={4} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button onClick={() => create.mutate({ quoteId, partnerId, rating, content: content.trim() || undefined })} disabled={create.isPending}>
            {create.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "리뷰 등록"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function MyQuoteCard({ q }: { q: any }) {
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [chatWith, setChatWith] = useState<{ partnerId: number; name: string } | null>(null);
  const [reviewWith, setReviewWith] = useState<{ partnerId: number; name: string } | null>(null);
  const [confirm, setConfirm] = useState<null | { title: string; desc: string; okLabel: string; onOk: () => void }>(null);

  const submissionCount: number = q.submissionCount ?? 0;
  const unreadCount: number = q.unreadCount ?? 0;
  const status: string = q.status;
  const isDecided = DECIDED.includes(status);

  const { data: submissions, isLoading } = trpc.quotes.submissions.useQuery({ quoteId: q.id }, { enabled: open });
  const { data: categories } = trpc.categories.list.useQuery(undefined, { enabled: open });
  const { data: myReview } = trpc.reviews.myReviewForQuote.useQuery({ quoteId: q.id }, { enabled: open && status === "completed" });

  const refresh = () => { utils.quotes.myQuotes.invalidate(); utils.quotes.submissions.invalidate({ quoteId: q.id }); };
  const onErr = (e: any) => toast.error(e.message);
  const select = trpc.quotes.selectSubmission.useMutation({ onSuccess: () => { toast.success("파트너를 선정했습니다"); refresh(); }, onError: onErr });
  const closeQuote = trpc.quotes.closeWithoutPartner.useMutation({ onSuccess: () => { toast.success("견적을 종결했습니다"); refresh(); }, onError: onErr });
  const completeWork = trpc.quotes.completeWork.useMutation({ onSuccess: () => { toast.success("시공이 완료되었습니다"); refresh(); }, onError: onErr });

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

  // 헤더 상태 배지
  const statusBadge = (() => {
    if (status === "cancelled") return <Badge variant="outline" className="text-muted-foreground">종결</Badge>;
    if (status === "completed") return <Badge className="bg-primary text-primary-foreground">시공 완료</Badge>;
    if (status === "in_progress") return <Badge className="bg-amber-500 text-white">시공 중</Badge>;
    if (status === "matched") return <Badge className="bg-emerald-600 text-white">파트너 선정됨</Badge>;
    return submissionCount > 0
      ? <Badge className="bg-primary text-primary-foreground">견적 {submissionCount}건 도착</Badge>
      : <Badge variant="secondary">대기중</Badge>;
  })();

  return (
    <>
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <button type="button" onClick={() => setOpen((o) => !o)} className="w-full text-left hover:bg-muted/30 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="shrink-0 text-xs font-medium px-2 py-0.5 rounded border bg-white"
                    style={q.type === "public"
                      ? { color: "#2563eb", borderColor: "#bfdbfe" }
                      : { color: "#ea580c", borderColor: "#fed7aa" }}
                  >
                    {q.type === "public" ? "공개" : "지정"}
                  </span>
                  <h3 className="font-semibold truncate">{q.title}</h3>
                  {unreadCount > 0 && (
                    <span className="shrink-0 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[11px] font-bold">{unreadCount}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                  <span>{q.region || "미지정"}</span>
                  <span>{new Date(q.createdAt).toLocaleDateString("ko-KR")}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {statusBadge}
                {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </div>
            </div>
          </CardContent>
        </button>

        {open && (
          <div className="border-t border-border/50 px-5 py-4 space-y-5 bg-muted/10">
            {/* 내가 의뢰한 내용 */}
            <div>
              <Label className="text-sm font-semibold mb-2 block">내가 의뢰한 내용</Label>
              <div className="space-y-2 text-sm">
                {categoryLabel && <div className="flex gap-2"><span className="text-muted-foreground shrink-0">분류:</span><span>{categoryLabel}</span></div>}
                <div className="flex gap-2"><span className="text-muted-foreground shrink-0">지역:</span><span>{q.region || "미지정"}</span></div>
                {q.address && <div className="flex gap-2"><span className="text-muted-foreground shrink-0">주소:</span><span className="break-words">{q.address}</span></div>}
                <div>
                  <span className="text-muted-foreground">요청 내용:</span>
                  <p className="mt-1 whitespace-pre-wrap bg-background rounded-lg p-3 border border-border/40">{q.description || "상세 내용 없음"}</p>
                </div>
                {formEntries.length > 0 && (
                  <div className="bg-background rounded-lg p-3 border border-border/40 space-y-1.5">
                    {formEntries.map(([key, value]) => (
                      <div key={key} className="flex gap-2"><span className="text-muted-foreground shrink-0">{key}:</span><span className="break-words">{Array.isArray(value) ? value.join(", ") : String(value)}</span></div>
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
                <div className="text-center py-6 text-sm text-muted-foreground"><Inbox className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />아직 도착한 견적이 없습니다</div>
              ) : (
                <div className="space-y-2.5">
                  {(submissions as any[]).map((s) => {
                    const isSelected = s.status === "selected";
                    const isRejected = s.status === "rejected";
                    const canChat = !isDecided || isSelected;
                    return (
                      <div key={s.id} className={`bg-background rounded-xl border p-3.5 ${isSelected ? "border-emerald-500 ring-1 ring-emerald-500/30" : isRejected ? "border-border/40 opacity-60" : "border-border/50"}`}>
                        <div className="flex items-start justify-between gap-3">
                          <Link href={`/partner/${s.partnerId}`} className="flex items-center gap-2.5 min-w-0 group">
                            <PartnerAvatar logoUrl={s.partner?.logoUrl} companyName={s.partner?.companyName || "파트너"} size="sm" />
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate group-hover:text-primary group-hover:underline flex items-center gap-1.5">
                                {s.partner?.companyName || "파트너"}
                                {isSelected && <span className="inline-flex items-center gap-0.5 text-[11px] text-emerald-600 font-semibold"><Check className="w-3 h-3" />선정</span>}
                                {isRejected && <span className="text-[11px] text-muted-foreground">미선정</span>}
                              </p>
                              {s.partner?.avgRating != null && Number(s.partner.avgRating) > 0 && (
                                <p className="flex items-center gap-1 text-xs text-muted-foreground"><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{Number(s.partner.avgRating).toFixed(1)}{s.partner?.reviewCount ? ` (${s.partner.reviewCount})` : ""}</p>
                              )}
                            </div>
                          </Link>
                          {canChat && (
                            <Button variant="outline" size="sm" className="shrink-0 relative gap-1.5" onClick={() => setChatWith({ partnerId: s.partnerId, name: s.partner?.companyName || "파트너" })}>
                              <MessageCircle className="w-4 h-4" />채팅
                              {s.unreadCount > 0 && <span className="absolute -top-2 -right-2 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[11px] font-bold">{s.unreadCount}</span>}
                            </Button>
                          )}
                        </div>
                        <div className="mt-3 pt-3 border-t border-border/40 space-y-1 text-sm">
                          <div className="flex items-baseline gap-2"><span className="text-muted-foreground shrink-0">견적 금액:</span><span className="font-bold text-base text-primary">{won(s.amount)}</span></div>
                          {s.estimatedDays != null && s.estimatedDays > 0 && <div className="flex gap-2"><span className="text-muted-foreground shrink-0">예상 기간:</span><span>{s.estimatedDays}일</span></div>}
                          {s.description && <div><span className="text-muted-foreground">파트너 메모:</span><p className="mt-0.5 whitespace-pre-wrap">{s.description}</p></div>}
                        </div>

                        {/* 액션 영역 */}
                        {!isDecided && (
                          <Button className="w-full mt-3" size="sm"
                            onClick={() => setConfirm({
                              title: "이 파트너로 진행할까요?",
                              desc: `${s.partner?.companyName || "파트너"}을(를) 선정하면 다른 파트너는 자동으로 미선정 처리되고 되돌릴 수 없습니다.`,
                              okLabel: "선정하기",
                              onOk: () => select.mutate({ submissionId: s.id, quoteId: q.id }),
                            })}>
                            이 파트너 선정
                          </Button>
                        )}
                        {isSelected && (status === "matched" || status === "in_progress") && (
                          <Button className="w-full mt-3" size="sm"
                            onClick={() => setConfirm({ title: "시공이 완료되었나요?", desc: "완료 처리 후 바로 리뷰를 작성합니다. 되돌릴 수 없습니다.", okLabel: "시공 완료", onOk: () => completeWork.mutate({ quoteId: q.id }, { onSuccess: () => setReviewWith({ partnerId: s.partnerId, name: s.partner?.companyName || "파트너" }) }) })}>
                            시공 완료
                          </Button>
                        )}
                        {isSelected && status === "completed" && (
                          myReview
                            ? <div className="w-full mt-3 text-center text-sm text-emerald-600 font-medium flex items-center justify-center gap-1"><Check className="w-4 h-4" />리뷰 작성 완료 ({(myReview as any).rating}★)</div>
                            : <Button className="w-full mt-3" size="sm" onClick={() => setReviewWith({ partnerId: s.partnerId, name: s.partner?.companyName || "파트너" })}>리뷰 작성</Button>
                        )}
                      </div>
                    );
                  })}

                  {/* 아무와도 진행 안 함 (종결) */}
                  {!isDecided && (
                    <button type="button"
                      className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-destructive py-2 mt-1"
                      onClick={() => setConfirm({
                        title: "이 견적을 종결할까요?",
                        desc: "아무 파트너와도 진행하지 않고 종결합니다. 되돌릴 수 없습니다.",
                        okLabel: "종결하기",
                        onOk: () => closeQuote.mutate({ quoteId: q.id }),
                      })}>
                      <CircleSlash className="w-3.5 h-3.5" />아무와도 진행하지 않고 종결
                    </button>
                  )}
                </div>
              )}
              {status === "cancelled" && <p className="text-center text-sm text-muted-foreground py-2 mt-2">이 견적은 종결되었습니다</p>}
            </div>
          </div>
        )}
      </Card>

      {chatWith && <ChatModal quoteId={q.id} partnerId={chatWith.partnerId} myRole="customer" title={`${chatWith.name} 와의 채팅`} onClose={() => setChatWith(null)} />}
      {reviewWith && <ReviewModal quoteId={q.id} partnerId={reviewWith.partnerId} partnerName={reviewWith.name} onClose={() => setReviewWith(null)} />}

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirm?.desc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={() => { confirm?.onOk(); setConfirm(null); }}>{confirm?.okLabel}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
