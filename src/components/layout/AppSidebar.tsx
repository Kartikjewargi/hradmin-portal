import { useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CalendarClock,
  FileText,
  CreditCard,
  Bell,
  Calculator,
  Receipt,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';

const navItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Employees', url: '/employees', icon: Users },
  { title: 'Attendance', url: '/attendance', icon: CalendarClock },
  { title: 'Leave Applications', url: '/leave-applications', icon: FileText },
  { title: 'Payroll Management', url: '/payroll-management', icon: Calculator },
  { title: 'Payslips', url: '/payslips', icon: CreditCard },
  { title: 'My Payslip', url: '/my-payslip', icon: Receipt },
  { title: 'Notifications', url: '/notifications', icon: Bell },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === 'collapsed';

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar
      className="border-r border-border/50 bg-gradient-to-b from-sidebar-background via-sidebar-background to-sidebar-background/98 shadow-lg transition-all duration-300"
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-sidebar-border/50 p-4 transition-all duration-300 hover:bg-sidebar-background/80">
        <div className="flex items-center gap-3 transition-all duration-300">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 shadow-lg hover:shadow-2xl transition-all duration-300 group-hover:scale-110">
            <span className="text-lg font-bold text-sidebar-primary-foreground">HR</span>
          </div>
          {!collapsed && (
            <div className="flex flex-col transition-all duration-300">
              <span className="font-display text-lg font-bold text-sidebar-foreground">
                HR Portal
              </span>
              <span className="text-xs text-sidebar-muted font-medium">Admin Dashboard</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs font-bold uppercase tracking-wider text-sidebar-muted">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={collapsed ? item.title : undefined}
                    className="transition-all duration-300 group"
                  >
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sidebar-foreground transition-all duration-300 hover:bg-sidebar-accent/40 hover:text-sidebar-accent-foreground group-hover:shadow-md"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-lg scale-105"
                    >
                      <item.icon className="h-5 w-5 shrink-0 transition-all duration-300 group-hover:scale-125 group-hover:rotate-6" />
                      {!collapsed && <span className="font-medium transition-colors duration-300">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
