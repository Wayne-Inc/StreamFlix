package com.itiswayneee.streamflix;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Binder;
import android.os.Build;
import android.os.IBinder;
import android.support.v4.media.MediaMetadataCompat;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;

import androidx.core.app.NotificationCompat;
import androidx.media.session.MediaButtonReceiver;

import java.net.URL;

public class MediaPlaybackService extends Service {

    private static final String CHANNEL_ID = "streamflix_playback";
    private static final int NOTIFICATION_ID = 1;

    private MediaSessionCompat mediaSession;
    private final IBinder binder = new LocalBinder();

    public class LocalBinder extends Binder {
        MediaPlaybackService getService() {
            return MediaPlaybackService.this;
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return binder;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle("StreamFlix")
                .setContentText("Ready to play")
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setSilent(true)
                .build();

        try {
            startForeground(NOTIFICATION_ID, notification);
        } catch (Exception e) {
            stopSelf();
            return;
        }

        mediaSession = new MediaSessionCompat(this, "StreamFlixPlayback");
        mediaSession.setActive(true);

        mediaSession.setCallback(new MediaSessionCompat.Callback() {
            @Override
            public void onPlay() {
                sendMediaCommand("play");
            }

            @Override
            public void onPause() {
                sendMediaCommand("pause");
            }

            @Override
            public void onSkipToNext() {
                sendMediaCommand("next");
            }

            @Override
            public void onSkipToPrevious() {
                sendMediaCommand("previous");
            }

            @Override
            public void onStop() {
                sendMediaCommand("stop");
                stopForeground(STOP_FOREGROUND_REMOVE);
                stopSelf();
            }
        });
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        try {
            MediaButtonReceiver.handleIntent(mediaSession, intent);
        } catch (Exception ignored) {}
        return START_NOT_STICKY;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (mediaSession != null) {
            mediaSession.setActive(false);
            mediaSession.release();
        }
    }

    public void updateMetadata(String title, String subtitle, String artworkUrl) {
        if (mediaSession == null) return;
        MediaMetadataCompat.Builder metadataBuilder = new MediaMetadataCompat.Builder()
                .putString(MediaMetadataCompat.METADATA_KEY_TITLE, title)
                .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, subtitle)
                .putString(MediaMetadataCompat.METADATA_KEY_ALBUM, "StreamFlix");

        if (artworkUrl != null && !artworkUrl.isEmpty()) {
            try {
                URL url = new URL(artworkUrl);
                Bitmap bitmap = BitmapFactory.decodeStream(url.openStream());
                if (bitmap != null) {
                    metadataBuilder.putBitmap(MediaMetadataCompat.METADATA_KEY_ART, bitmap);
                }
            } catch (Exception e) {
                // ignore
            }
        }

        mediaSession.setMetadata(metadataBuilder.build());
    }

    public void updatePlaybackState(boolean isPlaying, long position) {
        if (mediaSession == null) return;
        int state = isPlaying ? PlaybackStateCompat.STATE_PLAYING : PlaybackStateCompat.STATE_PAUSED;
        PlaybackStateCompat.Builder stateBuilder = new PlaybackStateCompat.Builder()
                .setActions(
                        PlaybackStateCompat.ACTION_PLAY |
                        PlaybackStateCompat.ACTION_PAUSE |
                        PlaybackStateCompat.ACTION_PLAY_PAUSE |
                        PlaybackStateCompat.ACTION_SKIP_TO_NEXT |
                        PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS |
                        PlaybackStateCompat.ACTION_STOP
                )
                .setState(state, position, isPlaying ? 1.0f : 0.0f);

        mediaSession.setPlaybackState(stateBuilder.build());
    }

    public void showNotification(String title, String subtitle, boolean isPlaying) {
        Intent launchIntent = new Intent(this, MainActivity.class);
        launchIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, launchIntent, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(title)
                .setContentText(subtitle)
                .setContentIntent(pendingIntent)
                .setOngoing(isPlaying)
                .setSilent(true)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC);

        builder.setStyle(
                new androidx.media.app.NotificationCompat.MediaStyle()
                .setMediaSession(mediaSession.getSessionToken())
                .setShowActionsInCompactView(0, 1, 2)
        );

        NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (manager != null) {
            manager.notify(NOTIFICATION_ID, builder.build());
        }
    }

    private void sendMediaCommand(String command) {
        Intent intent = new Intent("com.itiswayneee.streamflix.MEDIA_COMMAND");
        intent.putExtra("command", command);
        sendBroadcast(intent);
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Playback Controls",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Media playback controls for StreamFlix");
            channel.setShowBadge(false);
            NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }
}
