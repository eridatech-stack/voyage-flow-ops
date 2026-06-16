import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { LayoutDashboard, MapPin, Car, Wallet, Settings, Plane, LogOut, KeyRound, Loader2 } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter,
} from "@/components/ui/sidebar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useSignOut, useChangePassword } from "@/hooks/useAuth";

const items = [
  { title: "Dashboard",     url: "/",          icon: LayoutDashboard },
  { title: "Tours",         url: "/tours",      icon: MapPin },
  { title: "Transfers",     url: "/transfers",  icon: Plane },
  { title: "Fleet & Drivers", url: "/fleet",   icon: Car },
  { title: "Accounting",    url: "/accounting", icon: Wallet },
  { title: "Settings",      url: "/settings",   icon: Settings },
];

export function AppSidebar({ user }: { user: User }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (url: string) => url === "/" ? pathname === "/" : pathname.startsWith(url);
  const signOut = useSignOut();
  const [changePwOpen, setChangePwOpen] = useState(false);

  const displayName = user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Operator";
  const initials = displayName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <>
      <Sidebar collapsible="icon" className="border-r-0">
        <SidebarHeader className="border-b border-sidebar-border">
          <div className="flex items-center gap-2 px-2 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-amber text-amber-foreground font-bold shrink-0">
              iT
            </div>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <span className="font-display font-semibold text-sidebar-foreground leading-tight">InTravelSync</span>
              <span className="text-[11px] text-sidebar-foreground/60">Operations Console</span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={item.title}
                      className="data-[active=true]:bg-amber data-[active=true]:text-amber-foreground data-[active=true]:font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                    >
                      <Link to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-2 px-2 py-2 rounded-md hover:bg-sidebar-accent transition-colors text-left">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber text-xs font-bold text-amber-foreground">
                  {initials}
                </div>
                <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
                  <span className="text-xs font-medium text-sidebar-foreground truncate">{displayName}</span>
                  <span className="text-[11px] text-sidebar-foreground/60 truncate">{user.email}</span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-52">
              <DropdownMenuItem onClick={() => setChangePwOpen(true)}>
                <KeyRound className="h-4 w-4" /> Change Password
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut.mutate()}
                disabled={signOut.isPending}
                className="text-destructive focus:text-destructive"
              >
                {signOut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>

      <ChangePasswordDialog open={changePwOpen} onClose={() => setChangePwOpen(false)} />
    </>
  );
}

// ── Change Password Dialog ──────────────────────────────────────────────────

function ChangePasswordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const changePw = useChangePassword();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");

  const submit = async () => {
    setErr("");
    if (!next || next.length < 8) { setErr("Password must be at least 8 characters."); return; }
    if (next !== confirm) { setErr("Passwords don't match."); return; }
    try {
      await changePw.mutateAsync(next);
      setCurrent(""); setNext(""); setConfirm("");
      onClose();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to update password.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); setErr(""); setCurrent(""); setNext(""); setConfirm(""); } }}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Change Password</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">New Password</Label>
            <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="Min. 8 characters" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Confirm New Password</Label>
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          {err && <p className="text-xs text-destructive">{err}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={changePw.isPending}>
            {changePw.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Update Password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
