package com.itiswayneee.streamflix;

import android.content.Intent;
import android.net.Uri;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;

class StreamFlixWebViewClient extends WebViewClient {

    private final MainActivity activity;

    StreamFlixWebViewClient(MainActivity activity) {
        this.activity = activity;
    }

    @Override
    public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        Uri uri = request.getUrl();
        String scheme = uri.getScheme();
        String host = uri.getHost();

        if ("streamflix.dpdns.org".equals(host)) {
            return false;
        }

        if ("https".equals(scheme) || "http".equals(scheme)) {
            if (host != null && !host.isEmpty()) {
                view.post(() -> {
                    view.evaluateJavascript(
                        "window.dispatchEvent(new CustomEvent('blocked-redirect', { detail: '" +
                        uri.toString().replace("'", "\\'") + "' }))",
                        null
                    );
                });
                return true;
            }
        }

        return false;
    }
}
