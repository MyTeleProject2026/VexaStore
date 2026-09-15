# VexaStore ↔ MTP2026 installation contract

VexaStore publishes HTTPS WebApps and optional native packages. MTP2026 consumes the public install manifest at:

`/api/platform/apps/:slug/install-manifest`

## WebApp installation

1. A publisher creates a WebApp entry from **Platform App Publishing**.
2. VexaStore validates the published URL as HTTPS and creates a `web` app version.
3. The public install manifest exposes the WebApp URL and four MTP2026 guest targets:
   - MTP2026 Device OS
   - MTP2026 Android OS
   - MTP2026 Desktop OS
   - MTP2026 Gaming OS
4. The VexaStore user page can open the WebApp, request the browser's PWA install prompt when the target site supports it, or open an MTP2026 installation intent.
5. MTP2026 registers the WebApp in the authenticated VexaAccount application library. The registry is shared by all four MTP2026-owned guest profiles.

## Native packages

Native package entries may be published separately in `app_versions` with integrity metadata such as SHA-256, package name and version code. MTP2026 never claims a native package is installed merely because it was downloaded.

- Android packages are handed to the real Android PackageInstaller when a native Android host bridge is available.
- Windows packages are handed to a native Windows installer when a compatible MTP2026 host exists and Windows security/UAC remains authoritative.
- iOS packages require Apple-authorized distribution/signing; VexaStore does not silently sideload arbitrary IPA files.
- Gaming native packages require a compatible native runtime. The portable MTP2026 WebApp layer remains the cross-platform fallback.

## Security boundary

The browser cannot silently install arbitrary APK, IPA or EXE files on a physical device. The VexaStore web application therefore separates **download**, **integrity verification**, **native installer handoff**, and **user approval**. MTP2026 WebApps are the portable application format that can run inside every MTP2026 guest profile.
