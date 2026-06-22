// 비밀번호 정책 검증 공용 유틸 (클라이언트·서버 공용)
// 기준(KISA/일반 강력 정책): 8~20자, 영문+숫자+특수문자 3종 조합,
//   같은 문자/숫자 3회 연속 금지(aaa, 111), 연속 문자/숫자 3자 금지(abc, 123, 321)

const SPECIAL_RE = /[!@#$%^&*()\-_+=.,?~<>;:]/;

export interface PasswordCheck {
  length: boolean;     // 8~20자
  hasLetter: boolean;  // 영문 포함
  hasNumber: boolean;  // 숫자 포함
  hasSpecial: boolean; // 특수문자 포함
  noRepeat: boolean;   // 같은 문자 3회 연속 없음
  noSequence: boolean; // 연속된 문자/숫자 3자 없음
}

// 연속된 문자/숫자 3자 이상 여부 (오름차순 abc·123, 내림차순 cba·321)
function hasSequential(pw: string): boolean {
  for (let i = 0; i + 2 < pw.length; i++) {
    const a = pw.charCodeAt(i), b = pw.charCodeAt(i + 1), c = pw.charCodeAt(i + 2);
    if (b - a === 1 && c - b === 1) return true; // 오름차순
    if (a - b === 1 && b - c === 1) return true; // 내림차순
  }
  return false;
}

export function checkPassword(pw: string): PasswordCheck {
  return {
    length: pw.length >= 8 && pw.length <= 20,
    hasLetter: /[a-zA-Z]/.test(pw),
    hasNumber: /[0-9]/.test(pw),
    hasSpecial: SPECIAL_RE.test(pw),
    noRepeat: !/(.)\1\1/.test(pw),
    noSequence: !hasSequential(pw),
  };
}

export function isPasswordValid(pw: string): boolean {
  const c = checkPassword(pw);
  return c.length && c.hasLetter && c.hasNumber && c.hasSpecial && c.noRepeat && c.noSequence;
}

// 표시용 규칙 라벨
export const PASSWORD_RULES: { key: keyof PasswordCheck; label: string }[] = [
  { key: "length", label: "8~20자" },
  { key: "hasLetter", label: "영문 포함" },
  { key: "hasNumber", label: "숫자 포함" },
  { key: "hasSpecial", label: "특수문자 포함" },
  { key: "noRepeat", label: "같은 문자 3회 연속 금지" },
  { key: "noSequence", label: "연속된 문자·숫자(abc, 123) 금지" },
];
