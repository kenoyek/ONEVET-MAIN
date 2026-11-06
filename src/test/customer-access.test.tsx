import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
const auth=vi.hoisted(()=>({user:{id:'fixture'},role:null as string|null,roles:[] as string[],loading:false,permissionsError:false,refreshProfile:vi.fn(async()=>{})}));
vi.mock('@/lib/auth-context',()=>({useAuth:()=>auth}));
function view(){render(<MemoryRouter><ProtectedRoute allowedRoles={['pet_owner','client']}><p>Private customer record</p></ProtectedRoute></MemoryRouter>);}
beforeEach(()=>{auth.role=null;auth.roles=[];auth.permissionsError=false;vi.clearAllMocks();});afterEach(cleanup);
describe('Customer portal access',()=>{
 it('hides records when permissions fail and provides retry and support',()=>{auth.permissionsError=true;view();expect(screen.getByRole('alert')).toHaveTextContent('couldn’t verify');expect(screen.queryByText('Private customer record')).not.toBeInTheDocument();fireEvent.click(screen.getByText('Try again'));expect(auth.refreshProfile).toHaveBeenCalledOnce();expect(screen.getByRole('link',{name:'Contact support'})).toHaveAttribute('href','/contact');});
 it('waits for authoritative roles before rendering records',()=>{view();expect(screen.getByText('Verifying Permissions...')).toBeInTheDocument();expect(screen.queryByText('Private customer record')).not.toBeInTheDocument();});
 it('supports the existing client role on customer routes',()=>{auth.role='client';auth.roles=['client'];view();expect(screen.getByText('Private customer record')).toBeInTheDocument();});
});
