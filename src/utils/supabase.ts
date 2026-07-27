import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      flowType: "pkce",
      // OAuth/recovery callback pages exchange the code explicitly.
      // Disabling automatic URL detection prevents the same PKCE code from
      // being consumed twice.
      detectSessionInUrl: false,
    },
  },
);
