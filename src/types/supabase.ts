
// Custom type definitions for Supabase tables
// These are used to provide proper typing for our Supabase queries

export type ProfileType = {
  id: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  is_admin?: boolean;
  created_at?: string;
}

export type BarberType = {
  id: string;
  name: string;
  specialty: string;
  bio?: string;
  image_url?: string;
  active: boolean;
}

export type ServiceType = {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  active: boolean;
}

export type BookingType = {
  id?: string;
  user_id: string | undefined;
  barber_id: string;
  service_id: string;
  booking_date: string;
  booking_time: string;
  status?: string;
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
