package com.gosha.notes;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.provider.Settings;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import androidx.documentfile.provider.DocumentFile;

import org.json.JSONArray;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.security.SecureRandom;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

final class SecureSavesBridge {
    static final int PICK_FOLDER_REQUEST = 7319;

    private static final String META_PREFS = "gosha_secure_saves_meta";
    private static final String WRAPPED_DATA_KEY = "wrapped_data_key_v1";
    private static final String FOLDER_URI = "backup_folder_uri_v1";
    private static final String KEYSTORE_ALIAS = "gosha_secure_saves_wrap_v1";
    private static final String DIR_NAME = "secure-saves";
    private static final String MAGIC = "GSV1";
    private static final int GCM_TAG_BITS = 128;
    private static final int IV_BYTES = 12;
    private static final long QUICK_RETENTION_MS = 48L * 60L * 60L * 1000L;
    private static final long DAILY_RETENTION_MS = 730L * 24L * 60L * 60L * 1000L;

    private final Activity activity;
    private final WebView webView;
    private final SharedPreferences meta;
    private final File localDir;
    private final SecureRandom random = new SecureRandom();
    private final ExecutorService io = Executors.newSingleThreadExecutor();

    SecureSavesBridge(Activity activity, WebView webView) {
        this.activity = activity;
        this.webView = webView;
        this.meta = activity.getSharedPreferences(META_PREFS, Context.MODE_PRIVATE);
        this.localDir = new File(activity.getFilesDir(), DIR_NAME);
        if (!localDir.exists()) localDir.mkdirs();
        ensureDataKey();
    }

    @JavascriptInterface public boolean isAvailable() { return true; }

