import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from '@/utils/supabase/config';
import type { Database } from '@/utils/supabase/database.types';

let browserClient: SupabaseClient<Database> | undefined;

export const createClient = () => {
  if (browserClient) return browserClient;

  const { url, publishableKey } = getSupabaseConfig();
  browserClient = createBrowserClient<Database>(url, publishableKey);
  return browserClient;
};
