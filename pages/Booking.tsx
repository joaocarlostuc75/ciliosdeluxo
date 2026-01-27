
import React from 'react';
import { Service, User } from '../types';
import { OrnamentalSVG } from '../constants';

interface BookingProps {
  studio: User;
  services: Service[];
  onConfirm: () => void;
  selectedService: Service | null;
  selectedDate: number;
  setSelectedDate: (day: number) => void;
  selectedTime: string;
  setSelectedTime: (time: string) => void;
  setSelectedServiceId: (id: string) => void;
  availableDays: number[];
  currentMonthName: string;
  currentYear: number;
  currentMonthIndex: number;
}

const Booking: React.FC<BookingProps> = ({
  studio,
  services,
  onConfirm,
  selectedService,
  selectedDate,
  setSelectedDate,
  selectedTime,
  setSelectedTime,
  setSelectedServiceId,
  availableDays,
  currentMonthName,
  currentYear,
  currentMonthIndex
}) => {
  const activeServiceId = selectedService?.id || services[0]?.id;

  // Calculate dynamic times based on selected date and business hours
  const times = React.useMemo(() => {
    const dateObj = new Date(currentYear, currentMonthIndex, selectedDate);
    const weekDay = dateObj.getDay();
    const config = studio.businessHours?.find(h => h.dayOfWeek === weekDay);

    if (!config || !config.isOpen) return [];

    // Generate 30-min slots based on start/end times
    const allSlots: string[] = [];
    config.slots.forEach(slot => {
      let [startHour, startMin] = slot.start.split(':').map(Number);
      let [endHour, endMin] = slot.end.split(':').map(Number);

      let current = startHour * 60 + startMin;
      const end = endHour * 60 + endMin;

      while (current < end) {
        const h = Math.floor(current / 60).toString().padStart(2, '0');
        const m = (current % 60).toString().padStart(2, '0');
        allSlots.push(`${h}:${m}`);
        current += 30; // 30-min intervals
      }
    });
    return allSlots;
  }, [selectedDate, currentMonthIndex, currentYear, studio.businessHours]);

  // Calendar logic
  const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonthIndex, 1).getDay(); // 0 (Sun) - 6 (Sat)

  // Create placeholders for empty days at start of month
  const emptyDays = Array.from({ length: firstDayOfWeek }, (_, i) => i);
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="pb-32 pt-20 px-6 max-w-6xl mx-auto">
      <header className="mb-20 text-center reveal">
        <span className="text-gold dark:text-gold-light text-xs font-black uppercase tracking-[0.5em] mb-4 block">Experiência de Reserva</span>
        <h2 className="font-display text-5xl md:text-7xl font-bold text-stone-900 dark:text-parchment-light mb-6 italic">Agende sua Sessão</h2>
        <div className="w-20 h-[2px] bg-gold mx-auto"></div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-start">
        {/* Selection Flow */}
        <div className="lg:col-span-7 space-y-16">
          <section className="reveal" style={{ animationDelay: '200ms' }}>
            <h3 className="text-[11px] uppercase tracking-[0.3em] font-black text-stone-500 dark:text-stone-400 mb-8 flex items-center gap-4">
              <span className="w-8 h-8 rounded-full bg-gold/20 text-gold-dark dark:text-gold-light flex items-center justify-center text-xs font-black">01</span>
              Escolha a Técnica
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {services.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedServiceId(s.id)}
                  className={`relative p-6 rounded-3xl border text-left transition-all overflow-hidden group ${activeServiceId === s.id
                    ? 'border-gold bg-gold/10 ring-1 ring-gold shadow-lg shadow-gold/10'
                    : 'border-gold/20 bg-white/60 dark:bg-luxury-medium/40 hover:border-gold/60'
                    }`}
                >
                  <span className={`text-[10px] uppercase font-black tracking-widest block mb-1 ${activeServiceId === s.id ? 'text-gold-dark dark:text-gold-light' : 'text-stone-500 dark:text-stone-400'}`}>
                    {s.price}
                  </span>
                  <span className={`font-display text-xl font-bold ${activeServiceId === s.id ? 'text-stone-900 dark:text-parchment-light' : 'text-stone-600 dark:text-stone-300'}`}>
                    {s.name}
                  </span>
                  {activeServiceId === s.id && (
                    <span className="absolute top-4 right-4 material-symbols-outlined text-gold-dark dark:text-gold-light text-lg">check_circle</span>
                  )}
                </button>
              ))}
            </div>
          </section>

          <section className="reveal" style={{ animationDelay: '400ms' }}>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[11px] uppercase tracking-[0.3em] font-black text-stone-500 dark:text-stone-400 flex items-center gap-4">
                <span className="w-8 h-8 rounded-full bg-gold/20 text-gold-dark dark:text-gold-light flex items-center justify-center text-xs font-black">02</span>
                Selecione a Data
              </h3>
              <span className="text-gold-dark dark:text-gold-light text-xs font-black font-display italic uppercase">
                {currentMonthName} {currentYear}
              </span>
            </div>
            <div className="bg-white/80 dark:bg-luxury-medium/40 p-10 rounded-[3rem] border border-gold/10 grid grid-cols-7 gap-4 md:gap-6 text-center backdrop-blur-xl shadow-sm">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                <span key={i} className="text-[10px] text-stone-400 dark:text-stone-500 font-black opacity-60">{d}</span>
              ))}

              {/* Empty slots for correct alignment */}
              {emptyDays.map((d) => (
                <div key={`empty-${d}`} />
              ))}

              {/* Days of the month */}
              {monthDays.map((day) => {
                const isAvailable = availableDays.includes(day);
                const isSelected = selectedDate === day;
                return (
                  <button
                    key={day}
                    disabled={!isAvailable}
                    onClick={() => setSelectedDate(day)}
                    className={`aspect-square flex items-center justify-center text-sm font-bold rounded-2xl transition-all border ${!isAvailable ? 'text-stone-300 dark:text-stone-700 border-transparent opacity-20 cursor-not-allowed' :
                      isSelected ? 'bg-gold border-gold text-white shadow-[0_10px_20px_rgba(197,160,89,0.3)] scale-110' :
                        'bg-stone-50 dark:bg-luxury-black text-stone-700 dark:text-stone-300 border-gold/10 hover:border-gold hover:text-gold-dark dark:hover:text-gold'
                      }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* Action Sidebar */}
        <div className="lg:col-span-5 space-y-12 lg:sticky lg:top-40">
          <section className="reveal" style={{ animationDelay: '600ms' }}>
            <h3 className="text-[11px] uppercase tracking-[0.3em] font-black text-stone-500 dark:text-stone-400 mb-8 flex items-center gap-4">
              <span className="w-8 h-8 rounded-full bg-gold/20 text-gold-dark dark:text-gold-light flex items-center justify-center text-xs font-black">03</span>
              Horários
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {times.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTime(t)}
                  className={`py-5 rounded-2xl border text-xs font-bold tracking-widest transition-all ${selectedTime === t
                    ? 'bg-gold border-gold text-white shadow-xl'
                    : 'border-gold/10 bg-white/60 dark:bg-luxury-medium/40 text-stone-600 dark:text-stone-300 hover:border-gold/40'
                    }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </section>

          <div className="bg-luxury-black dark:bg-black text-parchment-light rounded-[3rem] p-10 space-y-8 shadow-2xl relative overflow-hidden reveal border border-gold/10" style={{ animationDelay: '800ms' }}>
            <OrnamentalSVG className="absolute top-0 right-0 w-32 h-32 text-gold/10 pointer-events-none translate-x-1/4 -translate-y-1/4" />

            <h4 className="font-display text-3xl font-bold text-gold italic border-b border-white/10 pb-6">Resumo da Reserva</h4>

            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-stone-500 font-black block mb-1">Técnica</span>
                  <span className="text-lg font-display font-bold">{services.find(s => s.id === activeServiceId)?.name}</span>
                </div>
                <span className="text-gold font-black text-xl">{services.find(s => s.id === activeServiceId)?.price}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-widest text-stone-500 font-black block mb-1">Data e Horário</span>
                <span className="text-lg text-parchment-light font-bold">{selectedDate} {currentMonthName}, {currentYear} às <span className="text-gold font-black">{selectedTime}</span></span>
              </div>
            </div>

            <button
              onClick={onConfirm}
              className="w-full gold-gradient text-white font-black py-6 rounded-3xl shadow-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] uppercase tracking-[0.4em] text-[11px] mt-4 shadow-[0_10px_30px_rgba(131,102,38,0.4)]"
            >
              Solicitar Reserva Premium
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booking;
