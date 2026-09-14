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

The receiving MTP2026 origin must validate `event.origin === 'https://www.vexastore.2bd.net'` and then register the HTTPS URL in the authenticated user's application library.

## Native packages

VexaStore may publish Android APK/AAB, Windows, macOS or Linux releases. A browser cannot silently install those packages. Installation is delegated to the platform's native installer after the download completes and after the platform/user grants any required permission.

Android:

1. VexaStore downloads the APK.
2. SHA-256 is verified when supplied.
3. A native Android bridge hands the verified APK to the Android package installer.
4. Android shows the system installation/permission UI.
5. The native bridge reports `installer_opened`, `installed`, `permission_required`, or `error` back to VexaStore/MTP2026.

Windows/macOS/Linux use their platform-native package mechanisms. iOS WebApps use browser/PWA installation rules; arbitrary IPA installation is not performed by a web page.

## MTP2026 guest OS

When VexaStore is opened inside MTP2026, the MTP2026 bridge can register WebApps into the current MTP2026 guest profile. Native packages should only be installed when that guest has a real native package manager/installer backend. A browser shell must never claim that an APK or EXE has been installed merely because a download completed.
