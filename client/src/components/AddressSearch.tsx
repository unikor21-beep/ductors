import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Search } from "lucide-react";
import { useCallback } from "react";

declare global {
  interface Window {
    daum: {
      Postcode: new (options: {
        oncomplete: (data: DaumPostcodeResult) => void;
        onclose?: () => void;
        width?: string | number;
        height?: string | number;
      }) => { open: () => void; embed: (element: HTMLElement) => void };
    };
  }
}

interface DaumPostcodeResult {
  zonecode: string; // 우편번호
  address: string; // 기본 주소
  addressEnglish: string;
  addressType: string;
  roadAddress: string; // 도로명 주소
  jibunAddress: string; // 지번 주소
  buildingName: string;
  apartment: string;
  bname: string; // 법정동/법정리
  bname1: string;
  bname2: string;
  sido: string; // 시도
  sigungu: string; // 시군구
  sigunguCode: string;
  userSelectedType: string;
  query: string;
}

interface AddressSearchProps {
  /** 우편번호 */
  zonecode: string;
  /** 기본 주소 (도로명 또는 지번) */
  address: string;
  /** 상세 주소 (사용자 직접 입력) */
  detailAddress: string;
  /** 주소 변경 콜백 */
  onAddressChange: (data: {
    zonecode: string;
    address: string;
    sido: string;
    sigungu: string;
  }) => void;
  /** 상세 주소 변경 콜백 */
  onDetailAddressChange: (value: string) => void;
  /** 라벨 텍스트 (기본: "주소") */
  label?: string;
  /** 상세 주소 placeholder */
  detailPlaceholder?: string;
  /** 필수 여부 */
  required?: boolean;
  /** 안내 텍스트 */
  helperText?: string;
}

export default function AddressSearch({
  zonecode,
  address,
  detailAddress,
  onAddressChange,
  onDetailAddressChange,
  label = "주소",
  detailPlaceholder = "상세 주소를 입력하세요 (동/호수 등)",
  required = false,
  helperText,
}: AddressSearchProps) {
  const openPostcode = useCallback(() => {
    if (!window.daum?.Postcode) {
      // 스크립트가 아직 로드되지 않은 경우 동적 로드
      const script = document.createElement("script");
      script.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
      script.onload = () => {
        new window.daum.Postcode({
          oncomplete: handleComplete,
        }).open();
      };
      document.head.appendChild(script);
      return;
    }

    new window.daum.Postcode({
      oncomplete: handleComplete,
    }).open();
  }, []);

  const handleComplete = useCallback((data: DaumPostcodeResult) => {
    // 도로명 주소 우선, 없으면 지번 주소
    const fullAddress = data.roadAddress || data.jibunAddress || data.address;

    onAddressChange({
      zonecode: data.zonecode,
      address: fullAddress,
      sido: data.sido,
      sigungu: data.sigungu,
    });
  }, [onAddressChange]);

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium flex items-center gap-1.5">
        <MapPin className="w-4 h-4 text-primary" />
        {label} {required && <span className="text-destructive">*</span>}
      </label>

      {/* 우편번호 + 검색 버튼 */}
      <div className="flex gap-2">
        <Input
          value={zonecode}
          placeholder="우편번호"
          readOnly
          className="w-32 bg-muted/30 cursor-pointer"
          onClick={openPostcode}
        />
        <Button
          type="button"
          variant="outline"
          onClick={openPostcode}
          className="gap-2 shrink-0"
        >
          <Search className="w-4 h-4" />
          우편번호 찾기
        </Button>
      </div>

      {/* 기본 주소 (읽기 전용) */}
      <Input
        value={address}
        placeholder="우편번호 찾기를 클릭하여 주소를 검색하세요"
        readOnly
        className="bg-muted/30 cursor-pointer"
        onClick={openPostcode}
      />

      {/* 상세 주소 (직접 입력) */}
      <Input
        value={detailAddress}
        onChange={(e) => onDetailAddressChange(e.target.value)}
        placeholder={detailPlaceholder}
        disabled={!address}
      />

      {helperText && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
}
