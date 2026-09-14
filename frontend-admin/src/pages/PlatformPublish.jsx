import { useState } from 'react';
import api, { getApiErrorMessage } from '../services/api';

const initialForm = { name: '', slug: '', description: '', web_url: '', version: '1.0.0', developer: 'MTP2026', website: '', icon_url: '' };
const GUEST_TARGETS = ['mtp2026', 'android', 'ios', 'windows11', 'gaming'];

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
        <p className="text-sm opacity-70 mt-1">Publish a complete HTTPS WebApp entry for VexaStore. MTP2026 can register it as a native launcher application while physical devices use their platform PWA/native installation mechanisms.</p>
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
          <p className="text-xs opacity-70 mt-1">Every published HTTPS WebApp is available to the MTP2026 application registry in all four MTP2026 guest profiles.</p>
          <div className="flex flex-wrap gap-2 mt-2">{GUEST_TARGETS.map(target => <span key={target} className="px-2 py-1 rounded-lg bg-black/20 border border-white/10 text-[11px]">{target}</span>)}</div>
        </div>
        <button disabled={busy} className="rounded-xl px-4 py-2 bg-cyan-500 text-black font-semibold disabled:opacity-50">{busy ? 'Publishing…' : 'Publish Web App'}</button>
        {message && <p className="text-sm opacity-80">{message}</p>}
      </form>

      {published && <div className="max-w-2xl rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm space-y-2">
        <b>Installation contract created</b>
        <p className="opacity-80">VexaStore manifest: <code>{published.installManifestPath}</code></p>
        <p className="opacity-80">MTP2026 direct install: <code>{published.mtp2026InstallUrl}</code></p>
        <p className="opacity-80">Supported MTP2026 profiles: {(published.supportedMtp2026Modes || GUEST_TARGETS).join(', ')}</p>
      </div>}

      <div className="max-w-2xl rounded-2xl border border-white/10 p-4 text-sm opacity-80">
        <b>Installation behavior</b>
        <ul className="list-disc ml-5 mt-2 space-y-1">
          <li><b>MTP2026:</b> HTTPS WebApps are registered after the VexaStore install request is received and become launchable from every MTP2026 guest profile.</li>
          <li><b>Android:</b> APK releases are downloaded, verified, then handed to Android PackageInstaller; Android may require user confirmation.</li>
          <li><b>iPhone/iOS:</b> WebApps use the platform PWA flow. Native IPA installation requires Apple's authorized signing/distribution path.</li>
          <li><b>Windows:</b> WebApps use browser/PWA installation; native installers may require UAC/security approval.</li>
          <li><b>Gaming OS:</b> WebApps use the MTP2026 registry; native packages require a compatible native runtime.</li>
        </ul>
      </div>
    </div>
  );
}
