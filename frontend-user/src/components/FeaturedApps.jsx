import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function FeaturedApps({ apps }) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      const { scrollWidth, clientWidth } = containerRef.current;
      setMaxScroll(scrollWidth - clientWidth);
    }
  }, [apps]);

  const scroll = (direction) => {
    if (!containerRef.current) return;
    const scrollAmount = containerRef.current.clientWidth * 0.8;
    const newPosition = direction === 'left' 
      ? Math.max(0, scrollPosition - scrollAmount)
      : Math.min(maxScroll, scrollPosition + scrollAmount);
    containerRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
    setScrollPosition(newPosition);
  };

  if (!apps || apps.length === 0) return null;

  return (
    <div className="relative">
      {/* Carousel Container */}
      <div
        ref={containerRef}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-4 snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {apps.map((app) => (
          <div key={app.id} className="min-w-[170px] max-w-[170px] snap-start flex-shrink-0">
            <Link to={`/app/${app.slug}`} className="block group">
              <div className="glass-card p-4 hover:border-cyan-500/30 transition-all duration-300 bg-[#0a0e1a]/80 hover:bg-[#0a0e1a] border border-white/5 rounded-2xl h-full">
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[#050812] border border-white/10 mb-3 group-hover:border-cyan-500/30 transition">
                    {app.icon_url ? (
                      <img 
                        src={`${import.meta.env.VITE_API_BASE_URL}${app.icon_url}`} 
                        alt={app.name} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl font-bold bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 text-cyan-400">
                        {app.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <h4 className="font-semibold text-white truncate w-full group-hover:text-cyan-400 transition">{app.name}</h4>
                  <p className="text-xs text-slate-500 truncate w-full">{app.developer || 'VexaTrade'}</p>
                  <div className="mt-2 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 text-cyan-400 text-xs font-medium border border-cyan-500/20">
                    ⭐ Featured
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Navigation Buttons */}
      {apps.length > 2 && (
        <>
          <button
            onClick={() => scroll('left')}
            disabled={scrollPosition <= 0}
            className="absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-full bg-[#0a0e1a]/90 backdrop-blur-sm border border-white/10 text-white hover:bg-cyan-500/20 hover:border-cyan-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition z-10 -translate-x-1/2"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={scrollPosition >= maxScroll - 5}
            className="absolute right-0 top-1/2 -translate-y-1/2 p-2 rounded-full bg-[#0a0e1a]/90 backdrop-blur-sm border border-white/10 text-white hover:bg-cyan-500/20 hover:border-cyan-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition z-10 translate-x-1/2"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}
    </div>
  );
}