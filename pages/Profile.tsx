import React, { useState, useRef, useMemo, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Appointment, Page, Service, Client, BusinessHours, AgendaBlock } from '../types';

interface ProfileProps {
  studio: User;
  setStudio: (studio: User) => void;
  client: User;
  setClient: (client: User) => void;
  clients: Client[];
  services: Service[];
  allAppointments: Appointment[];
  availableDays: number[];
  setAvailableDays: (days: number[]) => void;
  isAdmin: boolean;
  setIsAdmin: (isAdmin: boolean) => void;
  onNavigate: (page: Page) => void;
  onUpdateService: (s: Service) => void;
  onDeleteService: (id: string) => void;
  onAddService: (s: Service) => void;
  onUpdateAppointment: (a: Appointment) => void;
  onDeleteAppointment: (id: string) => void;
  onUpdateClient: (c: Client) => void;
  onDeleteClient: (id: string) => void;
  onAddClient: (c: Client) => void;
  onCancelAppointment: (id: string) => void;
  onRescheduleAppointment: (id: string) => void;
  onUpdateBusinessHours: (hours: BusinessHours[]) => void;
  onAddBlock: (block: AgendaBlock) => void;
  onDeleteBlock: (id: string) => void;
  currentYear: number;
  adminPassword?: string;
  setAdminPassword?: (pass: string) => void;
  onUpdateProfile?: (studio: User) => void;
  onClearSystem?: () => void;
}

