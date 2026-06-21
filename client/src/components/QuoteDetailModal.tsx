import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Send, MessageCircle, MapPin, Calendar, Loader2, X, Tag } from "lucide-react";

interface Props {
  quoteId: number;
  partnerId: number;
  onClose: () => void;
  onOpenChat: () => void;
}

// 파트너가 열람한 견적의 상세 + 견적 제출
export default function QuoteDetailModal({ quoteId, partnerId, onClose, onOpenChat }: Props) {
  const utils = trpc.useUtils();
  const { data: quote, isLoading } = trpc.quotes.detailForPartner.useQuery({ id: quoteId });
  const { data: allCategories } = trpc.categories.list.useQuery();
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [form, setForm] = useState({ amount: "", description: "", estimatedDays: 0 });

  // 카테고리 ID → "대분류 › 소분류" 이름 변환
  const categoryLabel = (() => {
    if (!quote?.categoryId || !allCategories) return null;
    const cat = (allCategories as any[]).find((c) => c.id === quote.categoryId);
    if (!cat) return null;
    if (cat.parentId) {
      const parent = (allCategories as any[]).find((c) => c.id === cat.parentId);
      return parent ? `${parent.name} › ${cat.name}` : cat.name;
    }
    return cat.name;
  })();

  const submitQuote = trpc.partners.submitQuote.useMutation({
    onSuccess: () => {
      toast.success("견적이 제출되었습니다! 고객과 채팅으로 상담을 이어가세요.");
      utils.partners.myViews.invalidate();
      onClose();
      onOpenChat(); // 제출 후 바로 채팅 열기
    },
    onError: (e) => toast.error(e.message),
  });

  const attachments = (quote?.attachments as string[]) || [];

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4 pr-6">
            <DialogTitle className="text-lg">{isLoading ? "불러오는 중..." : quote?.title}</DialogTitle>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" variant="outline" onClick={onOpenChat}>
                <MessageCircle className="w-4 h-4 mr-1" /> 채팅
              </Button>
              <Button size="sm" onClick={() => setShowSubmitForm(true)}>
                <Send className="w-4 h-4 mr-1" /> 견적 제출
              </Button>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : !quote ? (
          <p className="text-muted-foreground py-8 text-center">견적 정보를 불러올 수 없습니다.</p>
        ) : (
          <div className="space-y-4">
            {/* 기본 정보 */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {quote.type === "designated" && <Badge className="bg-primary">지정 견적</Badge>}
              {categoryLabel && <span className="flex items-center gap-1"><Tag className="w-4 h-4" />{categoryLabel}</span>}
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{quote.region || "지역 미지정"}</span>
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{new Date(quote.createdAt).toLocaleDateString("ko-KR")}</span>
            </div>

            {/* 의뢰자 정보 */}
            {quote.customer && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                <Label className="text-sm font-semibold mb-2 block">의뢰자 정보</Label>
                <div className="space-y-1 text-sm">
                  {quote.customer.name && <p><span className="text-muted-foreground">이름: </span>{quote.customer.name}</p>}
                  {quote.customer.phone && <p><span className="text-muted-foreground">연락처: </span>{quote.customer.phone}</p>}
                  {quote.customer.email && <p><span className="text-muted-foreground">이메일: </span>{quote.customer.email}</p>}
                </div>
              </div>
            )}

            {/* 주소 */}
            {quote.address && (
              <div className="bg-muted/40 rounded-lg p-3 text-sm">
                <span className="text-muted-foreground">시공 주소: </span>{quote.address}
              </div>
            )}

            {/* 요청 내용 */}
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">요청 내용</Label>
              <p className="text-sm leading-relaxed whitespace-pre-wrap bg-muted/30 rounded-lg p-3">
                {quote.description || "상세 내용이 없습니다."}
              </p>
            </div>

            {/* 추가 작성 항목 (formData) */}
            {quote.formData && Object.keys(quote.formData as Record<string, unknown>).length > 0 && (
              <div>
                <Label className="text-sm font-semibold mb-1.5 block">상세 항목</Label>
                <div className="bg-muted/30 rounded-lg p-3 space-y-1.5 text-sm">
                  {Object.entries(quote.formData as Record<string, unknown>).map(([key, value]) => (
                    <div key={key} className="flex gap-2">
                      <span className="text-muted-foreground shrink-0">{key}:</span>
                      <span className="break-words">{Array.isArray(value) ? value.join(", ") : String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 첨부 사진 */}
            {attachments.length > 0 && (
              <div>
                <Label className="text-sm font-semibold mb-1.5 block">첨부 사진 ({attachments.length})</Label>
                <div className="grid grid-cols-3 gap-2">
                  {attachments.map((src, i) => (
                    <a key={i} href={src} target="_blank" rel="noreferrer" className="block aspect-square rounded-lg overflow-hidden border border-border">
                      <img src={src} alt={`첨부${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* 견적 제출 폼 (토글) */}
            {showSubmitForm && (
              <div className="border-t border-border pt-4 space-y-3">
                <h4 className="font-semibold text-sm">견적 제출</h4>
                <div>
                  <Label className="text-sm mb-1.5 block">견적 금액</Label>
                  <Input placeholder="예: 3,000,000" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>
                <div>
                  <Label className="text-sm mb-1.5 block">예상 소요일</Label>
                  <Input type="number" placeholder="일" value={form.estimatedDays || ""} onChange={(e) => setForm({ ...form, estimatedDays: Number(e.target.value) })} />
                </div>
                <div>
                  <Label className="text-sm mb-1.5 block">설명</Label>
                  <Textarea placeholder="견적에 대한 상세 설명" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
                </div>
                <Button className="w-full" onClick={() => submitQuote.mutate({ quoteId, ...form })} disabled={submitQuote.isPending}>
                  {submitQuote.isPending ? "제출 중..." : "견적 제출하기"}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
