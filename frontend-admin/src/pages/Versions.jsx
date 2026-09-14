import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, getApiErrorMessage } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import { ArrowLeft, Plus, Trash2, Download, Smartphone, Apple, Monitor, Terminal, ShieldCheck } from 'lucide-react';

const OS_LABELS = { ios: 'iOS', android: 'Android', windows: 'Windows', macos: 'macOS', linux: 'Linux' };
const OS_ICONS = { ios: Apple, android: Smartphone, windows: Monitor, macos: Apple, linux: Terminal };

async function calculateSha256(file) {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function Versions() {
  const { id } = useParams();
  const [app, setApp] = useState(null);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hashing, setHashing] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const { showSuccess, showError } = useNotification();
  const [form, setForm] = useState({ app_id: id, version: '', os: 'android', release_notes: '', is_latest: 1, file: null, sha256: '', package_name: '', version_code: '', minimum_sdk: '24', signing_certificate_sha256: '', release_status: 'PUBLISHED' });

  useEffect(() => { if (id) loadApp(); }, [id]);
  async function loadApp() {
    try { setLoading(true); const res = await api.getApp(id); setApp(res.data?.data); setVersions(res.data?.data?.versions || []); }
    catch (err) { showError(getApiErrorMessage(err)); } finally { setLoading(false); }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((prev) => ({ ...prev, file, sha256: '' }));
    setHashing(true);
    try {
      const hash = await calculateSha256(file);
      setForm((prev) => ({ ...prev, sha256: hash }));
    } catch { showError('Unable to calculate SHA-256 for this file.'); }
    finally { setHashing(false); }
  };

  const handleAddVersion = async (e) => {
    e.preventDefault();
    if (!form.app_id || !form.version.trim() || !form.os || !form.file) { showError('Version, platform, and app file are required'); return; }
    if (form.os === 'android' && (!form.package_name.trim() || !form.sha256)) { showError('Android releases require package name and SHA-256 verification'); return; }
    try {
      setSubmitting(true);
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => { if (key !== 'file' && value !== null) data.append(key, String(value)); });
      data.append('file', form.file);
      await api.addReleaseVersion(data);
      showSuccess('Release version published with verification metadata.');
      setShowAddForm(false);
      setForm({ app_id: id, version: '', os: 'android', release_notes: '', is_latest: 1, file: null, sha256: '', package_name: '', version_code: '', minimum_sdk: '24', signing_certificate_sha256: '', release_status: 'PUBLISHED' });
      loadApp();
    } catch (err) { showError(getApiErrorMessage(err)); } finally { setSubmitting(false); }
  };

  const handleDeleteVersion = async (versionId) => {
    if (!confirm('Delete this version?')) return;
    try { setDeleting(versionId); await api.deleteVersion(versionId); showSuccess('Version deleted'); loadApp(); }
    catch (err) { showError(getApiErrorMessage(err)); } finally { setDeleting(null); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <Link to="/apps" className="inline-flex items-center gap-2 text-text-secondary hover:text-white transition"><ArrowLeft size={20} /> Back to Apps</Link>
      <div className="glass-card p-6 flex flex-wrap items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-white">{app?.name || 'App'} — Versions</h1><p className="text-text-secondary">Manage signed releases, checksums, Android package identity, and publication state.</p></div>
        <button onClick={() => setShowAddForm(!showAddForm)} className="btn-primary flex items-center gap-2"><Plus size={18} /> Add Version</button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddVersion} className="glass-card p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white">New Release</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="input-label">Version *</label><input value={form.version} onChange={(e) => setForm((p) => ({ ...p, version: e.target.value }))} placeholder="1.0.0" className="input-field" required /></div>
            <div><label className="input-label">Platform *</label><select value={form.os} onChange={(e) => setForm((p) => ({ ...p, os: e.target.value }))} className="input-field"><option value="android">Android (APK)</option><option value="ios">iOS (IPA)</option><option value="windows">Windows (EXE/MSI)</option><option value="macos">macOS (DMG)</option><option value="linux">Linux (DEB/RPM)</option></select></div>
          </div>
          {form.os === 'android' && <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border border-accent-primary/20 bg-accent-primary/5">
            <div><label className="input-label">Android package name *</label><input value={form.package_name} onChange={(e) => setForm((p) => ({ ...p, package_name: e.target.value }))} placeholder="com.example.app" className="input-field" required /></div>
            <div><label className="input-label">Version code</label><input type="number" min="1" value={form.version_code} onChange={(e) => setForm((p) => ({ ...p, version_code: e.target.value }))} placeholder="1" className="input-field" /></div>
            <div><label className="input-label">Minimum SDK</label><input type="number" min="21" value={form.minimum_sdk} onChange={(e) => setForm((p) => ({ ...p, minimum_sdk: e.target.value }))} className="input-field" /></div>
            <div><label className="input-label">Signing certificate SHA-256</label><input value={form.signing_certificate_sha256} onChange={(e) => setForm((p) => ({ ...p, signing_certificate_sha256: e.target.value }))} placeholder="Optional release certificate fingerprint" className="input-field" /></div>
          </div>}
          <div><label className="input-label">Release Notes</label><textarea value={form.release_notes} onChange={(e) => setForm((p) => ({ ...p, release_notes: e.target.value }))} className="input-field min-h-[80px] resize-y" placeholder="What's new?" /></div>
          <div><label className="input-label">App File *</label><input type="file" onChange={handleFileChange} className="w-full text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-accent-primary/10 file:text-accent-primary" required /><p className="text-xs text-text-secondary mt-1">APK, IPA, EXE, MSI, DMG, DEB, RPM, ZIP • SHA-256 is calculated automatically in your browser.</p></div>
          <div className="flex items-center gap-2 text-xs text-text-secondary">{hashing ? <><ShieldCheck size={15} className="animate-pulse" /> Calculating SHA-256…</> : form.sha256 ? <><ShieldCheck size={15} /> SHA-256: <span className="font-mono break-all">{form.sha256}</span></> : 'Select a file to calculate its SHA-256.'}</div>
          <div className="flex flex-wrap items-center gap-4"><label className="flex items-center gap-2 text-sm text-text-secondary"><input type="checkbox" checked={form.is_latest === 1} onChange={(e) => setForm((p) => ({ ...p, is_latest: e.target.checked ? 1 : 0 }))} /> Set as latest</label><select value={form.release_status} onChange={(e) => setForm((p) => ({ ...p, release_status: e.target.value }))} className="input-field w-auto"><option>PUBLISHED</option><option>DRAFT</option><option>VALIDATED</option><option>READY_FOR_REVIEW</option></select></div>
          <div className="flex gap-3"><button type="submit" disabled={submitting || hashing} className="btn-primary">{submitting ? 'Publishing…' : 'Publish Release'}</button><button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary">Cancel</button></div>
        </form>
      )}

      {versions.length > 0 ? versions.map((v) => { const Icon = OS_ICONS[v.os] || Smartphone; return <div key={v.id} className="glass-card p-4 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-4 min-w-0"><Icon size={24} className="text-accent-primary" /><div className="min-w-0"><p className="font-semibold text-white">{OS_LABELS[v.os] || v.os} {v.version}{v.is_latest === 1 && <span className="ml-2 text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">Latest</span>}</p><p className="text-xs text-text-secondary">Size: {v.file_size || 'N/A'} • Downloads: {v.download_count || 0} • Status: {v.release_status || 'PUBLISHED'}</p>{v.package_name && <p className="text-xs text-text-secondary mt-1 truncate">Package: {v.package_name}</p>}{v.sha256 && <p className="text-[11px] font-mono text-text-secondary mt-1 truncate">SHA-256: {v.sha256}</p>}{v.release_notes && <p className="text-xs text-text-secondary mt-1">{v.release_notes}</p>}</div></div><div className="flex items-center gap-2"><a href={v.file_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-dark-bg/50 text-text-secondary hover:text-white" title="Download file"><Download size={16} /></a><button onClick={() => handleDeleteVersion(v.id)} disabled={deleting === v.id} className="p-2 rounded-lg hover:bg-red-500/10 text-text-secondary hover:text-red-400">{deleting === v.id ? <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin inline-block" /> : <Trash2 size={16} />}</button></div></div>; }) : <div className="glass-card p-8 text-center text-text-secondary">No versions added yet. Add your first release.</div>}
    </div>
  );
}
