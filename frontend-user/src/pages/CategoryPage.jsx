import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { appApi } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import AppCard from '../components/AppCard';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CategoryPage() {
  const { slug } = useParams();
  const [apps, setApps] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showError } = useNotification();

  useEffect(() => {
    loadCategory();
  }, [slug]);

  async function loadCategory() {
    try {
      setLoading(true);
      const res = await appApi.getApps({ category: slug });
      setApps(res.data?.data || []);
      if (res.data?.data?.length > 0) {
        setCategory({ name: res.data.data[0].category_name, slug });
      } else {
        const catRes = await appApi.getCategories();
        const found = catRes.data?.data?.find(c => c.slug === slug);
        if (found) setCategory(found);
      }
    } catch (err) {
      showError('Failed to load category');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="space-y-4">
      <Link to="/" className="inline-flex items-center gap-2 text-text-secondary hover:text-white transition">
        <ChevronLeft size={20} /> Back to Home
      </Link>
      <h1 className="text-2xl font-bold text-white">{category?.name || slug} Apps</h1>
      <p className="text-text-secondary">Discover the best {category?.name || slug} apps from the VexaTrade ecosystem.</p>
      {apps.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
          {apps.map((app) => <AppCard key={app.id} app={app} />)}
        </div>
      ) : (
        <div className="glass-card p-8 text-center text-text-secondary">
          No apps found in this category yet.
        </div>
      )}
    </div>
  );
}