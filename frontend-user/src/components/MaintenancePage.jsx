import { RefreshCw, Clock, AlertTriangle } from 'lucide-react';

export default function MaintenancePage({ message, onRefresh }) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="glass-card max-w-md w-full p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={36} className="text-amber-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Under Maintenance</h1>
        <p className="text-text-secondary mb-6">{message || 'We\'re currently updating VexaStore. Please check back soon.'}</p>
        <div className="flex items-center justify-center gap-2 text-sm text-text-secondary mb-6">
          <Clock size={16} />
          <span>Estimated downtime: a few minutes</span>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Checking...' : 'Check Status'}
        </button>
        <p className="mt-4 text-xs text-text-secondary">
          VexaStore — The Official App Hub of VexaTrade Blockchain Ecosystem
        </p>
      </div>
    </div>
  );
}
