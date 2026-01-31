
import React from 'react';
import { Service } from '../types';

interface HomeProps {
  services: Service[];
  onSelectService: (service: Service) => void;
  studioName: string;
}

const Home: React.FC<HomeProps> = ({ services, onSelectService, studioName }) => {
  return (
    <div className="pb-32 md:pb-24 pt-16 md:pt-24 px-6 lg:px-12 animate-in fade-in duration-1000">
      <div className="max-w-4xl mb-12 flex flex-col items-center mx-auto text-center">
        <h2 className="font-display fluid-text-4xl md:text-6xl font-medium text-stone-900 dark:text-parchment-light leading-[1.1] mb-2">
          {studioName}
        </h2>
        <div className="w-16 h-[2px] bg-gold/50 my-6 rounded-full"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
        {services.map((service, index) => (
          <div
            key={service.id}
            className={`flex flex-col ${index % 2 !== 0 ? 'md:mt-12' : ''} reveal`}
            style={{ animationDelay: `${index * 150}ms` }}
          >
            <button
              onClick={() => onSelectService(service)}
              className="group relative w-full aspect-[4/5] rounded-[3rem] overflow-hidden border border-gold/10 shadow-2xl transition-all duration-700 hover:-translate-y-4 hover:shadow-gold/20 bg-stone-100 dark:bg-luxury-medium"
            >
              <img
                src={service.image}
                alt={service.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110 opacity-90 group-hover:opacity-100"
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-luxury-black/90 via-luxury-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>

              <div className="absolute top-8 right-8 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold px-5 py-2 rounded-full uppercase tracking-[0.3em] shadow-lg">
                Premium
              </div>

              <div className="absolute bottom-10 left-10 right-10 text-left">
                <span className="text-[10px] uppercase tracking-[0.4em] text-gold font-bold mb-3 block">Experiência Exclusiva</span>
                <h3 className="font-display text-4xl font-medium text-white mb-4 leading-none">{service.name}</h3>
                <div className="flex items-center gap-4">
                  <span className="text-white/80 text-sm font-sans uppercase tracking-widest font-semibold">{service.price}</span>
                  <div className="flex-grow h-[1px] bg-gold/50"></div>
                </div>
              </div>
            </button>
            <div className="mt-6 px-4">
              <p className="text-stone-500 dark:text-stone-400 text-sm line-clamp-2 leading-relaxed italic">{service.description}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default Home;
