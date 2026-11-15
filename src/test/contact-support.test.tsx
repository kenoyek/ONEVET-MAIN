import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
const mock=vi.hoisted(()=>({invoke:vi.fn()}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{functions:{invoke:mock.invoke}}}));
vi.mock('@/components/layout/Navbar',()=>({Navbar:()=>null}));
vi.mock('@/components/layout/Footer',()=>({Footer:()=>null}));
vi.mock('@/hooks/use-toast',()=>({useToast:()=>({toast:vi.fn()})}));
import Contact from '@/pages/Contact';
function mount(){return render(<MemoryRouter><Contact/></MemoryRouter>);}
function fill(){for(const [label,value] of [['Full Name','Ada Obi'],['Email Address','ada@example.invalid'],['Inquiry Subject','Account help'],['Your Message','Please help me update my account details.']])fireEvent.change(screen.getByLabelText(label!),{target:{value}});}
beforeEach(()=>{vi.clearAllMocks();vi.stubGlobal('IntersectionObserver',class {observe(){} unobserve(){} disconnect(){}});});afterEach(()=>{cleanup();vi.unstubAllGlobals();});
it('waits for acknowledgement, locks fields and sends one request during repeated submits',async()=>{
 let finish!:(value:unknown)=>void;mock.invoke.mockReturnValue(new Promise(resolve=>{finish=resolve;}));const {container}=mount();fill();
 fireEvent.submit(container.querySelector('form')!);fireEvent.submit(container.querySelector('form')!);
 await waitFor(()=>expect(mock.invoke).toHaveBeenCalledTimes(1));expect(screen.getByLabelText('Your Message')).toBeDisabled();
 expect(screen.queryByText('Your support message has been received')).not.toBeInTheDocument();
 finish({data:{success:true},error:null});
 expect(await screen.findByText('Your support message has been received')).toBeInTheDocument();
 await waitFor(()=>expect(screen.getByRole('heading',{name:'Your support message has been received'})).toHaveFocus());
 expect(screen.getByLabelText('Your Message')).toHaveValue('');
});
it('keeps entries when success is not explicitly acknowledged and permits retry',async()=>{
 mock.invoke.mockResolvedValueOnce({data:{},error:null}).mockResolvedValue({data:{success:true},error:null});mount();fill();
 fireEvent.click(screen.getByRole('button',{name:'Send message'}));expect(await screen.findByRole('alert')).toHaveTextContent('couldn’t confirm');
 expect(screen.getByLabelText('Your Message')).toHaveValue('Please help me update my account details.');
 expect(screen.queryByText('Your support message has been received')).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Send message'}));await screen.findByText('Your support message has been received');expect(mock.invoke).toHaveBeenCalledTimes(2);
});
it('marks invalid inputs without sending and offers real support destinations',async()=>{
 mount();fireEvent.click(screen.getByRole('button',{name:'Send message'}));
 await waitFor(()=>expect(screen.getByLabelText('Full Name')).toHaveAttribute('aria-invalid','true'));
 expect(mock.invoke).not.toHaveBeenCalled();expect(screen.getByRole('link',{name:'+234 705 239 8371'})).toHaveAttribute('href','tel:+2347052398371');
 expect(screen.getByRole('link',{name:'Urgent care guidance'})).toHaveAttribute('href','/urgent-care');
 fireEvent.click(screen.getByRole('button',{name:'How quickly will I get a response?'}));
 expect(await screen.findByText(/Response times vary. This form is for account/)).toBeInTheDocument();
});
