import "server-only";

import { createClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

/**
 * Service-role client. Bypasses RLS, so it must only ever be called from
 * server code that has already decided the caller is allowed to do this.
 *
 * Used for the public contact + newsletter writes, where anonymous visitors
 * need to insert a row but must never be able to read the table back.
 */
export function createSupabaseAdminClient() {
  return createClient<Database>(
    env.supabaseUrl(),
    env.supabaseServiceRoleKey(),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
