package com.itiswayneee.streamflix;

import android.view.View;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeWebChromeClient;

public class StreamFlixWebChromeClient extends BridgeWebChromeClient {

    private final MainActivity activity;

    public StreamFlixWebChromeClient(Bridge bridge, MainActivity activity) {
        super(bridge);
        this.activity = activity;
    }

    @Override
    public void onShowCustomView(View view, CustomViewCallback callback) {
        activity.showFullscreen(view, callback);
    }

    @Override
    public void onHideCustomView() {
        activity.hideFullscreen();
    }

    @Override
    public boolean onCreateWindow(WebView view, boolean isDialog,
                                  boolean isUserGesture, android.os.Message resultMsg) {
        return false;
    }

    @Override
    public void onProgressChanged(WebView webView, int newProgress) {
        super.onProgressChanged(webView, newProgress);
    }
}
