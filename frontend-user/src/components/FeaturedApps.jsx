import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import { Link } from 'react-router-dom';
import 'swiper/css';
import 'swiper/css/pagination';

export default function FeaturedApps({ apps }) {
  if (!apps || apps.length === 0) return null;
  
  return (
    <div className="relative -mx-4 md:mx-0">
      <Swiper
        modules={[Autoplay, Pagination]}
        spaceBetween={16}
        slidesPerView={1.2}
        centeredSlides={true}
        pagination={{ clickable: true, dynamicBullets: true }}
        autoplay={{ delay: 4000, disableOnInteraction: false }}
        breakpoints={{
          640: { slidesPerView: 2.2, spaceBetween: 20 },
          1024: { slidesPerView: 3.2, spaceBetween: 24 },
          1280: { slidesPerView: 4.2, spaceBetween: 24 },
        }}
        className="pb-10"
      >
        {apps.map((app) => (
          <SwiperSlide key={app.id}>
            <Link to={`/app/${app.slug}`} className="block group">
              <div className="glass-card p-5 hover:border-accent-primary/30 transition-all duration-300 h-full">
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-dark-bg border border-dark-border mb-3">
                    {app.icon_url ? (
                      <img src={`${import.meta.env.VITE_API_BASE_URL}${app.icon_url}`} alt={app.name} className="w-full h-full object-cover" />
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
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}