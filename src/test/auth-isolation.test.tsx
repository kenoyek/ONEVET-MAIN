import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '@/lib/auth-context';

const mock = vi.hoisted(() => ({
  roleStatus: 'ok' as 'ok' | 'error' | 'empty',
  listener: null as null | ((event: string, session: Session | null) => void),
  profiles: new Map<string, Promise<{ data: unknown; error: null }>>(),
}));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      onAuthStateChange: (fn: typeof mock.listener) => {
        mock.listener = fn;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      },
      getSession: async () => ({ data: { session: null }, error: null }),
    },
    from: (table: string) => ({
      select: () => ({
        eq: (_field: string, id: string) =>
          table === 'profiles'
            ? { maybeSingle: () => mock.profiles.get(id) }
            : Promise.resolve({
                data: mock.roleStatus === 'ok' ? [{ role: 'pet_owner' }] : [],
                error:
                  mock.roleStatus === 'error' ? { message: 'offline' } : null,
              }),
      }),
    }),
  },
}));
function Probe() {
  const a = useAuth();
  return (
    <p data-testid="identity" data-permissions-error={a.permissionsError}>
      {a.user?.id ?? 'none'}|{a.profile?.first_name ?? 'none'}|
      {a.roles.join(',')}
    </p>
  );
}
const session = (id: string) =>
  ({ user: { id, user_metadata: {} } }) as Session;
afterEach(() => {
  cleanup();
  mock.profiles.clear();
  mock.listener = null;
  mock.roleStatus = 'ok';
});
describe('Account transition isolation', () => {
  it('clears cached data and ignores a profile response from the previous account', async () => {
    let resolveA!: (value: { data: unknown; error: null }) => void;
    mock.profiles.set(
      'a',
      new Promise((resolve) => {
        resolveA = resolve;
      }),
    );
    mock.profiles.set(
      'b',
      Promise.resolve({ data: { id: 'pb', first_name: 'B' }, error: null }),
    );
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <AuthProvider>
          <Probe />
        </AuthProvider>
      </QueryClientProvider>,
    );
    await act(async () => {});
    await act(async () => {
      mock.listener?.('SIGNED_IN', session('a'));
    });
    client.setQueryData(['private-record'], { owner: 'a' });
    await act(async () => {
      mock.listener?.('SIGNED_IN', session('b'));
    });
    await waitFor(() =>
      expect(screen.getByTestId('identity')).toHaveTextContent('b|B|pet_owner'),
    );
    expect(client.getQueryData(['private-record'])).toBeUndefined();
    await act(async () => {
      resolveA({ data: { id: 'pa', first_name: 'A' }, error: null });
    });
    expect(screen.getByTestId('identity')).toHaveTextContent('b|B|pet_owner');
    client.setQueryData(['private-record'], { owner: 'b' });
    await act(async () => {
      mock.listener?.('SIGNED_OUT', null);
    });
    expect(screen.getByTestId('identity').textContent).toBe('none|none|');
    expect(client.getQueryData(['private-record'])).toBeUndefined();
  });
  it.each(['error', 'empty'] as const)(
    'does not grant metadata roles when the role lookup is %s',
    async (status) => {
      mock.roleStatus = status;
      mock.profiles.set(
        'forged',
        Promise.resolve({
          data: { id: 'p-forged', first_name: 'Test' },
          error: null,
        }),
      );
      const client = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      render(
        <QueryClientProvider client={client}>
          <AuthProvider>
            <Probe />
          </AuthProvider>
        </QueryClientProvider>,
      );
      await act(async () => {});
      const forged = session('forged');
      forged.user.user_metadata = { role: 'admin' };
      await act(async () => {
        mock.listener?.('SIGNED_IN', forged);
      });
      await waitFor(() =>
        expect(screen.getByTestId('identity')).toHaveAttribute(
          'data-permissions-error',
          'true',
        ),
      );
      expect(screen.getByTestId('identity').textContent).toBe('forged|Test|');
    },
  );
});
