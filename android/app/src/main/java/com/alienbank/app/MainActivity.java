package com.alienbank.app;

import android.os.Bundle;
import android.view.View;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    registerPlugin(SmsReaderPlugin.class);
    registerPlugin(KakaoReaderPlugin.class);
    super.onCreate(savedInstanceState);

    // WebView pull-to-refresh(당겨서 새로고침) 완전 비활성화
    WebView webView = getBridge().getWebView();
    webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
  }
}