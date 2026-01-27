
import React, { useState, useRef, useMemo } from 'react';
import { User, Appointment, Page, Service, Client } from '../types';

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
  // CRUD Actions
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
  onUpdateBusinessHours: (hours: any[]) => void;
  onAddBlock: (block: any) => void;
  onDeleteBlock: (id: string) => void;
  currentYear: number;
  // Password Management
  adminPassword?: string;
  setAdminPassword?: (pass: string) => void;
  onUpdateProfile?: (studio: User) => void;
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
  onUpdateProfile
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'history' | 'admin_dashboard'>(isAdmin ? 'admin_dashboard' : 'profile');
  const [adminSection, setAdminSection] = useState<'stats' | 'services' | 'clients' | 'agenda' | 'settings'>('stats');
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  // Password Change State
  const [currentPassInput, setCurrentPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [confirmPassInput, setConfirmPassInput] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  // Agenda Settings State
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
      .filter(a => a.status === 'completed')
      .reduce((sum, a) => sum + parsePrice(a.price), 0);

    const pendingRevenue = allAppointments
      .filter(a => a.status === 'upcoming')
      .reduce((sum, a) => sum + parsePrice(a.price), 0);

    const completedCount = allAppointments.filter(a => a.status === 'completed').length;
    const ticketMedio = completedCount > 0 ? totalRevenue / completedCount : 0;

    const popularServices = services.map(s => ({
      name: s.name,
      count: allAppointments.filter(a => a.serviceId === s.id).length
    })).sort((a, b) => b.count - a.count);

    return { totalRevenue, pendingRevenue, ticketMedio, popularServices };
  }, [allAppointments, services]);

  const handleLogoutAdmin = () => {
    setIsAdmin(false);
    onNavigate(Page.HOME);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result as string;
        if (isAdmin) setStudio({ ...studio, image: imageData });
        else setClient({ ...client, image: imageData });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleServiceImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && editingServiceId) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result as string;
        const service = services.find(s => s.id === editingServiceId);
        if (service) {
          onUpdateService({ ...service, image: imageData });
        }
        setEditingServiceId(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChangePassword = () => {
    if (currentPassInput !== adminPassword) {
      setPasswordMsg('A senha atual está incorreta.');
      return;
    }
    if (newPassInput.length < 6) {
      setPasswordMsg('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (newPassInput !== confirmPassInput) {
      setPasswordMsg('A nova senha e a confirmação não coincidem.');
      return;
    }

    if (setAdminPassword) {
      setAdminPassword(newPassInput);
      setPasswordMsg('Senha alterada com sucesso!');
      setCurrentPassInput('');
      setNewPassInput('');
      setConfirmPassInput('');
    }
  };

  const sendReminder = (app: Appointment, hours: string) => {
    const cleanNumber = app.clientWhatsapp.replace(/\D/g, '');
    let text = `✨ *Lembrete de Luxo!* ✨\n\nOlá ${app.clientName}, passando para lembrar do seu procedimento de *${app.serviceName}* daqui a *${hours}*!\n\n📅 Data: ${app.date} de ${app.month}\n⏰ Horário: ${app.time}\n\nEstamos ansiosas para te ver! 💖`;
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`);
  };

  const sendAdminConfirmation = (app: Appointment) => {
    const cleanNumber = app.clientWhatsapp.replace(/\D/g, '');
    let text = `✅ *Confirmação Cílios de Luxo* ✅\n\nOlá ${app.clientName}, seu agendamento de *${app.serviceName}* para o dia ${app.date} de ${app.month} às ${app.time} foi confirmado com sucesso!\n\nAté logo! ✨`;
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'upcoming': return 'text-gold-dark dark:text-gold-light border-gold/40 bg-gold/10 font-bold';
      case 'completed': return 'text-emerald-700 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 font-bold';
      case 'cancelled': return 'text-rose-600 dark:text-rose-400 border-rose-500/30 bg-rose-500/10 font-bold';
      default: return 'text-stone-500 dark:text-stone-300 border-stone-500/20 bg-stone-500/5 font-bold';
    }
  };

  return (
    <div className="pb-32 px-6 pt-12 min-h-screen max-w-4xl mx-auto flex flex-col relative overflow-x-hidden">
      <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
      <input type="file" ref={serviceImageInputRef} onChange={handleServiceImageUpload} accept="image/*" className="hidden" />

      <div className="flex-grow">
        <header className="flex flex-col items-center mb-10">
          <div className="relative group">
            <div onClick={() => fileInputRef.current?.click()} className="w-28 h-28 rounded-full border-2 border-gold p-1 shadow-2xl relative overflow-hidden bg-parchment-light dark:bg-luxury-medium flex items-center justify-center cursor-pointer transition-all">
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
            {isAdmin ? 'Gestão Cílios de Luxo' : 'Membro Exclusivo'}
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
                <button
                  key={sec.id}
                  onClick={() => setAdminSection(sec.id as any)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${adminSection === sec.id ? 'bg-gold border-gold text-white shadow-lg' : 'bg-white/60 dark:bg-luxury-medium/40 border-gold/10 text-stone-500 dark:text-stone-200'}`}
                >
                  <span className="material-symbols-outlined text-sm font-bold">{sec.icon}</span>
                  {sec.label}
                </button>
              ))}
            </nav>

            {adminSection === 'stats' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-6 bg-gold/10 border border-gold/20 rounded-3xl text-center backdrop-blur-sm">
                    <span className="text-[9px] uppercase tracking-widest text-stone-600 dark:text-stone-300 block mb-1 font-black">Faturamento Realizado</span>
                    <span className="text-3xl font-display text-emerald-700 dark:text-emerald-400 block font-black">R$ {stats.totalRevenue.toFixed(2)}</span>
                  </div>
                  <div className="p-6 bg-gold/10 border border-gold/20 rounded-3xl text-center backdrop-blur-sm">
                    <span className="text-[9px] uppercase tracking-widest text-stone-600 dark:text-stone-300 block mb-1 font-black">Faturamento Previsto</span>
                    <span className="text-3xl font-display text-gold-dark dark:text-gold-light block font-black">R$ {stats.pendingRevenue.toFixed(2)}</span>
                  </div>
                  <div className="p-6 bg-gold/10 border border-gold/20 rounded-3xl text-center backdrop-blur-sm">
                    <span className="text-[9px] uppercase tracking-widest text-stone-600 dark:text-stone-300 block mb-1 font-black">Ticket Médio</span>
                    <span className="text-3xl font-display text-stone-900 dark:text-parchment-light block font-black">R$ {stats.ticketMedio.toFixed(2)}</span>
                  </div>
                </div>

                <div className="bg-white/80 dark:bg-luxury-medium/40 border border-gold/10 p-8 rounded-[3rem] shadow-sm">
                  <h4 className="font-display text-xl text-stone-900 dark:text-parchment-light mb-8 italic font-bold">Técnicas mais Populares</h4>
                  <div className="space-y-6">
                    {stats.popularServices.map(s => (
                      <div key={s.name} className="flex items-center gap-6">
                        <span className="text-[10px] text-stone-700 dark:text-stone-200 uppercase tracking-widest font-black whitespace-nowrap min-w-[130px]">{s.name}</span>
                        <div className="flex-grow bg-stone-200 dark:bg-luxury-black h-2.5 rounded-full overflow-hidden max-w-[180px]">
                          <div className="bg-gold h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(197,160,89,0.3)]" style={{ width: `${(s.count / Math.max(...stats.popularServices.map(ps => ps.count), 1)) * 100}%` }}></div>
                        </div>
                        <span className="text-xs font-black text-gold-dark dark:text-gold-light">{s.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {adminSection === 'services' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[11px] uppercase tracking-widest text-stone-500 dark:text-stone-200 font-black">Catálogo de Serviços</h3>
                  <button onClick={() => onAddService({ id: Date.now().toString(), name: 'Nova Técnica', price: 'R$ 130,00', description: '', longDescription: '', duration: '2h', maintenance: '20 dias', image: 'https://picsum.photos/seed/new/600/800' })} className="px-6 py-3 gold-gradient text-white text-[9px] font-black uppercase rounded-full shadow-lg">Novo Serviço</button>
                </div>
                {services.map(s => (
                  <div key={s.id} className="p-6 bg-white/80 dark:bg-luxury-medium/40 border border-gold/10 rounded-[2rem] flex items-center justify-between group shadow-sm transition-all hover:border-gold/30">
                    <div className="flex items-center gap-6 flex-grow">
                      <div className="relative group/img cursor-pointer" onClick={() => { setEditingServiceId(s.id); serviceImageInputRef.current?.click(); }}>
                        <img src={s.image} className="w-16 h-16 rounded-2xl object-cover border-2 border-gold/10" alt={s.name} />
                        <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                          <span className="material-symbols-outlined text-white text-sm">photo_camera</span>
                        </div>
                      </div>
                      <div className="flex flex-col flex-grow">
                        <input className="font-display text-lg font-bold bg-transparent text-stone-900 dark:text-parchment-light outline-none w-full focus:text-gold-dark dark:focus:text-gold-light" value={s.name} onChange={(e) => onUpdateService({ ...s, name: e.target.value })} />
                        <input className="text-[10px] text-gold-dark dark:text-gold-light uppercase tracking-widest font-black bg-transparent outline-none" value={s.price} onChange={(e) => onUpdateService({ ...s, price: e.target.value })} />
                        <input className="text-[9px] text-stone-500 dark:text-stone-400 bg-transparent outline-none mt-1 w-full" value={s.description} onChange={(e) => onUpdateService({ ...s, description: e.target.value })} placeholder="Breve descrição..." />
                      </div>
                    </div>
                    <button onClick={() => onDeleteService(s.id)} className="text-stone-400 hover:text-red-500 transition-colors p-2">
                      <span className="material-symbols-outlined font-bold">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {adminSection === 'agenda' && (
              <div className="space-y-10">
                {/* Agenda Blocks Management */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-gold font-bold">event_busy</span>
                    <h3 className="text-[11px] uppercase tracking-widest text-stone-500 dark:text-stone-200 font-black">Bloqueios de Agenda (Férias/Viagens)</h3>
                  </div>

                  <div className="p-8 bg-white/80 dark:bg-luxury-medium/40 border border-gold/10 rounded-[2.5rem] shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-[9px] uppercase tracking-widest text-stone-500 dark:text-stone-400 font-black ml-1">Data Início</label>
                        <input type="date" value={newBlockStart} onChange={(e) => setNewBlockStart(e.target.value)} className="w-full bg-white dark:bg-luxury-black/50 border border-gold/20 rounded-xl px-4 py-3 outline-none focus:border-gold transition-all text-sm" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] uppercase tracking-widest text-stone-500 dark:text-stone-400 font-black ml-1">Data Fim</label>
                        <input type="date" value={newBlockEnd} onChange={(e) => setNewBlockEnd(e.target.value)} className="w-full bg-white dark:bg-luxury-black/50 border border-gold/20 rounded-xl px-4 py-3 outline-none focus:border-gold transition-all text-sm" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] uppercase tracking-widest text-stone-500 dark:text-stone-400 font-black ml-1">Motivo (Opcional)</label>
                        <input type="text" value={newBlockReason} onChange={(e) => setNewBlockReason(e.target.value)} placeholder="Ex: Férias, Reforma..." className="w-full bg-white dark:bg-luxury-black/50 border border-gold/20 rounded-xl px-4 py-3 outline-none focus:border-gold transition-all text-sm" />
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (newBlockStart && newBlockEnd) {
                          onAddBlock({ id: Date.now().toString(), startDate: newBlockStart, endDate: newBlockEnd, reason: newBlockReason || 'Ausência' });
                          setNewBlockStart(''); setNewBlockEnd(''); setNewBlockReason('');
                        }
                      }}
                      className="mt-6 w-full py-4 gold-gradient text-white text-[10px] font-black uppercase rounded-2xl shadow-lg"
                    >
                      Adicionar Período de Bloqueio
                    </button>
                  </div>

                  {studio.blocks && studio.blocks.length > 0 && (
                    <div className="grid grid-cols-1 gap-3">
                      {studio.blocks.map(block => (
                        <div key={block.id} className="p-5 bg-stone-50 dark:bg-luxury-black/40 border border-stone-200 dark:border-stone-800 rounded-[1.5rem] flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="material-symbols-outlined text-rose-500 font-bold">block</span>
                            <div>
                              <p className="font-bold text-sm text-stone-900 dark:text-parchment-light">{block.reason}</p>
                              <p className="text-[10px] uppercase text-stone-500 font-black tracking-widest">{new Date(block.startDate + 'T12:00:00').toLocaleDateString('pt-BR')} até {new Date(block.endDate + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                            </div>
                          </div>
                          <button onClick={() => onDeleteBlock(block.id)} className="text-stone-400 hover:text-red-500 transition-colors p-2">
                            <span className="material-symbols-outlined text-sm font-bold">delete</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-10 border-t border-gold/10">
                  <div className="flex items-center gap-2 mb-6">
                    <span className="material-symbols-outlined text-gold font-bold">schedule</span>
                    <h3 className="text-[11px] uppercase tracking-widest text-stone-500 dark:text-stone-200 font-black">Horário de Funcionamento</h3>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((day, idx) => {
                      const dayNum = idx === 6 ? 0 : idx + 1;
                      const config = studio.businessHours?.find(h => h.dayOfWeek === dayNum);
                      return (
                        <div key={day} className="p-6 bg-white/80 dark:bg-luxury-medium/40 border border-gold/10 rounded-3xl flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-3 h-3 rounded-full ${config?.isOpen ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-red-500'}`}></div>
                            <span className="text-[11px] uppercase tracking-widest font-black text-stone-700 dark:text-stone-200">{day}</span>
                          </div>
                          <div className="flex items-center gap-6">
                            {config?.isOpen ? (
                              <div className="flex items-center gap-2">
                                {config.slots.map((slot, sIdx) => (
                                  <span key={sIdx} className="bg-gold/10 text-gold-dark dark:text-gold-light px-3 py-1 rounded-lg text-[10px] font-black border border-gold/20">
                                    {slot.start} - {slot.end}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[10px] uppercase font-black text-stone-400">Fechado</span>
                            )}
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" checked={config?.isOpen || false} onChange={(e) => {
                                const newHours = studio.businessHours?.map(h =>
                                  h.dayOfWeek === dayNum ? { ...h, isOpen: e.target.checked } : h
                                ) || [];
                                onUpdateBusinessHours(newHours);
                              }} className="sr-only peer" />
                              <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none dark:bg-luxury-black peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gold rounded-full"></div>
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Reservation List (Original) */}
                <div className="pt-10 border-t border-gold/10 space-y-6">
                  <h3 className="text-[11px] uppercase tracking-widest text-stone-500 dark:text-stone-200 font-black">Histórico de Reservas</h3>
                  {allAppointments.map(app => (
                    <div key={app.id} className="p-6 bg-white/80 dark:bg-luxury-medium/40 border border-gold/10 rounded-[2rem] space-y-4 shadow-sm transition-all hover:border-gold/30">
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gold text-white flex flex-col items-center justify-center font-black">
                            <span className="text-sm">{app.date}</span>
                            <span className="text-[7px] uppercase">{app.month.substring(0, 3)}</span>
                          </div>
                          <div>
                            <p className="font-display font-black text-lg text-stone-900 dark:text-parchment-light">{app.clientName}</p>
                            <p className="text-[10px] uppercase text-gold-dark dark:text-gold-light font-black tracking-widest">{app.serviceName} • {app.time} • {currentYear}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <select
                            value={app.status}
                            onChange={(e) => onUpdateAppointment({ ...app, status: e.target.value as any })}
                            className={`text-[9px] uppercase font-black border-2 rounded-full px-4 py-1.5 bg-transparent outline-none ${getStatusStyle(app.status)}`}
                          >
                            <option value="upcoming">Agendado</option>
                            <option value="completed">Concluído</option>
                            <option value="cancelled">Cancelado</option>
                          </select>
                        </div>
                      </div>

                      {app.status === 'upcoming' && (
                        <div className="pt-4 border-t border-gold/10 flex flex-wrap gap-3">
                          <button onClick={() => sendAdminConfirmation(app)} className="px-4 py-2 bg-gold/10 text-gold-dark dark:text-gold-light rounded-xl text-[9px] font-bold uppercase hover:bg-gold/20 transition-all flex items-center gap-1">
                            Confirmar
                          </button>
                          <button onClick={() => sendReminder(app, "24h")} className="px-3 py-2 bg-stone-100 dark:bg-luxury-black text-stone-600 dark:text-stone-300 rounded-xl text-[9px] font-bold uppercase hover:bg-stone-200 transition-all">
                            Lembrete 24h
                          </button>
                          <button onClick={() => sendReminder(app, "12h")} className="px-3 py-2 bg-stone-100 dark:bg-luxury-black text-stone-600 dark:text-stone-300 rounded-xl text-[9px] font-bold uppercase hover:bg-stone-200 transition-all">
                            Lembrete 12h
                          </button>
                          <button onClick={() => sendReminder(app, "2h")} className="px-3 py-2 bg-stone-100 dark:bg-luxury-black text-stone-600 dark:text-stone-300 rounded-xl text-[9px] font-bold uppercase hover:bg-stone-200 transition-all">
                            Lembrete 2h
                          </button>
                          <div className="flex-grow"></div>
                          <button onClick={() => onRescheduleAppointment(app.id)} className="px-4 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-[9px] font-bold uppercase border border-emerald-500/20 hover:bg-emerald-500/20">
                            Reagendar
                          </button>
                          <button onClick={() => onCancelAppointment(app.id)} className="px-4 py-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl text-[9px] font-bold uppercase border border-rose-500/20 hover:bg-rose-500/20">
                            Cancelar
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {adminSection === 'clients' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[11px] uppercase tracking-widest text-stone-500 dark:text-stone-200 font-black">Base de Clientes & Histórico</h3>
                  <button onClick={() => onAddClient({ id: Date.now().toString(), name: 'Novo Cliente', whatsapp: '+55', totalSpent: 0, notes: '' } as any)} className="px-6 py-3 gold-gradient text-white text-[9px] font-black uppercase rounded-full shadow-lg">Novo Cliente</button>
                </div>
                {clients.map(c => {
                  const clientApps = allAppointments.filter(app =>
                    app.clientWhatsapp === c.whatsapp || app.clientName === c.name
                  );
                  const clientTotal = clientApps
                    .filter(app => app.status === 'completed')
                    .reduce((sum, app) => sum + parsePrice(app.price), 0);

                  return (
                    <div key={c.id} className="p-8 bg-white/80 dark:bg-luxury-medium/40 border border-gold/10 rounded-[2.5rem] shadow-sm overflow-hidden relative transition-all hover:border-gold/30">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-gold opacity-30"></div>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-gold/5 pb-6 mb-6">
                        <div className="flex items-center gap-5">
                          <div className="w-16 h-16 rounded-full border-2 border-gold/20 flex items-center justify-center text-gold bg-gold/5 shadow-inner">
                            <span className="material-symbols-outlined text-3xl font-bold">face_retouching_natural</span>
                          </div>
                          <div>
                            <input className="font-display font-black text-2xl bg-transparent text-stone-900 dark:text-parchment-light outline-none focus:text-gold-dark w-full" value={c.name} onChange={(e) => onUpdateClient({ ...c, name: e.target.value })} placeholder="Nome do Cliente" />
                            <div className="flex flex-col gap-1 mt-1">
                              <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-xs text-gold font-bold">smartphone</span>
                                <input className="text-[10px] uppercase tracking-widest text-stone-600 dark:text-stone-300 font-black bg-transparent outline-none" value={c.whatsapp} onChange={(e) => onUpdateClient({ ...c, whatsapp: e.target.value })} placeholder="WhatsApp" />
                              </div>
                              <input className="text-[9px] text-stone-400 bg-transparent outline-none w-full" value={c.notes || ''} onChange={(e) => onUpdateClient({ ...c, notes: e.target.value })} placeholder="Notas sobre o cliente..." />
                            </div>
                          </div>
                        </div>
                        <div className="text-right bg-emerald-500/10 px-6 py-4 rounded-2xl border-2 border-emerald-500/20 shadow-sm min-w-[150px]">
                          <p className="text-[9px] uppercase text-emerald-700 dark:text-emerald-400 font-black tracking-[0.2em] mb-1">Total Consumido</p>
                          <p className="text-2xl font-display text-emerald-700 dark:text-emerald-400 font-black italic">R$ {clientTotal.toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-[10px] uppercase text-gold-dark dark:text-gold-light font-black tracking-[0.3em] ml-1 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-gold"></span>
                          Histórico de Visitas
                        </h4>
                        <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto pr-2 no-scrollbar">
                          {clientApps.map((app, idx) => (
                            <div key={idx} className={`p-4 rounded-2xl border flex items-center justify-between group transition-colors ${app.status === 'completed' ? 'bg-stone-50 dark:bg-luxury-black/60 border-stone-200 dark:border-stone-800' : 'bg-gold/5 border-gold/20'}`}>
                              <div>
                                <p className={`font-display font-black text-base ${app.status === 'completed' ? 'text-stone-700 dark:text-stone-300' : 'text-stone-900 dark:text-parchment-light'}`}>{app.serviceName}</p>
                                <p className="text-[9px] uppercase tracking-widest text-stone-500 dark:text-stone-400 font-black">{app.date} {app.month.substring(0, 3)} • {app.time}</p>
                              </div>
                              <span className={`text-[8px] uppercase font-black px-3 py-1 rounded-full ${getStatusStyle(app.status)}`}>{app.status}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-8 pt-6 border-t border-gold/10 flex justify-between items-center">
                        <button onClick={() => onDeleteClient(c.id)} className="px-6 py-2.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-[9px] uppercase tracking-widest font-black hover:bg-red-600 hover:text-white transition-all shadow-sm">
                          Excluir Cliente
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {adminSection === 'settings' && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-gold text-lg font-bold">storefront</span>
                  <h3 className="text-[11px] uppercase tracking-widest font-black text-stone-600 dark:text-stone-300">Configurações do Estúdio</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-white/80 dark:bg-luxury-medium/40 rounded-3xl border border-gold/10 shadow-sm relative group focus-within:border-gold transition-colors">
                    <span className="text-[9px] uppercase tracking-widest text-gold-dark dark:text-gold-light font-black mb-2 block">Nome do Estúdio</span>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-0 top-1/2 -translate-y-1/2 text-gold/60">store</span>
                      <input
                        type="text"
                        value={studio.name}
                        onChange={(e) => setStudio({ ...studio, name: e.target.value })}
                        className="w-full bg-transparent pl-8 py-2 font-display text-lg font-bold text-stone-900 dark:text-parchment-light outline-none"
                        placeholder="Nome do Estúdio"
                      />
                    </div>
                  </div>

                  <div className="p-6 bg-white/80 dark:bg-luxury-medium/40 rounded-3xl border border-gold/10 shadow-sm relative group focus-within:border-gold transition-colors">
                    <span className="text-[9px] uppercase tracking-widest text-gold-dark dark:text-gold-light font-black mb-2 block">Nome do Proprietário</span>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-0 top-1/2 -translate-y-1/2 text-gold/60">person_celebrate</span>
                      <input
                        type="text"
                        value={studio.ownerName || ''}
                        onChange={(e) => setStudio({ ...studio, ownerName: e.target.value })}
                        className="w-full bg-transparent pl-8 py-2 font-display text-lg font-bold text-stone-900 dark:text-parchment-light outline-none"
                        placeholder="Seu Nome"
                      />
                    </div>
                  </div>

                  <div className="p-6 bg-white/80 dark:bg-luxury-medium/40 rounded-3xl border border-gold/10 shadow-sm relative group focus-within:border-gold transition-colors">
                    <span className="text-[9px] uppercase tracking-widest text-gold-dark dark:text-gold-light font-black mb-2 block">WhatsApp Oficial</span>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-0 top-1/2 -translate-y-1/2 text-gold/60">chat</span>
                      <input
                        type="text"
                        value={studio.whatsapp}
                        onChange={(e) => setStudio({ ...studio, whatsapp: e.target.value })}
                        className="w-full bg-transparent pl-8 py-2 font-bold text-stone-900 dark:text-parchment-light outline-none"
                        placeholder="+55 (00) 00000-0000"
                      />
                    </div>
                  </div>

                  <div className="p-6 bg-white/80 dark:bg-luxury-medium/40 rounded-3xl border border-gold/10 shadow-sm relative group focus-within:border-gold transition-colors">
                    <span className="text-[9px] uppercase tracking-widest text-gold-dark dark:text-gold-light font-black mb-2 block">E-mail de Contato</span>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-0 top-1/2 -translate-y-1/2 text-gold/60">mail</span>
                      <input
                        type="email"
                        value={studio.email}
                        onChange={(e) => setStudio({ ...studio, email: e.target.value })}
                        className="w-full bg-transparent pl-8 py-2 font-bold text-stone-900 dark:text-parchment-light outline-none"
                        placeholder="contato@exemplo.com"
                      />
                    </div>
                  </div>

                  <div className="p-6 bg-white/80 dark:bg-luxury-medium/40 rounded-3xl border border-gold/10 shadow-sm relative group focus-within:border-gold transition-colors md:col-span-2">
                    <span className="text-[9px] uppercase tracking-widest text-gold-dark dark:text-gold-light font-black mb-2 block">Endereço Completo</span>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-0 top-1/2 -translate-y-1/2 text-gold/60">location_on</span>
                      <input
                        type="text"
                        value={studio.address}
                        onChange={(e) => setStudio({ ...studio, address: e.target.value })}
                        className="w-full bg-transparent pl-8 py-2 font-bold text-stone-900 dark:text-parchment-light outline-none"
                        placeholder="Rua Exemplo, 123 - Cidade/UF"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => onUpdateProfile && onUpdateProfile(studio)}
                    className="px-8 py-4 gold-gradient text-white rounded-2xl text-[10px] uppercase font-black tracking-widest shadow-lg hover:shadow-gold/40 transition-all transform active:scale-95 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">save</span>
                    Salvar Alterações
                  </button>
                </div>

                {/* Password Change Section */}
                <div className="mt-8 pt-8 border-t border-gold/10">
                  <div className="flex items-center gap-2 mb-6">
                    <span className="material-symbols-outlined text-gold text-lg font-bold">lock_reset</span>
                    <h3 className="text-[11px] uppercase tracking-widest font-black text-stone-600 dark:text-stone-300">Segurança do Acesso</h3>
                  </div>

                  <div className="p-8 bg-white/80 dark:bg-luxury-medium/40 rounded-[2.5rem] border border-gold/10 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-[9px] uppercase tracking-widest text-stone-500 dark:text-stone-400 font-black ml-1">Senha Atual</label>
                        <input
                          type="password"
                          value={currentPassInput}
                          onChange={(e) => setCurrentPassInput(e.target.value)}
                          className="w-full bg-white dark:bg-luxury-black/50 border border-gold/20 rounded-xl px-4 py-3 outline-none focus:border-gold transition-all text-stone-800 dark:text-stone-200"
                          placeholder="••••••"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] uppercase tracking-widest text-stone-500 dark:text-stone-400 font-black ml-1">Nova Senha</label>
                        <input
                          type="password"
                          value={newPassInput}
                          onChange={(e) => setNewPassInput(e.target.value)}
                          className="w-full bg-white dark:bg-luxury-black/50 border border-gold/20 rounded-xl px-4 py-3 outline-none focus:border-gold transition-all text-stone-800 dark:text-stone-200"
                          placeholder="••••••"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] uppercase tracking-widest text-stone-500 dark:text-stone-400 font-black ml-1">Confirmar Nova Senha</label>
                        <input
                          type="password"
                          value={confirmPassInput}
                          onChange={(e) => setConfirmPassInput(e.target.value)}
                          className="w-full bg-white dark:bg-luxury-black/50 border border-gold/20 rounded-xl px-4 py-3 outline-none focus:border-gold transition-all text-stone-800 dark:text-stone-200"
                          placeholder="••••••"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-6">
                      <span className={`text-[10px] font-bold ${passwordMsg.includes('sucesso') ? 'text-emerald-500' : 'text-red-500'}`}>{passwordMsg}</span>
                      <button
                        onClick={handleChangePassword}
                        className="px-8 py-3 bg-luxury-black text-gold dark:bg-white dark:text-luxury-black rounded-xl text-[10px] uppercase font-black tracking-widest hover:opacity-90 transition-opacity"
                      >
                        Alterar Senha
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button onClick={handleLogoutAdmin} className="w-full py-5 border border-red-500/30 text-red-600 dark:text-red-400 rounded-2xl text-[10px] uppercase tracking-[0.3em] font-black hover:bg-red-500/10 transition-all mt-12 shadow-lg backdrop-blur-sm">Sair do Painel Admin</button>
          </div>
        )}

        {activeTab === 'profile' && !isAdmin && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4"><span className="material-symbols-outlined text-gold text-lg font-bold">manage_accounts</span><h3 className="text-[10px] uppercase tracking-widest font-black text-stone-600 dark:text-stone-300">Informações Pessoais</h3></div>
            {[
              { id: 'name', label: 'Nome Completo', value: client.name },
              { id: 'whatsapp', label: 'WhatsApp', value: client.whatsapp },
              { id: 'email', label: 'E-mail', value: client.email },
            ].map(field => (
              <div key={field.id} className="p-6 bg-white/80 dark:bg-luxury-medium/40 rounded-3xl border border-gold/10 shadow-sm">
                <span className="text-[9px] uppercase tracking-widest text-gold-dark dark:text-gold-light font-black">{field.label}</span>
                <p className="text-stone-900 dark:text-parchment-light font-bold text-base mt-1">{field.value}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'history' && !isAdmin && (
          <div className="space-y-10">
            {client.appointments?.length ? client.appointments.map(app => (
              <div key={app.id} className="bg-white/80 dark:bg-luxury-medium/40 rounded-[2.5rem] border border-gold/10 p-8 shadow-md transition-all hover:border-gold/30">
                <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-gold text-white flex flex-col items-center justify-center shadow-lg"><span className="text-xl font-black leading-none">{app.date}</span><span className="text-[8px] uppercase font-black mt-1">{app.month.substring(0, 3)}</span></div>
                    <div>
                      <h4 className="font-display text-2xl text-stone-900 dark:text-parchment-light font-black">{app.serviceName}</h4>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-[8px] uppercase font-black border-2 rounded-full px-3 py-1 inline-block ${getStatusStyle(app.status)}`}>{app.status}</span>
                        <span className="text-[8px] uppercase font-black text-stone-500 dark:text-stone-400 tracking-widest ml-2">{currentYear} • {app.time}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-lg font-display text-gold-dark dark:text-gold-light font-black italic">{app.price}</span>
                </div>

                {app.status === 'upcoming' && (
                  <div className="flex gap-4 border-t border-gold/10 pt-6">
                    <button onClick={() => onRescheduleAppointment(app.id)} className="flex-1 py-4 rounded-2xl bg-gold/10 border border-gold/20 text-gold-dark dark:text-gold-light text-[10px] font-black uppercase tracking-widest hover:bg-gold/20 transition-all">Reagendar</button>
                    <button onClick={() => onCancelAppointment(app.id)} className="flex-1 py-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/20 transition-all">Cancelar</button>
                  </div>
                )}
              </div>
            )) : (
              <div className="py-24 text-center">
                <span className="material-symbols-outlined text-gold/20 text-7xl mb-4">event_busy</span>
                <p className="text-stone-500 dark:text-stone-400 italic font-medium">Nenhum agendamento encontrado.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {!isAdmin && <div className="mt-20 mb-8 flex flex-col items-center opacity-40 hover:opacity-100 transition-all"><button onClick={() => onNavigate(Page.ADMIN_LOGIN)} className="flex flex-col items-center gap-3 group"><span className="material-symbols-outlined text-2xl text-gold/60 group-hover:text-gold transition-colors font-bold">lock</span><span className="text-[7px] uppercase tracking-[0.5em] text-stone-500 dark:text-stone-400 font-black">Portal Administrativo {currentYear}</span></button></div>}
    </div>
  );
};

export default Profile;
