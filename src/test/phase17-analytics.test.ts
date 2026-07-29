import { describe, it, expect } from 'vitest';
import { analyticsService } from '@/lib/services/analytics-service';

describe('Phase 17 Analytics, Reporting & HMO Business Intelligence Service', () => {
  it('exports analyticsService with expected API methods', () => {
    expect(analyticsService).toBeDefined();
    expect(typeof analyticsService.getPlatformFinancialMetrics).toBe('function');
    expect(typeof analyticsService.getProviderAnalytics).toBe('function');
    expect(typeof analyticsService.getDiseaseSurveillanceData).toBe('function');
  });
});
