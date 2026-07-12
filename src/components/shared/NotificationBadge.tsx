import { Bell } from 'lucide-react';
import { useUnreadCount } from '@/hooks/useUnreadCount';
import { useInAppNotifications } from '@/hooks/useInAppNotifications';
import { cn } from '@/lib/utils';

interface NotificationBadgeProps {
  className?: string;
  iconClassName?: string;
}

export function NotificationBadge({ className, iconClassName }: NotificationBadgeProps) {
  const { unreadCount: messageUnread } = useUnreadCount();
  const { unreadCount: notificationUnread } = useInAppNotifications();

  const totalUnread = messageUnread + notificationUnread;

  return (
    <div className={cn('relative', className)}>
      <Bell className={cn('h-5 w-5', iconClassName)} />
      {totalUnread > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold text-destructive-foreground bg-destructive rounded-full">
          {totalUnread > 99 ? '99+' : totalUnread}
        </span>
      )}
    </div>
  );
}
