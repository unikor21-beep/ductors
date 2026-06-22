/**
 * PartnerPickerDialog - 파트너 선택 팝업
 * 견적 의뢰 흐름을 떠나지 않고(페이지 이동 없이) 제자리에서 지정 파트너를 고른다.
 * 페이지가 유지되므로 카테고리 등 이미 입력한 값이 사라지지 않는다.
 */
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import PartnerAvatar from "@/components/PartnerAvatar";
import { Star, Award, Search, Loader2 } from "lucide-react";
import { GRADE_LABELS, GRADE_COLORS } from "@shared/constants";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (partnerId: number) => void;
};

export default function PartnerPickerDialog({ open, onOpenChange, onSelect }: Props) {
  // 팝업이 열렸을 때만 목록을 불러온다
  const { data: partners, isLoading } = trpc.partners.list.useQuery(undefined, { enabled: open });
  const [searchText, setSearchText] = useState("");

  const filtered = useMemo(() => {
    if (!partners) return [];
    const q = searchText.trim().toLowerCase();
    if (!q) return partners as any[];
    return (partners as any[]).filter(
      (p) =>
        (p.companyName || "").toLowerCase().includes(q) ||
        (p.shortIntro || "").toLowerCase().includes(q),
    );
  }, [partners, searchText]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="text-base">지정할 파트너 선택</DialogTitle>
          <DialogDescription className="text-xs">
            견적을 직접 요청할 파트너를 선택하세요. 선택해도 입력한 내용은 그대로 유지됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="회사명으로 검색"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="max-h-[55vh] overflow-y-auto px-5 pb-5 space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> 불러오는 중...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              {searchText ? "검색 결과가 없습니다" : "선택 가능한 파트너가 없습니다"}
            </div>
          ) : (
            filtered.map((partner: any) => (
              <button
                key={partner.id}
                type="button"
                onClick={() => onSelect(partner.id)}
                className="w-full text-left rounded-xl border border-border/60 p-3 flex items-center gap-3 hover:border-primary/50 hover:bg-primary/5 transition-colors"
              >
                <PartnerAvatar logoUrl={partner.logoUrl} companyName={partner.companyName} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground truncate">{partner.companyName}</span>
                    <Badge
                      className="text-[10px] px-1.5 py-0 shrink-0"
                      style={{
                        backgroundColor: GRADE_COLORS[partner.grade || "bronze"] + "20",
                        color: GRADE_COLORS[partner.grade || "bronze"],
                      }}
                    >
                      <Award className="w-2.5 h-2.5 mr-0.5" />
                      {GRADE_LABELS[partner.grade || "bronze"]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs text-muted-foreground">
                      {Number(partner.avgRating || 0).toFixed(1)} ({partner.reviewCount || 0}건)
                    </span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
