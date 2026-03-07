import { Bell } from 'lucide-react';
import { useUnreadCount } from '@/hooks/useUnreadCount';
import { cn } from '@/lib/utils';

interface NotificationBadgeProps {
  className?: string;
  iconClassName?: string;
}

export function NotificationBadge({ className, iconClassName }: NotificationBadgeProps) {
  const { unreadCount } = useUnreadCount();

  return (
    <div className={cn('relative', className)}>
      <Bell className={cn('h-5 w-5', iconClassName)} />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold text-destructive-foreground bg-destructive rounded-full">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </div>
  );
}
