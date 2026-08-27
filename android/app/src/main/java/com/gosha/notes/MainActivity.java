package com.gosha.notes;

import android.annotation.SuppressLint;
import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.Settings;
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
    private static final String VAULT_PREFS = "gosha_native_vault";
    private static final String VAULT_PAYLOAD = "notebook_payload";
    private static final String ARCHIVE_PAYLOAD = "batch_archive_payload";
    private static final String UPDATE_URL_PREFIX = "https://github.com/Gosha420/Notes/releases/download/android-latest/";

    private WebView webView;
    private BiometricPrompt biometricPrompt;
    private BiometricPrompt.PromptInfo promptInfo;
    private SharedPreferences vaultPreferences;
    private boolean authRunning = false;
    private long updateDownloadId = -1L;
    private boolean updateReceiverRegistered = false;

    private final BroadcastReceiver updateReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (!DownloadManager.ACTION_DOWNLOAD_COMPLETE.equals(intent.getAction())) return;
            long id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1L);
            if (id != updateDownloadId) return;
            openDownloadedUpdate(id);
        }
    };

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        vaultPreferences = getSharedPreferences(VAULT_PREFS, MODE_PRIVATE);
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
        webView.addJavascriptInterface(new VaultBridge(), "AndroidVault");
        webView.addJavascriptInterface(new UpdateBridge(), "AndroidUpdater");
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

    private void beginUpdate(String url) {
        if (url == null || !url.startsWith(UPDATE_URL_PREFIX)) {
            notifyUpdateState("error", "Blocked invalid update URL");
            return;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !getPackageManager().canRequestPackageInstalls()) {
            Intent settingsIntent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                    Uri.parse("package:" + getPackageName()));
            startActivity(settingsIntent);
            notifyUpdateState("permission", "Allow GO$HA to install updates, then tap Update again");
            return;
        }
        try {
            registerUpdateReceiverIfNeeded();
            DownloadManager manager = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url))
                    .setTitle("GO$HA update")
                    .setDescription("Downloading native update")
                    .setMimeType("application/vnd.android.package-archive")
                    .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                    .setDestinationInExternalFilesDir(this, Environment.DIRECTORY_DOWNLOADS, "gosha-notes-update.apk");
            updateDownloadId = manager.enqueue(request);
            notifyUpdateState("downloading", "Downloading update…");
        } catch (Exception e) {
            notifyUpdateState("error", "Update download failed");
        }
    }

    private void registerUpdateReceiverIfNeeded() {
        if (updateReceiverRegistered) return;
        IntentFilter filter = new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(updateReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(updateReceiver, filter);
        }
        updateReceiverRegistered = true;
    }

    private void openDownloadedUpdate(long id) {
        try {
            DownloadManager manager = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
            Uri apkUri = manager.getUriForDownloadedFile(id);
            if (apkUri == null) {
                notifyUpdateState("error", "Downloaded APK could not be opened");
                return;
            }
            Intent install = new Intent(Intent.ACTION_VIEW)
                    .setDataAndType(apkUri, "application/vnd.android.package-archive")
                    .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(install);
            notifyUpdateState("installing", "Android installer opened");
        } catch (Exception e) {
            notifyUpdateState("error", "Could not open Android installer");
        }
    }

    private void notifyUpdateState(String state, String message) {
        if (webView == null) return;
        String safeState = state.replace("'", "");
        String safeMessage = message.replace("\\", "\\\\").replace("'", "\\'").replace("\n", " ");
        webView.evaluateJavascript("window.goshaUpdateState && window.goshaUpdateState('" + safeState + "','" + safeMessage + "')", null);
    }

    private final class BiometricBridge {
        @JavascriptInterface
        public void authenticate() { runOnUiThread(MainActivity.this::requestBiometric); }
    }

    private final class VaultBridge {
        @JavascriptInterface
        public void save(String payload) {
            if (payload != null) vaultPreferences.edit().putString(VAULT_PAYLOAD, payload).apply();
        }
        @JavascriptInterface
        public String load() { return vaultPreferences.getString(VAULT_PAYLOAD, ""); }
        @JavascriptInterface
        public void saveArchive(String payload) {
            if (payload != null) vaultPreferences.edit().putString(ARCHIVE_PAYLOAD, payload).apply();
        }
        @JavascriptInterface
        public String loadArchive() { return vaultPreferences.getString(ARCHIVE_PAYLOAD, ""); }
    }

    private final class UpdateBridge {
        @JavascriptInterface
        public int getVersionCode() { return BuildConfig.VERSION_CODE; }

        @JavascriptInterface
        public String getVersionName() { return BuildConfig.VERSION_NAME; }

        @JavascriptInterface
        public boolean canInstallUpdates() {
            return Build.VERSION.SDK_INT < Build.VERSION_CODES.O || getPackageManager().canRequestPackageInstalls();
        }

        @JavascriptInterface
        public void install(String url) { runOnUiThread(() -> beginUpdate(url)); }
    }

    @Override
    protected void onDestroy() {
        if (updateReceiverRegistered) {
            try { unregisterReceiver(updateReceiver); } catch (Exception ignored) { }
            updateReceiverRegistered = false;
        }
        super.onDestroy();
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }
}
