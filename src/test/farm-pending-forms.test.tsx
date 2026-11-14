import {cleanup, render, screen} from '@testing-library/react';
import {afterEach, expect, it, vi} from 'vitest';
import {FarmForm, BatchForm, ObservationForm} from '@/components/farms/FarmForms';
afterEach(cleanup);
it.each(['farm','group','observation'])('locks every editable field during a pending %s save and unlocks afterward', kind => {
 const props={pending:true,onSave:vi.fn()};
 const form=(pending:boolean)=>kind==='farm'?<FarmForm {...props} pending={pending}/>:kind==='group'?<BatchForm {...props} pending={pending}/>:<ObservationForm {...props} pending={pending} batches={[]}/>;
 const {container,rerender}=render(form(true));
 for(const field of container.querySelectorAll('input,select,textarea,button')) expect(field).toBeDisabled();
 expect(screen.getByRole('button',{name:'Saving…'}).closest('form')).toHaveAttribute('aria-busy','true');
 rerender(form(false));
 for(const field of container.querySelectorAll('input,select,textarea,button')) expect(field).not.toBeDisabled();
});
