import { Capacitor, registerPlugin } from "@capacitor/core";

export type KakaoMessage = {
  id: string;
  sender: string;
  body: string;
  date: number;
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
    // Web environment: cannot open native settings screen
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
    alert("KakaoTalk notification reading is only available in the Android app.");
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
