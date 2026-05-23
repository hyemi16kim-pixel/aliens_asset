"use client";

import { useAndroidBack } from "@/components/lib/useAndroidBack";

/**
 * 루트 레이아웃에 삽입하는 Android 뒤로가기 핸들러
 * 렌더링 결과물은 없고 side-effect(backButton 리스너)만 담당
 */
export default function AndroidBackHandler() {
  useAndroidBack();
  return null;
}
