// Cross-platform publishing/install metadata for VexaStore.
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authAdmin } = require('../middleware/auth');

const PUBLIC = `(is_active = 1 AND (release_status = 'PUBLISHED' OR release_status IS NULL))`;
const MTP2026_ORIGIN = 'https://mtp2026-app-launcher.onrender.com';

function normalizeSlug(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function platformManifest(app, versions) {
  const byOs = {};
  for (const version of versions) byOs[String(version.os || '').toLowerCase()] = version;
  const web = byOs.web || versions[0] || null;
  const nativePackages = Object.fromEntries(
    Object.entries(byOs).filter(([os]) => os !== 'web').map(([os, v]) => [os, {
      url: v.file_url,
      versionId: v.id,
      version: v.version,
      fileSize: v.file_size,
      sha256: v.sha256 || null,
      packageName: v.package_name || null,
      versionCode: v.version_code || null,
      minimumSdk: v.minimum_sdk || null,
      signingCertificateSha256: v.signing_certificate_sha256 || null,
      installMode: os === 'android' ? 'android-package-installer' : os === 'windows' ? 'windows-installer' : os === 'ios' ? 'apple-authorized-install' : 'native-package',
      automaticSilentInstall: false,
      userApprovalRequired: true,
    }]))
  );
  const mtp2026InstallUrl = `${MTP2026_ORIGIN}/?vexastoreInstall=1&slug=${encodeURIComponent(app.slug)}`;
  return {
    schema: 'vexastore-install-manifest-v3',
    app: { id: app.id, name: app.name, slug: app.slug, description: app.description, iconUrl: app.icon_url, website: app.website, developer: app.developer },
    webApp: web ? {
      url: web.file_url || app.website,
      versionId: web.id,
      version: web.version,
      installable: true,
      installMode: 'mtp2026-webapp-registry',
      pwaMode: 'browser-controlled',
      automaticInstallInsideMtp2026: true,
      automaticInstallOnPhysicalDevice: false,
      mtp2026InstallUrl,
    } : null,
    nativePackages,
    supportedMtp2026Modes: ['mtp2026', 'ios', 'android', 'windows11', 'gaming'],
    mtp2026GuestProfiles: {
      mtp2026: 'MTP2026 Device OS',
      ios: 'MTP2026 Device OS',
      android: 'MTP2026 Android OS',
      windows11: 'MTP2026 Desktop OS',
      gaming: 'MTP2026 Gaming OS',
    },
    installIntent: {
      type: 'MTP2026_VEXASTORE_INSTALL',
      target: 'MTP2026-App-Launcher',
      url: mtp2026InstallUrl,
      requiresAuthenticatedMTP2026Session: true,
    },
    policy: {
      mtp2026: 'HTTPS WebApps are registered immediately in the authenticated MTP2026 application registry and become launchable from every MTP2026 guest profile.',
      android: 'Native Android packages are handed to Android PackageInstaller after HTTPS download and integrity/package verification. Android may require user approval.',
      ios: 'Native iOS packages require Apple-authorized signing/distribution. VexaStore does not silently install arbitrary IPA files.',
      windows: 'Windows installers are handed to the host installer and may require Windows security/UAC approval.',
      gaming: 'WebApps use the MTP2026 registry; native gaming packages require a compatible host installer/runtime.',
    },
  };
}

router.post('/publish-web', authAdmin, async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { name, slug: requestedSlug, description, web_url, version = '1.0.0', category_id, developer, website, icon_url, is_featured = 0 } = req.body || {};
    if (!name || !web_url) return res.status(400).json({ success: false, message: 'name and web_url are required' });
    let slug = normalizeSlug(requestedSlug || name);
    if (!slug) return res.status(400).json({ success: false, message: 'A valid slug is required' });
    const [existing] = await connection.query('SELECT id FROM apps WHERE slug = ?', [slug]);
    if (existing.length) return res.status(409).json({ success: false, message: 'Slug already exists' });
    let category = category_id;
    if (!category) {
      const [categories] = await connection.query('SELECT id FROM categories WHERE is_active = 1 ORDER BY id ASC LIMIT 1');
      category = categories[0]?.id;
    }
    if (!category) return res.status(400).json({ success: false, message: 'At least one active category is required' });
    await connection.beginTransaction();
    const [appResult] = await connection.query(`INSERT INTO apps (name, slug, description, long_description, category_id, icon_url, developer, website, is_featured, is_free, price, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, 1, NOW(), NOW())`, [name, slug, description || null, description || null, category, icon_url || null, developer || 'MTP2026', website || web_url, Number(is_featured) ? 1 : 0]);
    const [versionResult] = await connection.query(`INSERT INTO app_versions (app_id, version, os, file_url, file_size, release_notes, is_latest, is_active, release_status, created_at, updated_at) VALUES (?, ?, 'web', ?, NULL, ?, 1, 1, 'PUBLISHED', NOW(), NOW())`, [appResult.insertId, version, web_url, 'Published HTTPS WebApp; installable in MTP2026 and through browser PWA flows where supported.']);
    await connection.commit();
    res.status(201).json({ success: true, message: 'Web app published', data: { appId: appResult.insertId, versionId: versionResult.insertId, slug, installManifestPath: `/api/platform/apps/${slug}/install-manifest`, mtp2026InstallUrl: `${MTP2026_ORIGIN}/?vexastoreInstall=1&slug=${encodeURIComponent(slug)}`, supportedMtp2026Modes: ['mtp2026','ios','android','windows11','gaming'] } });
  } catch (error) { try { await connection.rollback(); } catch (_) {} next(error); } finally { connection.release(); }
});

router.get('/apps/:slug/install-manifest', async (req, res, next) => {
  try {
    const [apps] = await pool.query(`SELECT a.*, c.name AS category_name FROM apps a LEFT JOIN categories c ON c.id = a.category_id WHERE a.slug = ? AND a.is_active = 1`, [req.params.slug]);
    if (!apps.length) return res.status(404).json({ success: false, message: 'App not found' });
    const [versions] = await pool.query(`SELECT * FROM app_versions WHERE app_id = ? AND ${PUBLIC} ORDER BY created_at DESC`, [apps[0].id]);
    res.json({ success: true, data: platformManifest(apps[0], versions) });
  } catch (error) { next(error); }
});

module.exports = router;
