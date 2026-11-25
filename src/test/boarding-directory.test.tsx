import { BoardingShortlistShare } from '@/components/boarding/BoardingShortlistShare';
import { BoardingInquiryForm } from '@/components/boarding/BoardingInquiryForm';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
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
  const save = screen.getByRole('button', { name: 'Save Garden Boarding to shortlist' });
  expect(save).toHaveAttribute('aria-pressed', 'false');
  fireEvent.click(save);
  expect(save).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByText('Saved facilities (1)')).toBeInTheDocument();
  fireEvent.click(save);
  expect(save).toHaveAttribute('aria-pressed', 'false');
  expect(screen.getByText('Saved facilities (0)')).toBeInTheDocument();
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
  const maps = screen.getByRole('link', { name: /Search Google Maps/ });
  const mapUrl = new URL(maps.getAttribute('href')!);
  expect(mapUrl.origin + mapUrl.pathname).toBe('https://www.google.com/maps/search/');
  expect(mapUrl.searchParams.get('query')).toBe('Garden Boarding, Ibadan, Oyo, Nigeria');
  expect(maps).toHaveAttribute('rel', 'noopener noreferrer');
  const arrival = screen.getByLabelText('Arrival date');
  const departure = screen.getByLabelText('Departure date');
  const pets = screen.getByLabelText('Pets');
  const prepare = screen.getByRole('button', { name: 'Prepare email' });
  fireEvent.change(arrival, { target: { value: '2099-01-10' } });
  fireEvent.change(departure, { target: { value: '2099-01-10' } });
  fireEvent.change(pets, { target: { value: '1 dog & 1 cat' } });
  fireEvent.click(prepare);
  expect(departure).toHaveAttribute('min', '2099-01-11');
  expect(departure).toBeInvalid();
  expect(screen.queryByRole('link', { name: 'Open email draft' })).toBeNull();

  fireEvent.change(departure, { target: { value: '2099-01-11' } });
  expect(screen.getByText('1 night')).toBeInTheDocument();
  fireEvent.change(departure, { target: { value: '2099-01-12' } });
  expect(screen.getByText('2 nights')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('checkbox', { name: 'Vaccinations and records' }));
  fireEvent.click(prepare);
  const draft = new URL(screen.getByRole('link', { name: 'Open email draft' }).getAttribute('href')!);
  expect(draft.pathname).toBe('boarding@example.invalid');
  expect(draft.searchParams.get('subject')).toBe('Boarding inquiry for Garden Boarding');
  expect(draft.searchParams.get('body')).toContain('Arrival: 2099-01-10\r\nDeparture: 2099-01-12\r\nStay length: 2 nights\r\nPets: 1 dog & 1 cat');

  expect(draft.searchParams.get('body')).toContain('What vaccinations and records do you require?');
  expect(draft.searchParams.get('body')).not.toContain('drop-off and pick-up hours');
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
  expect(screen.queryByRole('link', { name: /Search Google Maps/ })).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /Email facility/ })).not.toBeInTheDocument();
});

