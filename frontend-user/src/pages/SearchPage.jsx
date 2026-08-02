import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { appApi } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import AppCard from '../components/AppCard';
import { Search, X } from 'lucide-react';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showError } = useNotification();
  
  useEffect(() => {
    if (query) {
      searchApps();
    } else {
      setApps([]);
      setLoading(false);
    }
  }, [query]);
  
  async function searchApps() {
    try {
      setLoading(true);
      const res = await appApi.getApps({ search: query });
      setApps(res.data?.data || []);
    } catch (err) {
      showError('Search failed');
    } finally {
      setLoading(false);
    }
  }
  
  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Search size={24} className="text-accent-primary" />
        <h1 className="text-2xl font-bold text-white">Search Results</h1>
      </div>
      {query && <p className="text-text-secondary">Showing results for: <span className="text-white font-medium">"{query}"</span></p>}
      {apps.length > 0 ? (
        <div className="space-y-3 mt-4">
          {apps.map((app) => <AppCard key={app.id} app={app} />)}
        </div>
      ) : (
        <div className="glass-card p-8 text-center text-text-secondary">
          <Search size={48} className="mx-auto text-text-secondary/30 mb-4" />
          <p>No apps found for "{query}"</p>
          <Link to="/" className="text-accent-primary hover:underline mt-2 inline-block">Go Home</Link>
        </div>
      )}
    </div>
  );
}