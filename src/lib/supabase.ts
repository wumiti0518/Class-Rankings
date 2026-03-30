import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iypxbzrxrcnszslimxcx.supabase.co';
const supabaseKey = 'sb_publishable_rnpOusTAggBePdsELvKB0g_1xeH4ZBd';

export const supabase = createClient(supabaseUrl, supabaseKey);
