import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import BoardingFacility from '@/pages/BoardingFacility';
import BoardingDirectory from '@/pages/BoardingDirectory';
import { BoardingListingPanel } from '@/components/provider/BoardingListingPanel';
import { getBoardingFacility, listBoardingFacilities, setBoardingListing } from '@/lib/services/boarding-directory';

vi.mock('@/components/layout/Navbar', () => ({ Navbar: () => null }));
vi.mock('@/components/layout/Footer', () => ({ Footer: () => null }));
vi.mock('@/lib/services/boarding-directory', () => ({
  getBoardingFacility: vi.fn(), listBoardingFacilities: vi.fn(), setBoardingListing: vi.fn(),
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
  expect(screen.getByRole('link', { name: 'Register your boarding facility' }))
    .toHaveAttribute('href', '/provider/register?category=boarding_facility');
  fireEvent.change(screen.getByLabelText('City'), { target: { value: ' Ibadan ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Find facilities' }));
  expect(await screen.findByRole('link', { name: 'Email Garden Boarding' }))
    .toHaveAttribute('href', 'mailto:boarding@example.invalid');
  expect(listBoardingFacilities).toHaveBeenLastCalledWith('Ibadan', undefined);
  expect(screen.getByRole('link', { name: 'View Garden Boarding' })).toHaveAttribute('href', '/boarding/garden?city=Ibadan');
});

it('requires publication consent and acknowledges the confirmed change', async () => {
  const onChange = vi.fn();
  vi.mocked(setBoardingListing).mockResolvedValueOnce(undefined);
  mount(<BoardingListingPanel id="facility" approved published={false} onChange={onChange}
    listing={{ name: 'Garden Boarding', slug: 'garden', description: 'Overnight facilities',
      email: 'boarding@example.invalid', city: 'Ibadan', state: 'Oyo' }} />);
  const preview = within(screen.getByRole('region', { name: 'Public listing preview' }));
  expect(preview.getByText('Garden Boarding')).toBeInTheDocument();
  expect(preview.getByText('Ibadan, Oyo')).toBeInTheDocument();
  expect(preview.getByText('Overnight facilities')).toBeInTheDocument();
  expect(preview.getByText(/boarding@example.invalid/)).toBeInTheDocument();
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
  await screen.findByText('No listed boarding facilities match these filters.');
  expect(screen.getByLabelText('City')).toHaveValue('Ibadan');
  expect(listBoardingFacilities).toHaveBeenLastCalledWith('Ibadan', undefined);
  fireEvent.change(screen.getByLabelText('City'), { target: { value: ' Lagos ' } });
  fireEvent.change(screen.getByLabelText('State or FCT'), { target: { value: ' Lagos ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Find facilities' }));
  await screen.findByText('?city=Lagos&state=Lagos');
  await vi.waitFor(() => expect(listBoardingFacilities).toHaveBeenLastCalledWith('Lagos', undefined, 'Lagos'));
  fireEvent.click(screen.getByRole('button', { name: 'Browser back' }));
  await screen.findByText('?city=Ibadan');
  expect(screen.getByLabelText('City')).toHaveValue('Ibadan');
  expect(screen.getByLabelText('State or FCT')).toHaveValue('');
});

it('opens a facility directly and keeps the city filter in the return link', async () => {
  vi.mocked(getBoardingFacility).mockResolvedValueOnce({
    name: 'Garden Boarding', slug: 'garden', description: 'Overnight facilities',
    email: 'boarding@example.invalid', city: 'Ibadan', state: 'Oyo',
  });
  render(<QueryClientProvider client={new QueryClient()}>
    <MemoryRouter initialEntries={['/boarding/garden?city=Ibadan']}>
      <Routes><Route path="/boarding/:slug" element={<BoardingFacility />} /></Routes>
    </MemoryRouter>
  </QueryClientProvider>);
  await screen.findByRole('heading', { name: 'Garden Boarding' });
  expect(screen.getByRole('link', { name: 'Back to boarding directory' })).toHaveAttribute('href', '/boarding?city=Ibadan');
  expect(screen.getByRole('link', { name: 'Email Garden Boarding' })).toHaveAttribute('href', 'mailto:boarding@example.invalid');
  expect(getBoardingFacility).toHaveBeenLastCalledWith('garden');
  const arrival = screen.getByLabelText('Arrival date');
  const departure = screen.getByLabelText('Departure date');
  const pets = screen.getByLabelText('Pets');
  const prepare = screen.getByRole('button', { name: 'Prepare email' });
  fireEvent.change(arrival, { target: { value: '2099-01-10' } });
  fireEvent.change(departure, { target: { value: '2099-01-10' } });
  fireEvent.change(pets, { target: { value: '1 dog & 1 cat' } });
  fireEvent.click(prepare);
  expect(screen.getByRole('alert')).toHaveTextContent('departure date after arrival');
  expect(screen.queryByRole('link', { name: 'Open email draft' })).toBeNull();

  fireEvent.change(departure, { target: { value: '2099-01-12' } });
  fireEvent.click(prepare);
  const draft = new URL(screen.getByRole('link', { name: 'Open email draft' }).getAttribute('href')!);
  expect(draft.pathname).toBe('boarding@example.invalid');
  expect(draft.searchParams.get('subject')).toBe('Boarding inquiry for Garden Boarding');
  expect(draft.searchParams.get('body')).toContain('Arrival: 2099-01-10\r\nDeparture: 2099-01-12\r\nPets: 1 dog & 1 cat');

  const copy = screen.getByRole('button', { name: 'Copy inquiry' });
  expect((screen.getByLabelText('Inquiry details') as HTMLTextAreaElement).value)
    .toContain('To: boarding@example.invalid\nSubject: Boarding inquiry for Garden Boarding');
  const share = screen.getByRole('button', { name: 'Copy facility link' });
  const facilityUrl = new URL('/boarding/garden', window.location.origin).href;
  const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  const writeText = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('Permission denied'))
    .mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('Permission denied'));
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  try {
    fireEvent.click(copy);
    await screen.findByText('Inquiry copied. Paste the details into a new email.');
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('Pets: 1 dog & 1 cat'));
    fireEvent.click(copy);
    await screen.findByText('Select and copy the inquiry details below.');
    fireEvent.click(share);
    await screen.findByText('Facility link copied.');
    expect(writeText).toHaveBeenLastCalledWith(facilityUrl);
    fireEvent.click(share);
    expect(await screen.findByLabelText('Facility link')).toHaveValue(facilityUrl);
  } finally {
    if (originalClipboard) Object.defineProperty(navigator, 'clipboard', originalClipboard);
    else Reflect.deleteProperty(navigator, 'clipboard');
  }

  fireEvent.change(pets, { target: { value: '1 dog' } });
  expect(screen.queryByRole('link', { name: 'Open email draft' })).toBeNull();
});

it('shows an unavailable listing without offering a contact link', async () => {
  vi.mocked(getBoardingFacility).mockResolvedValueOnce(null);
  render(<QueryClientProvider client={new QueryClient()}>
    <MemoryRouter initialEntries={['/boarding/withdrawn']}>
      <Routes><Route path="/boarding/:slug" element={<BoardingFacility />} /></Routes>
    </MemoryRouter>
  </QueryClientProvider>);
  await screen.findByRole('heading', { name: 'Listing unavailable' });
  expect(screen.queryByRole('link', { name: /Email facility/ })).not.toBeInTheDocument();
});
