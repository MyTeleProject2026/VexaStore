# VexaStore → MTP2026 Universal Application Distribution

VexaStore is the application publishing/distribution layer for the MTP2026 ecosystem.

## Publishing

Administrators can publish an HTTPS WebApp from **Platform App Publishing**. A published WebApp receives:

- a VexaStore application record;
- a published `web` version;
- a stable slug;
- an install manifest;
- MTP2026 install URLs for every guest profile.

The existing publishing route is:

`POST /api/platform/apps/publish-web`

The public installation contract is:

`GET /api/platform/apps/:slug/install-manifest`

## MTP2026 guest profiles

Every published WebApp is available to these MTP2026-owned profiles:

1. MTP2026 Device OS
2. MTP2026 Android OS
3. MTP2026 Desktop OS
4. MTP2026 Gaming OS

The application library is VexaAccount-scoped so an installed WebApp can be mirrored across the user's MTP2026 guest profiles.

## Installation protocol

VexaStore uses the cross-origin message:

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
    guestMode
  }
}
```

The MTP2026 launcher validates the VexaStore origin and fetches the authoritative install manifest before registering the application.

## WebApp behavior

For MTP2026-owned operating-system profiles, an HTTPS WebApp is a first-class installed application. The launcher records it in the authenticated MTP2026 application registry and exposes it through the guest shell. Launching the application runs it inside the MTP2026 WebApp runtime, with an external-browser fallback if the embedded runtime cannot load it.

## Native package behavior

VexaStore may publish native package metadata such as APK/Windows packages. The manifest carries SHA-256 and signing metadata when available. MTP2026 hands native packages to the real host installer only when that host exposes a compatible installation bridge.

A browser cannot silently install arbitrary native packages on a physical device. Android's PackageInstaller can require user approval, and iOS/Windows have their own platform signing/security controls. VexaStore therefore never reports a native package as installed until the host installer reports success.

## Security requirements

- HTTPS-only application URLs.
- No embedded credentials in published URLs.
- Native package integrity metadata uses SHA-256 when published.
- Native package installation remains controlled by the host operating system.
- MTP2026 does not bundle cracked/proprietary iOS or Windows firmware.
- WebApp installation is authenticated to the user's VexaAccount where the MTP2026 backend is available.

## Physical device distribution

The same VexaStore catalog can expose:

- WebApp/PWA installation on supported browsers;
- Android APK releases through Android's package installation flow;
- Windows installers through Windows' installer/security flow;
- Apple-authorized distribution for iOS applications.

The store UI must not claim that a browser can silently install arbitrary APK, IPA, or EXE packages on physical devices.
