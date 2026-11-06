import { renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { usePaystack } from '@/hooks/use-paystack';
afterEach(() => {
  vi.unstubAllEnvs();
  Reflect.deleteProperty(window, 'PaystackPop');
  localStorage.clear();
});
it('does not open a payment popup when production payments are disabled, even with a public key and a development override', () => {
  vi.stubEnv('DEV', false);
  vi.stubEnv('VITE_FEATURE_PAYMENTS_ENABLED', 'false');
  vi.stubEnv('VITE_PAYSTACK_PUBLIC_KEY', 'pk_test_fixture123');
  localStorage.setItem('1vet_ff_payments_enabled', 'true');
  const setup = vi.fn();
  Object.defineProperty(window, 'PaystackPop', {
    value: { setup },
    configurable: true,
  });
  const onClose = vi.fn();
  const onSuccess = vi.fn();
  const { result } = renderHook(usePaystack);
  result.current.initializePayment({
    email: 'fixture@example.invalid',
    amount: 10,
    onClose,
    onSuccess,
  });
  expect(setup).not.toHaveBeenCalled();
  expect(onSuccess).not.toHaveBeenCalled();
  expect(onClose).toHaveBeenCalledOnce();
});