    @JavascriptInterface public void chooseBackupFolder() {
        activity.runOnUiThread(() -> {
            Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE)
                    .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION | Intent.FLAG_GRANT_PREFIX_URI_PERMISSION);
            activity.startActivityForResult(intent, PICK_FOLDER_REQUEST);
        });
    }

    void handleFolderResult(Uri uri) {
        if (uri == null) return;
        try {
            int flags = Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION;
            activity.getContentResolver().takePersistableUriPermission(uri, flags);
            meta.edit().putString(FOLDER_URI, uri.toString()).commit();
            notifyFolderChanged(true);
            mirrorExistingAsync();
        } catch (Exception e) {
            notifyFolderChanged(false);
        }
    }

    @JavascriptInterface public boolean hasBackupFolder() {
        String raw = meta.getString(FOLDER_URI, "");
        return raw != null && !raw.isEmpty();
    }

    @JavascriptInterface public String getBackupFolderLabel() {
        String raw = meta.getString(FOLDER_URI, "");
        if (raw == null || raw.isEmpty()) return "Not selected";
        try {
            DocumentFile d = DocumentFile.fromTreeUri(activity, Uri.parse(raw));
            String name = d == null ? null : d.getName();
            return name == null || name.isEmpty() ? "Encrypted backup folder" : name;
        } catch (Exception e) { return "Encrypted backup folder"; }
    }

    @JavascriptInterface public boolean saveSnapshot(String name, String plaintext) {
        if (!validName(name) || plaintext == null) return false;
        try {
            String encrypted = encrypt(name, plaintext);
            File target = new File(localDir, name);
            writeFileAtomic(target, encrypted);
            mirrorOneAsync(name, encrypted);
            return true;
        } catch (Exception e) { return false; }
    }

    @JavascriptInterface public String listSnapshots() {
        try {
            File[] files = localDir.listFiles((dir, name) -> validName(name));
            if (files == null) return "[]";
            Arrays.sort(files, (a,b) -> Long.compare(b.lastModified(), a.lastModified()));
            JSONArray arr = new JSONArray();
            for (File f : files) arr.put(f.getName());
            return arr.toString();
        } catch (Exception e) { return "[]"; }
    }

    @JavascriptInterface public String loadSnapshot(String name) {
        if (!validName(name)) return "";
        try {
            File f = new File(localDir, name);
            if (!f.isFile()) return "";
            return decrypt(name, readAll(new FileInputStream(f)));
        } catch (Exception e) { return ""; }
    }

    @JavascriptInterface public boolean deleteSnapshot(String name) {
        if (!validName(name)) return false;
        boolean local = new File(localDir, name).delete();
        deleteMirrorAsync(name);
        return local;
    }

    @JavascriptInterface public int pruneSnapshots(long nowMs) {
        int deleted = 0;
        File[] files = localDir.listFiles((dir, name) -> validName(name));
        if (files == null) return 0;
        for (File f : files) {
            String n = f.getName();
            long age = Math.max(0L, nowMs - f.lastModified());
            long limit = n.startsWith("daily-") ? DAILY_RETENTION_MS : QUICK_RETENTION_MS;
            if (age > limit && f.delete()) { deleted++; deleteMirrorAsync(n); }
        }
        return deleted;
    }

    @JavascriptInterface public String getRecoveryKey() {
        try { return Base64.encodeToString(dataKey(), Base64.NO_WRAP | Base64.URL_SAFE); }
        catch (Exception e) { return ""; }
    }

    @JavascriptInterface public boolean importRecoveryKey(String encoded) {
        if (encoded == null) return false;
        try {
            byte[] key = Base64.decode(encoded.trim(), Base64.NO_WRAP | Base64.URL_SAFE);
            if (key.length != 32) return false;
            meta.edit().putString(WRAPPED_DATA_KEY, wrapDataKey(key)).commit();
            return true;
        } catch (Exception e) { return false; }
    }

    @JavascriptInterface public String deviceSecurity() {
        return "AES-256-GCM · Android Keystore wrapped key";
    }

    void shutdown() { io.shutdown(); }

    private boolean validName(String name) {
        return name != null && name.matches("(?:daily-[0-9]{4}-[0-9]{2}-[0-9]{2}|quick-[0-9]{10,17})\\.gsv");
    }

    private void ensureDataKey() {
        try {
            getOrCreateWrapKey();
            String wrapped = meta.getString(WRAPPED_DATA_KEY, "");
            if (wrapped == null || wrapped.isEmpty()) {
                byte[] raw = new byte[32]; random.nextBytes(raw);
                meta.edit().putString(WRAPPED_DATA_KEY, wrapDataKey(raw)).commit();
            } else { unwrapDataKey(wrapped); }
        } catch (Exception ignored) { }
    }

    private SecretKey getOrCreateWrapKey() throws Exception {
        KeyStore ks = KeyStore.getInstance("AndroidKeyStore"); ks.load(null);
        if (ks.containsAlias(KEYSTORE_ALIAS)) return (SecretKey) ks.getKey(KEYSTORE_ALIAS, null);
        KeyGenerator gen = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
        gen.init(new KeyGenParameterSpec.Builder(KEYSTORE_ALIAS, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256)
                .setRandomizedEncryptionRequired(true)
                .build());
        return gen.generateKey();
    }

    private String wrapDataKey(byte[] raw) throws Exception {
        Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
        c.init(Cipher.ENCRYPT_MODE, getOrCreateWrapKey());
        byte[] iv = c.getIV();
        byte[] ct = c.doFinal(raw);
        return b64(iv) + "." + b64(ct);
    }

    private byte[] unwrapDataKey(String wrapped) throws Exception {
        String[] p = wrapped.split("\\.", 2);
        if (p.length != 2) throw new IllegalArgumentException("bad wrapped key");
        Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
        c.init(Cipher.DECRYPT_MODE, getOrCreateWrapKey(), new GCMParameterSpec(GCM_TAG_BITS, b64d(p[0])));
        byte[] raw = c.doFinal(b64d(p[1]));
        if (raw.length != 32) throw new IllegalStateException("bad data key");
        return raw;
    }

    private byte[] dataKey() throws Exception {
        String wrapped = meta.getString(WRAPPED_DATA_KEY, "");
        if (wrapped == null || wrapped.isEmpty()) { ensureDataKey(); wrapped = meta.getString(WRAPPED_DATA_KEY, ""); }
        return unwrapDataKey(wrapped);
    }

    private String encrypt(String name, String plaintext) throws Exception {
        byte[] iv = new byte[IV_BYTES]; random.nextBytes(iv);
        Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
        SecretKeySpec key = new SecretKeySpec(dataKey(), "AES");
        c.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_BITS, iv));
        c.updateAAD(name.getBytes(StandardCharsets.UTF_8));
        byte[] ct = c.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
        return MAGIC + ":" + b64(iv) + ":" + b64(ct);
    }

    private String decrypt(String name, String blob) throws Exception {
        String[] p = blob.split(":", 3);
        if (p.length != 3 || !MAGIC.equals(p[0])) throw new IllegalArgumentException("bad snapshot");
        Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
        SecretKeySpec key = new SecretKeySpec(dataKey(), "AES");
        c.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_BITS, b64d(p[1])));
        c.updateAAD(name.getBytes(StandardCharsets.UTF_8));
        return new String(c.doFinal(b64d(p[2])), StandardCharsets.UTF_8);
    }

    private String b64(byte[] data) { return Base64.encodeToString(data, Base64.NO_WRAP); }
    private byte[] b64d(String data) { return Base64.decode(data, Base64.NO_WRAP); }

    private void writeFileAtomic(File target, String text) throws Exception {
        File tmp = new File(target.getParentFile(), target.getName() + ".tmp");
        try (FileOutputStream out = new FileOutputStream(tmp)) {
            out.write(text.getBytes(StandardCharsets.UTF_8)); out.flush(); out.getFD().sync();
        }
        if (target.exists() && !target.delete()) throw new IllegalStateException("replace failed");
        if (!tmp.renameTo(target)) throw new IllegalStateException("rename failed");
    }

    private String readAll(InputStream input) throws Exception {
        try (InputStream in = input; ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            byte[] buf = new byte[8192]; int n;
            while ((n = in.read(buf)) != -1) out.write(buf, 0, n);
            return out.toString(StandardCharsets.UTF_8.name());
        }
    }

    private DocumentFile mirrorRoot() {
        String raw = meta.getString(FOLDER_URI, "");
        if (raw == null || raw.isEmpty()) return null;
        try { return DocumentFile.fromTreeUri(activity, Uri.parse(raw)); }
        catch (Exception e) { return null; }
    }

    private void mirrorOneAsync(String name, String encrypted) {
        io.execute(() -> {
            try {
                DocumentFile root = mirrorRoot(); if (root == null || !root.canWrite()) return;
                DocumentFile old = root.findFile(name); if (old != null) old.delete();
                DocumentFile f = root.createFile("application/octet-stream", name); if (f == null) return;
                try (OutputStream out = activity.getContentResolver().openOutputStream(f.getUri(), "wt")) {
                    if (out != null) out.write(encrypted.getBytes(StandardCharsets.UTF_8));
                }
            } catch (Exception ignored) { }
        });
    }

    private void deleteMirrorAsync(String name) {
        io.execute(() -> {
            try { DocumentFile root = mirrorRoot(); if (root == null) return; DocumentFile f = root.findFile(name); if (f != null) f.delete(); }
            catch (Exception ignored) { }
        });
    }

    private void mirrorExistingAsync() {
        io.execute(() -> {
            File[] files = localDir.listFiles((dir, name) -> validName(name));
            if (files == null) return;
            for (File f : files) {
                try { mirrorOneBlocking(f.getName(), readAll(new FileInputStream(f))); }
                catch (Exception ignored) { }
            }
        });
    }

    private void mirrorOneBlocking(String name, String encrypted) throws Exception {
        DocumentFile root = mirrorRoot(); if (root == null || !root.canWrite()) return;
        DocumentFile old = root.findFile(name); if (old != null) old.delete();
        DocumentFile f = root.createFile("application/octet-stream", name); if (f == null) return;
        try (OutputStream out = activity.getContentResolver().openOutputStream(f.getUri(), "wt")) {
            if (out != null) out.write(encrypted.getBytes(StandardCharsets.UTF_8));
        }
    }

    private void notifyFolderChanged(boolean ok) {
        activity.runOnUiThread(() -> {
            if (webView == null) return;
            webView.evaluateJavascript("window.goshaSecureSavesFolderChanged && window.goshaSecureSavesFolderChanged(" + (ok ? "true" : "false") + ")", null);
        });
    }
}
