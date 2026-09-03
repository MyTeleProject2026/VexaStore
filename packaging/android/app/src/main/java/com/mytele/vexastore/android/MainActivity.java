package com.mytele.vexastore.android;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.core.content.FileProvider;

import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

public final class MainActivity extends Activity {
    private static final int INSTALL_PERMISSION_REQUEST = 4201;
    private WebView webView;
    private final Set<String> trustedHosts = new HashSet<>();
    private String pendingApkPath;
    private String pendingCallback = "";

    @Override
    public void onCreate(Bundle state) {
        super.onCreate(state);
        Uri webUri = Uri.parse(BuildConfig.WEB_APP_URL);
        if (webUri.getHost() != null) trustedHosts.add(webUri.getHost());
        trustedHosts.add("api-vexastore.onrender.com");

        webView = new WebView(this);
        setContentView(webView);
        webView.setWebChromeClient(new WebChromeClient());
        webView.addJavascriptInterface(new AndroidBridge(), "VexaStoreAndroid");
        webView.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, android.webkit.WebResourceRequest request) {
                Uri uri = request.getUrl();
                String host = uri.getHost();
                if ("https".equalsIgnoreCase(uri.getScheme()) && host != null && trustedHosts.contains(host)) return false;
                startActivity(new Intent(Intent.ACTION_VIEW, uri));
                return true;
            }
        });
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setSupportMultipleWindows(false);
        android.webkit.CookieManager.getInstance().setAcceptCookie(true);
        webView.loadUrl(BuildConfig.WEB_APP_URL);
    }

    @Override protected void onResume() {
        super.onResume();
        if (pendingApkPath != null && canInstallPackages()) {
            String path = pendingApkPath;
            pendingApkPath = null;
            launchInstaller(path, pendingCallback);
        }
    }

    private boolean canInstallPackages() {
        return Build.VERSION.SDK_INT < 26 || getPackageManager().canRequestPackageInstalls();
    }

    private void openInstallPermissionSettings() {
        if (Build.VERSION.SDK_INT >= 26) {
            Intent intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                    Uri.parse("package:" + getPackageName()));
            startActivityForResult(intent, INSTALL_PERMISSION_REQUEST);
        }
    }

    private void launchInstaller(String apkPath, String callback) {
        File apk = new File(apkPath);
        if (!apk.isFile()) {
            sendCallback(callback, "error", "APK file is missing");
            return;
        }
        Uri uri = FileProvider.getUriForFile(this, getPackageName() + ".fileprovider", apk);
        Intent intent = new Intent(Intent.ACTION_INSTALL_PACKAGE);
        intent.setData(uri);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
        intent.putExtra(Intent.EXTRA_RETURN_RESULT, true);
        try {
            startActivityForResult(intent, INSTALL_PERMISSION_REQUEST);
            sendCallback(callback, "installer_opened", "Android system installer opened");
        } catch (Exception e) {
            sendCallback(callback, "error", "Unable to open Android package installer");
        }
    }

    private void sendCallback(final String callback, final String status, final String message) {
        if (webView == null || callback == null || callback.length() == 0) return;
        final String safeStatus = JSONObject.quote(status);
        final String safeMessage = JSONObject.quote(message == null ? "" : message);
        runOnUiThread(() -> webView.evaluateJavascript(
                "window.dispatchEvent(new CustomEvent('vexastore:android-install', {detail:{status:" + safeStatus + ",message:" + safeMessage + "}}));", null));
    }

    private String sha256(File file) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        try (InputStream input = new FileInputStream(file)) {
            byte[] buffer = new byte[1024 * 1024];
            int read;
            while ((read = input.read(buffer)) != -1) digest.update(buffer, 0, read);
        }
        StringBuilder out = new StringBuilder();
        for (byte b : digest.digest()) out.append(String.format(Locale.US, "%02x", b));
        return out.toString();
    }

    private final class AndroidBridge {
        @JavascriptInterface
        public boolean isNativeAndroid() { return true; }

        @JavascriptInterface
        public void downloadAndInstall(String url, String expectedSha256, String expectedPackageName, String expectedVersion, String callbackName) {
            if (url == null || !url.startsWith("https://")) {
                sendCallback(callbackName, "error", "Only HTTPS APK downloads are allowed");
                return;
            }
            new Thread(() -> {
                File target = null;
                try {
                    String fileName = "vexastore-install-" + System.currentTimeMillis() + ".apk";
                    target = new File(getCacheDir(), fileName);
                    HttpURLConnection connection = (HttpURLConnection) new URL(url).openConnection();
                    connection.setConnectTimeout(20000);
                    connection.setReadTimeout(60000);
                    connection.setInstanceFollowRedirects(true);
                    connection.setRequestProperty("Accept", "application/vnd.android.package-archive,application/octet-stream");
                    int code = connection.getResponseCode();
                    if (code < 200 || code >= 300) throw new Exception("APK download failed (HTTP " + code + ")");
                    int total = connection.getContentLength();
                    try (InputStream input = connection.getInputStream(); FileOutputStream output = new FileOutputStream(target)) {
                        byte[] buffer = new byte[1024 * 1024];
                        long done = 0;
                        int read;
                        while ((read = input.read(buffer)) != -1) {
                            output.write(buffer, 0, read);
                            done += read;
                            int percent = total > 0 ? (int) Math.min(100, (done * 100L) / total) : -1;
                            sendCallback(callbackName, "progress", percent < 0 ? "Downloading APK" : "Downloading APK " + percent + "%");
                        }
                    } finally { connection.disconnect(); }

                    if (target.length() < 1024) throw new Exception("Downloaded APK is invalid or empty");
                    String actualSha = sha256(target);
                    if (expectedSha256 != null && expectedSha256.trim().length() > 0 && !actualSha.equalsIgnoreCase(expectedSha256.trim())) {
                        target.delete();
                        throw new Exception("APK integrity verification failed (SHA-256 mismatch)");
                    }

                    PackageManager pm = getPackageManager();
                    PackageInfo info = pm.getPackageArchiveInfo(target.getAbsolutePath(), PackageManager.GET_META_DATA);
                    if (info == null || info.packageName == null) throw new Exception("Downloaded file is not a valid Android APK");
                    if (expectedPackageName != null && expectedPackageName.trim().length() > 0 && !info.packageName.equals(expectedPackageName.trim())) {
                        target.delete();
                        throw new Exception("APK package name does not match the VexaStore release");
                    }
                    if (expectedVersion != null && expectedVersion.trim().length() > 0 && info.versionName != null && !info.versionName.equals(expectedVersion.trim())) {
                        target.delete();
                        throw new Exception("APK version does not match the VexaStore release");
                    }

                    sendCallback(callbackName, "verified", "APK verified: " + info.packageName + " " + (info.versionName == null ? "" : info.versionName));
                    final String finalPath = target.getAbsolutePath();
                    runOnUiThread(() -> {
                        if (!canInstallPackages()) {
                            pendingApkPath = finalPath;
                            pendingCallback = callbackName;
                            sendCallback(callbackName, "permission_required", "Allow VexaStore to install apps from this source");
                            openInstallPermissionSettings();
                        } else {
                            launchInstaller(finalPath, callbackName);
                        }
                    });
                } catch (Exception e) {
                    if (target != null && target.exists()) target.delete();
                    sendCallback(callbackName, "error", e.getMessage() == null ? "APK installation preparation failed" : e.getMessage());
                }
            }).start();
        }

        @JavascriptInterface
        public String getInstalledVersion(String packageName) {
            if (packageName == null || packageName.trim().length() == 0) return "";
            try {
                PackageInfo info = getPackageManager().getPackageInfo(packageName.trim(), 0);
                return info.versionName == null ? "" : info.versionName;
            } catch (PackageManager.NameNotFoundException e) {
                return "";
            }
        }

        @JavascriptInterface
        public boolean isPackageInstalled(String packageName) {
            return getInstalledVersion(packageName).length() > 0;
        }
    }

    @Override public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack(); else super.onBackPressed();
    }

    @Override protected void onDestroy() {
        if (webView != null) {
            webView.loadUrl("about:blank");
            webView.stopLoading();
            webView.removeJavascriptInterface("VexaStoreAndroid");
            webView.destroy();
        }
        super.onDestroy();
    }
}
