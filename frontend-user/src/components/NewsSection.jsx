// frontend-user/src/components/NewsSection.jsx
import { useState, useEffect } from 'react';
import { Newspaper, ChevronLeft, ChevronRight, Clock, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NewsSection({ news }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Auto-slide every 5 seconds
  useEffect(() => {
    if (news.length <= 1) return;
    const interval = setInterval(() => {
      handleNext();
    }, 5000);
    return () => clearInterval(interval);
  }, [news.length, currentIndex]);

  const handlePrev = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev === 0 ? news.length - 1 : prev - 1));
    setTimeout(() => setIsAnimating(false), 400);
  };

  const handleNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev === news.length - 1 ? 0 : prev + 1));
    setTimeout(() => setIsAnimating(false), 400);
  };

  const goToSlide = (index) => {
    if (isAnimating || index === currentIndex) return;
    setIsAnimating(true);
    setCurrentIndex(index);
    setTimeout(() => setIsAnimating(false), 400);
  };

  if (!news || news.length === 0) return null;

  const currentNews = news[currentIndex];

  return (
    <section className="glass-card overflow-hidden border-cyan-500/10">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Newspaper size={18} className="text-cyan-400" />
          <h2 className="text-sm font-semibold text-white">Latest News</h2>
          <span className="text-xs text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">
            {news.length}
          </span>
        </div>
        <Link to="/news" className="text-xs text-slate-500 hover:text-cyan-400 transition flex items-center gap-1">
          View All <ChevronRight size={14} />
        </Link>
      </div>

      <div className="relative p-4">
        {/* ─── News Content ─── */}
        <div className={`transition-opacity duration-300 ${isAnimating ? 'opacity-50' : 'opacity-100'}`}>
          {currentNews.image_url && (
            <div className="w-full h-32 md:h-40 rounded-xl overflow-hidden mb-3 bg-[#050812]">
              <img
                src={currentNews.image_url}
                alt={currentNews.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          )}

          <h3 className="text-base font-semibold text-white line-clamp-2">
            {currentNews.title}
          </h3>

          <p className="text-sm text-slate-400 mt-2 line-clamp-3">
            {currentNews.content?.replace(/<[^>]*>/g, '').slice(0, 150)}
            {currentNews.content?.length > 150 ? '...' : ''}
          </p>

          <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {new Date(currentNews.published_at || currentNews.created_at).toLocaleDateString()}
            </span>
            {currentNews.is_featured && (
              <span className="flex items-center gap-1 text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">
                <Sparkles size={10} /> Featured
              </span>
            )}
          </div>

          <Link
            to={`/news/${currentNews.slug}`}
            className="mt-3 inline-flex items-center gap-1 text-sm text-cyan-400 hover:underline"
          >
            Read More <ChevronRight size={14} />
          </Link>
        </div>

        {/* ─── Navigation ─── */}
        {news.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-[#0a0e1a]/80 backdrop-blur-sm border border-white/10 text-white hover:bg-cyan-500/20 transition"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-[#0a0e1a]/80 backdrop-blur-sm border border-white/10 text-white hover:bg-cyan-500/20 transition"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}

        {/* ─── Dots ─── */}
        {news.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-4">
            {news.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentIndex
                    ? 'w-6 bg-cyan-400'
                    : 'w-1.5 bg-slate-600 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
