import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowDown, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const messageTime = new Intl.DateTimeFormat('en-NG', {
  day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Africa/Lagos',
});

export function MessageItem({
  sender, sentAt, body, own, children, avatar,
}: {
  sender: string;
  sentAt: string;
  body: string;
  own?: boolean;
  children?: ReactNode;
  avatar?: ReactNode;
}) {
  const date = new Date(sentAt);
  return (
    <li className={cn('flex min-w-0 items-end gap-2', own && 'flex-row-reverse')}>
      {avatar}
      <div className={cn('flex min-w-0 max-w-[85%] flex-col gap-1', own ? 'items-end' : 'items-start')}>
        <span className="break-words text-xs font-semibold text-muted-foreground">{sender}</span>
        <div className={cn('max-w-full rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
          own ? 'rounded-br-sm bg-primary text-primary-foreground' : 'rounded-bl-sm border bg-card text-card-foreground')}>
          <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{body}</p>
          {children}
        </div>
        {Number.isFinite(date.getTime()) && (
          <time dateTime={sentAt} className="text-xs text-muted-foreground">{messageTime.format(date)} WAT</time>
        )}
      </div>
    </li>
  );
}

export function MessageTranscript({
  label, lastId, empty, children, followLatest = true, onLatestChange, className,
}: {
  label: string;
  lastId?: string | number;
  empty: string;
  children?: ReactNode;
  followLatest?: boolean;
  onLatestChange?: (latest: boolean) => void;
  className?: string;
}) {
  const viewport = useRef<HTMLOListElement>(null);
  const follow = useRef(true);
  const [atLatest, setAtLatest] = useState(true);

  function jumpToLatest() {
    const list = viewport.current;
    if (!list) return;
    list.scrollTop = list.scrollHeight;
    follow.current = true;
    setAtLatest(true);
    onLatestChange?.(true);
  }

  useLayoutEffect(() => {
    const list = viewport.current;
    if (list && followLatest && follow.current) {
      list.scrollTop = list.scrollHeight;
      onLatestChange?.(true);
    }
  }, [lastId, followLatest, onLatestChange]);

  return (
    <div className={cn('flex min-h-0 flex-col overflow-hidden rounded-xl border bg-muted/30', className)}>
      <ol ref={viewport} aria-label={label} aria-live={followLatest ? 'polite' : undefined} aria-relevant="additions"
        tabIndex={lastId === undefined ? undefined : 0}
        onScroll={event => {
          const list = event.currentTarget;
          follow.current = list.scrollHeight - list.clientHeight - list.scrollTop < 36;
          setAtLatest(follow.current);
          onLatestChange?.(follow.current);
        }}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3 outline-offset-[-3px] sm:p-4">
        {lastId === undefined ? (
          <li className="flex min-h-24 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
            <MessageCircle className="size-5" aria-hidden="true" />{empty}
          </li>
        ) : children}
      </ol>
      {followLatest && !atLatest && (
        <div className="border-t bg-card px-3 py-2 text-center">
          <Button size="sm" variant="outline" onClick={jumpToLatest}>
            <ArrowDown aria-hidden="true" />Jump to latest
          </Button>
        </div>
      )}
    </div>
  );
}
