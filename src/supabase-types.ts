
// Custom type definitions for Supabase tables
export interface Barber {
  id: string;
  name: string;
  specialty: string;
  bio?: string;
  image_url?: string;
  active: boolean;
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
  barber?: {
    name: string;
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
