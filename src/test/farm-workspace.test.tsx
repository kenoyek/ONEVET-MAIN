import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Farms from '@/pages/farms/Farms';
import FarmDetail from '@/pages/farms/FarmDetail';
import type {
  RegisterFarmInput,
  CreateHerdBatchInput,
  LogFlockHealthRecordInput,
} from '@/lib/services/livestock-service';
import type {
  FarmRecord,
  BatchRecord,
  FlockHealthRecord,
} from '@/integrations/supabase/customer-schema';
const state = vi.hoisted(() => ({
  farms: [] as FarmRecord[],
  batches: [] as BatchRecord[],
  records: [] as FlockHealthRecord[],
  fail: false,
}));
const owner = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const farmId = 'a0000000-0000-4000-8000-000000000001';
const batchId = 'a1000000-0000-4000-8000-000000000001';
vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'user-a' },
    profile: { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', user_id: 'user-a' },
  }),
}));
vi.mock('@/components/layout/Navbar', () => ({ Navbar: () => null }));
vi.mock('@/lib/services/livestock-service', () => ({
  livestockService: {
    getOwnerFarms: vi.fn(async () => {
      if (state.fail) throw new Error('offline');
      return [...state.farms];
    }),
    getOwnerFarm: vi.fn(
      async (_owner: string, id: string) =>
        state.farms.find((f) => f.id === id) ?? null,
    ),
    getBatches: vi.fn(async () => [...state.batches]),
    getHealthRecords: vi.fn(async () => [...state.records]),
    registerFarm: vi.fn(async (input: RegisterFarmInput) => {
      if (state.fail) throw new Error('offline');
      const f = {
        ...input,
        registration_number: null,
        total_acreage: null,
        id: 'a0000000-0000-4000-8000-000000000001',
        created_at: '2026-11-06T09:00:00Z',
        updated_at: '2026-11-06T09:00:00Z',
      };
      state.farms.push(f);
      return f;
    }),
    createHerdBatch: vi.fn(async (input: CreateHerdBatchInput) => {
      const b = {
        ...input,
        breed: input.breed ?? null,
        purpose: input.purpose ?? null,
        housing_unit: input.housing_unit ?? null,
        id: 'a1000000-0000-4000-8000-000000000001',
        batch_code: 'fixture-group',
        status: 'active' as const,
        created_at: '2026-11-06T09:00:00Z',
      };
      state.batches.push(b);
      return b;
    }),
    logFlockHealthRecord: vi.fn(async (input: LogFlockHealthRecordInput) => {
      const r = {
        ...input,
        attending_vet_id: null,
        affected_count: input.affected_count ?? 0,
        mortality_count: input.mortality_count ?? 0,
        treatment_administered: null,
        withdrawal_period_days: 0,
        created_at: '2026-11-06T09:00:00Z',
        id: 'a2000000-0000-4000-8000-000000000001',
        recorded_at: '2026-11-06T09:00:00Z',
      };
      state.records.push(r);
      return r;
    }),
  },
}));
import { livestockService } from '@/lib/services/livestock-service';
function renderPage(path = '/farms') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/farms" element={<Farms />} />
          <Route path="/farms/:farmId" element={<FarmDetail />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  state.farms = [];
  state.batches = [];
  state.records = [];
  state.fail = false;
  vi.clearAllMocks();
  localStorage.setItem('1vet_ff_customer_farms_enabled', 'true');
});
afterEach(() => {
  cleanup();
  localStorage.clear();
});
describe('Customer farm workspace', () => {
  it('creates a farm, an animal group, and a dated owner observation through the forms', async () => {
    renderPage();
    await screen.findByText('Start with your farm.');
    fireEvent.click(
      screen.getByRole('button', { name: 'Add your first farm' }),
    );
    for (const [label, value] of [
      ['Farm name', 'Fixture Farm'],
      ['Service location', 'Fixture location'],
      ['City or local area', 'Test city'],
      ['State', 'Test state'],
    ])
      fireEvent.change(screen.getByLabelText(label!), { target: { value } });
    fireEvent.click(screen.getByRole('button', { name: 'Save farm' }));
    const farmLink = await screen.findByRole('link', { name: /Fixture Farm/ });
    expect(livestockService.registerFarm).toHaveBeenCalledWith(
      expect.objectContaining({ owner_id: owner }),
    );
    fireEvent.click(farmLink);
    await screen.findByRole('heading', { name: 'Fixture Farm' });
    fireEvent.click(screen.getByRole('button', { name: 'Add animal group' }));
    fireEvent.change(screen.getByLabelText('Group name'), {
      target: { value: 'Pond 1' },
    });
    fireEvent.change(screen.getByLabelText('Species'), {
      target: { value: 'fish' },
    });
    fireEvent.change(screen.getByLabelText('Animal count at registration'), {
      target: { value: '50' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save animal group' }));
    await screen.findByText('50 animals registered');
    fireEvent.click(screen.getByRole('button', { name: 'Add observation' }));
    fireEvent.change(screen.getByLabelText('What did you observe?'), {
      target: { value: 'Eating less today' },
    });
    fireEvent.change(screen.getByLabelText('Animals affected'), {
      target: { value: '3' },
    });
    fireEvent.change(screen.getByLabelText('Deaths observed'), {
      target: { value: '1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save observation' }));
    await screen.findByText('Eating less today');
    expect(livestockService.logFlockHealthRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        batch_id: batchId,
        recorded_by_id: owner,
        record_type: 'owner_observation',
        affected_count: 3,
        mortality_count: 1,
      }),
    );
    expect(screen.getByText(/6 Nov 2026.*10:00.*WAT/)).toBeInTheDocument();
  });
  it('shows backend errors instead of an empty farm list and retries', async () => {
    state.fail = true;
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'We couldn’t load your farms.',
    );
    expect(screen.queryByText('Start with your farm.')).not.toBeInTheDocument();
    state.fail = false;
    fireEvent.click(screen.getByText('Try again'));
    await screen.findByText('Start with your farm.');
  });
  it('keeps an unavailable farm private and does not fetch its groups', async () => {
    renderPage(`/farms/${farmId}`);
    await screen.findByText('Farm not available');
    expect(livestockService.getBatches).not.toHaveBeenCalled();
    expect(livestockService.getHealthRecords).not.toHaveBeenCalled();
  });
  it('does not call the farm backend before rollout is enabled', async () => {
    localStorage.setItem('1vet_ff_customer_farms_enabled', 'false');
    renderPage();
    expect(
      screen.getByText('Your farm workspace is being prepared.'),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(livestockService.getOwnerFarms).not.toHaveBeenCalled(),
    );
  });
});
