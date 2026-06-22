import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Upload, Loader2, Trash2, ArrowUp, ArrowDown, Plus, X } from "lucide-react";
import { BANNER_POSITIONS } from "@shared/constants";

// Date <-> datetime-local 문자열 변환
function toLocalInput(d?: Date | string | null): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
function fromLocalInput(s: string): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

// 3x3 위치 선택기
function PositionPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-1 w-32">
      {BANNER_POSITIONS.map((p) => (
        <button
          key={p.key}
          type="button"
          onClick={() => onChange(p.key)}
          className={`h-9 rounded text-[11px] border transition ${
            value === p.key
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-muted/40 hover:bg-muted border-border"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

type FormState = {
  imageUrl: string;
  linkUrl: string;
  buttonText: string;
  buttonPosition: string;
  startsAt: string;
  endsAt: string;
};

const emptyForm: FormState = {
  imageUrl: "", linkUrl: "", buttonText: "", buttonPosition: "bc", startsAt: "", endsAt: "",
};

function BannerForm({
  initial, onSubmit, submitting, onCancel, submitLabel,
}: {
  initial: FormState;
  onSubmit: (f: FormState) => void;
  submitting: boolean;
  onCancel?: () => void;
  submitLabel: string;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadImage = trpc.upload.adminUploadImage.useMutation({
    onError: (e) => toast.error(`업로드 실패: ${e.message}`),
  });

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("이미지 파일만 가능합니다"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("파일은 10MB 이하여야 합니다"); return; }
    setUploading(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const { url } = await uploadImage.mutateAsync({ base64, contentType: file.type, filename: file.name });
      setForm((f) => ({ ...f, imageUrl: url }));
    } catch { /* handled */ } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }, [uploadImage]);

  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-1.5 block">배너 이미지</Label>
        {form.imageUrl ? (
          <div className="relative inline-block">
            <img src={form.imageUrl} alt="미리보기" className="max-h-40 rounded border" />
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, imageUrl: "" }))}
              className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Button type="button" variant="outline" disabled={uploading} onClick={() => fileRef.current?.click()}>
              {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              이미지 업로드
            </Button>
            <div className="flex items-center gap-2">
              <Input
                placeholder="또는 이미지 주소(URL) 붙여넣기"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && urlInput.trim()) { setForm((f) => ({ ...f, imageUrl: urlInput.trim() })); setUrlInput(""); } }}
              />
              <Button
                type="button"
                variant="secondary"
                disabled={!urlInput.trim()}
                onClick={() => { setForm((f) => ({ ...f, imageUrl: urlInput.trim() })); setUrlInput(""); }}
              >
                적용
              </Button>
            </div>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label className="mb-1.5 block">링크 URL (선택)</Label>
          <Input
            placeholder="/quote-request 또는 https://..."
            value={form.linkUrl}
            onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
          />
          <p className="text-xs text-muted-foreground mt-1">비워두면 버튼이 표시되지 않습니다.</p>
        </div>
        <div>
          <Label className="mb-1.5 block">버튼 문구</Label>
          <Input
            placeholder="자세히 보기"
            value={form.buttonText}
            onChange={(e) => setForm((f) => ({ ...f, buttonText: e.target.value }))}
          />
        </div>
      </div>

      <div>
        <Label className="mb-1.5 block">버튼 위치 (9분할)</Label>
        <PositionPicker value={form.buttonPosition} onChange={(v) => setForm((f) => ({ ...f, buttonPosition: v }))} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label className="mb-1.5 block">노출 시작 (선택)</Label>
          <Input type="datetime-local" value={form.startsAt} onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))} />
        </div>
        <div>
          <Label className="mb-1.5 block">노출 종료 (선택)</Label>
          <Input type="datetime-local" value={form.endsAt} onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))} />
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          disabled={submitting || !form.imageUrl}
          onClick={() => onSubmit(form)}
        >
          {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {submitLabel}
        </Button>
        {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>취소</Button>}
      </div>
    </div>
  );
}

export default function BannerManager() {
  const utils = trpc.useUtils();
  const { data: banners, isLoading } = trpc.banners.listAll.useQuery();
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [confirmDel, setConfirmDel] = useState<number | null>(null);

  const refresh = () => { utils.banners.listAll.invalidate(); utils.banners.list.invalidate(); };

  const createMut = trpc.banners.create.useMutation({
    onSuccess: () => { toast.success("배너가 추가되었습니다"); setAdding(false); refresh(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.banners.update.useMutation({
    onSuccess: () => { toast.success("저장되었습니다"); setEditId(null); refresh(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc.banners.delete.useMutation({
    onSuccess: () => { toast.success("삭제되었습니다"); setConfirmDel(null); refresh(); },
    onError: (e) => toast.error(e.message),
  });
  const swapMut = trpc.banners.swapOrder.useMutation({ onSuccess: refresh, onError: (e) => toast.error(e.message) });

  const list = banners ?? [];

  const buildPayload = (f: FormState) => ({
    imageUrl: f.imageUrl,
    linkUrl: f.linkUrl.trim() || null,
    buttonText: f.buttonText.trim() || null,
    buttonPosition: f.buttonPosition as any,
    startsAt: fromLocalInput(f.startsAt),
    endsAt: fromLocalInput(f.endsAt),
  });

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">배너 관리</h2>
          <p className="text-sm text-muted-foreground">메인페이지 상단에 노출되는 홍보·이벤트 배너입니다.</p>
        </div>
        {!adding && (
          <Button onClick={() => setAdding(true)}><Plus className="w-4 h-4 mr-2" />새 배너</Button>
        )}
      </div>

      {adding && (
        <Card>
          <CardHeader><CardTitle className="text-base">새 배너 추가</CardTitle></CardHeader>
          <CardContent>
            <BannerForm
              initial={emptyForm}
              submitting={createMut.isPending}
              submitLabel="추가"
              onCancel={() => setAdding(false)}
              onSubmit={(f) => createMut.mutate(buildPayload(f) as any)}
            />
          </CardContent>
        </Card>
      )}

      {list.length === 0 && !adding && (
        <Card><CardContent className="py-10 text-center text-muted-foreground">등록된 배너가 없습니다.</CardContent></Card>
      )}

      <div className="space-y-3">
        {list.map((b, i) => {
          const now = Date.now();
          const expired = b.endsAt && new Date(b.endsAt).getTime() < now;
          const pending = b.startsAt && new Date(b.startsAt).getTime() > now;
          const editing = editId === b.id;
          return (
            <Card key={b.id}>
              <CardContent className="p-4">
                {editing ? (
                  <BannerForm
                    initial={{
                      imageUrl: b.imageUrl,
                      linkUrl: b.linkUrl ?? "",
                      buttonText: b.buttonText ?? "",
                      buttonPosition: b.buttonPosition,
                      startsAt: toLocalInput(b.startsAt),
                      endsAt: toLocalInput(b.endsAt),
                    }}
                    submitting={updateMut.isPending}
                    submitLabel="저장"
                    onCancel={() => setEditId(null)}
                    onSubmit={(f) => updateMut.mutate({ id: b.id, ...buildPayload(f) } as any)}
                  />
                ) : (
                  <div className="flex gap-4">
                    <img src={b.imageUrl} alt="배너" className="w-32 h-20 object-cover rounded border shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {!b.isActive && <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">비활성</span>}
                        {expired && <span className="text-xs px-2 py-0.5 rounded bg-destructive/10 text-destructive">기간만료</span>}
                        {pending && <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700">노출대기</span>}
                        {b.isActive && !expired && !pending && <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">노출중</span>}
                      </div>
                      <p className="text-sm mt-1 truncate">{b.linkUrl ? `링크: ${b.linkUrl}` : "링크 없음"}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {b.startsAt ? toLocalInput(b.startsAt) : "즉시"} ~ {b.endsAt ? toLocalInput(b.endsAt) : "무기한"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">활성</span>
                        <Switch checked={b.isActive} onCheckedChange={(v) => updateMut.mutate({ id: b.id, isActive: v })} />
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" disabled={i === 0} onClick={() => swapMut.mutate({ idA: b.id, idB: list[i - 1].id })}><ArrowUp className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" disabled={i === list.length - 1} onClick={() => swapMut.mutate({ idA: b.id, idB: list[i + 1].id })}><ArrowDown className="w-4 h-4" /></Button>
                        <Button size="sm" variant="outline" onClick={() => setEditId(b.id)}>수정</Button>
                        {confirmDel === b.id ? (
                          <Button size="sm" variant="destructive" disabled={deleteMut.isPending} onClick={() => deleteMut.mutate({ id: b.id })}>정말 삭제?</Button>
                        ) : (
                          <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setConfirmDel(b.id)}><Trash2 className="w-4 h-4" /></Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
