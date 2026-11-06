import type { ReactNode } from 'react';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCustomerOverview } from '@/hooks/useCustomerOverview';
const state = vi.hoisted(() => ({
  calls: [] as { table: string; column: string; value: unknown }[],
  failure: '',
}));
vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'auth-a' },
    profile: { id: 'profile-a', user_id: 'auth-a' },
  }),
}));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => {
      const result = () =>
        Promise.resolve({
          data: table === 'subscriptions' ? null : [],
          error: state.failure === table ? { message: 'offline' } : null,
        });
      const builder = {
        select: () => builder,
        eq: (column: string, value: unknown) => {
          state.calls.push({ table, column, value });
          return builder;
        },
        order: () => builder,
        limit: result,
        maybeSingle: result,
      };
      return builder;
    },
  },
}));
function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
beforeEach(() => {
  state.calls = [];
  state.failure = '';
});
afterEach(cleanup);
describe('Customer dashboard data contract', () => {
  it('uses schema-defined subscription and order ownership columns', async () => {
    const { result } = renderHook(useCustomerOverview, { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(state.calls).toContainEqual({
      table: 'subscriptions',
      column: 'user_id',
      value: 'auth-a',
    });
    expect(state.calls).toContainEqual({
      table: 'orders',
      column: 'customer_id',
      value: 'profile-a',
    });
    expect(state.calls).toContainEqual({
      table: 'consultations',
      column: 'pet_owner_id',
      value: 'profile-a',
    });
    expect(state.calls).toContainEqual({
      table: 'pets',
      column: 'owner_id',
      value: 'profile-a',
    });
  });
  it('does not turn one failed query into a successful empty dashboard', async () => {
    state.failure = 'orders';
    const { result } = renderHook(useCustomerOverview, { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });
});
