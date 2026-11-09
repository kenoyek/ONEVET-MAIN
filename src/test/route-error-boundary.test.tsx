import {fireEvent,render,screen} from '@testing-library/react';
import {Link,MemoryRouter,Route,Routes} from 'react-router-dom';
import {describe,expect,it,vi} from 'vitest';
import {RouteErrorBoundary} from '@/components/shared/RouteErrorBoundary';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
describe('Route error boundaries',()=>{
 it('allows navigation to a healthy route after a different page crashes',async()=>{const log=vi.spyOn(console,'error').mockImplementation(()=>{});function Broken():never{throw new Error('Fixture render failure');}
 render(<MemoryRouter initialEntries={['/broken']}><Link to="/healthy">Open healthy page</Link><RouteErrorBoundary><Routes><Route path="/broken" element={<Broken/>}/><Route path="/healthy" element={<h1>Healthy page</h1>}/></Routes></RouteErrorBoundary></MemoryRouter>);expect(screen.getByText('Something went wrong')).toBeInTheDocument();fireEvent.click(screen.getByRole('link',{name:'Open healthy page'}));expect(await screen.findByRole('heading',{name:'Healthy page'})).toBeInTheDocument();expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();log.mockRestore();});
 it('explains a persistent download failure without claiming an incident was reported',()=>{const log=vi.spyOn(console,'error').mockImplementation(()=>{});function Missing():never{throw new TypeError('Failed to fetch dynamically imported module: old.js');}render(<ErrorBoundary><Missing/></ErrorBoundary>);expect(screen.getByText('This page could not be downloaded')).toBeInTheDocument();expect(screen.getByText(/Your sign-in is preserved/)).toBeInTheDocument();expect(screen.queryByText(/team has been notified/)).not.toBeInTheDocument();log.mockRestore();});
});
