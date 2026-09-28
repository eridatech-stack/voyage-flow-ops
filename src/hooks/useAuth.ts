import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { serverLogin, serverVerifyToken, serverChangePassword } from "@/server/auth";
import { setStoredToken, removeStoredToken, getStoredToken } from "@/lib/auth/jwt";

export interface AppUser {
  userId: string;
  email: string;
  fullName?: string | null;
}

export function useAuth() {
  const [user, setUser] = useState<AppUser | null | undefined>(undefined);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) { setUser(null); return; }
    serverVerifyToken(token)
      .then((payload) => setUser(payload as AppUser | null))
      .catch(() => setUser(null));
  }, []);

  return { user, isLoading: user === undefined };
}

export function useSignIn() {
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const result = await serverLogin(email, password);
      setStoredToken(result.token);
      return result;
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSignOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      removeStoredToken();
      qc.clear();
    },
    onSuccess: () => toast.success("Signed out"),
  });
}

export function useChangePassword() {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (newPassword: string) => {
      if (!user) throw new Error("Not authenticated");
      await serverChangePassword(user.userId, newPassword);
    },
    onSuccess: () => toast.success("Password changed"),
    onError: (e: Error) => toast.error(e.message),
  });
}
