"use client";

import { useEffect } from "react";

/**
 * Android WebView 에서 페이지 최상단에서 아래로 당길 때
 * 발생하는 Pull-to-Refresh(새로고침)를 방지합니다.
 * 일반 스크롤(위/아래)은 정상 동작합니다.
 */
export default function PreventPullToRefresh() {
  useEffect(() => {
    let startY = 0;

    const onTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      const currentY = e.touches[0].clientY;
      const scrollTop =
        window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;

      // 최상단(scrollTop=0)에서 아래로 당기는 동작만 차단
      if (scrollTop <= 0 && currentY > startY) {
        e.preventDefault();
      }
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  return null;
}
