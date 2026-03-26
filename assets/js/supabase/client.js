import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://wsshwwjiwfrgkssyxbtc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indzc2h3d2ppd2ZyZ2tzc3l4YnRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MTI5MTgsImV4cCI6MjA5MDA4ODkxOH0.AEyIkppiegZKsAsBJ0UGQqT2SFdPQ-gJIX2ST-cZsxo';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    redirectTo: window.location.origin + '/membros/dashboard'
  }
});
