
import React from 'react';
import { OrnamentalSVG } from '../constants';
import { User } from '../types';

interface SplashScreenProps {
  studio: User;
  onStart: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ studio, onStart }) => {
  return (
    <div className="h-full flex flex-col items-center justify-center py-16 px-8 text-center relative overflow-hidden bg-parchment-light dark:bg-luxury-black">

      <div className="flex-grow flex flex-col items-center justify-center w-full">
        {/* Main Logo Container */}
        <div className="w-72 h-72 rounded-full border-2 border-gold flex items-center justify-center bg-white/40 dark:bg-black/20 backdrop-blur-sm shadow-[0_30px_60px_rgba(197,160,89,0.2)] relative mb-12 overflow-hidden">
          <div className="absolute inset-0 z-0">
            {studio.image ? (
              <img src={studio.image} alt={studio.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-gold text-8xl font-light">visibility</span>
              </div>
            )}
          </div>
          {/* Decorative border */}
          <div className="absolute inset-3 rounded-full border border-gold/30 z-10 pointer-events-none"></div>
        </div>

        <div className="max-w-[280px]">
          <button
            onClick={onStart}
            className="w-full gold-gradient text-white font-black py-5 px-12 rounded-2xl shadow-xl uppercase tracking-[0.4em] text-xs shadow-[0_10px_30px_rgba(131,102,38,0.3)] hover:opacity-90 transition-opacity"
          >
            Agendar Experiência
          </button>
        </div>
      </div>

      <footer className="w-full text-gold-dark/30 dark:text-gold/20 text-[9px] tracking-[0.5em] uppercase font-bold mt-12">
        Atendimento Personalizado de Alto Padrão
      </footer>
    </div>
  );
};

export default SplashScreen;
