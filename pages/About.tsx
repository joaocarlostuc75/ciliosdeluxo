
import React, { useState, useRef } from 'react';
import { User, TeamMember } from '../types';

interface AboutProps {
  studio: User;
  setStudio: (studio: User) => void;
  isAdmin?: boolean;
}

const About: React.FC<AboutProps> = ({ studio, setStudio, isAdmin }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedStudio, setEditedStudio] = useState<User>(studio);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const teamImageInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    setStudio(editedStudio);
    setIsEditing(false);
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedStudio({ ...editedStudio, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTeamImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && editingMemberId) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newTeam = editedStudio.team?.map(member => 
          member.id === editingMemberId ? { ...member, image: reader.result as string } : member
        );
        setEditedStudio({ ...editedStudio, team: newTeam });
        setEditingMemberId(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateTeamMember = (id: string, field: keyof TeamMember, value: string) => {
    const newTeam = editedStudio.team?.map(member => 
      member.id === id ? { ...member, [field]: value } : member
    );
    setEditedStudio({ ...editedStudio, team: newTeam });
  };

  const addTeamMember = () => {
    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: 'Novo Especialista',
      role: 'Cargo / Especialidade',
      image: 'https://picsum.photos/seed/' + Math.random() + '/200/200'
    };
    setEditedStudio({
      ...editedStudio,
      team: [...(editedStudio.team || []), newMember]
    });
  };

  const removeTeamMember = (id: string) => {
    setEditedStudio({
      ...editedStudio,
      team: editedStudio.team?.filter(member => member.id !== id)
    });
  };

  return (
    <div className="pb-32 pt-12 md:pt-20 px-6 max-w-7xl mx-auto w-full">
      <input type="file" ref={logoInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
      <input type="file" ref={teamImageInputRef} onChange={handleTeamImageUpload} accept="image/*" className="hidden" />
      
      {/* Header Section */}
      <header className="mb-16 md:mb-24 text-center relative">
        <div className="relative z-10">
          <span className="text-gold dark:text-gold-light text-xs font-black uppercase tracking-[0.5em] mb-4 block animate-in slide-in-from-bottom-4 fade-in duration-700">
            Nossa Essência
          </span>
          <h2 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-stone-900 dark:text-parchment-light mb-6 italic animate-in slide-in-from-bottom-6 fade-in duration-700 delay-100">
            Sobre Nós
          </h2>
          <div className="w-24 h-[1px] bg-gold mx-auto animate-in zoom-in duration-700 delay-200"></div>
        </div>

        {isAdmin && (
          <div className="absolute top-0 right-0 z-20">
             <button 
              onClick={() => isEditing ? handleSave() : setIsEditing(true)} 
              className="flex items-center gap-2 px-4 py-2 bg-gold/5 hover:bg-gold/10 text-gold-dark dark:text-gold rounded-full transition-all border border-gold/20 backdrop-blur-sm"
            >
              <span className="material-symbols-outlined text-lg">
                {isEditing ? 'check' : 'edit'}
              </span>
              <span className="text-[9px] uppercase font-bold tracking-widest hidden md:inline">
                {isEditing ? 'Salvar' : 'Editar'}
              </span>
            </button>
          </div>
        )}
      </header>

      <div className="flex flex-col lg:flex-row items-center lg:items-start gap-12 lg:gap-24 mb-32">
        {/* Visual Branding */}
        <div className="lg:w-1/3 flex flex-col items-center lg:sticky lg:top-40 animate-in fade-in slide-in-from-left-8 duration-1000 delay-300">
          <div 
            onClick={isEditing && isAdmin ? () => logoInputRef.current?.click() : undefined}
            className={`w-40 h-40 md:w-64 md:h-64 rounded-full border-2 border-gold flex items-center justify-center bg-white dark:bg-luxury-black shadow-[0_50px_100px_rgba(197,160,89,0.2)] relative mb-8 overflow-hidden group transition-all ${isEditing && isAdmin ? 'cursor-pointer hover:border-gold-dark scale-105' : ''}`}
          >
            {isEditing && isAdmin && (
              <div className="absolute inset-0 z-20 bg-black/40 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                 <span className="material-symbols-outlined text-white text-3xl mb-2">upload</span>
                 <span className="text-white text-[10px] uppercase tracking-widest font-bold">Trocar Logotipo</span>
              </div>
            )}
            {(isEditing ? editedStudio.image : studio.image) ? (
              <img src={isEditing ? editedStudio.image : studio.image} alt={studio.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
            ) : (
              <div className="text-center p-8">
                <span className="material-symbols-outlined text-gold text-5xl block mb-4">visibility</span>
                <h1 className="font-display text-[10px] font-bold gold-gradient-text uppercase tracking-[0.3em]">{studio.name}</h1>
              </div>
            )}
          </div>
        </div>

        {/* Narrative Content */}
        <div className="lg:w-2/3 space-y-16 md:space-y-20 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
          <section>
            <h3 className="font-display text-4xl md:text-5xl text-gold-dark dark:text-gold mb-6 md:mb-8 opacity-80 italic text-center lg:text-left">Nossa Jornada</h3>
            {isEditing && isAdmin ? (
              <textarea 
                rows={6}
                className="w-full bg-white/40 dark:bg-luxury-medium/40 p-8 rounded-3xl border border-gold/10 outline-none text-lg leading-relaxed italic focus:border-gold transition-colors text-stone-600 dark:text-stone-200"
                value={editedStudio.history}
                onChange={(e) => setEditedStudio({...editedStudio, history: e.target.value})}
              />
            ) : (
              <p className="text-lg md:text-xl text-stone-600 dark:text-stone-300 leading-relaxed font-light italic text-center lg:text-left">
                {studio.history}
              </p>
            )}
          </section>

          <section className="bg-gold/[0.03] p-10 md:p-20 rounded-[3rem] border border-gold/5 relative overflow-hidden">
             <span className="material-symbols-outlined absolute -top-10 -right-10 text-[15rem] text-gold/[0.02] pointer-events-none">format_quote</span>
             <h3 className="font-display text-2xl md:text-3xl text-gold-dark mb-8 italic text-center md:text-left">O que nos move</h3>
             {isEditing && isAdmin ? (
                <textarea 
                  rows={4}
                  className="w-full bg-transparent border-b border-gold/20 outline-none text-2xl text-center font-display italic text-gold-dark"
                  value={editedStudio.mission}
                  onChange={(e) => setEditedStudio({...editedStudio, mission: e.target.value})}
                />
              ) : (
                <p className="text-2xl md:text-4xl font-display italic text-gold-dark dark:text-gold leading-tight text-center">
                  "{studio.mission}"
                </p>
              )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-8 md:mb-12">
              <h3 className="font-display text-3xl md:text-4xl text-gold-dark dark:text-gold italic">Especialista(s)</h3>
              {isEditing && isAdmin && (
                <button 
                  onClick={addTeamMember}
                  className="flex items-center gap-2 px-6 py-3 bg-gold/10 border border-gold/20 text-gold rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-gold hover:text-white transition-all"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  Adicionar Especialista
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {(isEditing ? editedStudio.team : studio.team)?.map((member) => (
                <div key={member.id} className="relative flex flex-col md:flex-row items-center md:items-start gap-6 bg-white/40 dark:bg-luxury-medium/40 p-6 rounded-3xl border border-gold/5 group hover:border-gold/30 transition-all shadow-sm">
                  {isEditing && isAdmin && (
                    <button 
                      onClick={() => removeTeamMember(member.id)}
                      className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform z-10"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  )}
                  
                  <div 
                    className={`relative w-32 h-32 md:w-40 md:h-40 flex-shrink-0 ${isEditing && isAdmin ? 'cursor-pointer group/img' : ''}`}
                    onClick={() => {
                      if (isEditing && isAdmin) {
                        setEditingMemberId(member.id);
                        teamImageInputRef.current?.click();
                      }
                    }}
                  >
                    <img 
                      src={member.image} 
                      alt={member.name} 
                      className={`w-full h-full rounded-2xl object-cover shadow-lg ${!isEditing ? 'grayscale group-hover:grayscale-0' : ''} transition-all duration-700`} 
                    />
                    {isEditing && isAdmin && (
                      <div className="absolute inset-0 bg-black/40 rounded-2xl flex flex-col items-center justify-center p-2 backdrop-blur-[2px] opacity-0 group-hover/img:opacity-100 transition-opacity">
                         <span className="material-symbols-outlined text-white text-2xl mb-1">add_a_photo</span>
                         <span className="text-white text-[8px] uppercase font-bold tracking-widest text-center">Alterar Foto</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-grow flex flex-col justify-center text-center md:text-left">
                    {isEditing && isAdmin ? (
                      <div className="space-y-3">
                        <input 
                          type="text"
                          value={member.name}
                          onChange={(e) => updateTeamMember(member.id, 'name', e.target.value)}
                          className="w-full bg-transparent border-b border-gold/20 font-display text-xl text-stone-800 dark:text-stone-200 outline-none"
                          placeholder="Nome"
                        />
                        <input 
                          type="text"
                          value={member.role}
                          onChange={(e) => updateTeamMember(member.id, 'role', e.target.value)}
                          className="w-full bg-transparent border-b border-gold/10 text-[9px] uppercase tracking-widest text-gold font-bold outline-none"
                          placeholder="Cargo / Especialidade"
                        />
                      </div>
                    ) : (
                      <>
                        <p className="font-display text-2xl text-stone-800 dark:text-parchment-light">{member.name}</p>
                        <p className="text-[10px] text-gold uppercase tracking-[0.3em] font-bold mt-2">{member.role}</p>
                        <div className="mt-4 flex gap-3 justify-center md:justify-start">
                          <span className="material-symbols-outlined text-gold/30 text-sm">verified</span>
                          <span className="material-symbols-outlined text-gold/30 text-sm">stars</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default About;
