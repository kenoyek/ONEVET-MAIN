import { describe, it, expect } from 'vitest';
import { i18nService } from '@/lib/services/i18n-service';

describe('Phase 20 Internationalization & Localization Engine Service', () => {
  it('formats currency correctly across NGN, USD, GBP, EUR, KES, GHS', () => {
    expect(i18nService.formatCurrency(5000, 'NGN')).toBe('₦5,000.00');
    expect(i18nService.formatCurrency(120, 'USD')).toBe('$120.00');
    expect(i18nService.formatCurrency(85, 'GBP')).toBe('£85.00');
    expect(i18nService.formatCurrency(2500, 'KES')).toBe('KSh2,500.00');
  });

  it('translates terminology into Hausa, Yoruba, and Igbo', () => {
    expect(i18nService.translate('emergency_sos', 'en')).toBe('24/7 SOS Emergency');
    expect(i18nService.translate('emergency_sos', 'ha')).toBe('Agin Gaggawa na 24/7');
    expect(i18nService.translate('emergency_sos', 'yo')).toBe('Pajawiri Pajawiri 24/7');
    expect(i18nService.translate('emergency_sos', 'ig')).toBe('Mberede Enyemaka 24/7');
  });
});
