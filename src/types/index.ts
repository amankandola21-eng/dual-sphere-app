export interface User {
  id: string;
  email: string;
  role: 'customer' | 'cleaner' | 'admin';
  name: string;
  phone?: string;
  avatar?: string;
  created_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  street: string;
  city: string;
  state: string;
  zip_code: string;
  apt_unit?: string;
  is_default: boolean;
}

export interface ServiceType {
  id: string;
  name: string;
  description: string;
  base_price: number;
  duration_hours: number;
}

export interface Booking {
  id: string;
  customer_id: string;
  cleaner_id?: string;
  service_type_id: string;
  address_id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  total_price: number;
  special_instructions?: string;
  created_at: string;
}

export interface Review {
  id: string;
  booking_id: string;
  customer_id: string;
  cleaner_id: string;
  rating: number;
  comment?: string;
  created_at: string;
}