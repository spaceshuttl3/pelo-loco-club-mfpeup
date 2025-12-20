
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
  credits_awarded?: boolean;
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
  updated_at?: string;
}

export interface FidelityRedemption {
  id: string;
  user_id: string;
  reward_id: string;
  appointment_id?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  credits_deducted: number;
  created_at?: string;
  confirmed_at?: string;
  confirmed_by?: string;
  reward?: FidelityReward;
  user?: User;
}

export interface FidelityTransaction {
  id: string;
  user_id: string;
  credits_change: number;
  transaction_type: 'earned' | 'redeemed' | 'adjusted' | 'cancelled';
  reference_type?: string;
  reference_id?: string;
  description?: string;
  created_at?: string;
}

export interface Badge {
  badge_id: string;
  badge_name: string;
  badge_description: string;
  badge_icon: string;
  earned_at: string;
}

export interface LoyaltyReward {
  id: string;
  points_required: number;
  reward_type: 'free_service' | 'discount_percentage' | 'discount_euros' | 'custom';
  reward_value: number;
  reward_description: string;
  is_active: boolean;
  created_at?: string;
}

export interface BadgeRule {
  id: string;
  badge_name: string;
  badge_description: string;
  badge_icon: string;
  rule_type: 'visits_count' | 'visits_timeframe' | 'total_spent';
  rule_config: {
    required_visits?: number;
    timeframe_days?: number;
    required_amount?: number;
  };
  is_active: boolean;
  created_at?: string;
}

export interface LoyaltyTransaction {
  id: string;
  user_id: string;
  points_change: number;
  transaction_type: 'earned' | 'redeemed' | 'adjusted';
  reference_type?: string;
  reference_id?: string;
  description?: string;
  created_at: string;
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
