package com.gosha.notes;

import android.annotation.SuppressLint;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;

import java.util.concurrent.Executor;

public class MainActivity extends AppCompatActivity {
    private static final String APP_URL = "https://gosha420.github.io/Notes/";
    private static final String APP_HOST = "gosha420.github.io";

    private WebView webView;
    private BiometricPrompt biometricPrompt;
    private BiometricPrompt.PromptInfo promptInfo;
    private boolean authRunning = false;

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        webView.setBackgroundColor(0xFF000000);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String host = request.getUrl().getHost();
                return host == null || !APP_HOST.equalsIgnoreCase(host);
            }
        });

        webView.addJavascriptInterface(new BiometricBridge(), "AndroidBiometric");
        prepareBiometricPrompt();
        webView.loadUrl(APP_URL);
    }

    private void prepareBiometricPrompt() {
        Executor executor = ContextCompat.getMainExecutor(this);
        biometricPrompt = new BiometricPrompt(this, executor,
                new BiometricPrompt.AuthenticationCallback() {
                    @Override
                    public void onAuthenticationSucceeded(@NonNull BiometricPrompt.AuthenticationResult result) {
                        super.onAuthenticationSucceeded(result);
                        authRunning = false;
                        webView.evaluateJavascript("window.goshaBiometricResult && window.goshaBiometricResult(true)", null);
                    }

                    @Override
                    public void onAuthenticationError(int errorCode, @NonNull CharSequence errString) {
                        super.onAuthenticationError(errorCode, errString);
                        authRunning = false;
                        webView.evaluateJavascript("window.goshaBiometricResult && window.goshaBiometricResult(false)", null);
                    }

                    @Override
                    public void onAuthenticationFailed() {
                        super.onAuthenticationFailed();
                        webView.evaluateJavascript("window.goshaBiometricAttemptFailed && window.goshaBiometricAttemptFailed()", null);
                    }
                });

        promptInfo = new BiometricPrompt.PromptInfo.Builder()
                .setTitle("Unlock GO$HA")
                .setSubtitle("Verify with your fingerprint or enrolled strong biometric")
                .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG)
                .setNegativeButtonText("Cancel")
                .setConfirmationRequired(false)
                .build();
    }

    private void requestBiometric() {
        if (authRunning) return;

        BiometricManager manager = BiometricManager.from(this);
        int status = manager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG);
        if (status != BiometricManager.BIOMETRIC_SUCCESS) {
            webView.evaluateJavascript("window.goshaBiometricUnavailable && window.goshaBiometricUnavailable(" + status + ")", null);
            return;
        }

        authRunning = true;
        biometricPrompt.authenticate(promptInfo);
    }

    private final class BiometricBridge {
        @JavascriptInterface
        public void authenticate() {
            runOnUiThread(MainActivity.this::requestBiometric);
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }
}
