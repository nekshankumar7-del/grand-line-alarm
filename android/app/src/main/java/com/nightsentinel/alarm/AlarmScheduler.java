package com.nightsentinel.alarm;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import org.json.JSONArray;
import org.json.JSONObject;

/** Exact alarm scheduling (AlarmManager.setAlarmClock) + persistence so alarms survive reboots. */
public final class AlarmScheduler {
    private static final String PREFS = "sentinel_alarms";
    private static final String KEY = "scheduled";

    private AlarmScheduler() {
    }

    static PendingIntent fireIntent(Context ctx, String id, String label) {
        Intent intent = new Intent(ctx, AlarmReceiver.class);
        intent.putExtra("id", id);
        intent.putExtra(AlarmService.EXTRA_LABEL, label);
        return PendingIntent.getBroadcast(ctx, id.hashCode(), intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static void schedule(Context ctx, String id, long at, String label) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        PendingIntent fire = fireIntent(ctx, id, label);
        Intent show = new Intent(ctx, MainActivity.class);
        PendingIntent showIntent = PendingIntent.getActivity(ctx, 2, show, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        try {
            // Alarm-clock alarms are exact, wake the device, and show the alarm icon in the status bar.
            am.setAlarmClock(new AlarmManager.AlarmClockInfo(at, showIntent), fire);
        } catch (SecurityException e) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, fire);
            else am.set(AlarmManager.RTC_WAKEUP, at, fire);
        }
    }

    static void cancel(Context ctx, String id, String label) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am != null) am.cancel(fireIntent(ctx, id, label));
    }

    /** Replace all scheduled alarms with the given list ([{id, at, label}]). */
    static void sync(Context ctx, JSONArray alarms) {
        JSONArray previous = load(ctx);
        for (int i = 0; i < previous.length(); i++) {
            JSONObject a = previous.optJSONObject(i);
            if (a != null) cancel(ctx, a.optString("id"), a.optString("label", "Alarm"));
        }
        JSONArray kept = new JSONArray();
        long now = System.currentTimeMillis();
        for (int i = 0; i < alarms.length(); i++) {
            JSONObject a = alarms.optJSONObject(i);
            if (a == null) continue;
            long at = a.optLong("at", 0);
            if (at <= now) continue;
            schedule(ctx, a.optString("id"), at, a.optString("label", "Alarm"));
            kept.put(a);
        }
        save(ctx, kept);
    }

    /** After a reboot, schedule everything again. */
    static void restore(Context ctx) {
        JSONArray saved = load(ctx);
        sync(ctx, saved);
    }

    static JSONArray load(Context ctx) {
        SharedPreferences prefs = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        try {
            return new JSONArray(prefs.getString(KEY, "[]"));
        } catch (Exception e) {
            return new JSONArray();
        }
    }

    private static void save(Context ctx, JSONArray alarms) {
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY, alarms.toString()).apply();
    }
}
