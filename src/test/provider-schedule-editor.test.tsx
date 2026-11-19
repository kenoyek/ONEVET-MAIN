import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mock=vi.hoisted(()=>({save:vi.fn(),load:vi.fn(),refresh:vi.fn()}));
vi.mock('@/lib/services/appointment-service',async original=>({...await original<typeof import('@/lib/services/appointment-service')>(),appointmentService:{saveSchedule:mock.save,schedule:mock.load}}));
import { ProviderScheduleEditor } from '@/components/provider/ProviderScheduleEditor';
import type { BookingSchedule } from '@/lib/services/appointment-service';
const initial:BookingSchedule={provider_id:'provider',enabled:true,weekly:[{weekday:1,opens:540,closes:1020}],closed_dates:[],version:1,updated_at:'2026-11-19T00:00:00Z'};
function editor(value=initial){return <ProviderScheduleEditor providerId="provider" initial={value} refresh={mock.refresh}/>;}
beforeEach(()=>{vi.clearAllMocks();mock.save.mockReset();mock.save.mockResolvedValue(2);mock.load.mockResolvedValue(initial);mock.refresh.mockResolvedValue(undefined);});afterEach(cleanup);
it('validates hours and closures before networking and retains entries',async()=>{
 render(editor());fireEvent.change(screen.getByLabelText('Monday closes'),{target:{value:'480'}});fireEvent.click(screen.getByRole('button',{name:'Save availability'}));
 expect(screen.getByRole('alert')).toHaveTextContent('Monday must close after');expect(mock.save).not.toHaveBeenCalled();
 fireEvent.change(screen.getByLabelText('Monday closes'),{target:{value:'1020'}});fireEvent.change(screen.getByLabelText(/Closed dates/),{target:{value:'2027-02-29'}});fireEvent.click(screen.getByRole('button',{name:'Save availability'}));
 expect(screen.getByRole('alert')).toHaveTextContent('real calendar date');expect(screen.getByLabelText(/Closed dates/)).toHaveValue('2027-02-29');expect(mock.save).not.toHaveBeenCalled();
});
it('does not discard dirty hours or overwrite a newer version without an explicit reload',async()=>{
 const view=render(editor());fireEvent.change(screen.getByLabelText('Monday opens'),{target:{value:'600'}});
 const latest={...initial,version:3,weekly:[{weekday:1,opens:720,closes:1080}]};view.rerender(editor(latest));
 expect(screen.getByLabelText('Monday opens')).toHaveValue('600');expect(screen.getByRole('button',{name:'Save availability'})).toBeDisabled();
 mock.load.mockResolvedValue(latest);fireEvent.click(screen.getByRole('button',{name:'Load latest saved schedule'}));await waitFor(()=>expect(screen.getByLabelText('Monday opens')).toHaveValue('720'));
 mock.save.mockResolvedValue(4);fireEvent.click(screen.getByRole('button',{name:'Save availability'}));await waitFor(()=>expect(mock.save).toHaveBeenCalledWith('provider',true,[{weekday:1,opens:720,closes:1080}],[],3));
});
it('blocks duplicate pending saves synchronously',async()=>{
 let finish!:(value:number)=>void;mock.save.mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve;}));const view=render(editor());const form=view.container.querySelector('form')!;
 act(()=>{fireEvent.submit(form);fireEvent.submit(form);});expect(mock.save).toHaveBeenCalledOnce();expect(screen.getByLabelText('Monday opens')).toBeDisabled();
 await act(async()=>finish(2));await screen.findByText('Schedule saved. Existing confirmations keep their recorded time.');
});
it('retains the draft after a stale write and after a failed explicit reload',async()=>{
 mock.save.mockRejectedValueOnce({code:'40001'});render(editor());fireEvent.change(screen.getByLabelText('Monday opens'),{target:{value:'600'}});fireEvent.click(screen.getByRole('button',{name:'Save availability'}));
 await screen.findByRole('region',{name:'Review saved schedule'});mock.load.mockRejectedValueOnce(new Error('Offline'));fireEvent.click(screen.getByRole('button',{name:'Load latest saved schedule'}));
 expect(await screen.findByRole('alert')).toHaveTextContent('Could not load');expect(screen.getByLabelText('Monday opens')).toHaveValue('600');expect(screen.getByRole('button',{name:'Save availability'})).toBeDisabled();
});
it('distinguishes a confirmed save from a failed refresh',async()=>{
 mock.refresh.mockRejectedValueOnce(new Error('Offline'));render(editor());fireEvent.click(screen.getByRole('button',{name:'Save availability'}));
 await screen.findByText('Schedule saved. Refresh the workspace to see its latest view; do not repeat the same save.');expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
it('does not claim success without an acknowledged new version',async()=>{
 mock.save.mockResolvedValueOnce(null);render(editor());fireEvent.click(screen.getByRole('button',{name:'Save availability'}));await screen.findByRole('alert');expect(screen.queryByText('Schedule saved. Existing confirmations keep their recorded time.')).not.toBeInTheDocument();
});
