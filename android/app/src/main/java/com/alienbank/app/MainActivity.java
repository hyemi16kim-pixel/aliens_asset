package com.alienbank.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    registerPlugin(SmsReaderPlugin.class);
    registerPlugin(KakaoReaderPlugin.class);
    super.onCreate(savedInstanceState);
  }
}