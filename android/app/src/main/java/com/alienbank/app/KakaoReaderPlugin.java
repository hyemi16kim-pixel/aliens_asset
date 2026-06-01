package com.alienbank.app;

import android.content.ComponentName;
import android.content.Intent;
import android.provider.Settings;
import android.text.TextUtils;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONObject;

@CapacitorPlugin(name = "KakaoReader")
public class KakaoReaderPlugin extends Plugin {

    /** Check whether Notification Access is granted for this app. */
    @PluginMethod
    public void isPermissionGranted(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("granted", isNotificationListenerEnabled());
        call.resolve(ret);
    }

    /** Open Android Notification Access settings so user can enable the app. */
    @PluginMethod
    public void requestPermission(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }

    /** Return stored KakaoTalk notifications (newest first). */
    @PluginMethod
    public void readRecentKakao(PluginCall call) {
        int limit = call.getInt("limit", 50);

        android.content.SharedPreferences prefs =
            getContext().getSharedPreferences(
                KakaoNotificationListenerService.PREFS_NAME,
                android.content.Context.MODE_PRIVATE
            );

        String json = prefs.getString(KakaoNotificationListenerService.PREFS_KEY, "[]");

        try {
            JSONArray arr  = new JSONArray(json);
            JSArray   out  = new JSArray();
            int       take = Math.min(limit, arr.length());

            for (int i = 0; i < take; i++) {
                JSONObject src = arr.getJSONObject(i);
                JSObject   item = new JSObject();
                item.put("id",     src.optString("id"));
                item.put("sender", src.optString("sender"));
                item.put("body",   src.optString("body"));
                item.put("date",   src.optLong("date"));
                item.put("source", "KAKAO");
                out.put(item);
            }

            JSObject ret = new JSObject();
            ret.put("messages", out);
            call.resolve(ret);

        } catch (Exception e) {
            call.reject("Failed to read kakao notifications: " + e.getMessage());
        }
    }

    /** Save known sender aliases so the listener can use them for filtering. */
    @PluginMethod
    public void setKnownSenders(PluginCall call) {
        try {
            com.getcapacitor.JSArray arr = call.getArray("senders");
            String json = arr != null ? arr.toString() : "[]";
            getContext()
                .getSharedPreferences("kakao_known_senders", android.content.Context.MODE_PRIVATE)
                .edit()
                .putString("senders_json", json)
                .apply();
            call.resolve();
        } catch (Exception e) {
            call.reject("setKnownSenders failed: " + e.getMessage());
        }
    }

    /** Clear all stored notifications (called after user imports them). */
    @PluginMethod
    public void clearNotifications(PluginCall call) {
        getContext()
            .getSharedPreferences(
                KakaoNotificationListenerService.PREFS_NAME,
                android.content.Context.MODE_PRIVATE
            )
            .edit()
            .remove(KakaoNotificationListenerService.PREFS_KEY)
            .apply();
        call.resolve();
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private boolean isNotificationListenerEnabled() {
        String flat = Settings.Secure.getString(
            getContext().getContentResolver(),
            "enabled_notification_listeners"
        );
        if (TextUtils.isEmpty(flat)) return false;

        String myPkg  = getContext().getPackageName();
        String myComp = new ComponentName(myPkg,
            KakaoNotificationListenerService.class.getName()).flattenToString();

        for (String comp : flat.split(":")) {
            if (comp.trim().equals(myComp)) return true;
        }
        return false;
    }
}
