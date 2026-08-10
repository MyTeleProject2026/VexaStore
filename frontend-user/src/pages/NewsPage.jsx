// frontend-user/src/pages/NewsPage.jsx
import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { appApi } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import { ArrowLeft, Newspaper, Clock, Sparkles, Calendar, User } from 'lucide-react';

export default function NewsPage() {
  const { slug } = useParams();
  const { showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState([]);
  const [selectedNews, setSelectedNews] = useState(null);
  const [isArticleView, setIsArticleView] = useState(false);

  useEffect(() => {
    loadNews();
  }, []);

  useEffect(() => {
    if (slug && news.length > 0) {
      const article = news.find(n => n.slug === slug);
      if (article) {
        setSelectedNews(article);
        setIsArticleView(true);
      }
    }
  }, [slug, news]);

  const loadNews = async () => {
    try {
      setLoading(true);
      const res = await appApi.getNews();
      setNews(res.data?.data || []);
      if (!slug && res.data?.data?.length > 0) {
        setSelectedNews(res.data.data[0]);
      }
    } catch (err) {
      showError('Failed to load news');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectArticle = (article) => {
    setSelectedNews(article);
    setIsArticleView(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBackToList = () => {
    setIsArticleView(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="spinner" />
        <p className="mt-4 text-slate-500 text-sm">Loading news...</p>
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="space-y-6">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition">
          <ArrowLeft size={20} /> Back
        </Link>
        <div className="glass-card p-8 text-center text-slate-400">
          <Newspaper size={48} className="mx-auto text-slate-600/30 mb-4" />
          <p>No news articles available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition">
        <ArrowLeft size={20} /> Back
      </Link>

      {isArticleView && selectedNews ? (
        // ─── Article View ───
        <div className="space-y-4">
          <button
            onClick={goBackToList}
            className="text-sm text-slate-400 hover:text-cyan-400 transition flex items-center gap-1"
          >
            <ArrowLeft size={16} /> Back to News List
          </button>

          <div className="glass-card p-6">
            {selectedNews.image_url && (
              <div className="w-full h-48 md:h-64 rounded-xl overflow-hidden mb-5 bg-[#050812]">
                <img
                  src={selectedNews.image_url}
                  alt={selectedNews.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                {new Date(selectedNews.published_at || selectedNews.created_at).toLocaleDateString()}
              </span>
              {selectedNews.is_featured && (
                <span className="flex items-center gap-1 text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">
                  <Sparkles size={12} /> Featured
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">
              {selectedNews.title}
            </h1>

            <div
              className="prose prose-invert prose-cyan max-w-none"
              dangerouslySetInnerHTML={{ __html: selectedNews.content }}
            />

            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-sm text-slate-500">
              <span>VexaStore News</span>
              <span>Updated: {new Date(selectedNews.updated_at || selectedNews.created_at).toLocaleString()}</span>
            </div>
          </div>
        </div>
      ) : (
        // ─── News List View ───
        <div className="space-y-4">
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <Newspaper size={24} className="text-cyan-400" />
              <h1 className="text-2xl font-bold text-white">News & Updates</h1>
            </div>
            <p className="text-slate-400">Latest news from the VexaTrade Ecosystem</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {news.map((article) => (
              <div
                key={article.id}
                className="glass-card p-4 hover:border-cyan-500/30 transition cursor-pointer"
                onClick={() => selectArticle(article)}
              >
                {article.image_url && (
                  <div className="w-full h-40 rounded-xl overflow-hidden mb-3 bg-[#050812]">
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(article.published_at || article.created_at).toLocaleDateString()}
                  </span>
                  {article.is_featured && (
                    <span className="text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full text-[10px]">
                      Featured
                    </span>
                  )}
                </div>

                <h3 className="text-base font-semibold text-white line-clamp-2">
                  {article.title}
                </h3>

                <p className="text-sm text-slate-400 mt-2 line-clamp-3">
                  {article.content?.replace(/<[^>]*>/g, '').slice(0, 120)}
                  {article.content?.length > 120 ? '...' : ''}
                </p>

                <div className="mt-3 text-sm text-cyan-400 hover:underline flex items-center gap-1">
                  Read More <ArrowLeft size={14} className="rotate-180" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
