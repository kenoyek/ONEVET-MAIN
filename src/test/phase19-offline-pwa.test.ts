import { describe, it, expect, beforeEach } from 'vitest';
import { offlineSyncService } from '@/lib/services/offline-sync-service';

describe('Phase 19 Mobile Optimization, PWA & Offline Sync Service', () => {
  beforeEach(() => {
    offlineSyncService.clearQueue();
  });

  it('queues offline actions and syncs queue when online', async () => {
    expect(offlineSyncService.getQueue()).toHaveLength(0);

    offlineSyncService.queueAction('LOG_WEIGHT', { pet_id: 'pet-123', weight: 12.5 });
    expect(offlineSyncService.getQueue()).toHaveLength(1);

    const result = await offlineSyncService.syncQueue(async (action) => {
      expect(action.type).toBe('LOG_WEIGHT');
      return true;
    });

    expect(result.synced).toBe(1);
    expect(offlineSyncService.getQueue()).toHaveLength(0);
  });
});
