import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, FileText, CalendarClock, CreditCard, Users, Info, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { notificationsApi } from '@/services/api';
import { Notification } from '@/types';
import { cn } from '@/lib/utils';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await notificationsApi.getAll();
      if (response.success && response.data) {
        // Only show UNREAD notifications
        const unreadNotifications = response.data.filter(n => !n.isRead);
        setNotifications(unreadNotifications);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load notifications',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark as read via API
      await notificationsApi.markAsRead([notification.id]);
      
      // Immediately remove from UI
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      
      // Navigate to the redirect path
      navigate(notification.redirectPath);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      // Still navigate even if API fails
      navigate(notification.redirectPath);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'leave':
        return <FileText className="h-5 w-5" />;
      case 'attendance':
        return <CalendarClock className="h-5 w-5" />;
      case 'payslip':
        return <CreditCard className="h-5 w-5" />;
      case 'employee':
        return <Users className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'leave':
        return 'bg-info/10 text-info border-info/20';
      case 'attendance':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'payslip':
        return 'bg-success/10 text-success border-success/20';
      case 'employee':
        return 'bg-primary/10 text-primary border-primary/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeBadgeColor = (type: Notification['type']) => {
    switch (type) {
      case 'leave':
        return 'bg-info/15 text-info border-info/30';
      case 'attendance':
        return 'bg-warning/15 text-warning border-warning/30';
      case 'payslip':
        return 'bg-success/15 text-success border-success/30';
      case 'employee':
        return 'bg-primary/15 text-primary border-primary/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Notifications</h1>
        <p className="mt-1 text-muted-foreground">
          {notifications.length > 0 
            ? `You have ${notifications.length} unread notification${notifications.length > 1 ? 's' : ''}` 
            : 'All caught up! No unread notifications.'}
        </p>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <Bell className="h-8 w-8 text-success" />
            </div>
            <p className="mt-4 text-lg font-medium text-foreground">All caught up!</p>
            <p className="text-sm text-muted-foreground">You have no unread notifications.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-card overflow-hidden">
          <CardHeader className="border-b bg-warning/5">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <div className="h-2 w-2 rounded-full bg-warning animate-pulse" />
              Unread Notifications ({notifications.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  className="flex w-full items-start gap-4 p-5 text-left transition-colors hover:bg-muted/50 group"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className={cn(
                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border',
                    getNotificationColor(notification.type)
                  )}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-foreground">
                        {notification.title}
                      </p>
                      <Badge variant="outline" className={cn("text-xs capitalize", getTypeBadgeColor(notification.type))}>
                        {notification.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(notification.createdAt)}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
