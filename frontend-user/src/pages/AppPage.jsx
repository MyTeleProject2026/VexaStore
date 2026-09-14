import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { appApi } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import DownloadButton from '../components/DownloadButton';
import { ChevronLeft, Star, ExternalLink, Smartphone, Phone, Monitor, Laptop, Terminal, Globe2, Download, PackageCheck, PlusSquare } from 'lucide-react';

const OS_ICONS = { ios: Phone, android: Smartphone, windows: Monitor, macos: Laptop, linux: Terminal, web: Globe2 };
const MTP2026_ORIGIN = 'https://mtp2026-app-launcher.onrender.com';

function getMtpInstallUrl(slug) {
  const url = new URL(MTP2026_ORIGIN);
  url.searchParams.set('vexastoreInstall', '1');
  url.searchParams.set('slug', slug);
  return url.toString();
}

function openWebAppFromStore(app, slug, notify, installToMtp = false) {
  const target = app?.website || '';
  if (!target) { notify('This application has no WebApp URL published yet.'); return; }
  let url;
  try { url = new URL(target); if (url.protocol !== 'https:') throw new Error('HTTPS required'); }
  catch (_) { notify('The published WebApp URL is invalid.'); return; }
  const payload = { type: 'MTP2026_VEXASTORE_INSTALL', app: { id: app.id, slug, title: app.name, description: app.description || app.long_description || '', url: url.toString(), iconUrl: app.icon_url || null, source: 'VexaStore', sourceUrl: window.location.href } };
  if (installToMtp) {
    let delivered = false;
    try { if (window.opener && !window.opener.closed) { window.opener.postMessage(payload, MTP2026_ORIGIN); delivered = true; } } catch (_) {}
    if (!delivered) window.open(getMtpInstallUrl(slug), '_blank', 'noopener,noreferrer');
    notify(delivered ? 'Installation sent to MTP2026.' : 'Opening MTP2026 to complete installation…');
    return;
  }
  try { if (window.opener && !window.opener.closed) window.opener.postMessage(payload, MTP2026_ORIGIN); } catch (_) {}
  window.open(url.toString(), '_blank', 'noopener,noreferrer');
}