const Profile: React.FC<ProfileProps> = ({
  studio, setStudio, client, setClient, clients, services, allAppointments,
  availableDays, setAvailableDays, isAdmin, setIsAdmin, onNavigate,
  onUpdateService, onDeleteService, onAddService,
  onUpdateAppointment, onDeleteAppointment,
  onUpdateClient, onDeleteClient, onAddClient,
  onCancelAppointment, onRescheduleAppointment,
  onUpdateBusinessHours, onAddBlock, onDeleteBlock,
  currentYear,
  adminPassword, setAdminPassword,
  onUpdateProfile,
  onClearSystem
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'history' | 'admin_dashboard'>(isAdmin ? 'admin_dashboard' : 'profile');
  const [adminSection, setAdminSection] = useState<'stats' | 'services' | 'clients' | 'agenda' | 'settings'>(() => {
    const savedSection = localStorage.getItem('adminSection');
    return (savedSection as any) || 'stats';
  });

  useEffect(() => {
    if (isAdmin) {
      localStorage.setItem('adminSection', adminSection);
    }
  }, [adminSection, isAdmin]);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  const [currentPassInput, setCurrentPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [confirmPassInput, setConfirmPassInput] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  const [newBlockStart, setNewBlockStart] = useState('');
  const [newBlockEnd, setNewBlockEnd] = useState('');
  const [newBlockReason, setNewBlockReason] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const serviceImageInputRef = useRef<HTMLInputElement>(null);

  const parsePrice = (priceStr: string) => {
    return parseFloat(priceStr.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
  };

  const stats = useMemo(() => {
    const totalRevenue = allAppointments
      .filter(a => a.status === 'COMPLETED')
      .reduce((sum, a) => sum + parsePrice(a.price), 0);

    const pendingRevenue = allAppointments
      .filter(a => a.status === 'SCHEDULED')
      .reduce((sum, a) => sum + parsePrice(a.price), 0);

    const completedCount = allAppointments.filter(a => a.status === 'COMPLETED').length;
    const ticketMedio = completedCount > 0 ? totalRevenue / completedCount : 0;

    const popularServices = services.map(s => ({
      name: s.name,
      count: allAppointments.filter(a => a.serviceId === s.id).length
    })).sort((a, b) => b.count - a.count);

    return { totalRevenue, pendingRevenue, ticketMedio, popularServices };
  }, [allAppointments, services]);

  const handleLogoutAdmin = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      onNavigate(Page.HOME);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const canvas = document.createElement('canvas');
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
          const maxWidth = 200, maxHeight = 200;
          let width = img.width, height = img.height;
          if (width > height) { if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; } }
          else { if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; } }
          canvas.width = width; canvas.height = height;
          canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.7);
          if (isAdmin) setStudio({ ...studio, image: compressed });
          else setClient({ ...client, image: compressed });
        };
      } catch (e) { console.error(e); }
    }
  };

  const handleServiceImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && editingServiceId) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result as string;
        const service = services.find(s => s.id === editingServiceId);
        if (service) onUpdateService({ ...service, image: imageData });
        setEditingServiceId(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChangePassword = async () => {
    if (newPassInput.length < 6) { setPasswordMsg('A nova senha deve ter pelo menos 6 caracteres.'); return; }
    if (newPassInput !== confirmPassInput) { setPasswordMsg('A nova senha e a confirmação não coincidem.'); return; }

    const { error } = await supabase.auth.updateUser({ password: newPassInput });

    if (error) {
      setPasswordMsg(`Erro: ${error.message}`);
    } else {
      setPasswordMsg('Senha alterada com sucesso!');
      setCurrentPassInput(''); setNewPassInput(''); setConfirmPassInput('');
    }
  };

  const sendReminder = (app: Appointment, hours: string) => {
    const cleanNumber = app.clientWhatsapp.replace(/\D/g, '');
    const dateFormatted = String(app.date).includes('-') ? app.date.split('-').reverse().join('/') : app.date;
    let text = `✨ *Lembrete: Seu Momento de Luxo está chegando!* ✨\n\nOlá, *${app.clientName}*! Tudo bem?\n\nPassando para confirmar seu agendamento de *${app.serviceName}* conosco:\n\n📅 *Data:* ${dateFormatted}\n⏰ *Horário:* ${app.time}\n📍 *Local:* ${studio.address}\n\nEstamos ansiosos para te proporcionar uma experiência incrível!\n\n_Att., Equipe ${studio.name}_`;
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`);
  };

  const sendAdminConfirmation = (app: Appointment) => {
    const cleanNumber = app.clientWhatsapp.replace(/\D/g, '');
    let text = `✅ *Confirmação ${studio.name}* ✅\n\nOlá ${app.clientName}, seu agendamento de *${app.serviceName}* para o dia ${app.date} às ${app.time} foi confirmado com sucesso!\n\nAté logo! ✨`;
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'text-gold-dark dark:text-gold-light border-gold/40 bg-gold/10 font-bold';
      case 'COMPLETED': return 'text-emerald-700 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 font-bold';
      case 'CANCELLED': return 'text-rose-600 dark:text-rose-400 border-rose-500/30 bg-rose-500/10 font-bold';
      default: return 'text-stone-500 dark:text-stone-300 border-stone-500/20 bg-stone-500/5 font-bold';
    }
  };

  return (
    <div className="pb-32 px-6 pt-12 min-h-screen max-w-4xl mx-auto flex flex-col relative overflow-x-hidden">
      <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
      <input type="file" ref={serviceImageInputRef} onChange={handleServiceImageUpload} accept="image/*" className="hidden" />

      <div className="flex-grow">
        <header className="flex flex-col items-center mb-10">
          <div className="relative group" onClick={() => fileInputRef.current?.click()}>
            <div className="w-28 h-28 rounded-full border-2 border-gold p-1 shadow-2xl relative overflow-hidden bg-parchment-light dark:bg-luxury-medium flex items-center justify-center cursor-pointer transition-all">
              {(isAdmin ? studio.image : client.image) ? (
                <img src={isAdmin ? studio.image : client.image} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-gold text-5xl">person</span>
              )}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="material-symbols-outlined text-white">upload</span>
              </div>
            </div>
          </div>
          <h2 className="mt-4 font-display text-2xl font-bold text-stone-900 dark:text-parchment-light text-center uppercase tracking-tight">
            {isAdmin ? (studio.ownerName || 'Hub Administrativo') : (client.name || 'Seu Perfil')}
          </h2>
          <p className="text-[10px] text-gold dark:text-gold-light uppercase tracking-[0.3em] font-black mt-1">
            {isAdmin ? `Gestão ${studio.name}` : 'Membro Exclusivo'}
          </p>
        </header>

        <div className="flex border-b border-gold/20 mb-8 overflow-hidden rounded-t-2xl">
          {isAdmin ? (
            <button onClick={() => setActiveTab('admin_dashboard')} className={`flex-1 py-4 text-[10px] uppercase tracking-widest font-black transition-all ${activeTab === 'admin_dashboard' ? 'bg-gold/10 text-gold-dark dark:text-gold-light border-b-2 border-gold' : 'text-stone-500 dark:text-stone-400'}`}>Painel Gestor</button>
          ) : (
            <>
              <button onClick={() => setActiveTab('profile')} className={`flex-1 py-4 text-[10px] uppercase tracking-widest font-black transition-all ${activeTab === 'profile' ? 'bg-gold/10 text-gold-dark dark:text-gold-light border-b-2 border-gold' : 'text-stone-500 dark:text-stone-400'}`}>Dados</button>
              <button onClick={() => setActiveTab('history')} className={`flex-1 py-4 text-[10px] uppercase tracking-widest font-black transition-all ${activeTab === 'history' ? 'bg-gold/10 text-gold-dark dark:text-gold-light border-b-2 border-gold' : 'text-stone-500 dark:text-stone-400'}`}>Agenda</button>
            </>
          )}
        </div>

        {activeTab === 'admin_dashboard' && isAdmin && (
          <div className="animate-in fade-in duration-300">
            <nav className="flex gap-4 mb-8 no-scrollbar overflow-x-auto pb-2">
              {[
                { id: 'stats', label: 'Financeiro', icon: 'payments' },
                { id: 'services', label: 'Serviços', icon: 'content_cut' },
                { id: 'agenda', label: 'Agenda', icon: 'calendar_month' },
                { id: 'clients', label: 'Clientes', icon: 'group' },
                { id: 'settings', label: 'Perfil', icon: 'storefront' },
              ].map(sec => (
                <button key={sec.id} onClick={() => setAdminSection(sec.id as any)} className={`flex items-center gap-2 px-6 py-3 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${adminSection === sec.id ? 'bg-gold border-gold text-white shadow-lg' : 'bg-white/60 dark:bg-luxury-medium/40 border-gold/10 text-stone-500 dark:text-stone-200'}`}>
                  <span className="material-symbols-outlined text-sm font-bold">{sec.icon}</span>
                  {sec.label}
                </button>
              ))}
            </nav>

            {adminSection === 'stats' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-6 bg-gold/10 border border-gold/20 rounded-3xl text-center backdrop-blur-sm">
                    <span className="text-[9px] uppercase tracking-widest text-stone-600 block mb-1 font-black">Faturamento Realizado</span>
                    <span className="text-3xl font-display text-emerald-700 block font-black">R$ {stats.totalRevenue.toFixed(2)}</span>
                  </div>
                  <div className="p-6 bg-gold/10 border border-gold/20 rounded-3xl text-center backdrop-blur-sm">
                    <span className="text-[9px] uppercase tracking-widest text-stone-600 block mb-1 font-black">Faturamento Previsto</span>
                    <span className="text-3xl font-display text-gold-dark block font-black">R$ {stats.pendingRevenue.toFixed(2)}</span>
                  </div>
                  <div className="p-6 bg-gold/10 border border-gold/20 rounded-3xl text-center backdrop-blur-sm">
                    <span className="text-[9px] uppercase tracking-widest text-stone-600 block mb-1 font-black">Ticket Médio</span>
                    <span className="text-3xl font-display text-stone-900 block font-black">R$ {stats.ticketMedio.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {adminSection === 'services' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[11px] uppercase tracking-widest text-stone-500 font-black">Catálogo de Serviços</h3>
                  <button onClick={() => onAddService({ id: Date.now().toString(), name: 'Nova Técnica', price: 'R$ 130,00', description: '', longDescription: '', duration: '2h', maintenance: '20 dias', image: 'https://picsum.photos/seed/new/600/800' })} className="px-6 py-3 gold-gradient text-white text-[9px] font-black uppercase rounded-full shadow-lg">Novo Serviço</button>
                </div>
                {services.map(s => (
                  <div key={s.id} className="p-6 bg-white/80 dark:bg-luxury-medium/40 border border-gold/10 rounded-[2rem] flex items-center justify-between group shadow-sm transition-all hover:border-gold/30">
                    <div className="flex items-center gap-6 flex-grow">
                      <div className="relative cursor-pointer" onClick={() => { setEditingServiceId(s.id); serviceImageInputRef.current?.click(); }}>
                        <img src={s.image} className="w-16 h-16 rounded-2xl object-cover border-2 border-gold/10" alt={s.name} />
                      </div>
                      <div className="flex flex-col flex-grow">
                        <input className="font-display text-lg font-bold bg-transparent text-stone-900 dark:text-parchment-light outline-none" value={s.name} onChange={(e) => onUpdateService({ ...s, name: e.target.value })} />
                        <input className="text-[10px] text-gold-dark uppercase tracking-widest font-black bg-transparent outline-none" value={s.price} onChange={(e) => onUpdateService({ ...s, price: e.target.value })} />
                      </div>
                    </div>
                    <button onClick={() => onDeleteService(s.id)} className="text-stone-400 hover:text-red-500 p-2"><span className="material-symbols-outlined">delete</span></button>
                  </div>
                ))}
              </div>
            )}

            {adminSection === 'agenda' && (
              <div className="space-y-12">
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-gold/70 text-base">list_alt</span>
                    <h3 className="text-[11px] uppercase tracking-widest text-stone-500 font-black">Agendamentos Realizados</h3>
                  </div>
                  <div className="space-y-4">
                    {allAppointments && allAppointments.length > 0 ? (
                      [...allAppointments].filter(app => app.status !== 'CANCELLED').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(app => (
                        <div key={app.id} className="p-6 bg-white/80 dark:bg-luxury-medium/40 rounded-[2rem] border border-gold/10 shadow-sm transition-all hover:border-gold/30">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-gold/10 flex flex-col items-center justify-center text-gold">
                                <span className="text-lg font-black">{app.date.split('-')[2]}</span>
                                <span className="text-[8px] uppercase">{app.month.substring(0, 3)}</span>
                              </div>
                              <div>
                                <h5 className="font-bold text-stone-900 dark:text-parchment-light">{app.clientName}</h5>
                                <p className="text-[10px] text-stone-500 uppercase">{app.time} • {app.serviceName}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <select value={app.status} onChange={(e) => onUpdateAppointment({ ...app, status: e.target.value as any })} className={`text-[9px] uppercase font-black border-2 rounded-full px-4 py-1.5 bg-transparent ${getStatusStyle(app.status)}`}>
                                <option value="SCHEDULED">Agendado</option>
                                <option value="COMPLETED">Concluído</option>
                                <option value="CANCELLED">Cancelado</option>
                              </select>
                              <button onClick={() => onRescheduleAppointment(app.id)} className="text-emerald-500 p-2"><span className="material-symbols-outlined text-sm">edit_calendar</span></button>
                              <button onClick={() => onCancelAppointment(app.id)} className="text-rose-400 p-2"><span className="material-symbols-outlined text-sm">block</span></button>
                              <button onClick={() => onDeleteAppointment(app.id)} className="text-stone-400 p-2"><span className="material-symbols-outlined text-sm">delete</span></button>
                            </div>
                          </div>
                          {app.status === 'SCHEDULED' && (
                            <div className="mt-4 pt-4 border-t border-gold/5 flex gap-2 justify-end items-center">
                              <span className="text-[8px] uppercase font-black text-stone-400 mr-2">Enviar Lembrete:</span>
                              <button onClick={() => sendReminder(app, '48h')} className="px-3 py-1 bg-stone-100 rounded text-[8px] font-bold uppercase hover:bg-gold/10">48h</button>
                              <button onClick={() => sendReminder(app, '24h')} className="px-3 py-1 bg-stone-100 rounded text-[8px] font-bold uppercase hover:bg-gold/10">24h</button>
                              <button onClick={() => sendReminder(app, '2h')} className="px-3 py-1 bg-stone-100 rounded text-[8px] font-bold uppercase hover:bg-gold/10">2h</button>
                              <button onClick={() => sendAdminConfirmation(app)} className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded text-[8px] font-bold uppercase flex items-center gap-1"><span className="material-symbols-outlined text-[10px]">check</span> Confirmar</button>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-12 text-center text-stone-400 italic">Nenhum agendamento encontrado.</div>
                    )}
                  </div>
                </div>

                <div className="space-y-6 pt-12 border-t border-gold/10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-gold/70 text-base">schedule</span>
                    <h3 className="text-[11px] uppercase tracking-widest text-stone-500 font-black">Horários de Funcionamento</h3>
                  </div>
                  <p className="text-[10px] text-stone-400 font-bold -mt-4 mb-4">Configure os horários de funcionamento do estabelecimento.</p>
                  <div className="grid grid-cols-1 gap-4">
                    {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((dayName, i) => {
                      const dayOfWeek = (i + 1) % 7;
                      const hourConfig = studio.businessHours?.find(h => h.dayOfWeek === dayOfWeek) || { dayOfWeek, isOpen: false, slots: [] };
                      return (
                        <div key={dayOfWeek} className="p-6 bg-white dark:bg-luxury-medium/20 rounded-[2rem] border border-gold/10 shadow-sm transition-all hover:border-gold/30">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <span className={`w-3 h-3 rounded-full ${hourConfig.isOpen ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-stone-300'}`}></span>
                              <span className="text-[11px] uppercase font-black text-stone-700 tracking-widest">{dayName}</span>
                            </div>
                            <button
                              onClick={() => {
                                const newHours = [...(studio.businessHours || [])];
                                const idx = newHours.findIndex(h => h.dayOfWeek === dayOfWeek);
                                if (idx >= 0) {
                                  newHours[idx] = { ...newHours[idx], isOpen: !newHours[idx].isOpen };
                                } else {
                                  newHours.push({ dayOfWeek, isOpen: true, slots: [{ start: '08:00', end: '12:00' }, { start: '14:00', end: '18:00' }] });
                                }
                                onUpdateBusinessHours(newHours);
                              }}
                              className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${hourConfig.isOpen ? 'bg-gold/10 text-gold-dark border border-gold/20' : 'bg-stone-100 text-stone-400 border border-stone-200'}`}
                            >
                              {hourConfig.isOpen ? 'Aberto' : 'Fechado'}
                            </button>
                          </div>

                          {hourConfig.isOpen && (
                            <div className="space-y-3">
                              {(hourConfig.slots.length > 0 ? hourConfig.slots : [{ start: '08:00', end: '18:00' }]).map((slot, sIdx) => (
                                <div key={sIdx} className="flex items-center justify-between bg-gold/[0.03] p-3 rounded-xl border border-gold/5">
                                  <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-gold text-xs">schedule</span>
                                    <input
                                      type="time"
                                      value={slot.start}
                                      onChange={(e) => {
                                        const newHours = [...(studio.businessHours || [])];
                                        const dIdx = newHours.findIndex(h => h.dayOfWeek === dayOfWeek);
                                        const newSlots = [...newHours[dIdx].slots];
                                        newSlots[sIdx] = { ...newSlots[sIdx], start: e.target.value };
                                        newHours[dIdx] = { ...newHours[dIdx], slots: newSlots };
                                        onUpdateBusinessHours(newHours);
                                      }}
                                      className="bg-transparent text-[11px] font-black text-stone-600 outline-none"
                                    />
                                    <span className="text-gold/40">às</span>
                                    <input
                                      type="time"
                                      value={slot.end}
                                      onChange={(e) => {
                                        const newHours = [...(studio.businessHours || [])];
                                        const dIdx = newHours.findIndex(h => h.dayOfWeek === dayOfWeek);
                                        const newSlots = [...newHours[dIdx].slots];
                                        newSlots[sIdx] = { ...newSlots[sIdx], end: e.target.value };
                                        newHours[dIdx] = { ...newHours[dIdx], slots: newSlots };
                                        onUpdateBusinessHours(newHours);
                                      }}
                                      className="bg-transparent text-[11px] font-black text-stone-600 outline-none"
                                    />
                                  </div>
                                  <button
                                    onClick={() => {
                                      const newHours = [...(studio.businessHours || [])];
                                      const dIdx = newHours.findIndex(h => h.dayOfWeek === dayOfWeek);
                                      const newSlots = newHours[dIdx].slots.filter((_, i) => i !== sIdx);
                                      newHours[dIdx] = { ...newHours[dIdx], slots: newSlots };
                                      onUpdateBusinessHours(newHours);
                                    }}
                                    className="text-stone-300 hover:text-rose-500 transition-colors"
                                  >
                                    <span className="material-symbols-outlined text-xs">close</span>
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={() => {
                                  const newHours = [...(studio.businessHours || [])];
                                  const dIdx = newHours.findIndex(h => h.dayOfWeek === dayOfWeek);
                                  const lastSlot = newHours[dIdx].slots[newHours[dIdx].slots.length - 1];
                                  newHours[dIdx] = {
                                    ...newHours[dIdx],
                                    slots: [...newHours[dIdx].slots, { start: lastSlot?.end || '14:00', end: '18:00' }]
                                  };
                                  onUpdateBusinessHours(newHours);
                                }}
                                className="w-full py-2 border border-dashed border-gold/20 rounded-xl text-[8px] uppercase font-black text-gold/60 hover:bg-gold/5 transition-all"
                              >
                                + Adicionar Período
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-6 pt-12 border-t border-gold/10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-gold/70 text-base">block</span>
                    <h3 className="text-[11px] uppercase tracking-widest text-stone-500 font-black">Bloqueios de Agenda</h3>
                  </div>
                  <p className="text-[10px] text-stone-400 font-bold -mt-4 mb-4">Bloqueie horários específicos (férias, feriados, manutenção).</p>

                  <div className="bg-white/80 dark:bg-luxury-medium/40 p-6 rounded-3xl border border-gold/10 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[8px] uppercase font-black text-stone-500 mb-1 block">Início</span>
                        <input type="date" value={newBlockStart} onChange={e => setNewBlockStart(e.target.value)} className="w-full bg-stone-50 p-3 rounded-xl text-xs outline-none border border-gold/5" />
                      </div>
                      <div>
                        <span className="text-[8px] uppercase font-black text-stone-500 mb-1 block">Fim</span>
                        <input type="date" value={newBlockEnd} onChange={e => setNewBlockEnd(e.target.value)} className="w-full bg-stone-50 p-3 rounded-xl text-xs outline-none border border-gold/5" />
                      </div>
                    </div>
                    <input type="text" placeholder="Motivo (ex: Férias, Manutenção)" value={newBlockReason} onChange={e => setNewBlockReason(e.target.value)} className="w-full bg-stone-50 p-3 rounded-xl text-xs outline-none border border-gold/5" />
                    <button
                      onClick={() => {
                        if (newBlockStart && newBlockEnd) {
                          onAddBlock({ id: '', startDate: newBlockStart, endDate: newBlockEnd, reason: newBlockReason });
                          setNewBlockStart(''); setNewBlockEnd(''); setNewBlockReason('');
                        }
                      }}
                      className="w-full py-4 gold-gradient text-white rounded-xl text-[10px] font-black uppercase shadow-lg"
                    >
                      Adicionar Bloqueio
                    </button>
                  </div>

                  <div className="space-y-3">
                    {studio.blocks?.map(block => (
                      <div key={block.id} className="p-4 bg-white border border-rose-500/10 rounded-2xl flex items-center justify-between shadow-sm">
                        <div>
                          <p className="text-xs font-bold text-stone-900">{block.reason || 'Bloqueio sem motivo'}</p>
                          <p className="text-[9px] text-stone-500 uppercase font-bold">{block.startDate.split('-').reverse().join('/')} até {block.endDate.split('-').reverse().join('/')}</p>
                        </div>
                        <button onClick={() => onDeleteBlock(block.id)} className="text-rose-400 hover:text-rose-600"><span className="material-symbols-outlined text-sm">delete</span></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {adminSection === 'clients' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[11px] uppercase tracking-widest text-stone-500 font-black">Base de Clientes</h3>
                  <button onClick={() => onAddClient({ id: Date.now().toString(), name: 'Novo Cliente', whatsapp: '+55', totalSpent: 0, notes: '' } as any)} className="px-6 py-3 gold-gradient text-white text-[9px] font-black uppercase rounded-full shadow-lg">Novo Cliente</button>
                </div>
                {clients.map(c => (
                  <div key={c.id} className="p-6 bg-white/80 dark:bg-luxury-medium/40 border border-gold/10 rounded-[2rem] shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full border border-gold/20 flex items-center justify-center text-gold bg-gold/5"><span className="material-symbols-outlined">person</span></div>
                        <div>
                          <input className="font-display font-black text-lg bg-transparent text-stone-900 dark:text-parchment-light outline-none" value={c.name} onChange={(e) => onUpdateClient({ ...c, name: e.target.value })} />
                          <input className="text-[10px] text-stone-500 bg-transparent outline-none" value={c.whatsapp} onChange={(e) => onUpdateClient({ ...c, whatsapp: e.target.value })} />
                        </div>
                      </div>
                      <button onClick={() => onDeleteClient(c.id)} className="text-red-500/50 hover:text-red-500"><span className="material-symbols-outlined">delete</span></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {adminSection === 'settings' && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-gold">storefront</span>
                  <h3 className="text-[11px] uppercase tracking-widest font-black text-stone-600">Configurações do Estúdio</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-white/80 dark:bg-luxury-medium/40 rounded-3xl border border-gold/10">
                    <span className="text-[9px] uppercase tracking-widest text-gold-dark font-black mb-2 block">Estabelecimento</span>
                    <input type="text" value={studio.name} onChange={(e) => setStudio({ ...studio, name: e.target.value })} className="w-full bg-transparent font-display text-lg font-bold text-stone-900 dark:text-parchment-light outline-none" />
                  </div>
                  <div className="p-6 bg-white/80 dark:bg-luxury-medium/40 rounded-3xl border border-gold/10">
                    <span className="text-[9px] uppercase tracking-widest text-gold-dark font-black mb-2 block">Proprietário</span>
                    <input type="text" value={studio.ownerName || ''} onChange={(e) => setStudio({ ...studio, ownerName: e.target.value })} className="w-full bg-transparent font-display text-lg font-bold text-stone-900 dark:text-parchment-light outline-none" />
                  </div>
                  <div className="p-6 bg-white/80 dark:bg-luxury-medium/40 rounded-3xl border border-gold/10">
                    <span className="text-[9px] uppercase tracking-widest text-gold-dark font-black mb-2 block">WhatsApp do Estúdio</span>
                    <input type="text" value={studio.whatsapp} onChange={(e) => setStudio({ ...studio, whatsapp: e.target.value })} className="w-full bg-transparent font-display text-lg font-bold text-stone-900 dark:text-parchment-light outline-none" />
                  </div>
                  <div className="p-6 bg-white/80 dark:bg-luxury-medium/40 rounded-3xl border border-gold/10 md:col-span-2">
                    <span className="text-[9px] uppercase tracking-widest text-gold-dark font-black mb-2 block">Endereço</span>
                    <input type="text" value={studio.address} onChange={(e) => setStudio({ ...studio, address: e.target.value })} className="w-full bg-transparent font-bold text-stone-900 dark:text-parchment-light outline-none" />
                  </div>
                  <div className="p-6 bg-white/80 dark:bg-luxury-medium/40 rounded-3xl border border-gold/10 md:col-span-2">
                    <span className="text-[9px] uppercase tracking-widest text-gold-dark font-black mb-2 block">Nossa Jornada</span>
                    <textarea rows={4} value={studio.history || ''} onChange={(e) => setStudio({ ...studio, history: e.target.value })} className="w-full bg-transparent font-sans text-sm text-stone-600 dark:text-stone-300 outline-none resize-none" placeholder="Conte a história do seu estúdio..." />
                  </div>
                  <div className="p-6 bg-white/80 dark:bg-luxury-medium/40 rounded-3xl border border-gold/10 md:col-span-2">
                    <span className="text-[9px] uppercase tracking-widest text-gold-dark font-black mb-2 block">O que nos move</span>
                    <textarea rows={2} value={studio.mission || ''} onChange={(e) => setStudio({ ...studio, mission: e.target.value })} className="w-full bg-transparent font-display text-lg italic text-gold-dark outline-none resize-none" placeholder="Sua missão ou frase de impacto..." />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button onClick={() => onUpdateProfile && onUpdateProfile(studio)} className="px-8 py-4 gold-gradient text-white rounded-2xl text-[10px] uppercase font-black shadow-lg">Salvar Perfil</button>
                </div>

                <div className="mt-8 pt-8 border-t border-gold/10 space-y-6">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-gold">badge</span>
                    <h3 className="text-[11px] uppercase tracking-widest font-black text-stone-600">Administradores</h3>
                  </div>
                  <div className="p-6 bg-white/80 dark:bg-luxury-medium/40 border border-gold/10 rounded-[2.5rem]">
                    <p className="text-xs text-stone-500 mb-4">Gerencie quem tem acesso ao painel deste estúdio.</p>
                    {/* Placeholder for future listing implementation */}
                    <button onClick={() => alert('Funcionalidade de convite em breve!')} className="w-full py-3 border border-dashed border-gold/30 text-gold-dark rounded-xl text-[9px] uppercase font-black hover:bg-gold/5">+ Adicionar Administrador</button>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-gold/10 space-y-6">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-gold">lock_reset</span>
                    <h3 className="text-[11px] uppercase tracking-widest font-black text-stone-600">Segurança</h3>
                  </div>
                  <div className="p-8 bg-white/80 dark:bg-luxury-medium/40 border border-gold/10 rounded-[2.5rem] grid grid-cols-1 md:grid-cols-3 gap-6">
                    <input type="password" value={currentPassInput} onChange={(e) => setCurrentPassInput(e.target.value)} placeholder="Senha Atual" className="bg-transparent border-b border-gold/20 p-2 outline-none" />
                    <input type="password" value={newPassInput} onChange={(e) => setNewPassInput(e.target.value)} placeholder="Nova Senha" className="bg-transparent border-b border-gold/20 p-2 outline-none" />
                    <button onClick={handleChangePassword} className="bg-luxury-black text-gold rounded-xl text-[10px] uppercase font-black h-12">Alterar Senha</button>
                  </div>
                  {passwordMsg && <p className="text-[10px] text-center font-bold text-emerald-500">{passwordMsg}</p>}
                </div>

              </div>
            )}

            <button onClick={handleLogoutAdmin} className="w-full py-5 border border-red-500/30 text-red-600 rounded-2xl text-[10px] uppercase tracking-[0.3em] font-black hover:bg-red-500/10 transition-all mt-12 shadow-lg backdrop-blur-sm">Sair do Painel Admin</button>
          </div>
        )}

        {/* User Sections */}
        {activeTab === 'profile' && !isAdmin && (
          <div className="space-y-6">
            <h3 className="text-[10px] uppercase font-black text-stone-600 mb-4">Informações Pessoais</h3>
            <div className="p-6 bg-white/80 dark:bg-luxury-medium/40 rounded-3xl border border-gold/10">
              <span className="text-[9px] uppercase text-gold-dark font-black">Nome Completo</span>
              <p className="text-stone-900 dark:text-parchment-light font-bold text-base mt-1">{client.name}</p>
            </div>
            <div className="p-6 bg-white/80 dark:bg-luxury-medium/40 rounded-3xl border border-gold/10">
              <span className="text-[9px] uppercase text-gold-dark font-black">WhatsApp</span>
              <p className="text-stone-900 dark:text-parchment-light font-bold text-base mt-1">{client.whatsapp}</p>
            </div>
          </div>
        )}

        {activeTab === 'history' && !isAdmin && (
          <div className="space-y-10">
            {client.appointments?.length ? client.appointments.map(app => (
              <div key={app.id} className="bg-white/80 dark:bg-luxury-medium/40 rounded-[2.5rem] border border-gold/10 p-8 shadow-md">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-gold text-white flex flex-col items-center justify-center font-black">
                      <span>{app.date.split('-')[2]}</span>
                      <span className="text-[8px] uppercase">{app.month.substring(0, 3)}</span>
                    </div>
                    <div>
                      <h4 className="font-display text-2xl text-stone-900 dark:text-parchment-light font-black">{app.serviceName}</h4>
                      <span className={`text-[8px] uppercase font-black border-2 rounded-full px-3 py-1 ${getStatusStyle(app.status)}`}>{app.status}</span>
                    </div>
                  </div>
                  <span className="text-lg font-display text-gold-dark font-black italic">{app.price}</span>
                </div>
                {app.status === 'SCHEDULED' && (
                  <div className="flex gap-4 border-t border-gold/10 pt-6">
                    <button onClick={() => onRescheduleAppointment(app.id)} className="flex-1 py-4 rounded-2xl bg-gold/10 border border-gold/20 text-gold-dark text-[10px] font-black uppercase tracking-widest">Reagendar</button>
                    <button onClick={() => onCancelAppointment(app.id)} className="flex-1 py-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-[10px] font-black uppercase tracking-widest">Cancelar</button>
                  </div>
                )}
              </div>
            )) : <div className="py-24 text-center text-stone-400 italic">Nenhum agendamento encontrado.</div>}
          </div>
        )}
      </div>

      {!isAdmin && (
        <div className="mt-20 mb-8 flex flex-col items-center opacity-40 hover:opacity-100 transition-all">
          <a href="/admin" className="flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-2xl text-gold/60">lock</span>
            <span className="text-[7px] uppercase tracking-[0.5em] text-stone-500 font-black">Portal Administrativo {currentYear}</span>
          </a>
        </div>
      )}
    </div>
  );
};

export default Profile;
