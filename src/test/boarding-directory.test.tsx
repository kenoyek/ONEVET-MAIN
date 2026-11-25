import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import BoardingDirectory from '@/pages/BoardingDirectory';
import { BoardingListingPanel } from '@/components/provider/BoardingListingPanel';
import { listBoardingFacilities, setBoardingListing } from '@/lib/services/boarding-directory';

vi.mock('@/components/layout/Navbar', () => ({ Navbar: () => null }));
vi.mock('@/components/layout/Footer', () => ({ Footer: () => null }));
vi.mock('@/lib/services/boarding-directory', () => ({
  listBoardingFacilities: vi.fn(), setBoardingListing: vi.fn(),
}));

function mount(element: React.ReactNode) {
  return render(<QueryClientProvider client={new QueryClient()}>
    <MemoryRouter>{element}</MemoryRouter>
  </QueryClientProvider>);
}

it('searches by city and shows a direct boarding inquiry link', async () => {
  vi.mocked(listBoardingFacilities).mockResolvedValueOnce({ facilities: [], hasMore: false })
    .mockResolvedValueOnce({ facilities: [{
      name: 'Garden Boarding', slug: 'garden', description: 'Overnight facilities',
      email: 'boarding@example.invalid', city: 'Ibadan', state: 'Oyo',
    }], hasMore: false });
  mount(<BoardingDirectory />);
  await screen.findByText('No boarding facilities are listed yet.');
  fireEvent.change(screen.getByLabelText('City'), { target: { value: ' Ibadan ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Find facilities' }));
  expect(await screen.findByRole('link', { name: 'Email Garden Boarding' }))
    .toHaveAttribute('href', 'mailto:boarding@example.invalid');
  expect(listBoardingFacilities).toHaveBeenLastCalledWith('Ibadan', undefined);
});

it('requires publication consent and acknowledges the confirmed change', async () => {
  const onChange = vi.fn();
  vi.mocked(setBoardingListing).mockResolvedValueOnce(undefined);
  mount(<BoardingListingPanel id="facility" approved published={false}
    email="boarding@example.invalid" onChange={onChange} />);
  const publish = screen.getByRole('button', { name: 'Publish listing' });
  expect(publish).toBeDisabled();
  fireEvent.click(screen.getByRole('checkbox', { name: /I agree/ }));
  fireEvent.click(publish);
  await vi.waitFor(() => expect(onChange).toHaveBeenCalledExactlyOnceWith(true));
  expect(setBoardingListing).toHaveBeenCalledExactlyOnceWith('facility', true);
});

it('restores the city search from a link and when the browser goes back', async () => {
  function NavigationProbe() {
    const location = useLocation();
    const navigate = useNavigate();
    return <><p>{location.search || 'No parameters'}</p><button onClick={() => navigate(-1)}>Browser back</button></>;
  }

  vi.mocked(listBoardingFacilities).mockResolvedValue({ facilities: [], hasMore: false });
  render(<QueryClientProvider client={new QueryClient()}>
    <MemoryRouter initialEntries={['/boarding?city=Ibadan']}>
      <NavigationProbe /><BoardingDirectory />
    </MemoryRouter>
  </QueryClientProvider>);
  await screen.findByText('No listed boarding facilities match this city.');
  expect(screen.getByLabelText('City')).toHaveValue('Ibadan');
  expect(listBoardingFacilities).toHaveBeenLastCalledWith('Ibadan', undefined);
  fireEvent.change(screen.getByLabelText('City'), { target: { value: ' Lagos ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Find facilities' }));
  await screen.findByText('?city=Lagos');
  fireEvent.click(screen.getByRole('button', { name: 'Browser back' }));
  await screen.findByText('?city=Ibadan');
  expect(screen.getByLabelText('City')).toHaveValue('Ibadan');
});
