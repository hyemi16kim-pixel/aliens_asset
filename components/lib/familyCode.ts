// 가족코드 관련 localStorage 키
const FAMILY_CODE_KEY = "alien_family_code";
const FAMILY_ID_KEY = "alien_family_id";
const FAMILY_CODES_KEY = "alien_family_codes"; // [{code, id, name}] 배열
const MY_USER_ID_KEY = "alien_my_user_id";

export type FamilyEntry = { code: string; id: number; name: string };

/** 현재 선택된 가족코드 */
export function getCurrentFamilyCode(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(FAMILY_CODE_KEY) || "";
}

/** 현재 선택된 familyId (숫자) */
export function getCurrentFamilyId(): number {
  if (typeof window === "undefined") return 1;
  return Number(localStorage.getItem(FAMILY_ID_KEY) || 1);
}

/** 저장된 모든 가족코드 목록 */
export function getAllFamilyCodes(): FamilyEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(FAMILY_CODES_KEY) || "[]");
  } catch {
    return [];
  }
}

/** 현재 가족을 설정하고 목록에 추가 */
export function setCurrentFamily(code: string, id: number, name: string) {
  localStorage.setItem(FAMILY_CODE_KEY, code);
  localStorage.setItem(FAMILY_ID_KEY, String(id));

  const codes = getAllFamilyCodes();
  const idx = codes.findIndex((c) => c.code === code);
  if (idx === -1) {
    codes.push({ code, id, name });
  } else {
    codes[idx] = { code, id, name };
  }
  localStorage.setItem(FAMILY_CODES_KEY, JSON.stringify(codes));
}

/** 가족코드가 저장되어 있는지 확인 */
export function hasFamilyCode(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem(FAMILY_CODE_KEY);
}

/** API URL에 familyId 쿼리파라미터를 붙여주는 헬퍼 */
export function withFamilyId(url: string): string {
  const familyId = getCurrentFamilyId();
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}familyId=${familyId}`;
}

/** 현재 기기의 사용자 ID */
export function getCurrentUserId(): number {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(MY_USER_ID_KEY) || 0);
}

/** 현재 기기의 사용자 ID 저장 */
export function setCurrentUserId(id: number) {
  localStorage.setItem(MY_USER_ID_KEY, String(id));
}
