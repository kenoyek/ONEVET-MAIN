import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useInAppNotifications } from '@/hooks/useInAppNotifications';
import { notificationDestination } from '@/lib/services/inbox-service';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
export function NotificationPopover(){
  const inbox=useInAppNotifications();const [open,setOpen]=useState(false);
  return <Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><Button aria-label={`Notifications${inbox.countUnavailable?' (unread count unavailable)':inbox.unreadCount?` (${inbox.unreadCount} unread)`:''}`} variant="ghost" size="icon" className="relative"><Bell className="h-5 w-5"/>{inbox.unreadCount>0&&<span className="absolute -top-1 -right-1 rounded-full bg-destructive px-1.5 text-xs text-destructive-foreground">{inbox.unreadCount>99?'99+':inbox.unreadCount}</span>}</Button></PopoverTrigger>
    <PopoverContent className="w-80 max-w-[calc(100vw-2rem)] p-0" align="end"><div className="border-b p-4 flex justify-between items-center"><h2 className="font-semibold">Notifications</h2><Button variant="link" size="sm" disabled={inbox.busy||!inbox.unreadCount} onClick={()=>void inbox.markAllAsRead().catch(()=>{})}>Mark all as read</Button></div>
      {inbox.mutationError&&<p role="alert" className="p-3 text-sm text-destructive">{inbox.mutationError}</p>}
      {inbox.countUnavailable&&<p role="status" className="px-4 pt-3 text-xs">Unread count unavailable. Refresh to check.</p>}
      <div className="max-h-96 overflow-y-auto">{inbox.loading?<p role="status" className="p-6">Loading notifications…</p>:inbox.error?<div className="p-4"><p role="alert">Could not load notifications.</p><Button variant="outline" onClick={()=>void inbox.refetch()}>Retry notifications</Button></div>:!inbox.notifications.length?<p className="p-6 text-sm text-muted-foreground">No notifications yet.</p>:<ul>{inbox.notifications.map(notification=>{const target=notificationDestination(notification);return <li key={notification.id} className={`border-b p-4 space-y-2 ${notification.is_read===false?'bg-primary/5':''}`}><h3 className="text-sm font-medium">{notification.title}{notification.is_read===false&&<span className="ml-2 text-xs">Unread</span>}</h3><p className="text-xs text-muted-foreground">{notification.message}</p>{target&&<Link className="text-xs text-primary underline" to={target} onClick={()=>{if(notification.is_read===false)void inbox.markAsRead(notification.id).catch(()=>{});setOpen(false);}}>Open details</Link>}{notification.is_read===false&&<Button size="sm" variant="link" disabled={inbox.busy} onClick={()=>void inbox.markAsRead(notification.id).catch(()=>{})}>Mark as read</Button>}</li>;})}</ul>}</div>
      <div className="p-3"><Button variant="ghost" asChild className="w-full"><Link to="/notifications" onClick={()=>setOpen(false)}>View all notifications</Link></Button></div>
    </PopoverContent>
  </Popover>;
}
