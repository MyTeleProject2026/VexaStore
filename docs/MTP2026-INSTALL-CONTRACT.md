# VexaStore ↔ MTP2026 installation contract

VexaStore publishes applications; MTP2026 is a consumer/launcher. The two applications remain separate repositories.

## WebApp installation

For a published HTTPS WebApp, VexaStore can send the following message to an already-open MTP2026 launcher window:

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

The receiving MTP2026 origin validates `event.origin === 'https://www.vexastore.2bd.net'`. MTP2026 then registers the HTTPS URL through its authenticated `/api/apps` application registry and mirrors the result into the local guest cache. This means the same VexaAccount application library can be restored when the user switches between MTP2026 Device OS, MTP2026 Android OS, MTP2026 Desktop OS, and MTP2026 Gaming OS profiles.

VexaStore also exposes a direct install URL:

`https://mtp2026-app-launcher.onrender.com/?vexastoreInstall=1&slug=<app-slug>`

MTP2026 consumes that URL, fetches the public VexaStore install manifest, registers the WebApp, and returns the user to the launcher. The application is not downloaded as a fake native binary; the MTP2026 registry stores the trusted HTTPS launch URL and application metadata.

## Native packages

VexaStore may publish Android APK/AAB, Windows, macOS or Linux releases. A browser cannot silently install those packages. Installation is delegated to the platform's native installer after the download completes and after the platform/user grants any required permission.

Android:

1. VexaStore downloads the APK.
2. SHA-256 is verified when supplied.
3. A native Android bridge hands the verified APK to Android PackageInstaller.
4. Android shows the system installation/permission UI.
5. The native bridge reports `installer_opened`, `installed`, `permission_required`, or `error` back to the application.

Windows/macOS/Linux use their platform-native package mechanisms. iOS WebApps use browser/PWA installation rules; arbitrary IPA installation is not performed by a web page.

## MTP2026 guest OS

The four MTP2026 guest profiles are MTP2026-owned OS shells, not copies of proprietary Apple, Google, Microsoft, or ASUS firmware. Their UI can provide OS-specific behavior while sharing the same VexaAccount/VexaStore application registry.

Native packages should only be installed when that guest has a real native package manager/installer backend. A browser shell must never claim that an APK or EXE has been installed merely because a download completed.