it('saves a facility on its public page and removes it from the directory shortlist', async () => {
  vi.mocked(getBoardingFacility).mockResolvedValueOnce({
    name: 'Garden Boarding', slug: 'garden', description: '',
    email: 'boarding@example.invalid', city: 'Ibadan', state: 'Oyo',
  });
  vi.mocked(listBoardingFacilities).mockResolvedValueOnce({ facilities: [], hasMore: false });
  render(<QueryClientProvider client={new QueryClient()}>
    <MemoryRouter initialEntries={['/boarding/garden']}>
      <Routes>
        <Route path="/boarding/:slug" element={<BoardingFacility />} />
        <Route path="/boarding" element={<BoardingDirectory />} />
      </Routes>
    </MemoryRouter>
  </QueryClientProvider>);
  fireEvent.click(await screen.findByRole('button', { name: 'Save to shortlist' }));
  expect(screen.getByRole('button', { name: 'Remove from shortlist' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('link', { name: 'Back to boarding directory' }));
  fireEvent.click(await screen.findByText('Saved facilities (1)'));
  expect(screen.getByRole('link', { name: 'Garden Boarding' })).toHaveAttribute('href', '/boarding/garden');
  fireEvent.click(screen.getByRole('button', { name: 'Remove Garden Boarding from shortlist' }));
  expect(screen.getByText('Saved facilities (0)')).toBeInTheDocument();
});


it('refreshes the open directory when another tab changes or clears the shortlist', async () => {
  const key = 'onevet.boarding-shortlist';
  vi.mocked(listBoardingFacilities).mockResolvedValueOnce({ facilities: [{
    name: 'Garden Boarding', slug: 'garden', description: '',
    email: 'boarding@example.invalid', city: 'Ibadan', state: 'Oyo',
  }], hasMore: false });
  mount(<BoardingDirectory />);
  const save = await screen.findByRole('button', { name: 'Save Garden Boarding to shortlist' });
  expect(save).toHaveAttribute('aria-pressed', 'false');

  try {
    act(() => {
      const newValue = JSON.stringify([{ slug: 'garden', name: 'Garden Boarding' }]);
      localStorage.setItem(key, newValue);
      window.dispatchEvent(new StorageEvent('storage', { key, newValue, storageArea: localStorage }));
    });
    expect(save).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Saved facilities (1)')).toBeInTheDocument();

    act(() => {
      localStorage.removeItem(key);
      window.dispatchEvent(new StorageEvent('storage', { key: null, storageArea: localStorage }));
    });
    expect(save).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('Saved facilities (0)')).toBeInTheDocument();
  } finally {
    localStorage.removeItem(key);
  }
});

it('shares saved facility names and public links when clipboard access is blocked', async () => {
  const key = 'onevet.boarding-shortlist';
  const datesKey = 'onevet.boarding-stay-dates';
  sessionStorage.setItem(datesKey, JSON.stringify({ arrival: '2099-01-10', departure: '2099-01-12' }));
  localStorage.setItem(key, JSON.stringify([
    { slug: 'garden', name: 'Garden Boarding' },
    { slug: 'park', name: 'Park Boarding' },
  ]));
  vi.mocked(listBoardingFacilities).mockResolvedValueOnce({ facilities: [], hasMore: false });

  const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  const writeText = vi.fn().mockRejectedValue(new Error('Permission denied'));
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  try {
    mount(<BoardingDirectory />);
    fireEvent.click(screen.getByText('Saved facilities (2)'));
    fireEvent.click(screen.getByRole('button', { name: 'Copy shortlist' }));
    const expected = [
      'Pet boarding shortlist',
      `Garden Boarding\n${window.location.origin}/boarding/garden`,
      `Park Boarding\n${window.location.origin}/boarding/park`,
    ].join('\n\n');
    expect(await screen.findByLabelText('Shortlist to share')).toHaveValue(expected);
    expect(writeText).toHaveBeenCalledWith(expected);
    fireEvent.click(screen.getByRole('checkbox', { name: /Include stay dates/ }));
    expect(screen.queryByLabelText('Shortlist to share')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Copy shortlist' }));
    expect(await screen.findByLabelText('Shortlist to share'))
      .toHaveValue(expected.replace('Pet boarding shortlist', 'Pet boarding shortlist\n\nArrival: 2099-01-10\nDeparture: 2099-01-12'));
  } finally {
    localStorage.removeItem(key);
    sessionStorage.removeItem(datesKey);
    if (originalClipboard) Object.defineProperty(navigator, 'clipboard', originalClipboard);
    else Reflect.deleteProperty(navigator, 'clipboard');
  }
});


it('reuses only stay dates in another inquiry in the same tab', () => {
  const first = render(<BoardingInquiryForm name="Garden Boarding" email="garden@example.invalid" />);
  try {
    fireEvent.change(screen.getByLabelText('Arrival date'), { target: { value: '2099-01-10' } });
    fireEvent.change(screen.getByLabelText('Departure date'), { target: { value: '2099-01-12' } });
    fireEvent.change(screen.getByLabelText('Pets'), { target: { value: '1 dog' } });
    fireEvent.click(screen.getByRole('button', { name: 'Remember dates in this tab' }));
    first.unmount();

    const second = render(<BoardingInquiryForm name="Park Boarding" email="park@example.invalid" />);
    expect(screen.getByLabelText('Arrival date')).toHaveValue('2099-01-10');
    expect(screen.getByLabelText('Departure date')).toHaveValue('2099-01-12');
    expect(screen.getByLabelText('Pets')).toHaveValue('');
    fireEvent.click(screen.getByRole('button', { name: 'Clear remembered dates' }));
    second.unmount();

    render(<BoardingInquiryForm name="Garden Boarding" email="garden@example.invalid" />);
    expect(screen.getByLabelText('Arrival date')).toHaveValue('');
    expect(screen.getByLabelText('Departure date')).toHaveValue('');
  } finally {
    sessionStorage.removeItem('onevet.boarding-stay-dates');
  }
});


it('shares the shortlist through the device and keeps copying available', async () => {
  const originalShare = Object.getOwnPropertyDescriptor(navigator, 'share');
  const share = vi.fn().mockResolvedValueOnce(undefined)
    .mockRejectedValueOnce(new DOMException('Cancelled', 'AbortError'))
    .mockRejectedValueOnce(new Error('Unavailable'));
  Object.defineProperty(navigator, 'share', { configurable: true, value: share });
  try {
    render(<BoardingShortlistShare facilities={[{ slug: 'garden', name: 'Garden Boarding' }]} />);
    const button = screen.getByRole('button', { name: 'Share shortlist' });
    fireEvent.click(button);
    await screen.findByText('Shortlist shared with your selected app.');
    expect(share).toHaveBeenCalledWith({
      title: 'Pet boarding shortlist',
      text: `Pet boarding shortlist\n\nGarden Boarding\n${window.location.origin}/boarding/garden`,
    });

    await act(async () => fireEvent.click(button));
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    fireEvent.click(button);
    await screen.findByText('Could not open sharing. Copy the shortlist to share it.');
    expect(screen.getByRole('button', { name: 'Copy shortlist' })).toBeEnabled();
  } finally {
    if (originalShare) Object.defineProperty(navigator, 'share', originalShare);
    else Reflect.deleteProperty(navigator, 'share');
  }
});
