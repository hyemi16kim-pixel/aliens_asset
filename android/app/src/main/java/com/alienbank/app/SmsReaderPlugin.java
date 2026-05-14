package com.alienbank.app;

import android.Manifest;
import android.database.Cursor;
import android.net.Uri;
import android.provider.Telephony;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

@CapacitorPlugin(
    name = "SmsReader",
    permissions = {
        @Permission(
            strings = { Manifest.permission.READ_SMS },
            alias = "sms"
        )
    }
)
public class SmsReaderPlugin extends Plugin {

    @PluginMethod
    public void readRecentSms(PluginCall call) {
        if (getPermissionState("sms") != com.getcapacitor.PermissionState.GRANTED) {
            requestPermissionForAlias("sms", call, "smsPermsCallback");
            return;
        }

        loadSms(call);
    }

    @com.getcapacitor.annotation.PermissionCallback
    private void smsPermsCallback(PluginCall call) {
        if (getPermissionState("sms") == com.getcapacitor.PermissionState.GRANTED) {
            loadSms(call);
        } else {
            call.reject("SMS 권한이 거부되었습니다.");
        }
    }

    private void loadSms(PluginCall call) {
        int limit = call.getInt("limit", 30);

        JSArray result = new JSArray();

        Uri uri = Telephony.Sms.Inbox.CONTENT_URI;

        String[] projection = new String[] {
            Telephony.Sms._ID,
            Telephony.Sms.ADDRESS,
            Telephony.Sms.BODY,
            Telephony.Sms.DATE
        };

        Cursor cursor = getContext().getContentResolver().query(
            uri,
            projection,
            null,
            null,
            Telephony.Sms.DATE + " DESC LIMIT " + limit
        );

        if (cursor == null) {
            call.reject("문자를 읽을 수 없습니다.");
            return;
        }

        try {
            while (cursor.moveToNext()) {
                JSObject item = new JSObject();

                item.put("id", cursor.getString(cursor.getColumnIndexOrThrow(Telephony.Sms._ID)));
                item.put("address", cursor.getString(cursor.getColumnIndexOrThrow(Telephony.Sms.ADDRESS)));
                item.put("body", cursor.getString(cursor.getColumnIndexOrThrow(Telephony.Sms.BODY)));
                item.put("date", cursor.getLong(cursor.getColumnIndexOrThrow(Telephony.Sms.DATE)));

                result.put(item);
            }
        } finally {
            cursor.close();
        }

        JSObject ret = new JSObject();
        ret.put("messages", result);

        call.resolve(ret);
    }
}