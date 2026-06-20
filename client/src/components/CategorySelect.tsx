/**
 * CategorySelect - 2단계 카테고리 선택 컴포넌트
 * 대분류 선택 → 소분류 자동 표시
 */
import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type Props = {
  value: number | null;           // 현재 선택된 소분류(또는 대분류) id
  onChange: (id: number | null) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
};

export default function CategorySelect({
  value,
  onChange,
  label = "카테고리",
  required = false,
  placeholder = "시공 분야를 선택하세요",
}: Props) {
  const { data: allCategories = [] } = trpc.categories.list.useQuery();

  // 대분류 / 소분류 분리
  const parents = useMemo(
    () => allCategories.filter((c) => !c.parentId).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [allCategories]
  );

  const childrenOf = useMemo(() => {
    const map: Record<number, typeof allCategories> = {};
    allCategories
      .filter((c) => c.parentId)
      .forEach((c) => {
        if (!map[c.parentId!]) map[c.parentId!] = [];
        map[c.parentId!].push(c);
      });
    // 각 그룹 sortOrder 정렬
    Object.values(map).forEach((arr) => arr.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)));
    return map;
  }, [allCategories]);

  // 현재 선택된 값으로 어느 대분류에 속하는지 파악
  const selectedCategory = allCategories.find((c) => c.id === value);
  const selectedParentId = selectedCategory
    ? selectedCategory.parentId ?? selectedCategory.id   // 소분류면 parentId, 대분류면 자기 id
    : null;

  // 대분류 변경
  function handleParentChange(parentIdStr: string) {
    const parentId = Number(parentIdStr);
    const subs = childrenOf[parentId] ?? [];
    if (subs.length === 0) {
      // 소분류 없으면 대분류 자체를 선택
      onChange(parentId);
    } else {
      // 소분류 있으면 초기화 (사용자가 소분류 선택하도록)
      onChange(null);
    }
  }

  // 소분류 변경
  function handleChildChange(childIdStr: string) {
    onChange(Number(childIdStr));
  }

  const currentSubs = selectedParentId ? (childrenOf[selectedParentId] ?? []) : [];

  return (
    <div className="space-y-3">
      {/* 대분류 */}
      <div>
        <Label className="text-sm font-medium mb-2 block">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
        <Select
          value={selectedParentId ? String(selectedParentId) : ""}
          onValueChange={handleParentChange}
        >
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {parents.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 소분류 (대분류 선택 후 소분류 있을 때만 표시) */}
      {selectedParentId && currentSubs.length > 0 && (
        <div>
          <Label className="text-sm font-medium mb-2 block">
            세부 분야 {required && <span className="text-destructive">*</span>}
          </Label>
          <Select
            value={selectedCategory?.parentId ? String(value) : ""}
            onValueChange={handleChildChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="세부 분야를 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              {currentSubs.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
