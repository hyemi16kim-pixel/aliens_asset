import { Capacitor, registerPlugin } from "@capacitor/core";

type SmsMessage = {
  id: string;
  address: string;
  body: string;
  date: number;
};

type SmsReaderPlugin = {
  readRecentSms(options: { limit: number }): Promise<{
    messages: SmsMessage[];
  }>;
};

const SmsReader = registerPlugin<SmsReaderPlugin>("SmsReader");

export async function readRecentSms(limit = 30): Promise<SmsMessage[]> {
  if (!Capacitor.isNativePlatform()) {
    alert("SMS 읽기는 Android 앱에서만 사용할 수 있습니다.");
    return [];
  }

  const result = await SmsReader.readRecentSms({ limit });
  return result.messages ?? [];
}