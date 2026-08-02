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
          <div key={app.id} className="min-w-[160px] max-w-[160px] snap-start flex-shrink-0">
            <Link to={`/app/${app.slug}`} className="block group">
              <div className="glass-card p-4 hover:border-accent-primary/30 transition-all duration-300 h-full">
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-dark-bg border border-dark-border mb-3">
                    {app.icon_url ? (
                      <img 
                        src={`${import.meta.env.VITE_API_BASE_URL}${app.icon_url}`} 
                        alt={app.name} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-accent-primary">
                        {app.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <h4 className="font-semibold text-white truncate w-full">{app.name}</h4>
                  <p className="text-xs text-text-secondary truncate w-full">{app.developer || 'VexaTrade'}</p>
                  <div className="mt-2 px-3 py-1 rounded-full bg-accent-primary/10 text-accent-primary text-xs font-medium">
                    Featured
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
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-dark-card/80 backdrop-blur-sm border border-dark-border text-white hover:bg-accent-primary/20 disabled:opacity-30 disabled:cursor-not-allowed transition z-10"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={scrollPosition >= maxScroll - 5}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-dark-card/80 backdrop-blur-sm border border-dark-border text-white hover:bg-accent-primary/20 disabled:opacity-30 disabled:cursor-not-allowed transition z-10"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}
    </div>
  );
}