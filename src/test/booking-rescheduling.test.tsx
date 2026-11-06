import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const { current, slots, reschedule }=vi.hoisted(()=>({current:vi.fn(),slots:vi.fn(),reschedule:vi.fn()}));
vi.mock('@/lib/auth-context',()=>({useAuth:()=>({user:{id:'customer-id'}})}));
vi.mock('@/lib/services/appointment-service',async original=>({...await original<typeof import('@/lib/services/appointment-service')>(),appointmentService:{service:current,rescheduleSlots:slots,reschedule}}));
import { BookingRescheduleForm } from '@/components/provider/BookingRescheduleForm';
import type { Appointment } from '@/lib/services/appointment-service';
const start=new Date(Date.now()+86400000).toISOString();const alternative=new Date(Date.parse(start)+15*60_000).toISOString();
const booking={id:'original-id',version:2,service_id:'service-id',start_at:start,base_fee:15000,currency:'NGN'} as Appointment;
function mount(){const cache=new QueryClient({defaultOptions:{queries:{retry:false}}});render(<QueryClientProvider client={cache}><MemoryRouter><Routes><Route path="/" element={<BookingRescheduleForm booking={booking} onSubmitted={vi.fn().mockResolvedValue(undefined)}/>}/><Route path="/appointments/:id" element={<h1>Replacement details</h1>}/></Routes></MemoryRouter></QueryClientProvider>);return cache;}
async function fill(){fireEvent.change(await screen.findByLabelText('New start time · WAT'),{target:{value:alternative}});fireEvent.change(screen.getByLabelText('Reason shared with the provider'),{target:{value:'A later start is needed.'}});fireEvent.click(screen.getByRole('checkbox'));}
describe('Customer rescheduling',()=>{
 beforeEach(()=>{vi.clearAllMocks();current.mockResolvedValue({service_version:4,base_price:20000,currency:'NGN',duration_minutes:60,booking_enabled:true});slots.mockResolvedValue([{start_at:start},{start_at:alternative}]);});
 it('requires acknowledgement of current terms and excludes the unchanged original time',async()=>{
  mount();await screen.findByLabelText('New start time · WAT');expect(screen.getByText(/Original fee: NGN 15,000.00. New request: NGN 20,000.00/)).toBeInTheDocument();expect(screen.getAllByRole('option')).toHaveLength(2);expect(screen.getByRole('button',{name:'Submit reschedule request'})).toBeDisabled();
 });
 it('preserves entries and reuses the key when a response is lost',async()=>{
  reschedule.mockRejectedValueOnce(new Error('Network')).mockResolvedValueOnce('alternative-id');mount();await fill();fireEvent.click(screen.getByRole('button',{name:'Submit reschedule request'}));expect(await screen.findByRole('alert')).toHaveTextContent('try again');expect(screen.getByLabelText('Reason shared with the provider')).toHaveValue('A later start is needed.');fireEvent.click(screen.getByRole('button',{name:'Submit reschedule request'}));await screen.findByRole('heading',{name:'Replacement details'});expect(reschedule.mock.calls[0]?.[0].key).toBe(reschedule.mock.calls[1]?.[0].key);expect(reschedule.mock.calls[1]?.[0]).toMatchObject({bookingId:'original-id',bookingVersion:2,serviceVersion:4});
 });
 it('requires fresh acknowledgement when a background refresh changes the service terms',async()=>{
  current.mockResolvedValueOnce({service_version:4,base_price:20000,currency:'NGN',duration_minutes:60,booking_enabled:true}).mockResolvedValue({service_version:5,base_price:22000,currency:'NGN',duration_minutes:60,booking_enabled:true});const cache=mount();await fill();expect(screen.getByRole('checkbox')).toBeChecked();await act(async()=>{await cache.invalidateQueries({queryKey:['reschedule-service']});});await waitFor(()=>expect(screen.getByRole('checkbox')).not.toBeChecked());expect(current).toHaveBeenCalledTimes(2);expect(screen.getByRole('button',{name:'Submit reschedule request'})).toBeDisabled();
 });
 it('reports unavailable service terms without exposing a submit action',async()=>{
  current.mockRejectedValue(new Error('Unavailable'));mount();expect(await screen.findByRole('alert')).toHaveTextContent('terms are unavailable');expect(screen.queryByRole('button',{name:'Submit reschedule request'})).not.toBeInTheDocument();
 });
});
