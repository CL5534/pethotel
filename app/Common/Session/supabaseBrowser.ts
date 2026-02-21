import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getRememberMe } from "./authStorage";

let supabase: SupabaseClient | null = null;

export function getSupabaseBrowserClient() {
  if (supabase) return supabase;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // ✅ 핵심: rememberMe에 따라 storage 선택
  const storage = getRememberMe() ? localStorage : sessionStorage;

  supabase = createClient(url, anon, {
    auth: {
      storage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return supabase;
}

export function resetSupabaseBrowserClient() {
  supabase = null;
}