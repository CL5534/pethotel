// app/Common/Session/useSession.ts
"use client";

import { useEffect, useState } from "react";
import type { Session, User, SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "./supabaseBrowser";

type UseSessionResult = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  error: string;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

export function useSession(): UseSessionResult {
  // ✅ supabase를 렌더링 중에 만들지 말고 state로 들고 간다
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ 브라우저에서만 supabase client 세팅
  useEffect(() => {
    setSupabase(getSupabaseBrowserClient());
  }, []);

  async function refresh() {
    setError("");

    if (!supabase) return; // 아직 브라우저에서 client 준비 전

    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        setError(error.message);
        setSession(null);
        setUser(null);
        return;
      }

      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
    } catch (e: any) {
      setError(e?.message ?? "세션 조회 중 오류가 발생했습니다.");
      setSession(null);
      setUser(null);
    }
  }

  async function signOut() {
    setError("");

    if (!supabase) return;

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setError(error.message);
        return;
      }
      setSession(null);
      setUser(null);
    } catch (e: any) {
      setError(e?.message ?? "로그아웃 중 오류가 발생했습니다.");
    }
  }

  // ✅ supabase가 준비된 뒤에만 세션 로딩 + 구독 시작
  useEffect(() => {
    if (!supabase) return;

    let mounted = true;

    (async () => {
      await refresh();
      if (mounted) setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  return {
    session,
    user,
    loading,
    error,
    signOut,
    refresh,
  };
}