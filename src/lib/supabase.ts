import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://iypxbzrxrcnszslimxcx.supabase.co';
const supabaseKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_rnpOusTAggBePdsELvKB0g_1xeH4ZBd';

export const supabase = createClient(supabaseUrl, supabaseKey);
