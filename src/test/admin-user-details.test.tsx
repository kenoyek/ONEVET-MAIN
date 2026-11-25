import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import AdminUserDetails from '@/pages/admin/UserDetails';
import AdminUsers from '@/pages/admin/Users';

const { from } = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from } }));
vi.mock('@/components/layout/Navbar', () => ({ Navbar: () => null }));
vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ user: { id: 'signed-in-admin' }, role: 'admin', roles: ['admin'], loading: false }),
}));

const profile = {
  id: '84111111-1111-4111-8111-111111111111',
  user_id: '84222222-2222-4222-8222-222222222222',
  first_name: 'Ada', last_name: 'Okafor', email: 'ada@example.invalid', phone: null,
  location: 'Ibadan', created_at: '2026-11-25T08:30:00Z', is_active: true, email_verified: true,
  customer_type: 'pet_owner', vendor_type: null,
};

it('opens the selected profile from View Details and uses the auth ID to load roles', async () => {
  const profileById = vi.fn().mockReturnValue({
    maybeSingle: vi.fn().mockResolvedValue({ data: profile, error: null }),
  });
  const roles = [{ user_id: profile.user_id, role: 'pet_owner' }, { user_id: profile.user_id, role: 'service_provider' }];
  const rolesByUser = vi.fn().mockReturnValue({
    order: vi.fn().mockResolvedValue({ data: roles, error: null }),
  });
  const roleResult = Object.assign(Promise.resolve({ data: roles, error: null }), { eq: rolesByUser });
  from.mockImplementation(table => ({
    select: () => table === 'profiles'
      ? { order: vi.fn().mockResolvedValue({ data: [profile], error: null }), eq: profileById }
      : roleResult,
  }));

  render(<QueryClientProvider client={new QueryClient()}>
    <MemoryRouter initialEntries={[{ pathname: '/admin/users', state: { roleFilter: 'pet_owner' } }]}>
      <Routes>
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/users/:profileId" element={<ProtectedRoute allowedRoles={['admin']}><AdminUserDetails /></ProtectedRoute>} />
      </Routes>
    </MemoryRouter>
  </QueryClientProvider>);

  await screen.findByText('Ada Okafor');
  fireEvent.change(screen.getByPlaceholderText('Search by name or email...'), { target: { value: 'ada@example' } });
  fireEvent.keyDown(await screen.findByRole('button', { name: 'Actions for Ada Okafor' }), { key: 'ArrowDown' });
  const details = await screen.findByRole('menuitem', { name: 'View Details' });
  expect(details).toHaveAttribute('href', `/admin/users/${profile.id}`);
  fireEvent.click(details);
  expect(await screen.findByRole('heading', { name: 'Ada Okafor' })).toBeInTheDocument();
  expect(screen.getByText('pet owner, service provider')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Back to users' })).toHaveAttribute('href', '/admin/users');
  expect(profileById).toHaveBeenCalledWith('id', profile.id);
  expect(rolesByUser).toHaveBeenCalledWith('user_id', profile.user_id);
  fireEvent.click(screen.getByRole('link', { name: 'Back to users' }));
  expect(await screen.findByPlaceholderText('Search by name or email...')).toHaveValue('ada@example');
  expect(screen.getByRole('combobox')).toHaveTextContent('Pet Owners');
});
