# VexaStore ↔ MTP2026 installation contract

VexaStore publishes applications; MTP2026 is the consumer/launcher. The repositories remain separate.

## WebApp installation

For a published HTTPS WebApp, VexaStore can send this message to an already-open MTP2026 launcher window:

```js
{
  type: 'MTP2026_VEXASTORE_INSTALL',
  app: {
    id,
    slug,
    title,
    description,
    url,
    iconUrl,
    source: 'VexaStore',
    sourceUrl
  }
}
```

The receiving MTP2026 origin validates the VexaStore origin. MTP2026 then consumes the public install manifest and registers the HTTPS URL through its authenticated `/api/apps` application registry. The local registry is mirrored into every MTP2026-owned guest profile:

- MTP2026 Device OS
- MTP2026 Android OS
- MTP2026 Desktop OS
- MTP2026 Gaming OS

Direct fallback:

`https://mtp2026-app-launcher.onrender.com/?vexastoreInstall=1&slug=<app-slug>`

MTP2026 consumes this URL, fetches the public VexaStore install manifest, registers the WebApp, and returns the user to the launcher.

## Physical-device WebApp installation

VexaStore exposes the normal browser PWA installation path through `beforeinstallprompt` where the browser supports it. If the browser does not expose that API, the user is directed to open the HTTPS WebApp and use the browser's own **Install app / Add to Home Screen** flow.

A web page must never claim that a physical device installed an application merely because a download completed.

## Native packages

VexaStore may publish Android APK/AAB, Windows, macOS or Linux releases. Native installation is always delegated to the host platform.

### Android

1. MTP2026/VexaStore downloads the HTTPS APK when a native Android host bridge is available.
2. SHA-256 is verified when supplied by the published release metadata.
3. The native Android bridge hands the package to Android `PackageInstaller`.
4. Android performs package/signature validation.
5. Android may show the user the required permission/system installer UI.
6. MTP2026 reports installer success/failure and refreshes the guest application library.

There is no browser-side silent APK installation.

### Windows

The MTP2026 Windows/Tauri shell hands the HTTPS installer to the host shell. Windows SmartScreen/UAC and the selected installer remain authoritative; the WebView does not silently install executables.

### iOS

MTP2026 Device OS can install/launch HTTPS WebApps as browser/PWA applications. Arbitrary IPA sideloading is not performed by the web application. Native iOS distribution must use an Apple-authorized distribution/signing mechanism.

### Gaming

MTP2026 Gaming OS uses the shared WebApp registry. Native gaming packages require a compatible native installer/runtime on the host.

## MTP2026 install-manifest v4

The public manifest exposes:

- `supportedMtp2026Modes`
- `mtp2026GuestProfiles`
- `webApp.automaticInstallInsideMtp2026`
- `webApp.automaticInstallOnPhysicalDevice`
- `webApp.userApprovalRequiredOnPhysicalDevice`
- `nativePackages` with URL, version, SHA-256 and package metadata
- `installTargets` for each MTP2026 profile
- `installIntent` for direct MTP2026 installation

This allows MTP2026 to make a real platform decision instead of pretending every package is installable on every host.

## Security requirements

- HTTPS-only application URLs.
- Trusted VexaStore origin for cross-window install messages.
- Authenticated MTP2026 session for cloud application registration.
- Verify SHA-256 whenever published release metadata contains one.
- Never silently install native packages.
- Never claim iOS/Windows/Android firmware replacement from a browser shell.
