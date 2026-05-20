"use client";

import { useRef } from "react";

interface SwipeNavOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  /** 최소 이동 거리 (px). 기본 90 */
  threshold?: number;
}

/**
 * 수평 스와이프 감지 훅.
 * - 수직 이동이 수평 이동보다 크면 무시 (스크롤 보호)
 * - 반환된 onTouchStart / onTouchEnd 를 컨테이너 요소에 붙이면 됨
 *
 * 방향 규칙:
 *   오른쪽→왼쪽 (dx < 0): onSwipeLeft  → 다음 페이지
 *   왼쪽→오른쪽 (dx > 0): onSwipeRight → 이전 페이지
 */
export function useSwipeNav({
  onSwipeLeft,
  onSwipeRight,
  threshold = 90,
}: SwipeNavOptions) {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (startX.current === null || startY.current === null) return;

    const dx = e.changedTouches[0].clientX - startX.current;
    const dy = e.changedTouches[0].clientY - startY.current;

    // 수직 스크롤이 지배적이면 무시
    if (Math.abs(dy) > Math.abs(dx)) {
      startX.current = null;
      startY.current = null;
      return;
    }

    if (Math.abs(dx) >= threshold) {
      if (dx < 0) onSwipeLeft?.();   // 오른쪽→왼쪽 = 다음
      else onSwipeRight?.();          // 왼쪽→오른쪽 = 이전
    }

    startX.current = null;
    startY.current = null;
  };

  return { onTouchStart, onTouchEnd };
}
