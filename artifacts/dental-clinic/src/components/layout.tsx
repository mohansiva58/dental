import { useAuth } from "@/lib/auth";
import { useLogout, getGetMeQueryKey } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Home, Users, FileText, ClipboardList, Activity, Stethoscope, LogOut,
  FileBarChart, Receipt, Bell, Calendar, ShieldCheck, GitFork
} from "lucide-react";
import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: Home, roles: ["administrator", "receptionist", "doctor"] },
  { label: "Patient Workflow", href: "/workflow", icon: GitFork, roles: ["administrator", "receptionist", "doctor"] },
  { label: "Patients", href: "/patients", icon: Users, roles: ["administrator", "receptionist", "doctor"] },
  { label: "OP Records", href: "/op-records", icon: FileText, roles: ["administrator", "receptionist", "doctor"] },
  { label: "Doctor Workspace", href: "/doctor-workspace", icon: Stethoscope, roles: ["doctor", "administrator"] },
  { label: "Treatments", href: "/treatments", icon: ClipboardList, roles: ["administrator", "receptionist", "doctor"] },
  { label: "Invoices", href: "/invoices", icon: Receipt, roles: ["administrator", "receptionist"] },
  { label: "Follow-ups", href: "/followups", icon: Calendar, roles: ["administrator", "receptionist", "doctor"] },
  { label: "Notifications", href: "/notifications", icon: Bell, roles: ["administrator", "receptionist", "doctor"] },
];

const adminItems = [
  { label: "Reports", href: "/reports", icon: FileBarChart, roles: ["administrator"] },
  { label: "User Management", href: "/admin/users", icon: ShieldCheck, roles: ["administrator"] },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const logout = useLogout();
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.clear();
        setLocation("/login");
      },
    });
  };

  const visibleNav = navItems.filter((item) => user && item.roles.includes(user.role));
  const visibleAdmin = adminItems.filter((item) => user && item.roles.includes(user.role));

  return (
    <SidebarProvider>
      <div className="flex min-h-[100dvh] w-full">
        <Sidebar className="border-r border-border bg-sidebar">
          <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Activity className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <p className="font-bold text-sidebar-foreground leading-none">DentalSync</p>
                <p className="text-xs text-muted-foreground mt-0.5">Clinic Management</p>
              </div>
            </div>
            {user && (
              <div className="mt-3 flex items-center gap-2 px-1">
                <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary">
                  {(user.fullName ?? "U").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-sidebar-foreground truncate">{user.fullName}</p>
                  <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 capitalize">{user.role}</Badge>
                </div>
              </div>
            )}
          </SidebarHeader>

          <SidebarContent className="pt-2">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleNav.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={item.href === "/dashboard" ? location === "/dashboard" : location.startsWith(item.href)}>
                        <Link href={item.href} className="flex items-center gap-2.5">
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {visibleAdmin.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs px-3">Administration</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {visibleAdmin.map((item) => (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild isActive={location.startsWith(item.href)}>
                          <Link href={item.href} className="flex items-center gap-2.5">
                            <item.icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </SidebarContent>

          <div className="mt-auto p-3 border-t border-sidebar-border">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </div>
        </Sidebar>

        <main className="flex-1 bg-background overflow-y-auto min-w-0">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
