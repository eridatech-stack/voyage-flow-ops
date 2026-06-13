import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, MapPin, Car, Users, Wallet, Settings, Plane } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Tours", url: "/tours", icon: MapPin },
  { title: "Transfers", url: "/transfers", icon: Plane },
  { title: "Fleet & Drivers", url: "/fleet", icon: Car },
  { title: "Accounting", url: "/accounting", icon: Wallet },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (url: string) => (url === "/" ? pathname === "/" : pathname.startsWith(url));

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-amber text-amber-foreground font-bold">
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
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-xs font-medium">
            OP
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-xs font-medium text-sidebar-foreground">Ops Team</span>
            <span className="text-[11px] text-sidebar-foreground/60">admin@intravelsync.com</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
