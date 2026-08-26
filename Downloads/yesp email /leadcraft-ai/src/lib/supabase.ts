import { createClient } from "@supabase/supabase-js";

// Fallbacks prevent createClient from throwing during Next.js build-time
// module evaluation. Real values are always present at runtime.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "placeholder-key"
);
