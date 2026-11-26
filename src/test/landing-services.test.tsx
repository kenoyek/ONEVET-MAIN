import {MarketplaceWelcome} from '@/components/landing/MarketplaceWelcome';
import {CareWorkspacePreview} from '@/components/landing/CareWorkspacePreview';
import {shopFilters} from '@/lib/shop-discovery';
import {cleanup, fireEvent, render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {afterEach, expect, it} from 'vitest';
import {CareServices} from '@/components/landing/CareServices';
afterEach(cleanup);
it('offers public service discovery, signup and honest pricing guidance',()=>{
 render(<MemoryRouter><CareServices/></MemoryRouter>);
 expect(screen.getByRole('link',{name:/Veterinary consultations/})).toHaveAttribute('href','/find-a-vet');
 expect(screen.getByRole('link',{name:/Grooming & wellbeing/})).toHaveAttribute('href','/provider-marketplace?category=grooming');
 expect(screen.getByRole('link',{name:/Diagnostics & labs/})).toHaveAttribute('href','/provider-marketplace?category=diagnostics');
 expect(screen.getByRole('link',{name:/Training & behaviour/})).toHaveAttribute('href','/provider-marketplace?category=training');
 expect(screen.getByRole('link',{name:/Create your free account/})).toHaveAttribute('href','/auth?mode=signup');
 expect(screen.getByText(/Online payments are currently unavailable/)).toBeInTheDocument();
 expect(screen.getByRole('link',{name:/Explore pricing & plans/})).toHaveAttribute('href','/pricing');
});

it('switches the feature preview between pets and farm groups without implying saved records',()=>{
 render(<MemoryRouter><CareWorkspacePreview/></MemoryRouter>);
 expect(screen.getByRole('button',{name:'Pets'})).toHaveAttribute('aria-pressed','true');
 expect(screen.getByRole('heading',{name:'Your pet profiles'})).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Farm animals'}));
 expect(screen.getByRole('button',{name:'Farm animals'})).toHaveAttribute('aria-pressed','true');
 expect(screen.getByRole('heading',{name:'Your farm & animal groups'})).toBeInTheDocument();
 expect(screen.getByText('Preview')).toBeInTheDocument();
 expect(screen.getByText('Example appointment · Awaiting provider confirmation')).toBeInTheDocument();
 expect(screen.getByText(/Account creation is free. Provider services have their own fees/)).toBeInTheDocument();
});
it('links homepage shopping categories to recognized catalogue filters',()=>{
 render(<MemoryRouter><MarketplaceWelcome/></MemoryRouter>);
 for(const [name,category] of [['Food & nutrition','Pet Food'],['Health & wellbeing','Pet Health'],['Farm essentials','Livestock'],['Everyday accessories','Accessories']]){
  const link=screen.getByRole('link',{name:new RegExp(name!)});
  const url=new URL(link.getAttribute('href')!,'https://1vet.store');
  expect(url.pathname).toBe('/marketplace');expect(shopFilters(url.searchParams).category).toBe(category);
 }
 expect(screen.getByText(/Online checkout is currently unavailable/)).toBeInTheDocument();
});
