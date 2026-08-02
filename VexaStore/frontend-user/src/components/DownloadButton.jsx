import { useState } from 'react';
import { Download, CheckCircle } from 'lucide-react';
import { appApi } from '../services/api';
import { useNotification } from '../hooks/useNotification';

export default function DownloadButton({ version, appId, appSlug }) {
  const [downloading, setDownloading] = useState(false);
  const { showSuccess, showError } = useNotification();
  
  const handleDownload = async () => {
    try {
      setDownloading(true);
      // Track download
      await appApi.trackDownload({
        app_id: appId,
        version_id: version.id,
        os: version.os,
        user_agent: navigator.userAgent,
        country: 'US', // Could get from IP
      });
      showSuccess(`Downloading ${version.os} version...`);
      // Simulate download start (in production, redirect to file URL)
      const fileUrl = `${import.meta.env.VITE_API_BASE_URL}${version.file_url}`;
      window.open(fileUrl, '_blank');
    } catch (err) {
      showError('Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };
  
  const osLabels = {
    ios: 'iOS',
    android: 'Android',
    windows: 'Windows',
    macos: 'macOS',
    linux: 'Linux',
  };
  
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-dark-bg/50 border border-dark-border hover:border-accent-primary/20 transition">
      <div>
        <p className="text-sm font-medium text-white">{osLabels[version.os] || version.os} {version.version}</p>
        <p className="text-xs text-text-secondary">Size: {version.file_size || 'N/A'} • Updated: {new Date(version.created_at).toLocaleDateString()}</p>
        {version.release_notes && (
          <p className="text-xs text-text-secondary mt-1">{version.release_notes}</p>
        )}
      </div>
      <button
        onClick={handleDownload}
        disabled={downloading}
        className={`btn-primary flex items-center gap-2 text-sm px-4 py-2 ${downloading ? 'opacity-70 cursor-not-allowed' : ''}`}
      >
        {downloading ? (
          <>
            <span className="w-4 h-4 border-2 border-black/30 border-t-transparent rounded-full animate-spin"></span>
            Downloading...
          </>
        ) : (
          <>
            <Download size={16} />
            Download
          </>
        )}
      </button>
    </div>
  );
}