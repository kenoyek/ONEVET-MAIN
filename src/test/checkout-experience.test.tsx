import {render,screen} from '@testing-library/react';
import {MemoryRouter,Route,Routes} from 'react-router-dom';
import {beforeEach,describe,expect,it,vi} from 'vitest';
const mock=vi.hoisted(()=>({items:[] as {id:string;title:string;price:number;quantity:number;image:string;seller_id:string}[],pay:vi.fn()}));
vi.mock('@/hooks/use-cart',()=>({useCart:()=>({items:mock.items,totalPrice:5000,clearCart:vi.fn()})}));
vi.mock('@/lib/auth-context',()=>({useAuth:()=>({user:{id:'owner-a'},profile:{id:'profile-a',first_name:'Test',last_name:'Owner',email:'owner@example.invalid'}})}));
vi.mock('@/hooks/use-paystack',()=>({usePaystack:()=>({initializePayment:mock.pay})}));
vi.mock('@/lib/feature-flags',()=>({isFeatureEnabled:()=>false}));
vi.mock('@/components/layout/Navbar',()=>({Navbar:()=> <nav>Navigation</nav>}));
vi.mock('@/components/layout/Footer',()=>({Footer:()=> <footer>Footer</footer>}));
import Checkout from '@/pages/Checkout';
beforeEach(()=>{vi.clearAllMocks();mock.items=[];});
describe('Checkout experience',()=>{
 it('redirects an empty cart declaratively instead of leaving a blank checkout',async()=>{render(<MemoryRouter initialEntries={['/checkout']}><Routes><Route path="/checkout" element={<Checkout/>}/><Route path="/marketplace" element={<h1>Browse products</h1>}/></Routes></MemoryRouter>);expect(await screen.findByRole('heading',{name:'Browse products'})).toBeInTheDocument();expect(mock.pay).not.toHaveBeenCalled();});
 it('makes payment unavailability clear without a payment promise',async()=>{mock.items=[{id:'item-a',title:'Test item',price:5000,quantity:1,image:'',seller_id:'seller-a'}];render(<MemoryRouter><Checkout/></MemoryRouter>);expect(screen.getByRole('button',{name:'Payments unavailable'})).toBeDisabled();expect(screen.getByText(/You can review your items in the cart/)).toBeInTheDocument();expect(screen.queryByText(/256-bit/)).not.toBeInTheDocument();expect(mock.pay).not.toHaveBeenCalled();});
});
