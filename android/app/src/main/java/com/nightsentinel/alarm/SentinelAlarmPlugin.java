package com.nightsentinel.alarm;

import android.Manifest;
import android.app.Activity;
import android.app.ActivityManager;
import android.app.AlarmManager;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;

import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import org.json.JSONArray;

/**
 * Bridge between the web app and Android's alarm machinery:
 * exact alarms, the ringing foreground service, screen pinning (lock task) and permission setup.
 */
@CapacitorPlugin(
        name = "SentinelAlarm",
        permissions = {@Permission(strings = {Manifest.permission.POST_NOTIFICATIONS}, alias = "notifications")}
)
public class SentinelAlarmPlugin extends Plugin {

    /** Schedule exactly the given alarms: [{ id, at (epoch ms), label }]. */
    @PluginMethod
    public void sync(PluginCall call) {
        JSArray alarms = call.getArray("alarms", new JSArray());
        try {
            AlarmScheduler.sync(getContext(), new JSONArray(alarms.toString()));
            call.resolve();
        } catch (Exception e) {
            call.reject("Could not schedule alarms", e);
        }
    }

    @PluginMethod
    public void startRinging(PluginCall call) {
        Intent service = new Intent(getContext(), AlarmService.class);
        service.setAction(AlarmService.ACTION_START);
        service.putExtra(AlarmService.EXTRA_LABEL, call.getString("label", "Alarm"));
        ContextCompat.startForegroundService(getContext(), service);
        call.resolve();
    }

    @PluginMethod
    public void stopRinging(PluginCall call) {
        if (AlarmService.ringing) {
            Intent service = new Intent(getContext(), AlarmService.class);
            service.setAction(AlarmService.ACTION_STOP);
            getContext().startService(service);
        }
        call.resolve();
    }

    @PluginMethod
    public void setMuted(PluginCall call) {
        AlarmService.setMuted(Boolean.TRUE.equals(call.getBoolean("muted", false)));
        call.resolve();
    }

    /** Pin the app (blocks Home / Recents / "Clear all") until unlock() is called. */
    @PluginMethod
    public void lock(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("No activity");
            return;
        }
        activity.runOnUiThread(() -> {
            try {
                if (lockTaskState() == ActivityManager.LOCK_TASK_MODE_NONE) activity.startLockTask();
                call.resolve();
            } catch (Exception e) {
                call.reject("Screen pinning is not available", e);
            }
        });
    }

    @PluginMethod
    public void unlock(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.resolve();
            return;
        }
        activity.runOnUiThread(() -> {
            try {
                if (lockTaskState() != ActivityManager.LOCK_TASK_MODE_NONE) activity.stopLockTask();
            } catch (Exception ignored) {
            }
            call.resolve();
        });
    }

    private int lockTaskState() {
        ActivityManager am = (ActivityManager) getContext().getSystemService(Context.ACTIVITY_SERVICE);
        if (am == null) return ActivityManager.LOCK_TASK_MODE_NONE;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) return am.getLockTaskModeState();
        return am.isInLockTaskMode() ? ActivityManager.LOCK_TASK_MODE_PINNED : ActivityManager.LOCK_TASK_MODE_NONE;
    }

    /** What's set up and what's still missing for a strict, reliable alarm. */
    @PluginMethod
    public void status(PluginCall call) {
        call.resolve(buildStatus());
    }

    private JSObject buildStatus() {
        Context ctx = getContext();
        JSObject r = new JSObject();
        r.put("notifications", NotificationManagerCompat.from(ctx).areNotificationsEnabled());
        boolean exact = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
            exact = am != null && am.canScheduleExactAlarms();
        }
        r.put("exactAlarms", exact);
        boolean fullScreen = true;
        if (Build.VERSION.SDK_INT >= 34) {
            NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
            fullScreen = nm != null && nm.canUseFullScreenIntent();
        }
        r.put("fullScreen", fullScreen);
        boolean battery = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PowerManager pm = (PowerManager) ctx.getSystemService(Context.POWER_SERVICE);
            battery = pm != null && pm.isIgnoringBatteryOptimizations(ctx.getPackageName());
        }
        r.put("battery", battery);
        r.put("pinned", lockTaskState() != ActivityManager.LOCK_TASK_MODE_NONE);
        r.put("ringing", AlarmService.ringing);
        return r;
    }

    @PluginMethod
    public void requestNotifications(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 33 && getPermissionState("notifications") != PermissionState.GRANTED) {
            requestPermissionForAlias("notifications", call, "notificationsCallback");
        } else {
            call.resolve(buildStatus());
        }
    }

    @PermissionCallback
    private void notificationsCallback(PluginCall call) {
        call.resolve(buildStatus());
    }

    private void openSettings(String action, boolean withPackage) {
        Intent intent = new Intent(action);
        if (withPackage) intent.setData(Uri.parse("package:" + getContext().getPackageName()));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            getContext().startActivity(intent);
        } catch (Exception e) {
            Intent fallback = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getContext().getPackageName()));
            fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(fallback);
        }
    }

    @PluginMethod
    public void openExactAlarmSettings(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) openSettings(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, true);
        call.resolve();
    }

    @PluginMethod
    public void openFullScreenSettings(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 34) openSettings(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT, true);
        else openSettings(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, true);
        call.resolve();
    }

    @PluginMethod
    public void openBatterySettings(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) openSettings(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, true);
        call.resolve();
    }

    /** App/screen pinning lives under Security settings on most phones. */
    @PluginMethod
    public void openPinningSettings(PluginCall call) {
        openSettings(Settings.ACTION_SECURITY_SETTINGS, false);
        call.resolve();
    }
}
