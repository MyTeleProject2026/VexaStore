import { useState } from 'react';
import api, { getApiErrorMessage } from '../services/api';

export default function PlatformPublish() {
  const [form, setForm] = useState({ name: '', slug: '', description: '', web_url: '', version: '1.0.0', developer: 'MTP2026' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true); setMessage('');
    try {
      const response = await api.publishWebApp(form);
      setMessage(`Published successfully. App ID: ${response.data?.data?.appId || 'created'}`);
      setForm({ name: '', slug: '', description: '', web_url: '', version: '1.0.0', developer: 'MTP2026' });
    } catch (error) {
      setMessage(getApiErrorMessage(error));
    } finally { setBusy(false); }
  };

  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold">Platform App Publishing</h1>
        <p className="text-sm opacity-70 mt-1">Publish a web application to VexaStore. MTP2026 can install published web apps into its own app registry.</p>
      </div>
      <form onSubmit={submit} className="max-w-2xl space-y-4 rounded-2xl border border-white/10 p-4 bg-black/10">
        {[
          ['name', 'Application name', 'VexaEmail'],
          ['slug', 'Slug', 'vexa-email'],
          ['version', 'Version', '1.0.0'],
          ['web_url', 'Web application URL', 'https://example.com/app'],
          ['developer', 'Developer', 'MTP2026'],
        ].map(([key, label, placeholder]) => (
          <label key={key} className="block space-y-1">
            <span className="text-sm font-medium">{label}</span>
            <input value={form[key]} onChange={update(key)} placeholder={placeholder} required={key !== 'developer'} className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 outline-none" />
          </label>
        ))}
        <label className="block space-y-1"><span className="text-sm font-medium">Description</span><textarea value={form.description} onChange={update('description')} rows={4} className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 outline-none" /></label>
        <button disabled={busy} className="rounded-xl px-4 py-2 bg-cyan-500 text-black font-semibold disabled:opacity-50">{busy ? 'Publishing…' : 'Publish Web App'}</button>
        {message && <p className="text-sm opacity-80">{message}</p>}
      </form>
      <div className="max-w-2xl rounded-2xl border border-white/10 p-4 text-sm opacity-80">
        <b>Installation behavior</b>
        <ul className="list-disc ml-5 mt-2 space-y-1"><li>MTP2026 OS: install to the MTP2026 app registry and launch immediately.</li><li>Android native package: handed to Android PackageInstaller; Android may require confirmation.</li><li>Windows native package: handed to the Windows installer/UAC.</li><li>iPhone/iOS: only Apple-authorized/signed installation paths can install native apps; a web app can use Safari/PWA installation.</li></ul>
      </div>
    </div>
  );
}
