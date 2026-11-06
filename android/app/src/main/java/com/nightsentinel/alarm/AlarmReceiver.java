package com.nightsentinel.alarm;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

import androidx.core.content.ContextCompat;

/** Fired by AlarmManager at alarm time → start the ringing foreground service. */
public class AlarmReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        String label = intent.getStringExtra(AlarmService.EXTRA_LABEL);
        Intent service = new Intent(context, AlarmService.class);
        service.setAction(AlarmService.ACTION_START);
        service.putExtra(AlarmService.EXTRA_LABEL, label != null ? label : "Alarm");
        ContextCompat.startForegroundService(context, service);
    }
}
