import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ items: [] as {id:string;title:string;price:number;quantity:number;image:string;seller_id:string}[], pay:vi.fn(), clear:vi.fn(), write:vi.fn() }));
vi.mock('@/hooks/use-cart', () => ({ useCart: () => ({items:mock.items,totalPrice:5000,clearCart:mock.clear}) }));
vi.mock('@/hooks/use-paystack', () => ({usePaystack:()=>({initializePayment:mock.pay})}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{from:mock.write,functions:{invoke:mock.write}}}));
vi.mock('@/components/layout/Navbar',()=>({Navbar:()=>null}));
vi.mock('@/components/layout/Footer',()=>({Footer:()=>null}));
import Checkout from '@/pages/Checkout';
beforeEach(()=>{vi.clearAllMocks();mock.items=[];});
describe('Checkout experience',()=>{
 it('returns an empty checkout to the cart without a payment attempt',async()=>{
  render(<MemoryRouter initialEntries={['/checkout']}><Routes><Route path="/checkout" element={<Checkout/>}/><Route path="/cart" element={<h1>Your cart</h1>}/></Routes></MemoryRouter>);
  expect(await screen.findByRole('heading',{name:'Your cart'})).toBeInTheDocument();expect(mock.pay).not.toHaveBeenCalled();
 });
 it('keeps items and offers support without collecting shipping data or creating an order',()=>{
  mock.items=[{id:'item-a',title:'Test item',price:5000,quantity:1,image:'',seller_id:'seller-a'}];
  const {container}=render(<MemoryRouter><Checkout/></MemoryRouter>);
  expect(screen.getByRole('heading',{name:'Checkout is currently unavailable'})).toBeInTheDocument();
  expect(screen.getByRole('link',{name:'Return to cart'})).toHaveAttribute('href','/cart');
  expect(screen.getByRole('link',{name:'Contact support'})).toHaveAttribute('href','/contact');
  expect(container.querySelector('form')).toBeNull();expect(mock.clear).not.toHaveBeenCalled();expect(mock.write).not.toHaveBeenCalled();expect(mock.pay).not.toHaveBeenCalled();expect(mock.items).toHaveLength(1);
 });
});
