
export enum Page {
  SPLASH = 'splash',
  HOME = 'home',
  SERVICE_DETAILS = 'service_details',
  ABOUT = 'about',
  BOOKING = 'booking',
  PROFILE = 'profile',
  CONFIRMATION = 'confirmation',
  ADMIN_LOGIN = 'admin_login'
}

export interface Appointment {
  id: string;
  serviceId: string;
  serviceName: string;
  clientName: string;
  clientWhatsapp: string;
  date: number;
  month: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  price: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  image: string;
}

export interface Service {
  id: string;
  name: string;
  price: string;
  description: string;
  longDescription: string;
  duration: string;
  maintenance: string;
  image: string;
}

export interface Client {
  id: string;
  name: string;
  whatsapp: string;
  email: string;
  image?: string;
  totalSpent: number;
  lastVisit?: string;
  notes?: string;
}

export interface BusinessHours {
  dayOfWeek: number; // 0-6 (Dom-Sab)
  slots: { start: string; end: string }[];
  isOpen: boolean;
}

export interface AgendaBlock {
  id: string;
  startDate: string; // ISO string YYYY-MM-DD
  endDate: string; // ISO string YYYY-MM-DD
  reason: string;
}

export interface User {
  name: string;
  ownerName?: string;
  whatsapp: string;
  address: string;
  email: string;
  image?: string;
  history?: string;
  mission?: string;
  team?: TeamMember[];
  appointments?: Appointment[];
  businessHours?: BusinessHours[];
  blocks?: AgendaBlock[];
}
