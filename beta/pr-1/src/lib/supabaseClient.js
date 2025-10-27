import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? 'https://qgwuszmggenuysrghcdi.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnd3Vzem1nZ2VudXlzcmdoY2RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1Nzk0MzAsImV4cCI6MjA3NzE1NTQzMH0.FAc4B8EdNiCVN3XGoZX90fnbumZFQwKhgxgNCoSxLcA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
