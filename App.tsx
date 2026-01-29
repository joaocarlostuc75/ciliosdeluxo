
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
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    // Splash screen disabled - always start at HOME
    const savedPage = localStorage.getItem('currentPage');
    if (savedPage) return savedPage as Page;
    return Page.HOME; // Skip splash, go directly to HOME
  });

  useEffect(() => {
    localStorage.setItem('currentPage', currentPage);
  }, [currentPage]);
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
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [selectedTime, setSelectedTime] = useState<string>('10:00');
  const [availableDays, setAvailableDays] = useState<number[]>([]);
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(() => {
    const savedAdminState = localStorage.getItem('isAdmin');
    return savedAdminState === 'true';
  });
  const [adminPassword, setAdminPassword] = useState<string>('admin123');
  const [profileId, setProfileId] = useState<string | undefined>(undefined);
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
          price: typeof s.price === 'number' ? `R$ ${s.price.toFixed(2).replace('.', ',')}` : s.price,
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
        setAllAppointments(appData.map(a => {
          // Helper to get month name from date string (YYYY-MM-DD)
          const dateObj = new Date(a.date + 'T12:00:00'); // Midday to avoid timezone issues
          const monthName = dateObj.toLocaleString('pt-BR', { month: 'long' });

          return {
            id: a.id,
            serviceId: a.service_id,
            serviceName: a.service_name || 'Serviço',
            clientName: a.client_name || 'Cliente',
            clientWhatsapp: a.client_whatsapp || '',
            date: a.date,
            month: monthName.charAt(0).toUpperCase() + monthName.slice(1), // Capitalize
            time: a.time,
            status: a.status as any,
            price: typeof a.service_price === 'number' ? `R$ ${a.service_price.toFixed(2).replace('.', ',')}` : 'R$ 130,00'
          };
        }));
      }
      // 5. Fetch Studio Profile
      const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').single();
      if (profileError) {
        console.error('Error fetching profile:', profileError);
      }
      if (profileData) {
        console.log('Profile loaded:', profileData);
        setProfileId(profileData.id);
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
      } else {
        console.warn('No profile data found in database');
      }

      // 6. Fetch Clients
      const { data: clientsData } = await supabase.from('clients').select('*');
      if (clientsData) {
        setClients(clientsData.map(c => ({
          id: c.id,
          name: c.name,
          whatsapp: c.whatsapp,
          email: '', // Not in DB yet, default empty
          totalSpent: 0, // Calculated on frontend for now
          notes: c.notes
        })));
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
    name: '',
    whatsapp: '',
    address: '',
    email: '',
    appointments: []
  });

  const selectedService = services.find(s => s.id === selectedServiceId) || null;

  const navigateToService = (service: Service) => {
    setSelectedServiceId(service.id);
    setCurrentPage(Page.SERVICE_DETAILS);
  };

  // Helper to parse duration string to minutes (e.g., "2h" -> 120, "1h 30m" -> 90)
  const parseDurationToMinutes = (durationStr: string): number => {
    let minutes = 0;
    const hoursMatch = durationStr.match(/(\d+)\s*h/i);
    const minsMatch = durationStr.match(/(\d+)\s*m/i);
    if (hoursMatch) minutes += parseInt(hoursMatch[1]) * 60;
    if (minsMatch) minutes += parseInt(minsMatch[1]);
    return minutes || 60; // Default to 60 if parsing fails
  };

  // CRUD Handlers
  const handleUpdateService = async (updated: Service) => {
    setServices(prev => prev.map(s => s.id === updated.id ? updated : s));

    const numericPrice = parseFloat(updated.price.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    const durationMins = parseDurationToMinutes(updated.duration);

    await supabase.from('services').update({
      name: updated.name,
      price: numericPrice,
      description: updated.description,
      long_description: updated.longDescription,
      duration: updated.duration,
      duration_minutes: durationMins,
      maintenance: updated.maintenance,
      image_url: updated.image
    }).eq('id', updated.id);
  };

  const handleDeleteService = async (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
    await supabase.from('services').delete().eq('id', id);
  };

  const handleAddService = async (service: Service) => {
    const numericPrice = parseFloat(service.price.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    const durationMins = parseDurationToMinutes(service.duration);

    const { data, error } = await supabase.from('services').insert({
      name: service.name,
      price: numericPrice,
      description: service.description,
      long_description: service.longDescription,
      duration: service.duration,
      duration_minutes: durationMins,
      maintenance: service.maintenance,
      image_url: service.image
    }).select().single();

    if (error) {
      console.error("Error adding service:", error);
      alert("Erro ao adicionar serviço.");
      return;
    }

    if (data) {
      setServices(prev => [...prev, {
        ...service,
        id: data.id,
        price: `R$ ${numericPrice.toFixed(2).replace('.', ',')}`
      }]);
    }
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
      handleUpdateAppointment({ ...app, status: 'CANCELLED' });
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

  const handleUpdateClient = async (updated: Client) => {
    setClients(prev => prev.map(c => c.id === updated.id ? updated : c));
    await supabase.from('clients').update({
      name: updated.name,
      whatsapp: updated.whatsapp,
      notes: (updated as any).notes // Cast as any if notes is not in interface, check types
    }).eq('id', updated.id);
  };

  const handleDeleteClient = async (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    await supabase.from('clients').delete().eq('id', id);
  };

  const handleAddClient = async (newClient: Client) => {
    const { data, error } = await supabase.from('clients').insert({
      name: newClient.name,
      whatsapp: newClient.whatsapp,
      notes: (newClient as any).notes
    }).select().single();

    if (error) {
      console.error("Error adding client:", error);
      alert("Erro ao adicionar cliente.");
      return;
    }

    if (data) {
      setClients(prev => [...prev, { ...newClient, id: data.id }]);
    }
  };

  const handleAddBlock = async (block: any) => {
    const { data } = await supabase.from('agenda_blocks').insert({
      start_date: block.startDate,
      end_date: block.endDate,
      reason: block.reason
    }).select().single();
    if (data) setStudio(prev => ({ ...prev, blocks: [{ id: data.id, startDate: block.startDate, endDate: block.endDate, reason: block.reason }, ...(prev.blocks || [])] }));
  };

  const handleDeleteBlock = async (id: string) => {
    setStudio(prev => ({ ...prev, blocks: prev.blocks?.filter(b => b.id !== id) || [] }));
    await supabase.from('agenda_blocks').delete().eq('id', id);
  };

  const checkAvailability = (dateStr: string, time: string, serviceId: string, excludeId?: string | null) => {
    const dateObj = new Date(dateStr + 'T12:00:00');
    const weekDay = dateObj.getDay();

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
      a.date === dateStr &&
      a.month === currentMonthName &&
      a.time === time &&
      a.serviceId === serviceId &&
      a.status !== 'CANCELLED' &&
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

    // Safety check: Ensure date is in YYYY-MM-DD format
    let finalDate = app.date;
    if (!String(finalDate).includes('-')) {
      console.warn('Date received is not in ISO format:', finalDate);
      const dayNum = parseInt(String(finalDate));
      if (!isNaN(dayNum)) {
        const d = new Date(currentYear, currentMonthIndex, dayNum);
        finalDate = d.toISOString().split('T')[0];
        console.log('Reconstructed date:', finalDate);
      } else {
        throw new Error('Formato de data inválido para o agendamento.');
      }
    }

    // Convert price to numeric
    const numericPrice = parseFloat(app.price.replace(/[^\d,]/g, '').replace(',', '.')) || 0;

    console.log('Saving appointment with date:', finalDate, 'and price:', numericPrice);

    // Save to Supabase
    const { data, error } = await supabase.from('appointments').insert({
      service_id: app.serviceId !== 'unknown' ? app.serviceId : null,
      service_name: app.serviceName,
      client_name: app.clientName,
      client_whatsapp: app.clientWhatsapp,
      service_price: numericPrice,
      date: finalDate,
      time: app.time,
      status: app.status
    }).select().single();

    if (error) {
      console.error('Error saving appointment:', error);
      throw error; // Throw so Confirmation.tsx can catch it
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



  const handleUpdateProfile = async (updatedStudio: User) => {
    try {
      setStudio(updatedStudio);

      console.log('Starting profile save process...');
      console.log('Updated studio data (keys):', Object.keys(updatedStudio));

      // ALWAYS fetch the profile ID from database before saving
      console.log('Fetching profile ID from database...');
      const { data: profileData, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .single();

      if (fetchError) {
        console.error('Error fetching profile ID:', fetchError);
        alert('Erro ao buscar perfil do banco de dados. Detalhes: ' + fetchError.message);
        return;
      }

      if (!profileData || !profileData.id) {
        console.error('No profile found in database');
        alert('Nenhum perfil encontrado no banco de dados. Por favor, contate o suporte.');
        return;
      }

      const dbProfileId = profileData.id;
      console.log('Profile ID from database:', dbProfileId);

      // Update state if needed
      if (!profileId) {
        setProfileId(dbProfileId);
      }

      // Save using UPDATE with the confirmed ID
      console.log('Saving profile to database...');
      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({
          name: updatedStudio.name,
          owner_name: updatedStudio.ownerName,
          whatsapp: updatedStudio.whatsapp,
          address: updatedStudio.address,
          email: updatedStudio.email,
          avatar_url: updatedStudio.image,
          history: updatedStudio.history,
          mission: updatedStudio.mission
        })
        .eq('id', dbProfileId)
        .select();

      console.log('Update response data:', updateData);
      console.log('Update error:', updateError);

      if (updateError) {
        console.error("Error updating profile:", updateError);
        alert(`Erro ao salvar perfil:\nMensagem: ${updateError.message}\nCódigo: ${updateError.code || 'N/A'}\nDetalhes: ${updateError.details || 'N/A'}`);
      } else {
        console.log('Profile saved successfully!');
        alert("Perfil atualizado com sucesso!");
      }
    } catch (error: any) {
      console.error('Unexpected error in handleUpdateProfile:', error);
      alert('Erro inesperado ao salvar perfil: ' + (error?.message || 'Desconhecido'));
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case Page.SPLASH:
        return <SplashScreen studio={studio} onStart={() => {
          localStorage.setItem('hasSeenSplash', 'true');
          setCurrentPage(Page.HOME);
        }} />;
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
            selectedDate={parseInt(selectedDate.split('-')[2])}
            setSelectedDate={(day) => {
              const newDate = new Date(currentYear, currentMonthIndex, day);
              setSelectedDate(newDate.toISOString().split('T')[0]);
            }}
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
            onAddClient={handleAddClient}
            onCancelAppointment={handleCancelAppointment}
            onRescheduleAppointment={handleRescheduleAppointment}
            onUpdateBusinessHours={handleUpdateBusinessHours}
            onAddBlock={handleAddBlock}
            onDeleteBlock={handleDeleteBlock}
            currentYear={currentYear}
            // Password Management
            adminPassword={adminPassword}
            setAdminPassword={setAdminPassword}
            onUpdateProfile={handleUpdateProfile}
          />
        );
      case Page.ADMIN_LOGIN:
        return (
          <AdminLogin
            adminPassword={adminPassword}
            onLogin={() => {
              setIsAdmin(true);
              localStorage.setItem('isAdmin', 'true');
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
