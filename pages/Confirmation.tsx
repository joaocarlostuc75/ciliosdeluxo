
import React from 'react';
import { User, Service, Appointment } from '../types';

interface ConfirmationProps {
  client: User;
  setClient: (client: User) => void;
  studioWhatsapp: string;
  selectedService: Service | null;
  selectedDate: number;
  selectedTime: string;
  onConfirmBooking: (appointment: Appointment) => void;
  checkAvailability: (date: number, time: string, serviceId: string) => boolean;
  onFinish: () => void;
  currentMonthName: string;
  currentYear: number;
  currentMonthIndex: number;
}

const Confirmation: React.FC<ConfirmationProps> = ({ 
  client, 
  setClient, 
  studioWhatsapp, 
  selectedService,
  selectedDate,
  selectedTime,
  onConfirmBooking,
  checkAvailability,
  onFinish,
  currentMonthName,
  currentYear,
  currentMonthIndex
}) => {
  // Format date as DD/MM/AA
  const formattedDate = `${String(selectedDate).padStart(2, '0')}/${String(currentMonthIndex + 1).padStart(2, '0')}/${String(currentYear).slice(-2)}`;
  
  const handleConfirm = () => {
    if (!client.name || !client.whatsapp) {
      alert("Por favor, preencha seu nome e contato para prosseguir.");
      return;
    }
    
    if (!selectedService) {
      alert("Erro ao identificar o serviço selecionado.");
      return;
    }

    // Bloqueio de agendamento duplicado (mesmo procedimento no mesmo horário)
    if (!checkAvailability(selectedDate, selectedTime, selectedService.id)) {
      alert("⚠️ Ops! Já existe um agendamento para esta técnica neste horário específico. Por favor, escolha outro horário ou entre em contato conosco.");
      return;
    }

    const cleanStudioNumber = studioWhatsapp.replace(/\D/g, '');
    const serviceName = selectedService?.name || 'Procedimento';
    
    const newAppointment: Appointment = {
      id: Date.now().toString(),
      serviceId: selectedService?.id || 'unknown',
      serviceName: serviceName,
      clientName: client.name,
      clientWhatsapp: client.whatsapp,
      date: selectedDate,
      month: currentMonthName,
      time: selectedTime,
      status: 'upcoming',
      price: selectedService?.price || 'R$ 130,00'
    };
    
    onConfirmBooking(newAppointment);

    const message = [
      `✨ *Olá, ${client.name}!* ✨`,
      ``,
      `Sua solicitação de agendamento no *Cílios de Luxo* foi enviada! 💅`,
      ``,
      `📋 *Detalhes da Reserva:*`,
      `━━━━━━━━━━━━━━━━━━`,
      `• *Procedimento:* ${serviceName}`,
      `• *Data:* ${formattedDate}`,
      `• *Horário:* ${selectedTime}`,
      `━━━━━━━━━━━━━━━━━━`,
      ``,
      `✅ Por favor, responda com *"CONFIRMAR"* para validar seu horário.`,
      ``,
      `Aguardamos você! 💖`,
      ``,
      `_Att., Equipe Cílios de Luxo_`
    ].join('\n');

    window.open(`https://wa.me/${cleanStudioNumber}?text=${encodeURIComponent(message)}`);
    onFinish();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 pt-12 pb-12 animate-in fade-in duration-700">
      <div className="w-24 h-24 rounded-full bg-gold/10 flex items-center justify-center mb-8 animate-bounce">
        <span className="material-symbols-outlined text-gold text-5xl">auto_awesome</span>
      </div>

      <h2 className="font-display text-3xl font-bold text-gold-dark dark:text-gold-light text-center mb-4 italic">
        Sua Escolha de Luxo
      </h2>
      <div className="w-12 h-[2px] bg-gold mb-8"></div>
      
      <p className="text-stone-600 dark:text-stone-300 text-sm leading-relaxed text-center mb-10 max-w-[280px] font-bold">
        Para finalizar seu agendamento premium, por favor confirme seus dados de contato.
      </p>

      <form className="w-full max-w-sm space-y-6 mb-12" onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-2">
          <label className="block text-[10px] uppercase tracking-widest text-gold dark:text-gold-light font-black ml-1">Nome Completo</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gold/60">person</span>
            <input 
              placeholder="Maria Silva"
              value={client.name}
              onChange={(e) => setClient({...client, name: e.target.value})}
              className="w-full bg-white/60 dark:bg-luxury-medium/60 border border-gold/20 rounded-xl py-4 pl-12 pr-4 text-stone-900 dark:text-parchment-light font-bold focus:border-gold outline-none transition-all placeholder:text-stone-400 dark:placeholder:text-stone-600 shadow-sm"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-[10px] uppercase tracking-widest text-gold dark:text-gold-light font-black ml-1">WhatsApp</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gold/60">smartphone</span>
            <input 
              placeholder="(00) 00000-0000"
              value={client.whatsapp}
              onChange={(e) => setClient({...client, whatsapp: e.target.value})}
              className="w-full bg-white/60 dark:bg-luxury-medium/60 border border-gold/20 rounded-xl py-4 pl-12 pr-4 text-stone-900 dark:text-parchment-light font-bold focus:border-gold outline-none transition-all placeholder:text-stone-400 dark:placeholder:text-stone-600 shadow-sm"
            />
          </div>
        </div>
      </form>

      <div className="w-full max-w-sm bg-gold/5 dark:bg-luxury-medium/40 border border-gold/20 rounded-2xl p-6 mb-8 backdrop-blur-sm shadow-sm">
        <h4 className="text-[10px] uppercase tracking-widest text-gold-dark dark:text-gold-light font-black mb-3 border-b border-gold/10 pb-2">Resumo</h4>
        <div className="space-y-3">
          <div className="flex justify-between text-xs font-bold text-stone-800 dark:text-stone-300">
            <span className="uppercase tracking-tighter opacity-70">Técnica:</span>
            <span>{selectedService?.name || '---'}</span>
          </div>
          <div className="flex justify-between text-xs font-bold text-stone-800 dark:text-stone-300">
            <span className="uppercase tracking-tighter opacity-70">Data:</span>
            <span>{formattedDate}</span>
          </div>
          <div className="flex justify-between text-xs font-bold text-stone-800 dark:text-stone-300">
            <span className="uppercase tracking-tighter opacity-70">Horário:</span>
            <span className="text-gold-dark dark:text-gold-light">{selectedTime}</span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <button
          onClick={handleConfirm}
          className="w-full gold-gradient text-white font-black py-6 rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-transform active:scale-95 uppercase tracking-widest text-xs"
        >
          <span className="material-symbols-outlined">verified_user</span>
          Solicitar Agendamento
        </button>
        <button
          onClick={onFinish}
          className="w-full py-4 text-stone-500 dark:text-stone-500 text-[10px] uppercase tracking-[0.3em] font-black opacity-60 hover:opacity-100 transition-opacity"
        >
          Voltar ao Início
        </button>
      </div>

      <p className="mt-8 text-[9px] text-stone-400 dark:text-stone-600 text-center uppercase tracking-widest font-black">
        Agendamento 100% Seguro & Confidencial
      </p>
    </div>
  );
};

export default Confirmation;
