import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, Image as ImageIcon, Loader2, RotateCcw, ExternalLink } from "lucide-react";
import { HERO_BG_DEFAULT, SECTION3_BG_DEFAULT, SETTING_KEYS } from "@shared/constants";

type SectionConfig = {
  key: string;
  label: string;
  description: string;
  defaultUrl: string;
};

const SECTIONS: SectionConfig[] = [
  {
    key: SETTING_KEYS.HERO_BG,
    label: "1단 히어로 배경",
    description: "메인 페이지 상단 히어로 영역의 배경 이미지입니다. 권장 크기: 1920x1080px 이상",
    defaultUrl: HERO_BG_DEFAULT,
  },
  {
    key: SETTING_KEYS.SECTION3_BG,
    label: "3단 파트너스 배경",
    description: "메인 페이지 하단 파트너스 영역의 배경 이미지입니다. 권장 크기: 1920x800px 이상",
    defaultUrl: SECTION3_BG_DEFAULT,
  },
];

function BackgroundCard({ section }: { section: SectionConfig }) {
  const utils = trpc.useUtils();
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: currentUrl } = trpc.settings.get.useQuery({ key: section.key });
  const setSetting = trpc.settings.set.useMutation({
    onSuccess: () => {
      toast.success("배경 이미지가 변경되었습니다");
      utils.settings.get.invalidate({ key: section.key });
      utils.settings.getAll.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const uploadImage = trpc.upload.adminUploadImage.useMutation({
    onError: (e) => toast.error(`업로드 실패: ${e.message}`),
  });

  const displayUrl = currentUrl || section.defaultUrl;

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("이미지 파일만 업로드할 수 있습니다");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("파일 크기는 10MB 이하여야 합니다");
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { url } = await uploadImage.mutateAsync({
        base64,
        contentType: file.type,
        filename: file.name,
      });

      await setSetting.mutateAsync({ key: section.key, value: url });
    } catch {
      // error already handled by mutation
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [section.key, uploadImage, setSetting]);

  const handleUrlSubmit = useCallback(async () => {
    if (!urlInput.trim()) {
      toast.error("URL을 입력해주세요");
      return;
    }
    try {
      new URL(urlInput);
    } catch {
      toast.error("올바른 URL 형식이 아닙니다");
      return;
    }
    await setSetting.mutateAsync({ key: section.key, value: urlInput.trim() });
    setUrlInput("");
  }, [urlInput, section.key, setSetting]);

  const handleReset = useCallback(async () => {
    await setSetting.mutateAsync({ key: section.key, value: section.defaultUrl });
  }, [section.key, section.defaultUrl, setSetting]);

  return (
    <Card className="border-border/50 shadow-sm overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-primary" />
          {section.label}
        </CardTitle>
        <CardDescription className="text-xs">{section.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview */}
        <div className="relative rounded-lg overflow-hidden border border-border/50 aspect-[16/7] bg-muted">
          <img
            src={displayUrl}
            alt={section.label}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = section.defaultUrl;
            }}
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <span className="text-white text-sm font-medium">현재 배경 이미지</span>
          </div>
        </div>

        {/* Upload file */}
        <div>
          <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">파일 업로드</Label>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              className="gap-2 flex-1"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />업로드 중...</>
              ) : (
                <><Upload className="w-4 h-4" />이미지 파일 선택</>
              )}
            </Button>
          </div>
        </div>

        {/* URL input */}
        <div>
          <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">또는 이미지 URL 직접 입력</Label>
          <div className="flex gap-2">
            <Input
              placeholder="https://example.com/image.jpg"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="text-sm h-9"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleUrlSubmit}
              disabled={setSetting.isPending || !urlInput.trim()}
              className="gap-1 shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              적용
            </Button>
          </div>
        </div>

        {/* Reset */}
        <div className="flex justify-end pt-1">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={handleReset}
            disabled={setSetting.isPending}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            기본 이미지로 복원
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BackgroundManager() {
  return (
    <div className="space-y-4">
      <div className="mb-2">
        <p className="text-sm text-muted-foreground">
          메인 페이지의 배경 이미지를 변경할 수 있습니다. 이미지 파일을 직접 업로드하거나 외부 URL을 입력하세요.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {SECTIONS.map((section) => (
          <BackgroundCard key={section.key} section={section} />
        ))}
      </div>
    </div>
  );
}
