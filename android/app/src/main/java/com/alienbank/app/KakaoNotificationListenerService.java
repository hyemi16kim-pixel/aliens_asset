package com.alienbank.app;

import android.app.Notification;
import android.content.pm.ApplicationInfo;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.HashSet;
import java.util.Set;

/**
 * Listens to KakaoTalk notifications and stores them in SharedPreferences.
 * The Capacitor plugin (KakaoReaderPlugin) reads from the same SharedPreferences.
 */
public class KakaoNotificationListenerService extends NotificationListenerService {

    static final String PREFS_NAME   = "kakao_notifications";
    static final String PREFS_KEY    = "notifications_json";
    static final String PREFS_SEEN   = "seen_ids";
    static final int    MAX_STORE    = 200;

    private static final String KAKAO_PKG = "com.kakao.talk";
    private static final String TAG       = "KakaoListener";

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (!KAKAO_PKG.equals(sbn.getPackageName())) return;

        Notification notification = sbn.getNotification();
        Bundle extras = notification.extras;

        // title: EXTRA_TITLE 우선, 없으면 EXTRA_SUB_TEXT (일부 공식채널)
        String title = extras.getString(Notification.EXTRA_TITLE, "");
        if (title.isEmpty()) {
            CharSequence sub = extras.getCharSequence(Notification.EXTRA_SUB_TEXT);
            if (sub != null) title = sub.toString();
        }

        // text: EXTRA_TEXT → EXTRA_BIG_TEXT → EXTRA_TEXT_LINES 순으로 시도
        String text = "";
        CharSequence cs = extras.getCharSequence(Notification.EXTRA_TEXT);
        if (cs != null) text = cs.toString();
        if (text.isEmpty()) {
            CharSequence bigText = extras.getCharSequence(Notification.EXTRA_BIG_TEXT);
            if (bigText != null) text = bigText.toString();
        }
        if (text.isEmpty()) {
            CharSequence[] lines = extras.getCharSequenceArray(Notification.EXTRA_TEXT_LINES);
            if (lines != null && lines.length > 0) {
                StringBuilder sb = new StringBuilder();
                for (CharSequence line : lines) {
                    if (line != null) {
                        if (sb.length() > 0) sb.append(" ");
                        sb.append(line);
                    }
                }
                text = sb.toString();
            }
        }

        // title/text 모두 비어있으면 skip
        if (title.isEmpty() && text.isEmpty()) return;

        // 금융 키워드 OR 등록된 별칭 sender 에 해당하는 것만 저장
        String combined = (title + " " + text).toLowerCase();
        boolean isFinancial = combined.contains("원") || combined.contains("승인") ||
            combined.contains("결제") || combined.contains("입금") ||
            combined.contains("출금") || combined.contains("이체") ||
            combined.contains("잔액") || combined.contains("누적") ||
            combined.contains("납부") || combined.contains("청구");

        if (!isFinancial) {
            // 등록된 별칭 sender인지 확인
            try {
                android.content.SharedPreferences sp =
                    getSharedPreferences("kakao_known_senders", MODE_PRIVATE);
                String sendersJson = sp.getString("senders_json", "[]");
                org.json.JSONArray senders = new org.json.JSONArray(sendersJson);
                String titleLower = title.toLowerCase();
                boolean matchesSender = false;
                for (int i = 0; i < senders.length(); i++) {
                    String s = senders.getString(i).toLowerCase();
                    if (!s.isEmpty() && (titleLower.contains(s) || s.contains(titleLower))) {
                        matchesSender = true;
                        break;
                    }
                }
                if (!matchesSender) return;
            } catch (Exception e) {
                return; // 파싱 실패 시 skip
            }
        }

        String id = sbn.getKey();
        long   ts = sbn.getPostTime();

        try {
            android.content.SharedPreferences prefs =
                getSharedPreferences(PREFS_NAME, MODE_PRIVATE);

            // Load existing
            String existing = prefs.getString(PREFS_KEY, "[]");
            JSONArray arr = new JSONArray(existing);

            // Dedup 1: key + timestamp (같은 대화방이라도 시간이 다르면 새 메시지)
            String dedupKey = id + "_" + ts;
            // Dedup 2: sender + body 동일한 내용 중복 방지
            //   (친구DM은 개별알림+그룹요약 두 개가 오는데 내용이 같으면 하나만 저장)
            //   (공식채널은 그룹요약만 오므로 이 로직으로 정상 저장됨)
            Set<String> seenDedup = new HashSet<>();
            Set<String> seenContent = new HashSet<>();
            for (int i = 0; i < arr.length(); i++) {
                JSONObject stored = arr.getJSONObject(i);
                seenDedup.add(stored.optString("id") + "_" + stored.optLong("date"));
                seenContent.add(stored.optString("sender") + "||" + stored.optString("body"));
            }
            if (seenDedup.contains(dedupKey)) return;
            if (seenContent.contains(title + "||" + text)) return;

            // Build new entry
            JSONObject obj = new JSONObject();
            obj.put("id",      id);
            obj.put("sender",  title);
            obj.put("body",    text);
            obj.put("date",    ts);
            obj.put("source",  "KAKAO");

            // Prepend (newest first) and cap at MAX_STORE
            JSONArray updated = new JSONArray();
            updated.put(obj);
            for (int i = 0; i < arr.length() && i < MAX_STORE - 1; i++) {
                updated.put(arr.getJSONObject(i));
            }

            prefs.edit().putString(PREFS_KEY, updated.toString()).apply();
            Log.d(TAG, "Stored KakaoTalk notification: " + title + " / " + text);

        } catch (Exception e) {
            Log.e(TAG, "Failed to store notification", e);
        }
    }

    @Override
    public void onNotificationRemoved(StatusBarNotification sbn) {
        // Nothing to do
    }
}
