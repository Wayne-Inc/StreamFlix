package com.itiswayneee.streamflix;

import android.app.PictureInPictureParams;
import android.content.Context;
import android.content.Intent;
import android.content.res.Configuration;
import android.graphics.Color;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Rational;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.widget.Button;
import android.widget.FrameLayout;

import android.webkit.JavascriptInterface;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final long PROGRESS_POLL_MS = 150L;
    private static final long LOADING_TIMEOUT_MS = 15_000L;

    private View loadingOverlay;
    private View offlineOverlay;
    private ConnectivityManager connectivityManager;
    private ConnectivityManager.NetworkCallback networkCallback;
    private boolean firstLoadFinished;
    private final Handler handler = new Handler(Looper.getMainLooper());

    private ViewGroup fullscreenContainer;
    private View fullscreenView;
    private WebChromeClient.CustomViewCallback fullscreenCallback;

    private boolean isInPipMode = false;
    private boolean mediaServiceStarted = false;

    private final Runnable progressRunnable = new Runnable() {
        @Override
        public void run() {
            try {
                WebView webView = bridge != null ? bridge.getWebView() : null;
                if (webView != null && webView.getProgress() >= 100) {
                    firstLoadFinished = true;
                    hideLoading();
                    return;
                }
            } catch (Exception ignored) {}
            if (loadingOverlay != null && loadingOverlay.getVisibility() == View.VISIBLE) {
                handler.postDelayed(this, PROGRESS_POLL_MS);
            }
        }
    };

    private final Runnable loadingTimeoutRunnable = new Runnable() {
        @Override
        public void run() {
            hideLoading();
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        try {
            getWindow().getDecorView().setBackgroundColor(Color.BLACK);
            WebView webView = bridge != null ? bridge.getWebView() : null;
            if (webView != null) {
                webView.setBackgroundColor(Color.BLACK);
                webView.setWebChromeClient(new StreamFlixWebChromeClient(bridge, this));
                webView.setWebViewClient(new StreamFlixWebViewClient(this));
                webView.addJavascriptInterface(this, "NativeBridge");
            }

            addOverlays();
            connectivityManager = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
            registerNetworkCallback();
            if (isOnline()) {
                showLoading();
                startLoadingWatch();
            } else {
                showOffline();
            }
        } catch (Exception ignored) {}

        handleIncomingIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleIncomingIntent(intent);
    }

    @JavascriptInterface
    public boolean isPipSupported() {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.O;
    }

    @JavascriptInterface
    public void startMediaServiceNative() {
        startMediaService();
    }

    @JavascriptInterface
    public void stopMediaServiceNative() {
        stopMediaService();
    }

    private void handleIncomingIntent(Intent intent) {
        if (intent == null) return;
        Uri data = intent.getData();
        if (data != null) {
            String url = data.toString();
            WebView webView = bridge != null ? bridge.getWebView() : null;
            if (webView != null && url.startsWith("http")) {
                webView.post(() -> webView.loadUrl(url));
            }
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        if (fullscreenView != null || isInPipMode) {
            hideLoading();
            return;
        }
        if (!isOnline()) {
            showOffline();
        } else if (!firstLoadFinished) {
            showLoading();
            startLoadingWatch();
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        try {
            if (connectivityManager != null && networkCallback != null) {
                connectivityManager.unregisterNetworkCallback(networkCallback);
            }
        } catch (Exception ignored) {}
        handler.removeCallbacksAndMessages(null);
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        if (isInPipMode) {
            return;
        }
        if (fullscreenView != null) {
            hideFullscreen();
            return;
        }
        super.onBackPressed();
    }

    @Override
    public void onPictureInPictureModeChanged(boolean isInPictureInPictureMode, Configuration newConfig) {
        super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig);
        isInPipMode = isInPictureInPictureMode;
        try {
            WebView webView = bridge != null ? bridge.getWebView() : null;
            if (webView != null) {
                webView.evaluateJavascript(
                    "window.dispatchEvent(new CustomEvent('pip-mode-changed', { detail: " + isInPictureInPictureMode + " }))",
                    null
                );
            }
        } catch (Exception ignored) {}
    }

    @android.annotation.SuppressLint("NewApi")
    @JavascriptInterface
    public void enterPipMode() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                PictureInPictureParams.Builder builder = new PictureInPictureParams.Builder();
                builder.setAspectRatio(new Rational(16, 9));
                builder.setAutoEnterEnabled(false);
                enterPictureInPictureMode(builder.build());
            } catch (Exception ignored) {}
        }
    }

    public void startMediaService() {
        if (mediaServiceStarted) return;
        try {
            Intent serviceIntent = new Intent(this, MediaPlaybackService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(serviceIntent);
            }
            mediaServiceStarted = true;
        } catch (Exception ignored) {}
    }

    public void stopMediaService() {
        if (!mediaServiceStarted) return;
        try {
            Intent serviceIntent = new Intent(this, MediaPlaybackService.class);
            stopService(serviceIntent);
            mediaServiceStarted = false;
        } catch (Exception ignored) {}
    }

    public void showFullscreen(View view, WebChromeClient.CustomViewCallback callback) {
        if (fullscreenView != null) {
            try { callback.onCustomViewHidden(); } catch (Exception ignored) {}
            return;
        }
        fullscreenView = view;
        fullscreenCallback = callback;

        try {
            hideLoading();
            handler.removeCallbacks(progressRunnable);
            handler.removeCallbacks(loadingTimeoutRunnable);

            ViewGroup decor = (ViewGroup) getWindow().getDecorView();
            if (fullscreenContainer == null) {
                fullscreenContainer = new FrameLayout(this);
                fullscreenContainer.setBackgroundColor(Color.BLACK);
            }
            fullscreenContainer.addView(
                view,
                new ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
            );
            decor.addView(
                fullscreenContainer,
                new ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
            );

            enterImmersiveMode();
        } catch (Exception e) {
            try { callback.onCustomViewHidden(); } catch (Exception ignored) {}
            fullscreenView = null;
            fullscreenCallback = null;
        }
    }

    public void hideFullscreen() {
        if (fullscreenView == null) return;
        try {
            ViewGroup decor = (ViewGroup) getWindow().getDecorView();
            if (fullscreenContainer != null) {
                fullscreenContainer.removeView(fullscreenView);
                decor.removeView(fullscreenContainer);
            }
            if (fullscreenCallback != null) {
                fullscreenCallback.onCustomViewHidden();
                fullscreenCallback = null;
            }
            fullscreenView = null;
            exitImmersiveMode();
        } catch (Exception ignored) {
            fullscreenView = null;
            fullscreenCallback = null;
        }
    }

    private void enterImmersiveMode() {
        try {
            WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
            controller.hide(WindowInsetsCompat.Type.systemBars());
            controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        } catch (Exception ignored) {}
    }

    private void exitImmersiveMode() {
        try {
            WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
            controller.show(WindowInsetsCompat.Type.systemBars());
        } catch (Exception ignored) {}
    }

    private void addOverlays() {
        ViewGroup content = findViewById(android.R.id.content);
        if (content == null) return;
        loadingOverlay = getLayoutInflater().inflate(R.layout.loading_overlay, content, false);
        offlineOverlay = getLayoutInflater().inflate(R.layout.offline_overlay, content, false);
        offlineOverlay.setVisibility(View.GONE);
        content.addView(loadingOverlay);
        content.addView(offlineOverlay);

        Button retry = offlineOverlay.findViewById(R.id.retryButton);
        if (retry != null) {
            retry.setOnClickListener(v -> {
                if (!isOnline()) {
                    showOffline();
                    return;
                }
                hideOffline();
                firstLoadFinished = false;
                showLoading();
                try {
                    WebView webView = bridge != null ? bridge.getWebView() : null;
                    if (webView != null) webView.reload();
                } catch (Exception ignored) {}
                startLoadingWatch();
            });
        }
    }

    private void registerNetworkCallback() {
        if (connectivityManager == null) return;
        try {
            networkCallback = new ConnectivityManager.NetworkCallback() {
                @Override
                public void onAvailable(Network network) {
                    runOnUiThread(() -> {
                        hideOffline();
                        if (!firstLoadFinished) {
                            showLoading();
                            startLoadingWatch();
                        }
                    });
                }

                @Override
                public void onLost(Network network) {
                    runOnUiThread(() -> {
                        if (!isOnline()) showOffline();
                    });
                }
            };
            connectivityManager.registerDefaultNetworkCallback(networkCallback);
        } catch (Exception ignored) {}
    }

    private void showLoading() {
        if (loadingOverlay != null) loadingOverlay.setVisibility(View.VISIBLE);
    }

    private void hideLoading() {
        if (loadingOverlay != null) loadingOverlay.setVisibility(View.GONE);
    }

    private void showOffline() {
        hideLoading();
        if (offlineOverlay != null) offlineOverlay.setVisibility(View.VISIBLE);
    }

    private void hideOffline() {
        if (offlineOverlay != null) offlineOverlay.setVisibility(View.GONE);
    }

    private boolean isOnline() {
        if (connectivityManager == null) return true;
        try {
            Network active = connectivityManager.getActiveNetwork();
            NetworkCapabilities caps = connectivityManager.getNetworkCapabilities(active);
            return caps != null && caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET);
        } catch (Exception e) {
            return true;
        }
    }

    private void startLoadingWatch() {
        handler.removeCallbacks(progressRunnable);
        handler.removeCallbacks(loadingTimeoutRunnable);
        handler.postDelayed(progressRunnable, PROGRESS_POLL_MS);
        handler.postDelayed(loadingTimeoutRunnable, LOADING_TIMEOUT_MS);
    }
}
