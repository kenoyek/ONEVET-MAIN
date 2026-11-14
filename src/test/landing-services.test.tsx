import {cleanup, render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {afterEach, expect, it} from 'vitest';
import {CareServices} from '@/components/landing/CareServices';
afterEach(cleanup);
it('offers public service discovery, signup and honest pricing guidance',()=>{
 render(<MemoryRouter><CareServices/></MemoryRouter>);
 expect(screen.getByRole('link',{name:/Veterinary care/})).toHaveAttribute('href','/find-a-vet');
 expect(screen.getByRole('link',{name:/Grooming & wellbeing/})).toHaveAttribute('href','/provider-marketplace');
 expect(screen.getByRole('link',{name:/Farm & livestock care/})).toHaveAttribute('href','/farm-care');
 expect(screen.getByRole('link',{name:/Create your free account/})).toHaveAttribute('href','/auth?mode=signup');
 expect(screen.getByText(/Online payments are currently unavailable/)).toBeInTheDocument();
 expect(screen.getByRole('link',{name:/Explore pricing & plans/})).toHaveAttribute('href','/pricing');
});
