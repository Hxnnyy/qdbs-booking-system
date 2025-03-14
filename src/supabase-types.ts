
// Custom type definitions for Supabase tables
export interface Barber {
  id: string;
  name: string;
  specialty: string;
  bio?: string;
  image_url?: string;
  active: boolean;
  color?: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  active: boolean;
}

export interface Booking {
  id: string;
  user_id: string;
  barber_id: string;
  service_id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  notes?: string;
  created_at?: string;
  guest_booking?: boolean;
  barber?: {
    name: string;
    color?: string;
  };
  service?: {
    name: string;
    price: number;
    duration: number;
  };
}

export interface Profile {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  is_admin?: boolean;
  is_super_admin?: boolean;
}

export interface LunchBreak {
  id: string;
  barber_id: string;
  start_time: string;
  duration: number;
  is_active: boolean;
}

export interface NotificationTemplate {
  id?: string;
  type: 'email' | 'sms';
  template_name: string;
  subject?: string;
  content: string;
  variables: string[];
  is_default: boolean;
  created_at?: string;
}

// Utility types for Supabase operations
export type InsertableBarber = Omit<Barber, 'id'>;
export type UpdatableBarber = Partial<InsertableBarber>;

export type InsertableService = Omit<Service, 'id'>;
export type UpdatableService = Partial<InsertableService>;

export type InsertableBooking = Omit<Booking, 'id' | 'created_at' | 'barber' | 'service'>;
export type UpdatableBooking = Partial<Omit<InsertableBooking, 'user_id'>>;

export type InsertableProfile = Omit<Profile, 'id'>;
export type UpdatableProfile = Partial<InsertableProfile>;

export type InsertableLunchBreak = Omit<LunchBreak, 'id'>;
export type UpdatableLunchBreak = Partial<InsertableLunchBreak>;

export type InsertableNotificationTemplate = Omit<NotificationTemplate, 'id' | 'created_at'>;
export type UpdatableNotificationTemplate = Partial<InsertableNotificationTemplate>;
