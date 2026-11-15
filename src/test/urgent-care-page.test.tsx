import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {afterEach,expect,it,vi} from 'vitest';
vi.mock('@/components/layout/Navbar',()=>({Navbar:()=>null}));
vi.mock('@/components/layout/Footer',()=>({Footer:()=>null}));
import UrgentCare from '@/pages/UrgentCare';
afterEach(cleanup);
it('offers a public clinic search with a clear external destination and no dispatch promise',()=>{
 const {container}=render(<MemoryRouter><UrgentCare/></MemoryRouter>);
 const form=container.querySelector('form')!;
 expect(form).toHaveAttribute('action','https://www.google.com/maps/search/');expect(form).toHaveAttribute('method','get');expect(form).toHaveAttribute('target','_blank');expect(form).toHaveAttribute('rel','noopener noreferrer');
 expect(new FormData(form).get('query')).toBe('veterinary clinic near me');
 expect(screen.getByText(/1Vet is not an emergency clinic or dispatch service/)).toBeInTheDocument();
 expect(screen.getByText(/Map listings do not confirm emergency capacity/)).toBeInTheDocument();
});
it('uses only the selected area in the clinic query and keeps support separate',()=>{
 const {container}=render(<MemoryRouter><UrgentCare/></MemoryRouter>);
 fireEvent.change(screen.getByLabelText(/City or area/),{target:{value:' Ibadan, Oyo State '}});
 const data=new FormData(container.querySelector('form')!);
 expect(data.get('query')).toBe('veterinary clinic Ibadan, Oyo State');expect([...data.keys()]).toEqual(['api','query']);
 expect(screen.getByRole('link',{name:'Contact platform support'})).toHaveAttribute('href','/contact');
 expect(screen.getByText(/support line and contact form are not emergency veterinary services/)).toBeInTheDocument();
 expect(screen.queryByText('Add your first pet')).not.toBeInTheDocument();
});
