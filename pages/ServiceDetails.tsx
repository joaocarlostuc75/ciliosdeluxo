
import React, { useState, useRef } from 'react';
import { Service } from '../types';

interface ServiceDetailsProps {
  service: Service;
  isAdmin?: boolean;
  onBack: () => void;
  onBook: () => void;
  onUpdate: (service: Service) => void;
}

const ServiceDetails: React.FC<ServiceDetailsProps> = ({ service, isAdmin, onBack, onBook, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedService, setEditedService] = useState<Service>(service);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    onUpdate(editedService);
    setIsEditing(false);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedService({ ...editedService, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-32">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        accept="image/*" 
        className="hidden" 
      />
      
      {/* Dynamic Header */}
      <nav className="sticky top-0 z-[110] glass px-8 py-5 flex items-center justify-between border-b border-gold/10">
        <button onClick={onBack} className="w-10 h-10 rounded-full border border-gold/20 flex items-center justify-center text-gold hover:bg-gold/10 transition-all">
          <span className="material-symbols-outlined text-lg">arrow_back_ios_new</span>
        </button>
        <span className="font-display italic text-2xl text-gold-dark dark:text-gold font-medium">
          {isEditing ? 'Curadoria' : 'Detalhes'}
        </span>
        
        {isAdmin ? (
          <button 
            onClick={() => isEditing ? handleSave() : setIsEditing(true)} 
            className="w-10 h-10 rounded-full border border-gold/20 flex items-center justify-center text-gold hover:bg-gold/10 transition-all"
          >
            <span className="material-symbols-outlined text-xl">{isEditing ? 'done' : 'auto_fix'}</span>
          </button>
        ) : (
          <div className="w-10 h-10" />
        )}
      </nav>

      <div className="max-w-6xl mx-auto px-6 pt-16 md:pt-24 flex flex-col md:grid md:grid-cols-2 gap-16 md:gap-24 items-center">
        {/* Visual Showcase */}
        <div className="w-full max-w-sm md:max-w-none reveal">
          <div 
            onClick={() => isEditing && fileInputRef.current?.click()}
            className={`eye-frame aspect-[3/4] group relative overflow-hidden ${isEditing ? 'cursor-pointer hover:opacity-90' : ''}`}
          >
            <img 
              src={isEditing ? editedService.image : service.image} 
              alt={service.name} 
              className="w-full h-full object-cover rounded-[inherit] grayscale group-hover:grayscale-0 transition-all duration-1000" 
            />
            {isEditing && (
              <div className="absolute inset-0 bg-black/40 rounded-[inherit] flex flex-col items-center justify-center p-8 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                 <span className="material-symbols-outlined text-white text-4xl mb-2">add_a_photo</span>
                 <span className="text-white text-[10px] uppercase tracking-[0.4em] font-black text-center">Clique para alterar foto da galeria</span>
              </div>
            )}
          </div>
        </div>

        {/* Narrative & Info */}
        <div className="w-full text-center md:text-left reveal" style={{ animationDelay: '300ms' }}>
          {isEditing ? (
            <input 
              className="font-display text-5xl md:text-7xl font-bold text-stone-900 dark:text-parchment-light mb-6 w-full bg-transparent border-b border-gold/30 outline-none italic"
              value={editedService.name}
              onChange={(e) => setEditedService({...editedService, name: e.target.value})}
            />
          ) : (
            <h2 className="font-display text-5xl md:text-7xl font-bold text-stone-900 dark:text-parchment-light mb-6 leading-tight italic">
              {service.name}
            </h2>
          )}

          <div className="inline-flex items-center gap-6 mb-12">
            <div className="h-[1px] w-12 bg-gold"></div>
            {isEditing ? (
              <input 
                className="text-gold-dark dark:text-gold font-semibold text-3xl tracking-tighter italic bg-transparent outline-none w-32"
                value={editedService.price}
                onChange={(e) => setEditedService({...editedService, price: e.target.value})}
              />
            ) : (
              <span className="text-gold-dark dark:text-gold font-semibold text-3xl tracking-tighter italic">
                {service.price}
              </span>
            )}
            <div className="h-[1px] w-12 bg-gold"></div>
          </div>

          <div className="space-y-8 text-stone-600 dark:text-stone-300 text-lg md:text-xl font-light leading-relaxed mb-12 italic">
            {isEditing ? (
              <textarea 
                rows={5}
                className="w-full bg-white/10 p-8 rounded-[2rem] border border-gold/10 outline-none focus:border-gold text-stone-600 dark:text-stone-200"
                value={editedService.longDescription}
                onChange={(e) => setEditedService({...editedService, longDescription: e.target.value})}
              />
            ) : (
              <p>{service.longDescription}</p>
            )}
          </div>

          {!isEditing && (
            <div className="grid grid-cols-2 gap-8 mb-16">
              <div className="border-l border-gold/30 pl-6 py-2">
                <span className="text-[10px] uppercase tracking-[0.4em] text-stone-400 dark:text-stone-500 font-bold block mb-2">Duração da Experiência</span>
                <span className="text-2xl font-display text-stone-800 dark:text-stone-100">{service.duration}</span>
              </div>
              <div className="border-l border-gold/30 pl-6 py-2">
                <span className="text-[10px] uppercase tracking-[0.4em] text-stone-400 dark:text-stone-500 font-bold block mb-2">Ciclo de Manutenção</span>
                <span className="text-2xl font-display text-stone-800 dark:text-stone-100">{service.maintenance}</span>
              </div>
            </div>
          )}

          {!isEditing && (
            <button
              onClick={onBook}
              className="w-full md:w-auto px-16 py-6 gold-gradient text-white font-black rounded-2xl shadow-2xl transition-all transform hover:scale-[1.05] active:scale-95 uppercase tracking-[0.4em] text-xs shadow-[0_10px_30px_rgba(131,102,38,0.3)]"
            >
              Iniciar Agendamento
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceDetails;
