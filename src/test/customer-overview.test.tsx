import type { ReactNode } from 'react';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCustomerOverview } from '@/hooks/useCustomerOverview';
const state = vi.hoisted(() => ({
  calls: [] as { table: string; column: string; value: unknown }[],
  failure: '',
  pending:'',mismatch:false,limits:[] as {table:string;count:number}[],
}));
vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: { id: state.mismatch?'auth-b':'auth-a' },
    profile: { id: 'profile-a', user_id: 'auth-a' },
  }),
}));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => {
      const result = () =>
        state.pending===table?new Promise(()=>{}):Promise.resolve({
          data: table === 'subscriptions' ? null : table==='pets'?[{id:'pet-a',name:'Milo',species:'dog',avatar_url:null}]:[],
          error: state.failure === table ? { message: 'offline' } : null,
        });
      const builder = {
        select: () => builder,
        eq: (column: string, value: unknown) => {
          state.calls.push({ table, column, value });
          return builder;
        },
        order: () => builder,
        limit: (count:number) => {state.limits.push({table,count});return builder;},
        then:(resolve:(value:unknown)=>unknown,reject:(error:unknown)=>unknown)=>result().then(resolve,reject),
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
  state.failure = '';state.pending='';state.mismatch=false;state.limits=[];
});
afterEach(cleanup);
describe('Customer dashboard data contract', () => {
  it('uses schema-defined subscription and order ownership columns', async () => {
    const { result } = renderHook(useCustomerOverview, { wrapper });
    await waitFor(() => expect(Object.values(result.current).every(query=>query.isSuccess)).toBe(true));
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
  it('isolates an order failure, preserves successful pet data and retries only orders', async () => {
    state.failure = 'orders';
    const { result } = renderHook(useCustomerOverview, { wrapper });
    await waitFor(() => expect(result.current.orders.isError).toBe(true));
    await waitFor(()=>expect(result.current.pets.isSuccess).toBe(true));
    expect(result.current.orders.data).toBeUndefined();expect(result.current.pets.data?.[0]?.name).toBe('Milo');
    expect(result.current.subscription.isSuccess).toBe(true);
    state.failure='';state.calls=[];await act(async()=>{await result.current.orders.refetch();});
    await waitFor(()=>expect(result.current.orders.isSuccess).toBe(true));expect(state.calls.map(call=>call.table)).toEqual(['orders']);
  });
  it('does not wait for membership to load before making other records available',async()=>{
    state.pending='subscriptions';const {result}=renderHook(useCustomerOverview,{wrapper});
    await waitFor(()=>expect(result.current.pets.isSuccess).toBe(true));expect(result.current.subscription.isPending).toBe(true);
    expect(result.current.pets.data?.[0]?.name).toBe('Milo');expect(state.limits).toContainEqual({table:'subscriptions',count:1});
  });
  it('does not load private records while the profile belongs to another account',()=>{
    state.mismatch=true;renderHook(useCustomerOverview,{wrapper});expect(state.calls).toEqual([]);
  });

});
