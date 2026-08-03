import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Download, Clock, ArrowLeft } from 'lucide-react';

export default function Downloads() {
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch downloads from API or localStorage
    const fetchDownloads = async () => {
      try {
        // Mock data - replace with actual API call
        setDownloads([
          { id: 1, name: 'VexaTrade Pro', version: '2.1.0', platform: 'Android', date: '2026-08-01' },
          { id: 2, name: 'VexaWallet', version: '3.0.1', platform: 'iOS', date: '2026-07-30' },
        ]);
      } catch (err) {
        console.error('Failed to fetch downloads:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDownloads();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full"></div></div>;
  }

  return (
    <div className="space-y-4">
      <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition">
        <ArrowLeft size={20} /> Back
      </Link>

      <h1 className="text-2xl font-bold text-white">My Downloads</h1>

      {downloads.length > 0 ? (
        <div className="space-y-3">
          {downloads.map((item) => (
            <div key={item.id} className="glass-card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  <Download size={18} className="text-cyan-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">{item.name}</p>
                  <p className="text-xs text-slate-400">{item.platform} • v{item.version}</p>
                  <p className="text-xs text-slate-500"><Clock size={12} className="inline mr-1" /> {item.date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-8 text-center text-slate-400">
          <Download size={48} className="mx-auto text-slate-600/30 mb-4" />
          <p className="text-lg font-medium text-slate-400">No downloads yet</p>
          <p className="text-sm mt-1">Start exploring apps and download your favorites</p>
          <Link to="/" className="text-cyan-400 hover:underline mt-3 inline-block">Browse Apps</Link>
        </div>
      )}
    </div>
  );
}
