import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {MemoryRouter,Route,Routes,useLocation} from 'react-router-dom';
import {afterEach,expect,it,vi} from 'vitest';
vi.mock('@/components/layout/Navbar',()=>({Navbar:()=>null}));
vi.mock('@/components/layout/Footer',()=>({Footer:()=>null}));
import Services from '@/pages/Services';
import {careSearchFilters} from '@/lib/care-search';
afterEach(cleanup);
it('offers validated public category searches with no activation or guaranteed booking',()=>{
 render(<MemoryRouter><Services/></MemoryRouter>);
 for(const [label,category] of [['Find veterinary services','veterinary'],['Explore grooming','grooming'],['Explore diagnostics','diagnostics'],['Explore training','training']]){
  const url=new URL(screen.getByRole('link',{name:label}).getAttribute('href')!,'https://1vet.store');
  expect(url.pathname).toBe('/provider-marketplace');expect(careSearchFilters(url.searchParams).category).toBe(category);
 }
 expect(screen.getByText(/Your request is pending until the provider confirms it/)).toBeInTheDocument();
 expect(screen.getByText(/No online payment is collected/)).toBeInTheDocument();
 expect(screen.getByRole('link',{name:'Urgent care guidance'})).toHaveAttribute('href','/urgent-care');
});
it('submits the shared city finder into directory parameters',()=>{
 function Destination(){const filters=careSearchFilters(new URLSearchParams(useLocation().search));return <p>{filters.category} in {filters.city}</p>;}
 render(<MemoryRouter initialEntries={['/services']}><Routes><Route path="/services" element={<Services/>}/><Route path="/provider-marketplace" element={<Destination/>}/></Routes></MemoryRouter>);
 fireEvent.change(screen.getByLabelText('Type of care'),{target:{value:'diagnostics'}});fireEvent.change(screen.getByLabelText(/City/),{target:{value:'Ibadan'}});fireEvent.click(screen.getByRole('button',{name:'Find care'}));
 expect(screen.getByText('diagnostics in Ibadan')).toBeInTheDocument();
});
