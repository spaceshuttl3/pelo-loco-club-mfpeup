
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * PELO LOCO CLUB - SUPABASE SETUP INSTRUCTIONS
 * 
 * 1. Create a Supabase project at https://supabase.com
 * 2. Get your project URL and anon key from Settings > API
 * 3. Replace the values below with your actual credentials
 * 
 * 4. Create the following tables in your Supabase database:
 * 
 * TABLE: users
 * - id: uuid (primary key, references auth.users)
 * - name: text
 * - email: text
 * - phone: text
 * - birthday: date (nullable)
 * - role: text (default: 'customer')
 * - created_at: timestamp with time zone (default: now())
 * 
 * TABLE: appointments
 * - id: uuid (primary key, default: gen_random_uuid())
 * - user_id: uuid (foreign key -> users.id)
 * - service: text
 * - date: date
 * - time: text
 * - status: text (default: 'booked')
 * - payment_mode: text (default: 'pay_in_person')
 * - payment_status: text (default: 'pending')
 * - created_at: timestamp with time zone (default: now())
 * 
 * TABLE: products
 * - id: uuid (primary key, default: gen_random_uuid())
 * - name: text
 * - price: numeric
 * - stock: integer
 * - description: text
 * - photo_url: text (nullable)
 * - created_at: timestamp with time zone (default: now())
 * 
 * TABLE: orders
 * - id: uuid (primary key, default: gen_random_uuid())
 * - user_id: uuid (foreign key -> users.id)
 * - items: jsonb
 * - total_price: numeric
 * - payment_mode: text
 * - payment_status: text
 * - created_at: timestamp with time zone (default: now())
 * 
 * TABLE: coupons
 * - id: uuid (primary key, default: gen_random_uuid())
 * - user_id: uuid (foreign key -> users.id)
 * - coupon_type: text
 * - discount_value: numeric
 * - expiration_date: date
 * - status: text (default: 'active')
 * - created_at: timestamp with time zone (default: now())
 * 
 * 5. Enable Row Level Security (RLS) on all tables
 * 6. Create appropriate policies for each table
 * 
 * Example policies:
 * - Users can read their own data
 * - Admins can read/write all data
 * - Customers can create appointments and orders
 */

// IMPORTANT: Replace these with your actual Supabase credentials
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
