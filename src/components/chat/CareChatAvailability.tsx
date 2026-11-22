import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  careChatAvailabilityKey, isCareChatAvailable, staffCareChatAvailability,
} from '@/lib/services/care-chat-service';

const availabilityRefresh = 15000;
const lagosTime = new Intl.DateTimeFormat('en-NG', {
  timeStyle: 'short',
  timeZone: 'Africa/Lagos',
});

export function VisitorChatAvailability() {
  const availability = useQuery({
    queryKey: careChatAvailabilityKey,
    queryFn: isCareChatAvailable,
    refetchInterval: availabilityRefresh,
    retry: false,
  });

  let message = 'Checking live chat availability…';
  if (availability.isError) {
    message = 'Could not check live availability. You can still leave a message.';
  } else if (availability.isSuccess) {
    message = availability.data
      ? 'The care team is accepting live chats.'
      : 'The care team is away. Leave a message and check this tab for a reply.';
  }

  return (
    <p role="status" className="flex items-center gap-2 rounded-lg border bg-card p-3 text-sm">
      <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${availability.isSuccess && availability.data ? 'bg-green-600' : 'bg-muted-foreground'}`} />
      {message}
    </p>
  );
}

export function StaffChatAvailability({ userId }: { userId: string }) {
  const cache = useQueryClient();
  const queryKey = ['care-chat', 'staff-availability', userId];
  const availability = useQuery({
    queryKey,
    queryFn: () => staffCareChatAvailability(),
    refetchInterval: availabilityRefresh,
    retry: false,
  });
  const update = useMutation({
    mutationFn: (accepting: boolean) => staffCareChatAvailability(accepting),
    onSuccess: async expiry => {
      await cache.cancelQueries({ queryKey, exact: true });
      cache.setQueryData(queryKey, expiry);
      await cache.invalidateQueries({ queryKey: careChatAvailabilityKey });
    },
  });

  return (
    <section aria-label="Your chat availability" className="space-y-3 rounded-lg border bg-card p-4">
      <p role="status" className="text-sm">
        {availability.isPending && 'Loading your availability…'}
        {availability.isError && 'Could not check your availability.'}
        {availability.isSuccess && (availability.data
          ? `You’re accepting live chats until ${lagosTime.format(new Date(availability.data))} WAT.`
          : 'You’re away. Visitors can still leave messages.')}
      </p>
      {availability.isError && <Button variant="outline" onClick={() => void availability.refetch()}>Retry availability</Button>}
      {availability.isSuccess && (
        <div className="flex flex-wrap gap-2">
          <Button disabled={update.isPending} onClick={() => update.mutate(true)}>
            {availability.data ? 'Extend availability' : 'Go available for 30 minutes'}
          </Button>
          {availability.data && (
            <Button variant="outline" disabled={update.isPending} onClick={() => update.mutate(false)}>Go away</Button>
          )}
        </div>
      )}
      {update.isError && <p role="alert" className="text-sm text-destructive">Could not confirm the availability change. Try again.</p>}
    </section>
  );
}
