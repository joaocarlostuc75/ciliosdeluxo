
import React from 'react';
import { OrnamentalSVG } from '../constants';
import { User } from '../types';

interface SplashScreenProps {
  studio: User;
  onStart: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ studio, onStart }) => {
  return (
    <div className="h-full flex flex-col items-center justify-between py-16 px-8 text-center relative overflow-hidden animate-in fade-in duration-1000">
      {/* Decorative Layer */}
      <div className="absolute top-10 left-10 w-32 h-32 text-gold/10 pointer-events-none animate-pulse">
        <OrnamentalSVG className="w-full h-full rotate-[-15deg]" />
      </div>
      <div className="absolute bottom-40 right-10 w-40 h-40 text-gold/10 pointer-events-none animate-pulse delay-700">
        <OrnamentalSVG className="w-full h-full rotate-[165deg]" />
      </div>

      <div className="flex-grow flex flex-col items-center justify-center w-full">
        {/* Main Logo Container */}
        <div className="w-64 h-64 rounded-full border-2 border-gold flex items-center justify-center bg-white/40 dark:bg-black/20 backdrop-blur-sm shadow-[0_30px_60px_rgba(197,160,89,0.2)] relative mb-10 group overflow-hidden animate-in zoom-in duration-1000">
          <div className="absolute inset-0 z-0">
            {studio.image ? (
              <img src={studio.image} alt={studio.name} className="w-full h-full object-cover opacity-90 transition-transform duration-1000 group-hover:scale-110" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-gold text-6xl font-light">visibility</span>
              </div>
            )}
          </div>
          <div className="absolute inset-3 rounded-full border border-gold/30 z-10"></div>
          
          <div className="absolute inset-0 bg-black/5 flex flex-col items-center justify-center relative z-20">
            <h1 className="font-display text-4xl font-bold gold-gradient-text tracking-tight leading-none drop-shadow-sm px-4">
              {studio.name.split(' ')[0]}<br/>
              <span className="text-3xl opacity-90">{studio.name.split(' ').slice(1).join(' ')}</span>
            </h1>
            <p className="text-[9px] text-gold tracking-[0.4em] uppercase mt-4 font-bold opacity-70">Estética de Luxo</p>
          </div>
        </div>
        
        <div className="max-w-[280px] animate-in slide-in-from-bottom-6 duration-1000 delay-300">
          <p className="font-display italic text-gold-dark dark:text-gold text-lg mb-8 leading-relaxed">
            Transforme seu olhar com a precisão do luxo e a exclusividade que você merece.
          </p>

          <button
            onClick={onStart}
            className="w-full gold-gradient text-white font-black py-5 px-12 rounded-2xl shadow-xl hover:shadow-gold/40 transition-all transform active:scale-95 uppercase tracking-[0.4em] text-xs shadow-[0_10px_30px_rgba(131,102,38,0.3)]"
          >
            Agendar Experiência
          </button>
        </div>
      </div>

      <footer className="w-full text-gold-dark/30 dark:text-gold/20 text-[9px] tracking-[0.5em] uppercase font-bold animate-pulse mt-12">
        Atendimento Personalizado de Alto Padrão
      </footer>
    </div>
  );
};

export default SplashScreen;
