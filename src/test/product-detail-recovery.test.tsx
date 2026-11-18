import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mock=vi.hoisted(()=>({product:vi.fn(),addItem:vi.fn()}));
vi.mock('@/lib/services/shop-service',()=>({shopService:{product:mock.product}}));
vi.mock('@/hooks/use-cart',()=>({useCart:()=>({items:[],addItem:mock.addItem})}));
vi.mock('@/components/layout/Navbar',()=>({Navbar:()=>null}));
vi.mock('@/components/layout/Footer',()=>({Footer:()=>null}));
import ProductDetail from '@/pages/ProductDetail';
const product={id:'feed',title:'Poultry feed',price:1500,stock_quantity:5,seller_id:'seller',images:[],category:'Pet Food',description:'Daily feed',seller:null};
function mount(){render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><MemoryRouter initialEntries={['/marketplace/feed?category=Pet+Food&q=feed']}><Routes><Route path="/marketplace/:id" element={<ProductDetail/>}/></Routes></MemoryRouter></QueryClientProvider>);}
beforeEach(()=>{vi.clearAllMocks();mock.product.mockResolvedValue(product);});afterEach(cleanup);
it('provides shop and cart recovery when a listing is no longer published',async()=>{
 mock.product.mockResolvedValue(null);mount();await screen.findByRole('heading',{name:'This product is no longer available'});
 expect(screen.getByRole('link',{name:'Back to shop'})).toHaveAttribute('href','/marketplace?category=Pet+Food&q=feed');expect(screen.getByRole('link',{name:'View cart'})).toHaveAttribute('href','/cart');
 expect(mock.addItem).not.toHaveBeenCalled();
});
it('blocks additions while refreshing and explains stock that disappears',async()=>{
 mount();await screen.findByRole('button',{name:'Add to Cart'});
 let finish!:(value:unknown)=>void;mock.product.mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve;}));
 fireEvent.click(screen.getByRole('button',{name:'Refresh price and stock'}));
 await waitFor(()=>expect(screen.getByRole('button',{name:'Checking stock…'})).toBeDisabled());
 await act(async()=>finish({...product,stock_quantity:0}));
 expect(await screen.findByRole('button',{name:'Out of Stock'})).toBeDisabled();expect(screen.getByRole('link',{name:'Browse other products'})).toHaveAttribute('href','/marketplace?category=Pet+Food&q=feed');expect(mock.addItem).not.toHaveBeenCalled();
});
it('replaces stale product actions with recovery when a refresh removes the listing',async()=>{
 mount();await screen.findByRole('button',{name:'Add to Cart'});mock.product.mockResolvedValueOnce(null);
 fireEvent.click(screen.getByRole('button',{name:'Refresh price and stock'}));await screen.findByRole('heading',{name:'This product is no longer available'});
 expect(screen.queryByRole('button',{name:'Add to Cart'})).not.toBeInTheDocument();expect(mock.addItem).not.toHaveBeenCalled();
});
it('recovers a failed product lookup without losing shop filters',async()=>{
 mock.product.mockRejectedValueOnce(new Error('Offline'));mount();await screen.findByRole('heading',{name:'We couldn’t load this product.'});
 expect(screen.getByRole('link',{name:'Back to shop'})).toHaveAttribute('href','/marketplace?category=Pet+Food&q=feed');fireEvent.click(screen.getByRole('button',{name:'Try again'}));
 expect(await screen.findByRole('button',{name:'Add to Cart'})).toBeEnabled();
});
