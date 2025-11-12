
export type UserRole = 'customer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthday?: string;
  role: UserRole;
  created_at?: string;
}

export interface Appointment {
  id: string;
  user_id: string;
  barber_id?: string;
  service: string;
  date: string;
  time: string;
  status: 'booked' | 'completed' | 'cancelled';
  payment_mode: 'pay_in_person' | 'online';
  payment_status: 'pending' | 'paid';
  created_at?: string;
  user?: User;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  description: string;
  photo_url?: string;
  created_at?: string;
}

export interface Order {
  id: string;
  user_id: string;
  items: OrderItem[];
  total_price: number;
  payment_mode: 'pay_in_person' | 'online';
  payment_status: 'pending' | 'paid';
  created_at?: string;
  user?: User;
}

export interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
}

export interface Coupon {
  id: string;
  user_id: string;
  coupon_type: string;
  discount_value: number;
  expiration_date: string;
  status: 'active' | 'used' | 'expired';
  coupon_code?: string;
  config_id?: string;
  created_at?: string;
}

export const SERVICES = [
  { id: 'haircut', name: 'Haircut', duration: 30, price: 25 },
  { id: 'beard', name: 'Beard Trim', duration: 20, price: 15 },
  { id: 'haircut_beard', name: 'Haircut + Beard', duration: 45, price: 35 },
  { id: 'shave', name: 'Hot Towel Shave', duration: 30, price: 30 },
  { id: 'kids', name: 'Kids Haircut', duration: 20, price: 20 },
];

export interface TabBarItem {
  name: string;
  route: string;
  icon: string;
  label: string;
}
