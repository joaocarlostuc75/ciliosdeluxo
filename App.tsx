
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import BottomNav from './components/BottomNav';
import { Page, Service, User, Appointment, Client } from './types';
import { supabase } from './lib/supabase';

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
  const [currentPage, setCurrentPage] = useState<Page>(Page.SPLASH);
  const [services, setServices] = useState<Service[]>([]);
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [studio, setStudio] = useState<User>({
    name: 'Cílios de Luxo Studio',
    whatsapp: '+55',
    address: '',
    email: '',
    businessHours: [],
    blocks: []
  });
  // Date Logic
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonthIndex = today.getMonth(); // 0-11
  const currentDay = today.getDate();

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const currentMonthName = monthNames[currentMonthIndex];

  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<number>(currentDay);
  const [selectedTime, setSelectedTime] = useState<string>('10:00');
  const [availableDays, setAvailableDays] = useState<number[]>([]);
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState<string>('admin123');
  const [darkMode, setDarkMode] = useState(false);

  // Dark mode Logic
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  // Load Initial Data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      // 1. Fetch Services
      const { data: servicesData } = await supabase.from('services').select('*');
      if (servicesData) {
        setServices(servicesData.map(s => ({
          id: s.id,
          name: s.name,
          price: s.price,
          description: s.description || '',
          longDescription: s.long_description || '',
          duration: s.duration || '',
          maintenance: s.maintenance || '',
          image: s.image_url || 'https://picsum.photos/seed/default/600/800'
        })));
      }

      // 2. Fetch Business Hours
      const { data: hoursData } = await supabase.from('operating_hours').select('*').order('day_of_week', { ascending: true });
      if (hoursData) {
        setStudio(prev => ({
          ...prev,
          businessHours: hoursData.map(h => ({
            dayOfWeek: h.day_of_week,
            isOpen: h.is_open,
            slots: h.slots
          }))
        }));
      }

      // 3. Fetch Agenda Blocks
      const { data: blocksData } = await supabase.from('agenda_blocks').select('*');
      if (blocksData) {
        setStudio(prev => ({
          ...prev,
          blocks: blocksData.map(b => ({
            id: b.id,
            startDate: b.start_date,
            endDate: b.end_date,
            reason: b.reason || 'Ausência'
          }))
        }));
      }

      // 4. Fetch Appointments
      const { data: appData } = await supabase.from('appointments').select('*');
      if (appData) {
        setAllAppointments(appData.map(a => ({
          id: a.id,
          serviceId: a.service_id,
          serviceName: a.service_name || 'Serviço',
          clientName: a.client_name,
          clientWhatsapp: a.client_whatsapp,
          date: a.date,
          month: a.month,
          time: a.time,
          status: a.status as any,
          price: a.price
        })));
        // 5. Fetch Studio Profile
        const { data: profileData } = await supabase.from('profiles').select('*').single();
        if (profileData) {
          setStudio(prev => ({
            ...prev,
            name: profileData.name || prev.name,
            ownerName: profileData.owner_name || prev.ownerName,
            whatsapp: profileData.whatsapp || prev.whatsapp,
            address: profileData.address || prev.address,
            email: profileData.email || prev.email,
            history: profileData.history || prev.history,
            mission: profileData.mission || prev.mission,
            image: profileData.avatar_url || prev.image
          }));
        }
      };

      fetchData();
    }, []);

  // Generate available days
  useEffect(() => {
    const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
    const days: number[] = [];

    for (let d = currentDay; d <= daysInMonth; d++) {
      const date = new Date(currentYear, currentMonthIndex, d);
      const weekDay = date.getDay();
      const dateStr = date.toISOString().split('T')[0];

      // Check Business Hours
      const dayConfig = studio.businessHours?.find(h => h.dayOfWeek === weekDay);
      if (dayConfig && !dayConfig.isOpen) continue;

      // Check Blocks
      const isBlocked = studio.blocks?.some(block =>
        dateStr >= block.startDate && dateStr <= block.endDate
      );
      if (isBlocked) continue;

      days.push(d);
    }
    setAvailableDays(days);
  }, [currentDay, currentMonthIndex, currentYear, studio.businessHours, studio.blocks]);


  const [client, setClient] = useState<User>({
    name: 'Maria Valentina',
    whatsapp: '11987654321',
    address: '',
    email: 'maria.v@exemplo.com',
    appointments: [
      { id: 'h1', serviceId: 'volume-brasileiro', serviceName: 'Volume Brasileiro', date: currentDay + 5, month: currentMonthName, time: '15:30', status: 'upcoming', price: 'R$ 130,00', clientName: 'Maria Valentina', clientWhatsapp: '11987654321' },
    ]
  });

  const selectedService = services.find(s => s.id === selectedServiceId) || null;

  const navigateToService = (service: Service) => {
    setSelectedServiceId(service.id);
    setCurrentPage(Page.SERVICE_DETAILS);
  };

  // CRUD Handlers
  const handleUpdateService = async (updated: Service) => {
    setServices(prev => prev.map(s => s.id === updated.id ? updated : s));
    await supabase.from('services').update({
      name: updated.name,
      price: updated.price,
      description: updated.description,
      long_description: updated.longDescription,
      duration: updated.duration,
      maintenance: updated.maintenance,
      image_url: updated.image
    }).eq('id', updated.id);
  };

  const handleDeleteService = async (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
    await supabase.from('services').delete().eq('id', id);
  };

  const handleAddService = async (service: Service) => {
    const { data } = await supabase.from('services').insert({
      name: service.name,
      price: service.price,
      description: service.description,
      long_description: service.longDescription,
      duration: service.duration,
      maintenance: service.maintenance,
      image_url: service.image
    }).select().single();
    if (data) setServices(prev => [...prev, { ...service, id: data.id }]);
  };

  const handleUpdateAppointment = async (updated: Appointment) => {
    setAllAppointments(prev => prev.map(a => a.id === updated.id ? updated : a));
    if (updated.clientWhatsapp === client.whatsapp) {
      setClient(prev => ({
        ...prev,
        appointments: prev.appointments?.map(a => a.id === updated.id ? updated : a)
      }));
    }
    await supabase.from('appointments').update({
      status: updated.status,
      date: updated.date,
      time: updated.time
    }).eq('id', updated.id);
  };

  const handleCancelAppointment = async (id: string) => {
    const app = allAppointments.find(a => a.id === id);
    if (app) {
      handleUpdateAppointment({ ...app, status: 'cancelled' });
    }
  };

  const handleRescheduleAppointment = (id: string) => {
    const app = allAppointments.find(a => a.id === id);
    if (app) {
      setReschedulingId(id);
      setSelectedServiceId(app.serviceId);
      setSelectedDate(app.date);
      setSelectedTime(app.time);
      setCurrentPage(Page.BOOKING);
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    setAllAppointments(prev => prev.filter(a => a.id !== id));
    await supabase.from('appointments').delete().eq('id', id);
  };

  const handleUpdateClient = (updated: Client) => setClients(prev => prev.map(c => c.id === updated.id ? updated : c));
  const handleDeleteClient = (id: string) => setClients(prev => prev.filter(c => c.id !== id));

  const handleUpdateBusinessHours = async (hours: any[]) => {
    setStudio(prev => ({ ...prev, businessHours: hours }));
    for (const h of hours) {
      await supabase.from('operating_hours').upsert({
        day_of_week: h.dayOfWeek,
        is_open: h.isOpen,
        slots: h.slots
      });
    }
  };

  const handleAddBlock = async (block: any) => {
    const { data } = await supabase.from('agenda_blocks').insert({
      start_date: block.startDate,
      end_date: block.endDate,
      reason: block.reason
    }).select().single();
    if (data) setStudio(prev => ({ ...prev, blocks: [{ ...block, id: data.id }, ...(prev.blocks || [])] }));
  };

  const handleDeleteBlock = async (id: string) => {
    setStudio(prev => ({ ...prev, blocks: prev.blocks?.filter(b => b.id !== id) || [] }));
    await supabase.from('agenda_blocks').delete().eq('id', id);
  };

  const checkAvailability = (date: number, time: string, serviceId: string, excludeId?: string | null) => {
    const dateObj = new Date(currentYear, currentMonthIndex, date);
    const weekDay = dateObj.getDay();
    const dateStr = dateObj.toISOString().split('T')[0];

    // Check Business Hours
    const dayConfig = studio.businessHours?.find(h => h.dayOfWeek === weekDay);
    if (!dayConfig || !dayConfig.isOpen) return false;

    // Check specific time slot
    const hasSlot = dayConfig.slots.some(slot => time >= slot.start && time < slot.end);
    if (!hasSlot) return false;

    // Check Blocks
    const isBlocked = studio.blocks?.some(block =>
      dateStr >= block.startDate && dateStr <= block.endDate
    );
    if (isBlocked) return false;

    return !allAppointments.some(a =>
      a.date === date &&
      a.month === currentMonthName &&
      a.time === time &&
      a.serviceId === serviceId &&
      a.status !== 'cancelled' &&
      a.id !== excludeId
    );
  };

  const handleAddAppointment = async (app: Appointment) => {
    // If we were rescheduling, remove the old one first or mark as cancelled in local state
    if (reschedulingId) {
      setAllAppointments(prev => prev.filter(a => a.id !== reschedulingId));
      setClient(prev => ({
        ...prev,
        appointments: prev.appointments?.filter(a => a.id !== reschedulingId)
      }));
      // Also delete from Supabase if rescheduling (or we could mark as cancelled)
      await supabase.from('appointments').delete().eq('id', reschedulingId);
      setReschedulingId(null);
    }

    // Save to Supabase
    const { data, error } = await supabase.from('appointments').insert({
      service_id: app.serviceId,
      service_name: app.serviceName,
      client_name: app.clientName,
      client_whatsapp: app.clientWhatsapp,
      date: app.date,
      month: app.month,
      time: app.time,
      status: app.status,
      price: app.price
    }).select().single();

    if (error) {
      console.error('Error saving appointment:', error);
      alert('Erro ao salvar agendamento. Por favor, tente novamente.');
      return;
    }

    const savedApp = { ...app, id: data.id };

    setAllAppointments(prev => [savedApp, ...prev]);
    setClient(prev => ({ ...prev, appointments: [savedApp, ...(prev.appointments || [])] }));

    // Local client list logic (optional persistence)
    if (!clients.find(c => c.whatsapp === client.whatsapp)) {
      setClients(prev => [...prev, {
        id: Date.now().toString(),
        name: client.name,
        whatsapp: client.whatsapp,
        email: client.email,
        totalSpent: 0
      }]);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case Page.SPLASH:
        return <SplashScreen studio={studio} onStart={() => setCurrentPage(Page.HOME)} />;
      case Page.HOME:
        return <Home services={services} onSelectService={navigateToService} />;
      case Page.SERVICE_DETAILS:
        return selectedService ? (
          <ServiceDetails
            service={selectedService}
            isAdmin={isAdmin}
            onBack={() => setCurrentPage(Page.HOME)}
            onBook={() => {
              setReschedulingId(null); // Clear any pending reschedule if starting fresh
              setCurrentPage(Page.BOOKING);
            }}
            onUpdate={handleUpdateService}
          />
        ) : <Home services={services} onSelectService={navigateToService} />;
      case Page.ABOUT:
        return <About studio={studio} setStudio={setStudio} isAdmin={isAdmin} />;
      case Page.BOOKING:
        return (
          <Booking
            studio={studio}
            services={services}
            onConfirm={() => setCurrentPage(Page.CONFIRMATION)}
            selectedService={selectedService}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            selectedTime={selectedTime}
            setSelectedTime={setSelectedTime}
            setSelectedServiceId={setSelectedServiceId}
            availableDays={availableDays}
            currentMonthName={currentMonthName}
            currentYear={currentYear}
            currentMonthIndex={currentMonthIndex}
          />
        );
      case Page.PROFILE:
        return (
          <Profile
            studio={studio}
            setStudio={setStudio}
            client={client}
            setClient={setClient}
            clients={clients}
            services={services}
            allAppointments={allAppointments}
            availableDays={availableDays}
            setAvailableDays={setAvailableDays}
            isAdmin={isAdmin}
            setIsAdmin={setIsAdmin}
            onNavigate={setCurrentPage}
            // App Logic Callbacks
            onUpdateService={handleUpdateService}
            onDeleteService={handleDeleteService}
            onAddService={handleAddService}
            onUpdateAppointment={handleUpdateAppointment}
            onDeleteAppointment={handleDeleteAppointment}
            onUpdateClient={handleUpdateClient}
            onDeleteClient={handleDeleteClient}
            onCancelAppointment={handleCancelAppointment}
            onRescheduleAppointment={handleRescheduleAppointment}
            onUpdateBusinessHours={handleUpdateBusinessHours}
            onAddBlock={handleAddBlock}
            onDeleteBlock={handleDeleteBlock}
            currentYear={currentYear}
            // Password Management
            adminPassword={adminPassword}
            setAdminPassword={setAdminPassword}
          />
        );
      case Page.ADMIN_LOGIN:
        return (
          <AdminLogin
            adminPassword={adminPassword}
            onLogin={() => {
              setIsAdmin(true);
              setCurrentPage(Page.PROFILE);
            }}
            onBack={() => setCurrentPage(Page.PROFILE)}
          />
        );
      case Page.CONFIRMATION:
        return (
          <Confirmation
            client={client}
            setClient={setClient}
            studioWhatsapp={studio.whatsapp}
            selectedService={selectedService}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onConfirmBooking={handleAddAppointment}
            checkAvailability={(d, t, s) => checkAvailability(d, t, s, reschedulingId)}
            onFinish={() => setCurrentPage(Page.HOME)}
            currentMonthName={currentMonthName}
            currentYear={currentYear}
            currentMonthIndex={currentMonthIndex}
          />
        );
      default:
        return <Home services={services} onSelectService={navigateToService} />;
    }
  };

  const showNav = ![Page.SPLASH, Page.CONFIRMATION, Page.ADMIN_LOGIN].includes(currentPage);

  return (
    <Layout
      activePage={currentPage}
      onNavigate={setCurrentPage}
      studio={studio}
      darkMode={darkMode}
      toggleDarkMode={toggleDarkMode}
    >
      {renderPage()}
      {showNav && (
        <div className="md:hidden">
          <BottomNav activePage={currentPage} onNavigate={setCurrentPage} />
        </div>
      )}
    </Layout>
  );
};

export default App;
