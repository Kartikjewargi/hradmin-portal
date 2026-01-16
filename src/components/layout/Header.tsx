import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, LogOut, User, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { notificationsApi } from '@/services/api';

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = useCallback(async () => {
    try {
      const response = await notificationsApi.getUnreadCount();
      if (response.success && response.data !== undefined) {
        setUnreadCount(response.data);
      }
    } catch (error) {
      console.error('Failed to load notification count:', error);
    }
  }, []);

  // Load count on mount and when route changes (to sync after notification click)
  useEffect(() => {
    loadUnreadCount();
  }, [loadUnreadCount, location.pathname]);

  const handleNotificationClick = () => {
    navigate('/notifications');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border/50 bg-white/85 backdrop-blur-xl px-6 shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="h-10 w-10 rounded-lg hover:bg-primary/10 transition-all duration-200 text-muted-foreground hover:text-primary hover:scale-110">
          <Menu className="h-5 w-5" />
        </SidebarTrigger>
        <div className="hidden md:block border-l border-border/50 pl-4">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Welcome back</h2>
          <p className="text-sm font-semibold text-foreground">{user?.name || 'User'}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications - Direct navigation */}
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200 hover:scale-110 active:scale-95"
          onClick={handleNotificationClick}
          title="Notifications"
        >
          <Bell className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full p-0 text-xs font-bold shadow-lg"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>

        {/* Profile Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-3 px-3 h-10 rounded-lg hover:bg-muted/50 transition-all duration-200 hover:scale-105 active:scale-95">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 transform group-hover:scale-110">
                {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
              </div>
              <div className="hidden xl:flex flex-col text-left">
                <p className="text-sm font-semibold text-foreground">{user?.name}</p>
                <p className="text-xs text-muted-foreground/70 truncate">{user?.email}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60 bg-popover border border-border/50 shadow-2xl rounded-xl">
            <DropdownMenuLabel className="px-4 py-3">
              <div className="flex flex-col space-y-1">
                <span className="font-bold text-foreground">{user?.name}</span>
                <span className="text-xs text-muted-foreground/70">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer transition-all duration-200 mx-2 rounded-md">
              <LogOut className="mr-3 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
