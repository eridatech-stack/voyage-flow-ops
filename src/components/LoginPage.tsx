import { useState } from "react";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useSignIn } from "@/hooks/useAuth";

// No onSuccess prop needed — useAuth's onAuthStateChange listener
// automatically picks up the new session and re-renders AuthGate
export function LoginPage() {
  const signIn = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    try {
      await signIn.mutateAsync({ email, password });
      // No reload needed — onAuthStateChange fires and AuthGate re-renders
    } catch (err: any) {
      setError(err?.message ?? "Invalid credentials. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber font-display text-xl font-bold text-amber-foreground shadow-lg">
            iT
          </div>
          <div className="text-center">
            <h1 className="font-display text-2xl font-semibold">InTravelSync</h1>
            <p className="mt-1 text-sm text-muted-foreground">Operations Console</p>
          </div>
        </div>

        <Card className="p-6">
          <h2 className="font-display text-lg font-semibold">Sign in</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your operator credentials to continue.
          </p>

          <form onSubmit={submit} className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Email</Label>
              <Input
                type="email"
                placeholder="ops@youragency.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
                disabled={signIn.isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Password</Label>
              <div className="relative">
                <Input
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="pr-10"
                  disabled={signIn.isPending}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={signIn.isPending}>
              {signIn.isPending
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</>
                : "Sign in"
              }
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Access restricted to authorized operators only.
        </p>
      </div>
    </div>
  );
}
