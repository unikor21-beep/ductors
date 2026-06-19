import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Loader2, Plus, Trash2, ChevronDown, ChevronRight,
  GripVertical, Edit2, Check, X, Settings2, ListPlus
} from "lucide-react";

// ── 타입 ──────────────────────────────────────────────────
type FieldType = "text" | "number" | "select" | "multiselect" | "image" | "file";

type CategoryField = {
  id: number;
  categoryId: number;
  label: string;
  fieldType: FieldType;
  options: string[] | null;
  isRequired: boolean | null;
  sortOrder: number | null;
  isActive: boolean | null;
};

type Category = {
  id: number;
  parentId: number | null;
  name: string;
  icon: string | null;
  description: string | null;
  sortOrder: number | null;
  isActive: boolean | null;
};

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: "텍스트 입력",
  number: "숫자 입력",
  select: "단일 선택",
  multiselect: "복수 선택",
  image: "이미지 첨부",
  file: "파일 첨부",
};

// ── 인라인 편집 훅 ────────────────────────────────────────
function useInlineEdit(initialValue: string) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  return { editing, setEditing, value, setValue };
}

// ── 필드 행 컴포넌트 ──────────────────────────────────────
function FieldRow({
  field,
  onUpdate,
  onDelete,
}: {
  field: CategoryField;
  onUpdate: (id: number, data: Partial<CategoryField>) => void;
  onDelete: (id: number) => void;
}) {
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelValue, setLabelValue] = useState(field.label);
  const [optionInput, setOptionInput] = useState("");
  const [options, setOptions] = useState<string[]>(field.options ?? []);
  const needsOptions = field.fieldType === "select" || field.fieldType === "multiselect";

  const saveLabel = () => {
    if (labelValue.trim() && labelValue !== field.label) {
      onUpdate(field.id, { label: labelValue.trim() });
    }
    setEditingLabel(false);
  };

  const addOption = () => {
    if (!optionInput.trim()) return;
    const next = [...options, optionInput.trim()];
    setOptions(next);
    setOptionInput("");
    onUpdate(field.id, { options: next });
  };

  const removeOption = (idx: number) => {
    const next = options.filter((_, i) => i !== idx);
    setOptions(next);
    onUpdate(field.id, { options: next });
  };

  return (
    <div className="border border-border rounded-lg p-3 space-y-2 bg-background">
      <div className="flex items-center gap-2">
        <GripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0" />

        {/* 라벨 인라인 편집 */}
        {editingLabel ? (
          <div className="flex items-center gap-1 flex-1">
            <Input
              value={labelValue}
              onChange={(e) => setLabelValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") saveLabel(); if (e.key === "Escape") setEditingLabel(false); }}
              className="h-7 text-sm"
              autoFocus
            />
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveLabel}><Check className="w-3.5 h-3.5 text-green-600" /></Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingLabel(false)}><X className="w-3.5 h-3.5" /></Button>
          </div>
        ) : (
          <span
            className="flex-1 text-sm font-medium cursor-pointer hover:text-primary flex items-center gap-1 group"
            onClick={() => setEditingLabel(true)}
          >
            {field.label}
            <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-50" />
          </span>
        )}

        <Badge variant="outline" className="text-xs shrink-0">{FIELD_TYPE_LABELS[field.fieldType]}</Badge>

        <div className="flex items-center gap-1 shrink-0">
          <span className="text-xs text-muted-foreground">필수</span>
          <Switch
            checked={field.isRequired ?? false}
            onCheckedChange={(v) => onUpdate(field.id, { isRequired: v })}
            className="scale-75"
          />
        </div>

        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-destructive/60 hover:text-destructive shrink-0"
          onClick={() => onDelete(field.id)}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* select/multiselect 옵션 편집 */}
      {needsOptions && (
        <div className="pl-6 space-y-1.5">
          <div className="flex flex-wrap gap-1.5">
            {options.map((opt, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded text-xs">
                {opt}
                <button onClick={() => removeOption(i)} className="hover:text-destructive"><X className="w-2.5 h-2.5" /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-1">
            <Input
              placeholder="선택지 추가..."
              value={optionInput}
              onChange={(e) => setOptionInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addOption(); }}
              className="h-7 text-xs"
            />
            <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={addOption}>추가</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 카테고리 카드 컴포넌트 ────────────────────────────────
function CategoryCard({ category }: { category: Category }) {
  const [expanded, setExpanded] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(category.name);
  const [editingIcon, setEditingIcon] = useState(false);
  const [iconValue, setIconValue] = useState(category.icon ?? "");
  const [showAddField, setShowAddField] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<FieldType>("text");
  const [newFieldRequired, setNewFieldRequired] = useState(false);

  const utils = trpc.useUtils();

  const { data: fields = [], isLoading: fieldsLoading } = trpc.categories.fields.useQuery(
    { categoryId: category.id },
    { enabled: expanded }
  );

  const updateCategory = trpc.categories.update.useMutation({
    onSuccess: () => { toast.success("카테고리가 수정되었습니다"); utils.categories.listAll.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const deleteCategory = trpc.categories.delete.useMutation({
    onSuccess: () => { toast.success("카테고리가 삭제되었습니다"); utils.categories.listAll.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const createField = trpc.categories.createField.useMutation({
    onSuccess: () => {
      toast.success("항목이 추가되었습니다");
      utils.categories.fields.invalidate({ categoryId: category.id });
      setNewFieldLabel("");
      setNewFieldType("text");
      setNewFieldRequired(false);
      setShowAddField(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateField = trpc.categories.updateField.useMutation({
    onSuccess: () => { toast.success("항목이 수정되었습니다"); utils.categories.fields.invalidate({ categoryId: category.id }); },
    onError: (e) => toast.error(e.message),
  });

  const deleteField = trpc.categories.deleteField.useMutation({
    onSuccess: () => { toast.success("항목이 삭제되었습니다"); utils.categories.fields.invalidate({ categoryId: category.id }); },
    onError: (e) => toast.error(e.message),
  });

  const saveName = () => {
    if (nameValue.trim() && nameValue !== category.name) {
      updateCategory.mutate({ id: category.id, name: nameValue.trim() });
    }
    setEditingName(false);
  };

  const saveIcon = () => {
    if (iconValue !== category.icon) {
      updateCategory.mutate({ id: category.id, icon: iconValue.trim() });
    }
    setEditingIcon(false);
  };

  const handleAddField = () => {
    if (!newFieldLabel.trim()) { toast.error("항목 이름을 입력하세요"); return; }
    createField.mutate({
      categoryId: category.id,
      label: newFieldLabel.trim(),
      fieldType: newFieldType,
      isRequired: newFieldRequired,
      sortOrder: (fields?.length ?? 0),
    });
  };

  return (
    <Card className={`transition-all ${!category.isActive ? "opacity-50" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {/* 아이콘 편집 */}
          {editingIcon ? (
            <div className="flex items-center gap-1">
              <Input value={iconValue} onChange={(e) => setIconValue(e.target.value)} className="h-7 w-16 text-center text-lg" autoFocus onKeyDown={(e) => { if (e.key === "Enter") saveIcon(); }} placeholder="🏠" />
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveIcon}><Check className="w-3.5 h-3.5 text-green-600" /></Button>
            </div>
          ) : (
            <span className="text-xl cursor-pointer hover:opacity-70" onClick={() => setEditingIcon(true)} title="클릭해서 아이콘 변경">
              {category.icon || "📁"}
            </span>
          )}

          {/* 카테고리 이름 편집 */}
          {editingName ? (
            <div className="flex items-center gap-1 flex-1">
              <Input value={nameValue} onChange={(e) => setNameValue(e.target.value)} className="h-7 text-sm font-semibold" autoFocus onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false); }} />
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveName}><Check className="w-3.5 h-3.5 text-green-600" /></Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingName(false)}><X className="w-3.5 h-3.5" /></Button>
            </div>
          ) : (
            <CardTitle
              className="text-base cursor-pointer hover:text-primary flex items-center gap-1 group flex-1"
              onClick={() => setEditingName(true)}
            >
              {category.name}
              <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-50" />
            </CardTitle>
          )}

          <div className="flex items-center gap-2 ml-auto shrink-0">
            <div className="flex items-center gap-1.5" title="끄면 고객·파트너 화면에서 숨겨집니다 (데이터는 유지)">
              <span className="text-xs text-muted-foreground">활성</span>
              <Switch
                checked={category.isActive ?? true}
                onCheckedChange={(v) => updateCategory.mutate({ id: category.id, isActive: v })}
                className="scale-75"
              />
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-destructive/60 hover:text-destructive"
              title="완전히 삭제 (복구 불가)"
              onClick={() => {
                const isParent = !category.parentId;
                const msg = isParent
                  ? `"${category.name}" 대분류를 완전히 삭제할까요?\n\n⚠️ 이 대분류에 속한 모든 소분류도 함께 삭제됩니다.\n(삭제하면 복구할 수 없습니다)`
                  : `"${category.name}" 소분류를 완전히 삭제할까요?\n(삭제하면 복구할 수 없습니다)`;
                if (confirm(msg)) deleteCategory.mutate({ id: category.id });
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-3 pt-0">
          <div className="h-px bg-border" />

          {fieldsLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {fields.length === 0 && !showAddField && (
                <p className="text-sm text-muted-foreground text-center py-3">
                  아직 입력 항목이 없습니다. 아래에서 추가하세요.
                </p>
              )}

              {/* 기존 필드 목록 */}
              <div className="space-y-2">
                {fields.map((field) => (
                  <FieldRow
                    key={field.id}
                    field={field as CategoryField}
                    onUpdate={(id, data) => updateField.mutate({ id, ...data } as any)}
                    onDelete={(id) => { if (confirm("이 항목을 삭제할까요?")) deleteField.mutate({ id }); }}
                  />
                ))}
              </div>

              {/* 새 필드 추가 폼 */}
              {showAddField && (
                <div className="border border-dashed border-primary/40 rounded-lg p-3 space-y-3 bg-primary/5">
                  <p className="text-xs font-medium text-primary">새 입력 항목 추가</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">항목 이름 *</Label>
                      <Input
                        placeholder="예: 설치 면적(㎡)"
                        value={newFieldLabel}
                        onChange={(e) => setNewFieldLabel(e.target.value)}
                        className="h-8 text-sm"
                        autoFocus
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">입력 유형</Label>
                      <Select value={newFieldType} onValueChange={(v) => setNewFieldType(v as FieldType)}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(FIELD_TYPE_LABELS).map(([val, label]) => (
                            <SelectItem key={val} value={val} className="text-sm">{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch checked={newFieldRequired} onCheckedChange={setNewFieldRequired} className="scale-75" />
                      <span className="text-xs text-muted-foreground">필수 항목</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowAddField(false)}>취소</Button>
                      <Button size="sm" className="h-7 text-xs" onClick={handleAddField} disabled={createField.isPending}>
                        {createField.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "추가"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {!showAddField && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs border-dashed"
                  onClick={() => setShowAddField(true)}
                >
                  <ListPlus className="w-3.5 h-3.5 mr-1.5" />
                  입력 항목 추가
                </Button>
              )}
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────
export default function CategoryManager() {
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("");
  const [newCategoryParentId, setNewCategoryParentId] = useState<string>(""); // "" = 대분류, 숫자 = 소분류

  const utils = trpc.useUtils();
  const { data: categories = [], isLoading } = trpc.categories.listAll.useQuery();

  // 대분류(parentId 없음)와 소분류로 분리
  const parents = (categories as Category[]).filter((c) => !c.parentId);
  const childrenOf = (parentId: number) => (categories as Category[]).filter((c) => c.parentId === parentId);

  const createCategory = trpc.categories.create.useMutation({
    onSuccess: () => {
      toast.success("카테고리가 추가되었습니다");
      utils.categories.listAll.invalidate();
      setNewCategoryName("");
      setNewCategoryIcon("");
      setNewCategoryParentId("");
      setShowAddCategory(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleCreate = () => {
    if (!newCategoryName.trim()) { toast.error("카테고리 이름을 입력하세요"); return; }
    createCategory.mutate({
      name: newCategoryName.trim(),
      parentId: newCategoryParentId ? Number(newCategoryParentId) : undefined,
      icon: newCategoryIcon.trim() || undefined,
      sortOrder: categories.length,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Settings2 className="w-4 h-4" />
            카테고리 & 입력 항목 관리
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            견적 의뢰 시 고객에게 표시될 카테고리와 질문 항목을 설정합니다.
            카테고리 이름·아이콘을 클릭해서 바로 편집할 수 있습니다.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowAddCategory(true)} disabled={showAddCategory}>
          <Plus className="w-4 h-4 mr-1" />
          카테고리 추가
        </Button>
      </div>

      {/* 새 카테고리 추가 폼 */}
      {showAddCategory && (
        <Card className="border-dashed border-primary/40 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-primary">새 카테고리</CardTitle>
            <CardDescription className="text-xs">추가 후 카드를 펼쳐서 입력 항목을 설정하세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">분류 단계</Label>
              <select
                value={newCategoryParentId}
                onChange={(e) => setNewCategoryParentId(e.target.value)}
                className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value="">대분류 (예: 식당, 가정, 공장, 상업)</option>
                {parents.map((p) => (
                  <option key={p.id} value={p.id}>
                    └ {p.name} 의 소분류로 추가
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <div className="space-y-1 w-20">
                <Label className="text-xs">아이콘 (이모지)</Label>
                <Input
                  placeholder="🏠"
                  value={newCategoryIcon}
                  onChange={(e) => setNewCategoryIcon(e.target.value)}
                  className="h-8 text-center text-lg"
                  maxLength={4}
                />
              </div>
              <div className="space-y-1 flex-1">
                <Label className="text-xs">{newCategoryParentId ? "소분류" : "대분류"} 이름 *</Label>
                <Input
                  placeholder={newCategoryParentId ? "예: 후드공사, 욕실, 국소배기..." : "예: 식당, 가정, 공장, 상업..."}
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
                  className="h-8 text-sm"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowAddCategory(false)}>취소</Button>
              <Button size="sm" className="h-7 text-xs" onClick={handleCreate} disabled={createCategory.isPending}>
                {createCategory.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Plus className="w-3 h-3 mr-1" />}
                추가
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 카테고리 목록 */}
      {categories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Settings2 className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">카테고리가 없습니다</p>
            <p className="text-xs text-muted-foreground/70 mt-1">위 버튼을 눌러 첫 대분류를 추가하세요.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {parents.map((parent) => {
            const children = childrenOf(parent.id);
            return (
              <div key={parent.id} className="space-y-2">
                {/* 대분류 */}
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs shrink-0">대분류</Badge>
                  <div className="flex-1 min-w-0">
                    <CategoryCard category={parent} />
                  </div>
                </div>
                {/* 소분류들 (들여쓰기) */}
                <div className="ml-6 pl-4 border-l-2 border-border/40 space-y-2">
                  {children.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-1">아직 소분류가 없습니다. 위 "카테고리 추가"에서 이 대분류의 소분류를 추가하세요.</p>
                  ) : (
                    children.map((child) => <CategoryCard key={child.id} category={child} />)
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 사용 안내 */}
      <Card className="bg-muted/30">
        <CardContent className="py-3 px-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            💡 <strong>사용 방법:</strong> 카테고리 우측 화살표(▶)를 눌러 입력 항목을 펼치세요.
            이름·아이콘은 클릭해서 바로 수정 가능합니다.
            <br />
            🔘 <strong>활성 스위치</strong> = 잠깐 숨기기 (데이터 유지) ／ 🗑️ <strong>휴지통</strong> = 완전 삭제 (복구 불가).
            대분류를 삭제하면 그 안의 소분류도 함께 삭제됩니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
