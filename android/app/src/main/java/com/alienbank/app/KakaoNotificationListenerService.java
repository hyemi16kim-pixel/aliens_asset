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
    static final int    MAX_STORE    = 100;

    private static final String KAKAO_PKG = "com.kakao.talk";
    private static final String TAG       = "KakaoListener";

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (!KAKAO_PKG.equals(sbn.getPackageName())) return;

        Notification notification = sbn.getNotification();
        Bundle extras = notification.extras;

        String title   = extras.getString(Notification.EXTRA_TITLE, "");
        String text    = "";
        CharSequence cs = extras.getCharSequence(Notification.EXTRA_TEXT);
        if (cs != null) text = cs.toString();

        // Skip group-summary notifications (they duplicate individual ones)
        if ((notification.flags & Notification.FLAG_GROUP_SUMMARY) != 0) return;
        if (title.isEmpty() && text.isEmpty()) return;

        String id = sbn.getKey();
        long   ts = sbn.getPostTime();

        try {
            android.content.SharedPreferences prefs =
                getSharedPreferences(PREFS_NAME, MODE_PRIVATE);

            // Load existing
            String existing = prefs.getString(PREFS_KEY, "[]");
            JSONArray arr = new JSONArray(existing);

            // Dedup by key + timestamp (같은 대화방이라도 시간이 다르면 새 메시지)
            String dedupKey = id + "_" + ts;
            Set<String> seenDedup = new HashSet<>();
            for (int i = 0; i < arr.length(); i++) {
                JSONObject stored = arr.getJSONObject(i);
                seenDedup.add(stored.optString("id") + "_" + stored.optLong("date"));
            }
            if (seenDedup.contains(dedupKey)) return;

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
