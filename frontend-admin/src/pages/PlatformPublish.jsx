import { useState } from 'react';
import api, { getApiErrorMessage } from '../services/api';

const initialForm = { name: '', slug: '', description: '', web_url: '', version: '1.0.0', developer: 'MTP2026', website: '', icon_url: '' };
const GUEST_TARGETS = [
  ['mtp2026', 'MTP2026 Device OS'],
  ['android', 'MTP2026 Android OS'],
  ['windows11', 'MTP2026 Desktop OS'],
  ['gaming', 'MTP2026 Gaming OS'],
];

export default function PlatformPublish() {
  const [form, setForm] = useState(initialForm);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [published, setPublished] = useState(null);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true); setMessage(''); setPublished(null);
    try {
      const response = await api.publishWebApp(form);
      const data = response.data?.data || {};
      setPublished(data);
      setMessage(`Published successfully. App ID: ${data.appId || 'created'}`);
      setForm(initialForm);
    } catch (error) {
      setMessage(getApiErrorMessage(error));
    } finally { setBusy(false); }
  };

  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold">Platform App Publishing</h1>
        <p className="text-sm opacity-70 mt-1">Publish an HTTPS WebApp once. VexaStore creates the signed installation contract used by MTP2026 and by normal device/browser installation flows.</p>
      </div>
      <form onSubmit={submit} className="max-w-2xl space-y-4 rounded-2xl border border-white/10 p-4 bg-black/10">
        {[
          ['name', 'Application name', 'VexaEmail'],
          ['slug', 'Slug', 'vexa-email'],
          ['version', 'Version', '1.0.0'],
          ['web_url', 'Published HTTPS WebApp URL', 'https://example.com/app'],
          ['website', 'Public website URL', 'https://example.com'],
          ['icon_url', 'Application icon URL', 'https://example.com/icon.png'],
          ['developer', 'Developer', 'MTP2026'],
        ].map(([key, label, placeholder]) => (
          <label key={key} className="block space-y-1">
            <span className="text-sm font-medium">{label}</span>
            <input value={form[key]} onChange={update(key)} placeholder={placeholder} required={['name','web_url'].includes(key)} className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 outline-none" />
          </label>
        ))}
        <label className="block space-y-1"><span className="text-sm font-medium">Description</span><textarea value={form.description} onChange={update('description')} rows={4} className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 outline-none" /></label>
        <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-3">
          <b className="text-sm">MTP2026 guest targets</b>
          <p className="text-xs opacity-70 mt-1">One published WebApp can be installed into every MTP2026-owned guest profile. The VexaAccount application library remains shared across profiles.</p>
          <div className="flex flex-wrap gap-2 mt-2">{GUEST_TARGETS.map(([id, label]) => <span key={id} className="px-2 py-1 rounded-lg bg-black/20 border border-white/10 text-[11px]">{label}</span>)}</div>
        </div>
        <button disabled={busy} className="rounded-xl px-4 py-2 bg-cyan-500 text-black font-semibold disabled:opacity-50">{busy ? 'Publishing…' : 'Publish Web App'}</button>
        {message && <p className="text-sm opacity-80">{message}</p>}
      </form>

      {published && <div className="max-w-2xl rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm space-y-3">
        <b>Installation contract created</b>
        <p className="opacity-80">VexaStore manifest: <code>{published.installManifestPath}</code></p>
        <p className="opacity-80">All four MTP2026 guest profiles now have a direct installation target:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(published.profileInstallUrls ? Object.entries(published.profileInstallUrls) : [['mtp2026', published.mtp2026InstallUrl]]).map(([mode, url]) => <a key={mode} className="rounded-lg border border-white/10 bg-black/10 px-3 py-2 hover:border-cyan-400/40" href={url} target="_blank" rel="noreferrer"><b>{mode === 'mtp2026' ? 'MTP2026 Device OS' : mode === 'android' ? 'MTP2026 Android OS' : mode === 'windows11' ? 'MTP2026 Desktop OS' : 'MTP2026 Gaming OS'}</b><span className="block text-[11px] opacity-60">Open installer</span></a>)}
        </div>
        <a className="inline-flex rounded-lg bg-cyan-500 text-black px-3 py-2 font-semibold" href={published.mtp2026InstallUrl} target="_blank" rel="noreferrer">Open MTP2026 Installer</a>
      </div>}

      <div className="max-w-2xl rounded-2xl border border-white/10 p-4 text-sm opacity-80">
        <b>Installation behavior</b>
        <ul className="list-disc ml-5 mt-2 space-y-1">
          <li><b>MTP2026:</b> HTTPS WebApps are registered after VexaAccount authentication and become launchable from all four MTP2026 guest profiles.</li>
          <li><b>Android APK:</b> a native MTP2026 Android build can hand the verified package to Android PackageInstaller; physical Android security may still require user approval.</li>
          <li><b>iPhone/iOS:</b> WebApps use the browser/PWA installation mechanism. Arbitrary IPA files are not silently installed by a web page.</li>
          <li><b>Windows:</b> WebApps use browser/PWA installation; native installers remain under Windows security/UAC.</li>
          <li><b>Gaming OS:</b> WebApps use the MTP2026 application registry; native packages require a compatible native runtime.</li>
        </ul>
      </div>
    </div>
  );
}