export default function AppPage() {
  const { slug } = useParams();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const { showError, showSuccess } = useNotification();
  const [selectedOS, setSelectedOS] = useState('');

  useEffect(() => {
    loadApp();
    const onBeforeInstall = (event) => { event.preventDefault(); setDeferredPrompt(event); };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, [slug]);

  async function loadApp() {
    try {
      setLoading(true);
      const res = await appApi.getApp(slug);
      setApp(res.data?.data || null);
      const versions = res.data?.data?.versions || [];
      if (versions.length > 0) setSelectedOS(versions[0].os);
    } catch (err) { showError('Failed to load app'); }
    finally { setLoading(false); }
  }

  async function installPwa() {
    if (!deferredPrompt) {
      showSuccess('Your browser does not expose an automatic install prompt. Open the WebApp and use the browser menu to install it.');
      if (app?.website) window.open(app.website, '_blank', 'noopener,noreferrer');
      return;
    }
    try {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      showSuccess(result?.outcome === 'accepted' ? 'WebApp installation accepted.' : 'WebApp installation cancelled.');
    } catch (_) { showError('WebApp installation could not be started.'); }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin"></div></div>;
  if (!app) return <div className="glass-card p-8 text-center text-text-secondary"><p>App not found.</p><Link to="/" className="text-accent-primary hover:underline mt-2 inline-block">Go Home</Link></div>;

  const versionsByOS = (app.versions || []).reduce((acc, v) => { if (!acc[v.os]) acc[v.os] = []; acc[v.os].push(v); return acc; }, {});
  const availableOS = Object.keys(versionsByOS);
  const currentVersions = selectedOS ? versionsByOS[selectedOS] || [] : [];
  const hasWebApp = Boolean(app.website);
  const mtpInstallMode = new URLSearchParams(window.location.search).get('mtp2026Install') === '1';

  return (
    <div className="space-y-6">
      <Link to="/" className="inline-flex items-center gap-2 text-text-secondary hover:text-white transition"><ChevronLeft size={20} /> Back to Home</Link>
      <div className="glass-card p-6 flex flex-col md:flex-row gap-6">
        <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden bg-dark-bg border border-dark-border flex-shrink-0 mx-auto md:mx-0">
          {app.icon_url ? <img src={`${import.meta.env.VITE_API_BASE_URL}${app.icon_url}`} alt={app.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-accent-primary">{app.name.charAt(0).toUpperCase()}</div>}
        </div>
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-bold text-white">{app.name}</h1>
          <p className="text-text-secondary">{app.developer || 'VexaTrade'}</p>
          <div className="flex items-center justify-center md:justify-start gap-3 mt-2"><div className="flex items-center"><Star size={16} className="fill-yellow-400 text-yellow-400" /><span className="text-sm font-medium ml-1">{Number(app.rating || 0).toFixed(1)}</span></div><span className="text-text-secondary">•</span><span className="text-sm text-text-secondary">{app.total_downloads || 0} downloads</span></div>
          <p className="text-sm text-text-secondary mt-3 max-w-2xl">{app.long_description || app.description}</p>
          {app.website && <a href={app.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-accent-primary hover:underline text-sm mt-2">Visit website <ExternalLink size={14} /></a>}
        </div>
      </div>

      {hasWebApp && <div className="glass-card p-6 border border-accent-primary/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div><h2 className="text-lg font-semibold text-white flex items-center gap-2"><Globe2 size={19} /> WebApp</h2><p className="text-sm text-text-secondary mt-1">One published HTTPS WebApp can be registered in MTP2026 and installed as a PWA on browsers that expose the platform install prompt.</p></div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => openWebAppFromStore(app, slug, (message) => showSuccess(message), true)} className="btn-primary flex items-center justify-center gap-2"><PackageCheck size={16} /> Install to MTP2026</button>
            <button onClick={installPwa} className="btn-primary flex items-center justify-center gap-2"><PlusSquare size={16} /> Install on this device</button>
            <button onClick={() => openWebAppFromStore(app, slug, (message) => showSuccess(message), false)} className="btn-primary flex items-center justify-center gap-2"><Download size={16} /> Open WebApp</button>
          </div>
        </div>
        {mtpInstallMode && <p className="text-xs text-accent-primary mt-3">MTP2026 installation mode is active. Return to the launcher to finish registering this application.</p>}
      </div>}

      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Download for</h2>
        {availableOS.length > 0 ? <><div className="flex flex-wrap gap-2 mb-4">{availableOS.map((os) => { const Icon = OS_ICONS[os] || Smartphone; const isActive = selectedOS === os; return <button key={os} onClick={() => setSelectedOS(os)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${isActive ? 'bg-accent-primary text-black' : 'bg-dark-bg border border-dark-border text-text-secondary hover:bg-dark-card/80'}`}><Icon size={16} />{os === 'web' ? 'WebApp / PWA' : os.charAt(0).toUpperCase() + os.slice(1)}</button>; })}</div>{currentVersions.map((version) => <DownloadButton key={version.id} version={version} appId={app.id} />)}</> : <p className="text-text-secondary">No native releases available yet. Use the WebApp option above when a website is published.</p>}
      </div>

      {app.screenshots && app.screenshots.length > 0 && <div className="glass-card p-6"><h2 className="text-lg font-semibold text-white mb-4">Screenshots</h2><div className="flex gap-4 overflow-x-auto pb-2 snap-x">{app.screenshots.map((url, idx) => <img key={idx} src={`${import.meta.env.VITE_API_BASE_URL}${url}`} alt={`Screenshot ${idx+1}`} className="h-48 w-auto rounded-xl border border-dark-border snap-start" loading="lazy" />)}</div></div>}
      {app.reviews && app.reviews.length > 0 && <div className="glass-card p-6"><h2 className="text-lg font-semibold text-white mb-4">Reviews</h2><div className="space-y-3">{app.reviews.map((review, idx) => <div key={idx} className="border-b border-dark-border pb-3 last:border-0"><div className="flex items-center gap-2"><div className="flex items-center">{[...Array(5)].map((_, i) => <Star key={i} size={14} className={i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-text-secondary'} />)}</div><span className="text-xs text-text-secondary">{review.user_email || 'Anonymous'}</span></div><p className="text-sm text-text-secondary mt-1">{review.review}</p></div>)}</div></div>}
    </div>
  );
}
