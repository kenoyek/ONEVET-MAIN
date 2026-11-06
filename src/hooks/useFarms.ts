import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { livestockService } from '@/lib/services/livestock-service';
import { isFeatureEnabled } from '@/lib/feature-flags';

export function useFarmOwner() {
  const { user, profile } = useAuth();
  return profile?.user_id === user?.id ? profile?.id : undefined;
}
export function useFarms() {
  const ownerId = useFarmOwner();
  return useQuery({
    queryKey: ['customer-farms', ownerId],
    queryFn: () => livestockService.getOwnerFarms(ownerId!),
    enabled: !!ownerId && isFeatureEnabled('customer_farms_enabled'),
  });
}
export function useFarmWorkspace(farmId: string | undefined) {
  const ownerId = useFarmOwner();
  return useQuery({
    queryKey: ['customer-farm', ownerId, farmId],
    queryFn: async () => {
      const farm = await livestockService.getOwnerFarm(ownerId!, farmId!);
      if (!farm) return null;
      const batches = await livestockService.getBatches(farm.id);
      const records = await livestockService.getHealthRecords(
        batches.map((batch) => batch.id),
      );
      return { farm, batches, records };
    },
    enabled:
      !!ownerId && !!farmId && isFeatureEnabled('customer_farms_enabled'),
  });
}
