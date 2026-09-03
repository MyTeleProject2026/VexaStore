# VexaStore Android packaging

Canonical native Android packaging for the VexaStore User and Admin web applications.

Variants:
- `user` — `com.mytele.vexastore.user`
- `admin` — `com.mytele.vexastore.admin`

## Build

Override deployment URLs with `-PuserWebAppUrl=...` and `-PadminWebAppUrl=...` when a deployment hostname changes.

Build both APK and AAB artifacts with:

`./gradlew assembleUserRelease bundleUserRelease assembleAdminRelease bundleAdminRelease`

GitHub Actions builds both variants on `master` pushes and manual runs. CI uses JDK 17 and Android API 36.

## VexaStore Android APK installation flow

The User WebApp's Android `Install` button is connected to the native wrapper. On Android it:

1. Records the download through the VexaStore download API.
2. Downloads the APK over HTTPS into the application's private cache.
3. Reports download progress back to the WebApp.
4. Calculates the APK SHA-256 digest and compares it with the published release metadata.
5. Reads the APK package name and version directly from the downloaded APK and rejects a package/version mismatch.
6. Opens Android's official package installer using a protected `FileProvider` content URI.
7. If Android has not trusted VexaStore as an install source, opens the system "install unknown apps" settings for VexaStore. The user must enable that permission; VexaStore cannot bypass it.
8. Returns to the WebApp after the system installer is opened so the UI can refresh its installed/update state.
9. Uses the stored Android package name to show `Install`, `Update`, or `Installed` state when the installed version can be queried.

Android intentionally keeps the final **Install/Allow** decision in the Android system UI. A normal third-party app cannot silently install another APK without privileged/device-owner capabilities.

## Release metadata

Android releases require:
- package name
- SHA-256 checksum
- version name
- optional version code, minimum SDK, and signing-certificate SHA-256
- release status

The Admin **Versions** page calculates SHA-256 in the browser before publishing and sends the metadata with the APK. The backend exposes `/api/admin/release-versions` and provisions the additive `app_versions` metadata columns at startup. The standalone SQL migration is also available at `backend/database/release_distribution_migration.sql`.

APK updates must be signed with a signing identity compatible with the already-installed application; otherwise Android will reject the update rather than silently replacing the installed app.

## Distribution model

This project is designed for direct/manual APK distribution from VexaStore rather than requiring Google Play publication. The AAB artifacts remain available for future store publication.

No signing keys or secrets are committed to this repository. Production release APKs must be signed by the release pipeline or another controlled signing environment.
