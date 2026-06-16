import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

// ── Get current session ─────────────────────────────────────────────────────
export function useAuth() {
  return useQuery({
    queryKey: ["auth_session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session?.user ?? null;
    },
    staleTime: 1000 * 60 * 5, // 5 min
  });
}

// ── Sign in with email + password ───────────────────────────────────────────
export function useSignIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data.user;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["auth_session"] });
    },
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
      qc.invalidateQueries({ queryKey: ["auth_session"] });
      qc.clear(); // clear all cached data on logout
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

// ── Listen to auth state changes (call once at root) ────────────────────────
export function subscribeToAuthChanges(onUpdate: (user: User | null) => void) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    onUpdate(session?.user ?? null);
  });
  return () => subscription.unsubscribe();
}
