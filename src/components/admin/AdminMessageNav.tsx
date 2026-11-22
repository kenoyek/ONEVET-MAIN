import { ArrowLeft, ArrowRight, LayoutGrid, Mail, MessageCircle, Stethoscope } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const adminMessageChannels = [
  { path: '/admin/care-chat', label: 'Care chat', icon: MessageCircle, description: 'Reply to visitors asking about care and booking.' },
  { path: '/admin/support', label: 'Support inbox', icon: Mail, description: 'Review and resolve Contact form submissions.' },
  { path: '/admin/conversations', label: 'Consultations', icon: Stethoscope, description: 'Review consultation conversations in read-only mode.' },
] as const;

export function AdminMessageNav() {
  return (
    <nav aria-label="Admin messaging" className="space-y-2">
      <Link to="/admin" className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary">
        <ArrowLeft className="size-4" aria-hidden="true" /> Back to admin
      </Link>
      <ul className="flex flex-wrap gap-2">
        {[{ path: '/admin/messages', label: 'Messages', icon: LayoutGrid }, ...adminMessageChannels].map(({ path, label, icon: Icon }) => (
          <li key={path}>
            <NavLink end to={path} className={({ isActive }) => cn(
              'inline-flex min-h-10 items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold',
              isActive ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:bg-muted',
            )}>
              <Icon className="size-4 shrink-0" aria-hidden="true" /> {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function AdminMessageChannels({
  careStatus, openSupport, unreadSupport,
}: {
  careStatus: string;
  openSupport: string;
  unreadSupport: string;
}) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {adminMessageChannels.map(({ path, label, icon: Icon, description }) => (
        <li key={path} className="flex flex-col gap-4 rounded-xl border bg-card p-5">
          <Link to={path} className="group flex flex-col gap-4 rounded-md hover:text-primary focus-visible:ring-2 focus-visible:ring-ring">
            <div className="flex items-start justify-between gap-3">
              <span className="rounded-lg bg-primary/10 p-2.5 text-primary">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <ArrowRight className="size-5 text-muted-foreground group-hover:text-primary" aria-hidden="true" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">{label}</h2>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </Link>
          {path === '/admin/care-chat' && (
            <div className="mt-auto flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm"><Link to={path}>{careStatus}</Link></Button>
              <Button asChild variant="outline" size="sm"><Link to={`${path}?assignment=mine`}>My waiting chats</Link></Button>
            </div>
          )}
          {path === '/admin/support' && (
            <div className="mt-auto flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm"><Link to={`${path}?status=open`}>{openSupport}</Link></Button>
              <Button asChild variant="outline" size="sm"><Link to={`${path}?status=unread`}>{unreadSupport}</Link></Button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
