import { useEffect, useState } from 'react';
import { CheckCircle2, Download, ExternalLink, RefreshCw, ShieldCheck } from 'lucide-react';
import { appApi } from '../services/api';
import { useNotification } from '../hooks/useNotification';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api-vexastore.onrender.com';

function isNativeAndroid() {
  return typeof window !== 'undefined' && Boolean(window.VexaStoreAndroid?.isNativeAndroid?.());
}

export default function DownloadButton({ version, appId }) {
  const [state, setState] = useState('idle');
  const [installedVersion, setInstalledVersion] = useState('');
  const { showSuccess, showError } = useNotification();
  const nativeAndroid = isNativeAndroid() && version.os === 'android';
  const fileUrl = version.file_url || '';

  useEffect(() => {
    if (!nativeAndroid || !version.package_name) return;
    try {
      setInstalledVersion(window.VexaStoreAndroid.getInstalledVersion(version.package_name) || '');
    } catch (error) {
      console.warn('Unable to query installed Android package', error);
    }
  }, [nativeAndroid, version.package_name, version.version]);

  useEffect(() => {
    if (!nativeAndroid) return undefined;
    const handler = (event) => {
      const detail = event.detail || {};
      if (detail.status === 'progress') setState('downloading');
      else if (detail.status === 'verified') setState('verifying');
      else if (detail.status === 'installer_opened') {
        setState('idle');
        showSuccess('Android system installer opened. Complete the installation there.');
      } else if (detail.status === 'permission_required') setState('permission');
      else if (detail.status === 'error') {
        setState('idle');
        showError(detail.message || 'APK installation failed.');
      }
    };
    window.addEventListener('vexastore:android-install', handler);
    return () => window.removeEventListener('vexastore:android-install', handler);
  }, [nativeAndroid, showError, showSuccess]);

  const handleDownload = async () => {
    if (!fileUrl) {
      showError('This release does not have a downloadable file.');
      return;
    }
    try {
      setState('tracking');
      await appApi.trackDownload({
        app_id: appId,
        version_id: version.id,
        os: version.os,
        user_agent: navigator.userAgent,
      });
      const absoluteUrl = fileUrl.startsWith('http') ? fileUrl : `${API_BASE_URL}${fileUrl}`;
      if (nativeAndroid) {
        if (typeof window.VexaStoreAndroid.downloadAndInstall !== 'function') throw new Error('Android installer bridge unavailable');
        setState('downloading');
        window.VexaStoreAndroid.downloadAndInstall(
          absoluteUrl,
          version.sha256 || version.apk_sha256 || '',
          version.package_name || version.android_package_name || '',
          version.version || '',
          'vexastoreInstallCallback'
        );
        return;
      }
      setState('idle');
      showSuccess(`Downloading ${version.os} version...`);
      window.open(absoluteUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setState('idle');
      showError(err?.message || 'Download failed. Please try again.');
    }
  };

  const osLabels = { ios: 'iOS', android: 'Android', windows: 'Windows', macos: 'macOS', linux: 'Linux' };
  const isInstalled = nativeAndroid && Boolean(installedVersion);
  const isCurrent = isInstalled && installedVersion === version.version;
  const isBusy = ['tracking', 'downloading', 'verifying', 'permission'].includes(state);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-dark-bg/50 border border-dark-border hover:border-accent-primary/20 transition">
      <div className="min-w-0">
        <p className="text-sm font-medium text-white">{osLabels[version.os] || version.os} {version.version}</p>
        <p className="text-xs text-text-secondary">Size: {version.file_size || 'N/A'} • Updated: {new Date(version.created_at).toLocaleDateString()}</p>
        {nativeAndroid && version.package_name && <p className="text-[11px] text-text-secondary mt-1 truncate">Package: {version.package_name}</p>}
        {isInstalled && <p className="text-[11px] text-emerald-300 mt-1">Installed: {installedVersion}{isCurrent ? ' • Up to date' : ' • Update available'}</p>}
        {version.release_notes && <p className="text-xs text-text-secondary mt-1">{version.release_notes}</p>}
      </div>
      <button onClick={handleDownload} disabled={isBusy} className={`btn-primary flex items-center gap-2 text-sm px-4 py-2 ${isBusy ? 'opacity-70 cursor-not-allowed' : ''}`}>
        {state === 'tracking' ? <><RefreshCw size={16} className="animate-spin" /> Preparing...</>
          : state === 'downloading' ? <><Download size={16} className="animate-pulse" /> Downloading...</>
          : state === 'verifying' ? <><ShieldCheck size={16} /> Verifying...</>
          : state === 'permission' ? <><ExternalLink size={16} /> Allow install...</>
          : isCurrent ? <><CheckCircle2 size={16} /> Installed</>
          : isInstalled ? <><Download size={16} /> Update</>
          : <><Download size={16} /> {nativeAndroid ? 'Install' : 'Download'}</>}
      </button>
    </div>
  );
}
