export interface OfflineAction {
  id: string;
  type: string; // e.g. LOG_WEIGHT, LOG_FLOCK_HEALTH, LOG_GROOMING
  payload: unknown;
  queued_at: string;
}

const QUEUE_STORAGE_KEY = '1vet_offline_queue';

export const offlineSyncService = {
  /**
   * Get all queued offline actions
   */
  getQueue(): OfflineAction[] {
    try {
      const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn('[OfflineSyncService] Failed to read offline queue:', e);
      return [];
    }
  },

  /**
   * Queue an action when offline
   */
  queueAction(type: string, payload: unknown) {
    const queue = this.getQueue();
    const action: OfflineAction = {
      id: `off-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type,
      payload,
      queued_at: new Date().toISOString(),
    };
    queue.push(action);
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    return action;
  },

  /**
   * Clear queued actions
   */
  clearQueue() {
    localStorage.removeItem(QUEUE_STORAGE_KEY);
  },

  /**
   * Process and sync queued offline actions
   */
  async syncQueue(processor: (action: OfflineAction) => Promise<boolean>) {
    const queue = this.getQueue();
    if (queue.length === 0) return { synced: 0, failed: 0 };

    let syncedCount = 0;
    let failedCount = 0;
    const remainingQueue: OfflineAction[] = [];

    for (const action of queue) {
      try {
        const success = await processor(action);
        if (success) {
          syncedCount++;
        } else {
          failedCount++;
          remainingQueue.push(action);
        }
      } catch (e) {
        console.error('[OfflineSyncService] Failed to sync action:', action, e);
        failedCount++;
        remainingQueue.push(action);
      }
    }

    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(remainingQueue));
    return { synced: syncedCount, failed: failedCount };
  },
};
