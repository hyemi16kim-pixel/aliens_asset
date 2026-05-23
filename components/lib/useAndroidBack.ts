"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";

/**
 * Android 시스템 뒤로가기 버튼 처리
 * - 앱 내 history가 있으면 → router.back()
 * - history가 없으면 (홈이거나 stack 바닥) → App.exitApp()
 *
 * 사용법: 루트 레이아웃 또는 각 페이지에서 useAndroidBack() 호출
 */
export function useAndroidBack() {
  const router = useRouter();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let cleanup: (() => void) | undefined;

    (async () => {
      try {
        const { App } = await import("@capacitor/app");

        const handle = await App.addListener("backButton", ({ canGoBack }) => {
          if (canGoBack) {
            router.back();
          } else {
            App.exitApp();
          }
        });

        cleanup = () => handle.remove();
      } catch (e) {
        console.warn("useAndroidBack: failed to attach backButton listener", e);
      }
    })();

    return () => {
      if (cleanup) cleanup();
    };
  }, [router]);
}
