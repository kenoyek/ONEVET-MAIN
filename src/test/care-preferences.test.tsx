import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CarePreferences } from '@/components/farms/CarePreferences';
const mock = vi.hoisted(() => ({
  update: vi.fn(),
  refresh: vi.fn(async () => {}),
  fail: false,
}));
vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'auth-a' },
    profile: { id: 'profile-a', user_id: 'auth-a', customer_type: 'pet_owner' },
    refreshProfile: mock.refresh,
  }),
}));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => {
      const builder = {
        update: (values: unknown) => {
          mock.update(values);
          return builder;
        },
        eq: () => builder,
        select: () => builder,
        single: async () => ({
          data: mock.fail ? null : { id: 'profile-a' },
          error: mock.fail ? { message: 'offline' } : null,
        }),
      };
      return builder;
    },
  },
}));
function view() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <CarePreferences />
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  mock.fail = false;
  vi.clearAllMocks();
});
afterEach(cleanup);
describe('Care audience preference', () => {
  it('saves both audiences without altering privileged roles', async () => {
    view();
    fireEvent.change(screen.getByLabelText('I care for'), {
      target: { value: 'both' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save preference' }));
    await screen.findByText('Preference saved.');
    expect(mock.update).toHaveBeenCalledExactlyOnceWith({
      customer_type: 'both',
    });
    expect(mock.refresh).toHaveBeenCalledOnce();
  });
  it('preserves the selected preference when saving fails', async () => {
    mock.fail = true;
    view();
    fireEvent.change(screen.getByLabelText('I care for'), {
      target: { value: 'farm_owner' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save preference' }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('could not be saved'),
    );
    expect(screen.getByLabelText('I care for')).toHaveValue('farm_owner');
    expect(screen.queryByText('Preference saved.')).not.toBeInTheDocument();
  });
});
