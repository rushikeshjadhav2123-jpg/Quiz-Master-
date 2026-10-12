// Supabase connection settings
const SUPABASE_URL = 'https://puftkxzketifdtjkloas.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Sz5IVNxFQQsl2qa3PXlSyQ_nPXM1zwK';

// Create the Supabase client (used by login.html and index.html)
window.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
