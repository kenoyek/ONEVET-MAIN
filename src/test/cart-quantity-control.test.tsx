import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { CartQuantityControl } from '@/components/marketplace/CartQuantityControl';
const item={id:'feed',title:'Poultry feed',price:5000,quantity:1,stock_quantity:5,seller_id:'seller',image:''};
afterEach(cleanup);
it('does not remove the last item through a quantity decrease',()=>{
 const change=vi.fn();render(<CartQuantityControl item={item} checking={false} failed={false} onChange={change}/>);
 expect(screen.getByRole('button',{name:'Decrease quantity of Poultry feed'})).toBeDisabled();expect(change).not.toHaveBeenCalled();
});
it.each(['0','-1','1.5','abc','6','100'])('rejects invalid or unavailable direct quantities (%s)',value=>{
 const change=vi.fn();render(<CartQuantityControl item={item} checking={false} failed={false} onChange={change}/>);
 fireEvent.change(screen.getByLabelText('Quantity for Poultry feed'),{target:{value}});fireEvent.click(screen.getByRole('button',{name:'Update quantity of Poultry feed'}));
 expect(screen.getByRole('alert')).toHaveTextContent('between 1 and 5');expect(change).not.toHaveBeenCalled();
});
it('accepts a checked quantity and supports Enter',()=>{
 const change=vi.fn();render(<CartQuantityControl item={item} checking={false} failed={false} onChange={change}/>);
 const input=screen.getByLabelText('Quantity for Poultry feed');fireEvent.change(input,{target:{value:'4'}});fireEvent.keyDown(input,{key:'Enter'});expect(change).toHaveBeenCalledWith(4);
});
it.each([{checking:true,failed:false},{checking:false,failed:true}])('allows decreases but blocks increases during uncertain stock (%o)',flags=>{
 const change=vi.fn();render(<CartQuantityControl item={{...item,quantity:3}} {...flags} onChange={change}/>);
 expect(screen.getByRole('button',{name:'Increase quantity of Poultry feed'})).toBeDisabled();
 const input=screen.getByLabelText('Quantity for Poultry feed');fireEvent.change(input,{target:{value:'4'}});fireEvent.click(screen.getByRole('button',{name:'Update quantity of Poultry feed'}));expect(change).not.toHaveBeenCalled();
 fireEvent.change(input,{target:{value:'2'}});fireEvent.click(screen.getByRole('button',{name:'Update quantity of Poultry feed'}));expect(change).toHaveBeenCalledWith(2);
});
it('explains stock limits and refreshes the editor after automatic stock reduction',()=>{
 const change=vi.fn();const view=render(<CartQuantityControl item={{...item,quantity:5}} checking={false} failed={false} onChange={change}/>);
 expect(screen.getByText('Available quantity reached: 5 per cart.')).toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('Quantity for Poultry feed'),{target:{value:'4'}});
 view.rerender(<CartQuantityControl item={{...item,quantity:2,stock_quantity:2}} checking={false} failed={false} onChange={change}/>);
 expect(screen.getByLabelText('Quantity for Poultry feed')).toHaveValue('2');expect(screen.getByRole('button',{name:'Increase quantity of Poultry feed'})).toBeDisabled();
});
it('does not allow edits to unavailable products',()=>{
 render(<CartQuantityControl item={{...item,available:false}} checking={false} failed={false} onChange={vi.fn()}/>);
 expect(screen.getByLabelText('Quantity for Poultry feed')).toBeDisabled();expect(screen.getByRole('button',{name:'Update quantity of Poultry feed'})).toBeDisabled();
});
