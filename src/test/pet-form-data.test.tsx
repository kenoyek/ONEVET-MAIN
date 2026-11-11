import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PetForm } from '@/components/pets/PetForm';
beforeEach(()=>vi.stubGlobal('ResizeObserver',class{observe(){}unobserve(){}disconnect(){}}));
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
describe('animal profile form',()=>{
 it('submits a date-only value unchanged and permits an unknown date to be cleared',async()=>{
  const save=vi.fn().mockResolvedValue(undefined);render(<PetForm defaultValues={{name:'Bello'}} onSubmit={save}/>);
  const date=screen.getByLabelText('Date of Birth');fireEvent.change(date,{target:{value:'2024-02-29'}});fireEvent.click(screen.getByRole('button',{name:'Save Pet'}));await waitFor(()=>expect(save.mock.calls[0]?.[0]).toMatchObject({dateOfBirth:'2024-02-29'}));
  fireEvent.change(date,{target:{value:''}});fireEvent.click(screen.getByRole('button',{name:'Save Pet'}));await waitFor(()=>expect(save.mock.calls.at(-1)?.[0]).toMatchObject({dateOfBirth:''}));
 });
 it('shows a fractional livestock-count error and keeps the entered value',async()=>{
  const save=vi.fn();const {container}=render(<PetForm defaultValues={{name:'Flock',isLivestock:true}} onSubmit={save}/>);
  fireEvent.change(screen.getByLabelText('Number of Animals'),{target:{value:'1.5'}});fireEvent.submit(container.querySelector('form')!);expect(await screen.findByText('Enter a whole number of animals.')).toBeInTheDocument();expect(save).not.toHaveBeenCalled();expect(screen.getByLabelText('Number of Animals')).toHaveValue(1.5);
 });
});
