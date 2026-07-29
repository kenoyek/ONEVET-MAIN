import { describe, it, expect } from 'vitest';
import { notificationService } from '@/lib/services/notification-service';

describe('Phase 16 Notifications, Messaging & Communication Infrastructure Service', () => {
  it('exports notificationService with expected API methods', () => {
    expect(notificationService).toBeDefined();
    expect(typeof notificationService.getUserPreferences).toBe('function');
    expect(typeof notificationService.dispatchNotification).toBe('function');
  });
});
