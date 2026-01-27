
import React from 'react';
import { OrnamentalSVG } from '../constants';
import { Page, User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activePage: Page;
  onNavigate: (page: Page) => void;
  studio: User;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activePage, onNavigate, studio, darkMode, toggleDarkMode }) => {
  const isSplash = activePage === Page.SPLASH;

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-700 ${darkMode ? 'dark' : ''} bg-gradient-to-b from-parchment-light to-[#F5E6D3] dark:from-luxury-black dark:to-luxury-dark relative overflow-x-hidden`}>
      
      {/* Global Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none ornament-bg opacity-30 dark:opacity-[0.03] z-0 mix-blend-multiply dark:mix-blend-normal"></div>

      {/* Dynamic Header for Desktop */}
      {!isSplash && (
        <header className="hidden md:flex fixed top-0 left-0 right-0 z-[100] glass px-6 lg:px-12 py-4 items-center justify-between transition-all duration-500">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onNavigate(Page.HOME)}>
            <div className="w-9 h-9 rounded-full border border-gold/50 flex items-center justify-center transition-all group-hover:bg-gold group-hover:text-white overflow-hidden shadow-sm flex-shrink-0">
              {studio.image ? (
                <img src={studio.image} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-gold group-hover:text-white transition-colors text-lg">visibility</span>
              )}
            </div>
            <h1 className="font-display text-xl font-bold gold-gradient-text uppercase tracking-[0.15em] whitespace-nowrap">Cílios de Luxo</h1>
          </div>
          
          <nav className="flex items-center gap-6 lg:gap-10">
            <div className="flex gap-6 lg:gap-10">
              {[
                { id: Page.HOME, label: 'Início' },
                { id: Page.BOOKING, label: 'Agenda' },
                { id: Page.ABOUT, label: 'Sobre' },
                { id: Page.PROFILE, label: 'Perfil' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`text-[10px] uppercase tracking-[0.2em] font-bold transition-all relative py-2 whitespace-nowrap ${
                    activePage === item.id 
                      ? 'text-gold-dark dark:text-gold' 
                      : 'text-stone-500 dark:text-stone-400 hover:text-gold dark:hover:text-gold-light'
                  }`}
                >
                  {item.label}
                  {activePage === item.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-[1px] bg-gold reveal"></span>
                  )}
                </button>
              ))}
            </div>

            <button 
              onClick={toggleDarkMode} 
              className="w-9 h-9 rounded-full border border-gold/20 bg-white/50 dark:bg-black/20 flex items-center justify-center text-gold hover:bg-gold/10 transition-all active:scale-95 flex-shrink-0"
              title={darkMode ? "Mudar para tema claro" : "Mudar para tema escuro"}
            >
              <span className="material-symbols-outlined text-lg">
                {darkMode ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
          </nav>
        </header>
      )}

      {/* Mobile Dark Mode Toggle (Floating) */}
      {!isSplash && (
        <button 
          onClick={toggleDarkMode}
          className="md:hidden fixed top-6 right-6 z-[90] w-10 h-10 rounded-full bg-white/80 dark:bg-luxury-medium/80 backdrop-blur-md border border-gold/30 flex items-center justify-center text-gold shadow-[0_4px_20px_rgba(0,0,0,0.1)] active:scale-90 transition-all"
        >
          <span className="material-symbols-outlined text-xl">
            {darkMode ? 'light_mode' : 'dark_mode'}
          </span>
        </button>
      )}

      {/* Main Content Area */}
      <main className={`flex-grow relative z-10 ${isSplash ? '' : 'pt-0 md:pt-24'}`}>
        {!isSplash && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.03] dark:opacity-[0.05]">
            <OrnamentalSVG className="absolute -top-10 -left-10 w-96 h-96 text-gold rotate-12" />
            <OrnamentalSVG className="absolute -bottom-20 -right-20 w-[30rem] h-[30rem] text-gold rotate-[160deg]" />
          </div>
        )}
        
        <div className={`relative z-10 w-full h-full ${isSplash ? '' : 'max-w-7xl mx-auto'}`}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
