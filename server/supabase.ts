import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type StudentApplicationRow = {
  id: string;
  university: string;
  matric_number: string;
  surname: string;
  verification_status: string;
  verification_payload: string | null;
  government_reference: string | null;
  created_at: string;
  updated_at: string;
};

let client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  client = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return client;
}
