"use client";

import { Capacitor, registerPlugin } from "@capacitor/core";

export type KakaoMessage = {
  id: string;
  sender: string;   // notification title (sender name or group name)
  body: string;     // notification text (message content)
  date: number;     // timestamp ms
  source: "KAKAO";
};

type KakaoReaderPlugin = {
  isPermissionGranted(): Promise<{ granted: boolean }>;
  requestPermission(): Promise<void>;
  readRecentKakao(options: { limit: number }): Promise<{ messages: KakaoMessage[] }>;
  clearNotifications(): Promise<void>;
};

const KakaoReader = registerPlugin<KakaoReaderPlugin>("KakaoReader");

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

export async function isKakaoPermissionGranted(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const { granted } = await KakaoReader.isPermissionGranted();
    return granted;
  } catch {
    return false;
  }
}

export async function requestKakaoPermission(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    // 웹 환경: 네이티브 설정 화면을 열 수 없음
    return;
  }
  try {
    await KakaoReader.requestPermission();
  } catch (e) {
    console.error("KakaoReader.requestPermission error:", e);
  }
}

export async function readRecentKakao(limit = 50): Promise<KakaoMessage[]> {
  if (!Capacitor.isNativePlatform()) {
    alert("카카오톡 알림 읽기는 Android 앱에서만 사용 가능합니다.");
    return [];
  }
  try {
    const result = await KakaoReader.readRecentKakao({ limit });
    return result.messages ?? [];
  } catch (e) {
    console.error("KakaoReader error:", e);
    return [];
  }
}

export async function clearKakaoNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await KakaoReader.clearNotifications();
  } catch {}
}
