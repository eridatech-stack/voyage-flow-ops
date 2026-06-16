import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

// ── Get current session — uses real-time auth state listener ────────────────
export function useAuth() {
  const [user, setUser] = useState<User | null | undefined>(undefined); // undefined = loading

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    // Subscribe to auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    user,
    isLoading: user === undefined,
  };
}

// ── Sign in with email + password ───────────────────────────────────────────
export function useSignIn() {
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data.user;
    },
    // onAuthStateChange in useAuth will handle the state update automatically
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Sign out ────────────────────────────────────────────────────────────────
export function useSignOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      qc.clear(); // clear all cached query data on logout
      toast.success("Signed out");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Change password ─────────────────────────────────────────────────────────
export function useChangePassword() {
  return useMutation({
    mutationFn: async (newPassword: string) => {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
    },
    onSuccess: () => toast.success("Password changed"),
    onError: (e: Error) => toast.error(e.message),
  });
}
