import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import BottomNav from './components/BottomNav';
import { Page, Service, User, Appointment, Client } from './types';
import { supabase } from './lib/supabase';
import { Routes, Route, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import SplashScreen from './pages/SplashScreen';
import Home from './pages/Home';
import ServiceDetails from './pages/ServiceDetails';
import About from './pages/About';
import Booking from './pages/Booking';
import Profile from './pages/Profile';
import Confirmation from './pages/Confirmation';
import AdminLogin from './pages/AdminLogin';

const App: React.FC = () => {
  const { user, studioProfile, loading: authLoading, retry } = useAuth();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  if (authLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-luxury-black text-gold space-y-8">
      <div className="font-display text-xl animate-pulse">Iniciando sistema...</div>
      <button
        onClick={retry}
        className="px-6 py-3 border border-gold/30 rounded-full text-[10px] uppercase font-bold tracking-widest hover:bg-gold/10 transition-all font-sans"
      >
        Tentar Novamente
      </button>
    </div>
  );

  return (
    <Routes>
      <Route path="/admin" element={
        user ? <StudioPage isAdminView={true} darkMode={darkMode} toggleDarkMode={() => setDarkMode(!darkMode)} />
          : <AdminLogin onLogin={() => navigate('/admin')} onBack={() => navigate('/')} />
      } />
      {/* Route directly to Cílios de Luxo for root */}
      <Route path="*" element={<StudioPage darkMode={darkMode} toggleDarkMode={() => setDarkMode(!darkMode)} />} />
    </Routes>
  );
};

const StudioPage: React.FC<{ isAdminView?: boolean; darkMode: boolean; toggleDarkMode: () => void }> = ({ isAdminView = false, darkMode, toggleDarkMode }) => {
  const { slug } = useParams<{ slug: string }>();
  const { user, studioProfile } = useAuth();
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState<Page>(Page.HOME);
  const [studio, setStudio] = useState<User | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States for Booking
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string>('10:00');
  const [availableDays, setAvailableDays] = useState<number[]>([]);
  const [viewDate, setViewDate] = useState(new Date());

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const currentYear = viewDate.getFullYear();
  const currentMonthIndex = viewDate.getMonth();
  const currentMonthName = monthNames[currentMonthIndex];

  useEffect(() => {
    const loadData = async () => {
      console.log('StudioPage: Inicia carregamento', { slug, isAdminView, studioProfileId: studioProfile?.id });
      setLoading(true);
      setError(null);
      try {
        let profile: User | null = null;
        let pId: string | null = null;

        const fetchProfilePromise = supabase
          .from('profiles')
          .select('*')
          // FORCE SINGLE TENANT: Always load cílios-de-luxo or the admin's profile
          .eq(isAdminView ? 'id' : 'slug', isAdminView ? user?.id : 'cilios-de-luxo')
          .single();

        const timeoutPromise = new Promise<null>((_, reject) => {
          setTimeout(() => reject(new Error('Tempo limite de carregamento excedido (8s)')), 8000);
        });

        const { data, error: fetchError } = await Promise.race([fetchProfilePromise, timeoutPromise]) as any;

        if (fetchError) throw fetchError;

        if (data) {
          profile = {
            id: data.id,
            name: data.name,
            ownerName: data.owner_name,
            whatsapp: data.whatsapp,
            address: data.address,
            email: data.email,
            history: data.history,
            mission: data.mission,
            image: data.avatar_url,
            businessHours: [],
            blocks: []
          };
          pId = data.id;
        }

        if (profile && pId) {
          console.log('StudioPage: Profile encontrado, buscando entidades', { pId });
          const { data: srvs } = await supabase.from('services').select('*').eq('profile_id', pId);
          const { data: hours } = await supabase.from('operating_hours').select('*').eq('profile_id', pId);
          const { data: blocks } = await supabase.from('agenda_blocks').select('*').eq('profile_id', pId);

          setStudio({
            ...profile,
            businessHours: hours?.map(h => ({ dayOfWeek: h.day_of_week, isOpen: h.is_open, slots: h.slots })) || [],
            blocks: blocks?.map(b => ({ id: b.id, startDate: b.start_date, endDate: b.end_date, reason: b.reason })) || []
          });

          const mappedServices = srvs?.map(s => ({
            id: s.id,
            name: s.name,
            price: `R$ ${Number(s.price).toFixed(2).replace('.', ',')}`,
            description: s.description || '',
            longDescription: s.long_description || '',
            duration: s.duration || '',
            maintenance: s.maintenance || '',
            image: s.image_url || ''
          })) || [];
          setServices(mappedServices);
          console.log('StudioPage: Serviços carregados', mappedServices.length);

          if (isAdminView) {
            const { data: apps } = await supabase.from('appointments').select('*').eq('profile_id', pId);
            const { data: clts } = await supabase.from('clients').select('*').eq('profile_id', pId);
            setAllAppointments(apps || []);
            setClients(clts || []);
          }
        } else {
          console.log('StudioPage: Profile não encontrado ou incompleto');
        }
      } catch (e: any) {
        console.error('StudioPage: Erro fatal no loadData', e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [slug, isAdminView, studioProfile, user]);

  const { retry } = useAuth();

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-luxury-black text-gold space-y-8">
      <div className="font-display text-xl animate-pulse">Carregando Estúdio...</div>
      <button
        onClick={retry}
        className="px-6 py-3 border border-gold/30 rounded-full text-[10px] uppercase font-bold tracking-widest hover:bg-gold/10 transition-all font-sans"
      >
        Tentar Novamente
      </button>
    </div>
  );

  if (error || !studio) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-luxury-black text-white p-8 space-y-8">
      <h2 className="font-display text-4xl text-rose-500 italic">Estúdio não encontrado</h2>
      <p className="text-stone-400 text-center max-w-sm font-sans uppercase tracking-widest text-[10px]">
        {error ? `Erro: ${error}` : 'Verifique se o endereço está correto ou se o estúdio ainda faz parte da nossa rede.'}
      </p>
      <div className="flex gap-4">
        <button onClick={() => navigate('/')} className="px-8 py-3 border border-gold/40 text-gold rounded-full font-bold uppercase tracking-widest text-[10px]">Voltar para Início</button>
        <button onClick={retry} className="px-8 py-3 bg-gold text-white rounded-full font-bold uppercase tracking-widest text-[10px]">Tentar Novamente</button>
      </div>
    </div>
  );

  // Booking State
  const [bookingClient, setBookingClient] = useState<User>({
    id: '',
    name: '',    // Initialized empty for user input
    whatsapp: '', // Initialized empty for user input
    image: '',
    email: '',
    address: '',
    history: '',
    mission: '',
    ownerName: '',
    businessHours: [],
    blocks: []
  });

  const renderPage = () => {
    const selectedService = services.find(s => s.id === (selectedServiceId || services[0]?.id)) || null;
    switch (currentPage) {
      case Page.HOME: return <Home services={services} onSelectService={(s) => { setSelectedServiceId(s.id); setCurrentPage(Page.SERVICE_DETAILS); }} studioName={studio.name} />;
      case Page.SERVICE_DETAILS: return selectedService ? <ServiceDetails service={selectedService} isAdmin={isAdminView} onBack={() => setCurrentPage(Page.HOME)} onBook={() => setCurrentPage(Page.BOOKING)} onUpdate={() => { }} /> : <Home services={services} onSelectService={() => { }} studioName={studio.name} />;
      case Page.ABOUT: return <About studio={studio} setStudio={setStudio} isAdmin={isAdminView} />;
      case Page.BOOKING: return <Booking studio={studio} services={services} onConfirm={() => setCurrentPage(Page.CONFIRMATION)} selectedService={selectedService} selectedDate={parseInt(selectedDate.split('-')[2])} setSelectedDate={(d) => setSelectedDate(new Date(currentYear, currentMonthIndex, d).toISOString().split('T')[0])} selectedTime={selectedTime} setSelectedTime={setSelectedTime} setSelectedServiceId={setSelectedServiceId} availableDays={availableDays} currentMonthName={currentMonthName} currentYear={currentYear} currentMonthIndex={currentMonthIndex} onPrevMonth={() => setViewDate(d => new Date(d.setMonth(d.getMonth() - 1)))} onNextMonth={() => setViewDate(d => new Date(d.setMonth(d.getMonth() + 1)))} />;
      case Page.PROFILE: return <Profile
        studio={studio}
        setStudio={setStudio}
        client={{} as any} // Profile page for admin/existing logic
        setClient={() => { }}
        clients={clients}
        services={services}
        allAppointments={allAppointments}
        availableDays={availableDays}
        setAvailableDays={() => { }}
        isAdmin={isAdminView}
        setIsAdmin={() => { }}
        onNavigate={setCurrentPage}
        currentYear={currentYear}
        onUpdateProfile={async (updatedProfile) => {
          if (!updatedProfile.id) return;
          const { data, error } = await supabase.from('profiles').update({
            name: updatedProfile.name,
            owner_name: updatedProfile.ownerName,
            whatsapp: updatedProfile.whatsapp,
            address: updatedProfile.address,
            email: updatedProfile.email,
            history: updatedProfile.history,
            mission: updatedProfile.mission,
            avatar_url: updatedProfile.image
          }).eq('id', updatedProfile.id).select();

          if (error) {
            console.error('Erro ao atualizar perfil:', error);
            alert(`Erro ao salvar perfil: ${error.message}`);
          } else if (!data || data.length === 0) {
            console.warn('Nenhum dado atualizado. Verifique permissões RLS.', updatedProfile.id);
            alert('Atenção: As alterações não foram salvas. Verifique se você tem permissão para editar este perfil.');
          } else {
            console.log('Perfil atualizado com sucesso!', data);
            alert('Perfil atualizado com sucesso!');
            // Update local state to ensure UI reflects persistence
            setStudio(prev => prev ? { ...prev, ...updatedProfile } : null);
          }
        }}
        onUpdateService={async (updatedService) => {
          const { error } = await supabase.from('services').update({
            name: updatedService.name,
            price: parseFloat(updatedService.price.replace('R$', '').replace(',', '.').trim()),
            description: updatedService.description,
            long_description: updatedService.longDescription,
            duration: updatedService.duration,
            maintenance: updatedService.maintenance,
            image_url: updatedService.image
          }).eq('id', updatedService.id);

          if (error) alert('Erro ao atualizar serviço.');
          else {
            setServices(prev => prev.map(s => s.id === updatedService.id ? updatedService : s));
          }
        }}
        onDeleteService={() => { }}
        onAddService={async (newService) => {
          if (!studio.id) return;
          const { data, error } = await supabase.from('services').insert({
            profile_id: studio.id,
            name: newService.name,
            price: parseFloat(newService.price.replace('R$', '').replace(',', '.').trim()),
            description: newService.description,
            long_description: newService.longDescription,
            image_url: newService.image
          }).select().single();

          if (error) alert('Erro ao adicionar serviço.');
          else if (data) {
            const mapped = {
              id: data.id,
              name: data.name,
              price: `R$ ${Number(data.price).toFixed(2).replace('.', ',')}`,
              description: data.description || '',
              longDescription: data.long_description || '',
              duration: data.duration || '',
              maintenance: data.maintenance || '',
              image: data.image_url || ''
            };
            setServices(prev => [...prev, mapped]);
          }
        }}
        onUpdateAppointment={async (updatedAppt) => {
          // Placeholder for update appointment logic if needed
        }}
        onDeleteAppointment={() => { }}
        onUpdateClient={async (updatedClient: any) => {
          const { error } = await supabase.from('clients').update({
            name: updatedClient.name,
            email: updatedClient.email,
            phone: updatedClient.phone,
            instagram: updatedClient.instagram,
            notes: updatedClient.notes
          }).eq('id', updatedClient.id);

          if (error) {
            console.error('Erro ao atualizar cliente:', error);
            alert('Erro ao atualizar cliente.');
          } else {
            setClients(prev => prev.map(c => c.id === updatedClient.id ? {
              ...c,
              name: updatedClient.name,
              email: updatedClient.email,
              whatsapp: updatedClient.phone,
              notes: updatedClient.notes
            } : c));
          }
        }}
        onDeleteClient={() => { }}
        onAddClient={async (newClient: any) => {
          if (!studio.id) return;
          const { data, error } = await supabase.from('clients').insert({
            profile_id: studio.id,
            name: newClient.name,
            email: newClient.email,
            phone: newClient.phone,
            instagram: newClient.instagram,
            notes: newClient.notes
          }).select().single();

          if (error) {
            console.error('Erro ao adicionar cliente:', error);
            alert('Erro ao cadastrar cliente.');
          } else if (data) {
            setClients(prev => [...prev, {
              id: data.id,
              name: data.name,
              email: data.email,
              whatsapp: data.phone || '', // Map phone column to whatsapp property
              notes: data.notes,
              totalSpent: 0 // Initialize required property
            }]);
          }
        }}
        onCancelAppointment={() => { }}
        onRescheduleAppointment={() => { }}
        onUpdateBusinessHours={async (newHours) => {
          if (!studio.id) return;
          console.log('Salvando horários...', newHours);

          const updates = newHours.map(h => ({
            profile_id: studio.id,
            day_of_week: h.dayOfWeek,
            is_open: h.isOpen,
            slots: h.slots
          }));

          const { error } = await supabase.from('operating_hours').upsert(updates, { onConflict: 'day_of_week,profile_id' });

          if (error) {
            console.error('Erro ao salvar horários:', error);
            alert('Erro ao salvar horários de funcionamento.');
          } else {
            console.log('Horários salvos com sucesso!');
            setStudio(prev => prev ? { ...prev, businessHours: newHours } : null);
          }
        }}
        onAddBlock={() => { }}
        onDeleteBlock={() => { }}
      />;
      case Page.CONFIRMATION: return <Confirmation client={bookingClient} setClient={setBookingClient} studioWhatsapp={studio.whatsapp} selectedService={selectedService} selectedDate={selectedDate} selectedTime={selectedTime} onConfirmBooking={async () => { }} checkAvailability={() => true} onFinish={() => setCurrentPage(Page.HOME)} currentMonthName={currentMonthName} currentYear={currentYear} currentMonthIndex={currentMonthIndex} />;
      default: return <Home services={services} onSelectService={() => { }} studioName={studio.name} />;
    }
  };

  return (
    <Layout activePage={currentPage} onNavigate={setCurrentPage} studio={studio} darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
      {renderPage()}
      <div className="md:hidden">
        <BottomNav activePage={currentPage} onNavigate={setCurrentPage} />
      </div>
    </Layout>
  );
};

export default App;
