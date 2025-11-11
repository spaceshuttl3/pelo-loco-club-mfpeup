
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
const SUPABASE_URL = 'https://tvccqnqsdlzazpcnqqqx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Y2NxbnFzZGx6YXpwY25xcXF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4OTc1NjEsImV4cCI6MjA3ODQ3MzU2MX0.5ZG6fha_0wM9HvoCjKBymwwZ1AQoKw-gwm1-0Fn7_CE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
