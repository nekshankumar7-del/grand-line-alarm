package com.nightsentinel.alarm;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;

import androidx.core.app.NotificationCompat;

/**
 * Foreground alarm service: keeps ringing even if the app is swiped away or "Clear all" is used.
 * Only the app itself (after the missions are completed, or via the emergency code) stops it.
 */
public class AlarmService extends Service {
    public static final String ACTION_START = "com.nightsentinel.alarm.START";
    public static final String ACTION_STOP = "com.nightsentinel.alarm.STOP";
    public static final String EXTRA_LABEL = "label";
    static final String CHANNEL_ID = "sentinel_alarm";
    static final int NOTIFICATION_ID = 4242;

    /** True while the alarm is ringing (read by the plugin / activity). */
    public static volatile boolean ringing = false;
    /** Muted while the app is open and playing the user's chosen sound itself. */
    public static volatile boolean muted = false;
    private static AlarmService instance;
    private float rampVolume = 0.15f;

    /** Mute/unmute the system alarm sound (the app plays its own sound while visible). */
    public static void setMuted(boolean value) {
        muted = value;
        AlarmService s = instance;
        if (s != null) s.applyVolume();
    }

    private void applyVolume() {
        if (player == null) return;
        float v = muted ? 0f : rampVolume;
        try {
            player.setVolume(v, v);
        } catch (Exception ignored) {
        }
    }

    private MediaPlayer player;
    private Vibrator vibrator;
    private PowerManager.WakeLock wakeLock;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private long startedAt = 0;
    private String label = "Alarm";

    private final Runnable ramp = new Runnable() {
        @Override
        public void run() {
            if (player == null) return;
            float elapsed = (System.currentTimeMillis() - startedAt) / 1000f;
            rampVolume = Math.min(1f, 0.15f + (elapsed / 30f) * 0.85f);
            applyVolume();
            if (rampVolume < 1f) handler.postDelayed(this, 1000);
        }
    };

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : ACTION_START;
        if (ACTION_STOP.equals(action)) {
            stopRinging();
            stopSelf();
            return START_NOT_STICKY;
        }
        if (intent != null && intent.getStringExtra(EXTRA_LABEL) != null) label = intent.getStringExtra(EXTRA_LABEL);
        startInForeground();
        if (!ringing) {
            ringing = true;
            startedAt = System.currentTimeMillis();
            acquireWakeLock();
            startSound();
            startVibration();
        }
        // If Android kills the service, restart it (the alarm must keep ringing).
        return START_STICKY;
    }

    private PendingIntent openAppIntent() {
        Intent open = new Intent(this, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        open.putExtra(MainActivity.EXTRA_FROM_ALARM, true);
        return PendingIntent.getActivity(this, 1, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private void startInForeground() {
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && nm.getNotificationChannel(CHANNEL_ID) == null) {
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, "Alarm", NotificationManager.IMPORTANCE_HIGH);
            channel.setDescription("Ringing alarm — complete your missions to stop it");
            channel.setSound(null, null); // the service plays the sound itself
            channel.enableVibration(false);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            nm.createNotificationChannel(channel);
        }
        PendingIntent open = openAppIntent();
        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle("⏰ " + label + " — ringing")
                .setContentText("Complete your missions to stop the alarm")
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setOngoing(true)
                .setAutoCancel(false)
                .setContentIntent(open)
                .setFullScreenIntent(open, true)
                .build();
        notification.flags |= Notification.FLAG_INSISTENT | Notification.FLAG_NO_CLEAR;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
    }

    private void startSound() {
        if (player != null) return;
        try {
            AudioManager am = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
            // Alarm stream at full volume (it's an alarm the user chose to set).
            am.setStreamVolume(AudioManager.STREAM_ALARM, am.getStreamMaxVolume(AudioManager.STREAM_ALARM), 0);
        } catch (Exception ignored) {
        }
        Uri uri = RingtoneManager.getActualDefaultRingtoneUri(this, RingtoneManager.TYPE_ALARM);
        if (uri == null) uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
        if (uri == null) uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
        try {
            player = new MediaPlayer();
            player.setAudioAttributes(new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build());
            player.setDataSource(this, uri);
            player.setLooping(true);
            player.prepare();
            rampVolume = 0.15f;
            applyVolume();
            player.start();
            handler.post(ramp);
        } catch (Exception e) {
            player = null;
        }
    }

    private void startVibration() {
        vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
        if (vibrator == null) return;
        long[] pattern = {0, 700, 400, 700, 400};
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0));
        } else {
            vibrator.vibrate(pattern, 0);
        }
    }

    private void acquireWakeLock() {
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (pm == null) return;
        wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "NightSentinel:alarm");
        wakeLock.acquire(60 * 60 * 1000L); // safety cap: 1 hour
    }

    private void stopRinging() {
        ringing = false;
        muted = false;
        handler.removeCallbacks(ramp);
        if (player != null) {
            try {
                player.stop();
                player.release();
            } catch (Exception ignored) {
            }
            player = null;
        }
        if (vibrator != null) vibrator.cancel();
        if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
        stopForeground(true);
    }

    /** "Clear all" / swipe-away: keep ringing and re-post the full-screen alert to bring the app back. */
    @Override
    public void onTaskRemoved(Intent rootIntent) {
        // App cleared → nobody else is playing sound: unmute and keep ringing.
        setMuted(false);
        if (ringing) startInForeground();
        super.onTaskRemoved(rootIntent);
    }

    @Override
    public void onDestroy() {
        if (ringing) {
            // Killed while still ringing → ask Android to bring us back.
            Intent again = new Intent(getApplicationContext(), AlarmService.class).setAction(ACTION_START).putExtra(EXTRA_LABEL, label);
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) getApplicationContext().startForegroundService(again);
                else getApplicationContext().startService(again);
            } catch (Exception ignored) {
            }
        }
        handler.removeCallbacks(ramp);
        if (instance == this) instance = null;
        super.onDestroy();
    }
}
