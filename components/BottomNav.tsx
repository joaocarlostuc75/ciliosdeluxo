
import React from 'react';
import { Page } from '../types';

interface BottomNavProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activePage, onNavigate }) => {
  const items = [
    { id: Page.HOME, icon: 'home', label: 'Início' },
    { id: Page.BOOKING, icon: 'calendar_month', label: 'Agenda' },
    { id: Page.ABOUT, icon: 'history_edu', label: 'Nós' },
    { id: Page.PROFILE, icon: 'person', label: 'Perfil' },
  ];

  return (
    <nav className="fixed md:absolute bottom-0 left-0 right-0 max-w-md mx-auto h-24 bg-white/90 dark:bg-luxury-medium/95 backdrop-blur-xl border-t border-gold/10 flex items-center justify-around z-50 px-4 pb-safe-bottom rounded-t-[32px] shadow-[0_-10px_40px_rgba(197,160,89,0.1)] transition-colors duration-500">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          className={`relative flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all duration-300 ${
            activePage === item.id 
              ? 'text-gold transform -translate-y-1' 
              : 'text-stone-400 dark:text-stone-500 hover:text-gold/70'
          }`}
        >
          {activePage === item.id && (
            <span className="absolute -top-1 w-1 h-1 rounded-full bg-gold animate-pulse"></span>
          )}
          <span className={`material-symbols-outlined text-[26px] ${activePage === item.id ? 'fill-1' : 'font-light'}`}>
            {item.icon}
          </span>
          <span className="text-[9px] font-sans font-bold uppercase tracking-widest">
            {item.label}
          </span>
        </button>
      ))}
    </nav>
  );
};

export default BottomNav;
