"use client";

import { BackStackProvider } from "@/components/lib/BackStackContext";
import AndroidBackHandler from "@/components/AndroidBackHandler";
import PreventPullToRefresh from "@/components/PreventPullToRefresh";

/**
 * 루트 레이아웃의 클라이언트 사이드 래퍼
 * - BackStackProvider: 전역 모달 뒤로가기 스택
 * - AndroidBackHandler: 시스템 뒤로가기 버튼 처리
 * - PreventPullToRefresh: 당겨서 새로고침 방지
 */
export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BackStackProvider>
      <AndroidBackHandler />
      <PreventPullToRefresh />
      {children}
    </BackStackProvider>
  );
}
