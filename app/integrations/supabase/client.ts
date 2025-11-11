import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './types';
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://tvccqnqsdlzazpcnqqqx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Y2NxbnFzZGx6YXpwY25xcXF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4OTc1NjEsImV4cCI6MjA3ODQ3MzU2MX0.5ZG6fha_0wM9HvoCjKBymwwZ1AQoKw-gwm1-0Fn7_CE";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
