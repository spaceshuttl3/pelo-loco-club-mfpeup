
export type UserRole = 'customer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthday?: string;
  role: UserRole;
  fidelity_credits?: number;
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
  cancellation_reason?: string;
  fidelity_reward_id?: string;
  fidelity_redemption_id?: string;
  created_at?: string;
  user?: User;
  barber?: {
    id: string;
    name: string;
  };
  fidelity_redemption?: FidelityRedemption;
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
  payment_status: 'pending' | 'paid' | 'cancelled';
  cancellation_reason?: string;
  created_at?: string;
  user?: User;
}

export interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
}

export interface FidelityReward {
  id: string;
  name: string;
  description: string;
  credits_required: number;
  is_active: boolean;
  created_at?: string;
}

export interface FidelityRedemption {
  id: string;
  user_id: string;
  reward_id: string;
  appointment_id?: string;
  status: 'pending' | 'confirmed' | 'used' | 'cancelled';
  credits_deducted: number;
  created_at?: string;
  confirmed_at?: string;
  used_at?: string;
  reward?: FidelityReward;
}

export interface FidelityTransaction {
  id: string;
  user_id: string;
  credits_change: number;
  transaction_type: 'earned' | 'redeemed' | 'adjusted' | 'expired';
  reference_type?: string;
  reference_id?: string;
  description: string;
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
