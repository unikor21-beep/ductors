import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ImagePlus, X, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { REGIONS } from "@shared/constants";

const MAX_IMAGES = 3;

type PortfolioForm = {
  title: string;
  categoryId: number | undefined;
  region: string;
  description: string;
  images: string[];
};

const emptyForm: PortfolioForm = { title: "", categoryId: undefined, region: "", description: "", images: [] };

const STATUS_INFO: Record<string, { label: string; icon: typeof Clock; className: string }> = {
  pending: { label: "검수 대기중", icon: Clock, className: "bg-amber-100 text-amber-800" },
  approved: { label: "게시중", icon: CheckCircle2, className: "bg-green-100 text-green-800" },
  rejected: { label: "반려됨", icon: XCircle, className: "bg-red-100 text-red-800" },
};

export default function PortfolioManager() {
  const utils = trpc.useUtils();
  const { data: portfolios, isLoading } = trpc.portfolios.myPortfolios.useQuery();
  const { data: categories } = trpc.categories.list.useQuery();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<PortfolioForm>(emptyForm);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createMut = trpc.portfolios.create.useMutation({
    onSuccess: () => {
      toast.success("포트폴리오가 등록되었습니다. 관리자 검수 후 게시됩니다.");
      utils.portfolios.myPortfolios.invalidate();
      closeDialog();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMut = trpc.portfolios.update.useMutation({
    onSuccess: () => {
      toast.success("수정되었습니다. 다시 검수 후 게시됩니다.");
      utils.portfolios.myPortfolios.invalidate();
      closeDialog();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMut = trpc.portfolios.delete.useMutation({
    onSuccess: () => {
      toast.success("삭제되었습니다.");
      utils.portfolios.myPortfolios.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(p: any) {
    setEditingId(p.id);
    setForm({
      title: p.title ?? "",
      categoryId: p.categoryId ?? undefined,
      region: p.region ?? "",
      description: p.description ?? "",
      images: Array.isArray(p.images) ? p.images : [],
    });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  // 임시 방식: 선택한 사진을 브라우저에서 미리보기용으로 변환 (추후 S3 업로드로 교체)
  function handleFiles(files: FileList | null) {
    if (!files) return;
    const remaining = MAX_IMAGES - form.images.length;
    if (remaining <= 0) {
      toast.error(`사진은 최대 ${MAX_IMAGES}장까지 올릴 수 있습니다.`);
      return;
    }
    const selected = Array.from(files).slice(0, remaining);
    selected.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setForm((prev) => ({ ...prev, images: [...prev.images, reader.result as string] }));
      };
      reader.readAsDataURL(file);
    });
  }

  function removeImage(idx: number) {
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
  }

  function handleSubmit() {
    if (!form.title.trim()) return toast.error("공사 제목을 입력해주세요.");
    if (form.images.length === 0) return toast.error("사진을 최소 1장 올려주세요.");

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      images: form.images,
      categoryId: form.categoryId,
      region: form.region.trim() || undefined,
    };

    if (editingId) updateMut.mutate({ id: editingId, ...payload });
    else createMut.mutate(payload);
  }

  const saving = createMut.isPending || updateMut.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">시공 포트폴리오</h3>
          <p className="text-sm text-muted-foreground">완료한 시공 사례를 올려 고객에게 실력을 보여주세요.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1" /> 새 포트폴리오
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin inline mr-2" /> 불러오는 중...
        </div>
      ) : !portfolios || portfolios.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          아직 등록한 포트폴리오가 없습니다. 첫 시공 사례를 올려보세요!
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {portfolios.map((p: any) => {
            const status = STATUS_INFO[p.status] ?? STATUS_INFO.pending;
            const StatusIcon = status.icon;
            const images: string[] = Array.isArray(p.images) ? p.images : [];
            return (
              <Card key={p.id} className="border-border/50 shadow-sm overflow-hidden">
                {images[0] && (
                  <div className="aspect-video bg-muted overflow-hidden">
                    <img src={images[0]} alt={p.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-foreground line-clamp-1">{p.title}</h4>
                    <Badge className={`${status.className} shrink-0`}>
                      <StatusIcon className="w-3 h-3 mr-1" /> {status.label}
                    </Badge>
                  </div>
                  {p.region && <p className="text-sm text-muted-foreground">📍 {p.region}</p>}
                  {p.description && <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>}
                  {images.length > 1 && <p className="text-xs text-muted-foreground">사진 {images.length}장</p>}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                      <Pencil className="w-3 h-3 mr-1" /> 수정
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => {
                        if (confirm("이 포트폴리오를 삭제할까요?")) deleteMut.mutate({ id: p.id });
                      }}
                    >
                      <Trash2 className="w-3 h-3 mr-1" /> 삭제
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(o) => (o ? setDialogOpen(true) : closeDialog())}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "포트폴리오 수정" : "새 포트폴리오"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>사진 (최대 {MAX_IMAGES}장)</Label>
              <div className="flex gap-2 flex-wrap">
                {form.images.map((src, idx) => (
                  <div key={idx} className="relative w-24 h-24 rounded-md overflow-hidden border">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {form.images.length < MAX_IMAGES && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 rounded-md border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    <ImagePlus className="w-5 h-5" />
                    <span className="text-xs mt-1">추가</span>
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  handleFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>

            <div className="space-y-1.5">
              <Label>공사 제목 *</Label>
              <Input
                placeholder="예: 강남 OO아파트 전열교환기 설치"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>공사 종류</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={form.categoryId ?? ""}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value ? Number(e.target.value) : undefined })}
                >
                  <option value="">선택 안 함</option>
                  {categories?.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.icon ? `${c.icon} ` : ""}
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>시공 지역</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={form.region}
                  onChange={(e) => setForm({ ...form, region: e.target.value })}
                >
                  <option value="">선택 안 함</option>
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>공사 소개</Label>
              <Textarea
                placeholder="어떤 공사였는지, 어떤 점에 신경 썼는지 자유롭게 소개해주세요."
                rows={5}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={saving}>
              취소
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              {editingId ? "수정 완료" : "등록"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
