package com.nightsentinel.alarm;

import android.app.KeyguardManager;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    public static final String EXTRA_FROM_ALARM = "from_alarm";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SentinelAlarmPlugin.class);
        super.onCreate(savedInstanceState);
        showOverLockScreenIfRinging(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        showOverLockScreenIfRinging(intent);
    }

    @Override
    public void onResume() {
        super.onResume();
        showOverLockScreenIfRinging(getIntent());
    }

    /** Leaving the app while ringing → the native alarm sound takes over again. */
    @Override
    public void onPause() {
        if (AlarmService.ringing) AlarmService.setMuted(false);
        super.onPause();
    }

    @Override
    public void onStop() {
        if (AlarmService.ringing) AlarmService.setMuted(false);
        super.onStop();
    }

    /** While the alarm rings, open on top of the lock screen and turn the screen on. */
    private void showOverLockScreenIfRinging(Intent intent) {
        boolean fromAlarm = intent != null && intent.getBooleanExtra(EXTRA_FROM_ALARM, false);
        if (!fromAlarm && !AlarmService.ringing) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
            KeyguardManager km = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
            if (km != null) km.requestDismissKeyguard(this, null);
        } else {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                    | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                    | WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD);
        }
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }
}
