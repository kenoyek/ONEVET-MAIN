import { farmSaveError } from '@/lib/confirmed-create';
import { petBookingReturn } from '@/lib/pet-booking-return';
import { PageHeading } from '@/components/layout/PageHeading';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Sprout, Plus, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { FarmForm } from '@/components/farms/FarmForms';
import { FarmAccess } from '@/components/farms/FarmAccess';
import { useFarms, useFarmOwner } from '@/hooks/useFarms';
import { livestockService } from '@/lib/services/livestock-service';
import type { FarmValues } from '@/lib/farm-validation';

function FarmsContent() {
  const query = useFarms();
  const [params]=useSearchParams();
  const navigate=useNavigate();
  const returnTo=petBookingReturn(params.get('returnTo'));
  const active=useRef(true);
  useEffect(()=>{active.current=true;return()=>{active.current=false;};},[]);
  const farmPath=(id:string)=>`/farms/${id}${returnTo?'?'+new URLSearchParams({returnTo}):''}`;
  const ownerId = useFarmOwner();
  const client = useQueryClient();
  const actionLock=useRef(false);
  const draftId=useRef<string>();
  const [createdFarm,setCreatedFarm]=useState<{id:string;name:string}|null>(null);
  const [open, setOpen] = useState(false);
  const save = useMutation({
    mutationFn: (values: FarmValues) => {
      if (!ownerId) throw new Error('Profile not ready');
      return livestockService.registerFarm({ ...values, owner_id: ownerId },draftId.current);
    },
    onSettled:()=>{actionLock.current=false;},
    onSuccess: async saved => {
      draftId.current=undefined;
      await client.invalidateQueries({queryKey:['customer-farms',ownerId]});
      if(saved?.id&&active.current){if(returnTo)navigate(farmPath(saved.id));else setCreatedFarm({id:saved.id,name:saved.farm_name});}
    },
  });
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main
        id="main-content"
        tabIndex={-1}
        className="container-wide pt-28 md:pt-36 pb-20"
      >
        <Link
          to="/dashboard"
          className="text-sm text-muted-foreground underline underline-offset-4"
        >
          Back to your dashboard
        </Link>
        {returnTo&&<section className="mt-6 rounded-xl border bg-card p-5"><h2 className="font-semibold">Add an animal group for your appointment</h2><p className="text-sm text-muted-foreground mt-2">Choose a farm or register one, then add or select an active animal group. Your selected service and time will be checked again when you return.</p><Link className="inline-block mt-3 text-primary underline text-sm" to={returnTo}>Return to appointment request</Link></section>}
        <div className="flex flex-col sm:flex-row gap-5 justify-between items-start sm:items-center mt-7 mb-9">
          <div>
            <p className="eyebrow mb-3">Your farm workspace</p>
            <PageHeading size="workspace" className="" title={<> Farms & livestock </>}/>
            <p className="text-muted-foreground mt-3">
              Manage a herd, flock, pond, or batch without adding every animal
              individually.
            </p>
          </div>
          <Button
            onClick={() => {
              save.reset();
              setOpen(true);
            }}
            disabled={!ownerId}
          >
            <Plus size={18} />
            Add farm
          </Button>
        </div>
        {createdFarm&&<section aria-label="Farm saved" className="mb-8 rounded-2xl border border-primary/20 bg-card p-6 sm:p-8">
          <p role="status" className="eyebrow mb-3">Farm saved</p><h2 className="text-2xl break-words">{createdFarm.name} is ready for its first animal group.</h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">Next, add your herd, flock, pond or batch. Group records keep animal counts and observations together and can be selected when requesting care.</p>
          <div className="mt-5 flex flex-wrap gap-3"><Button asChild><Link to={farmPath(createdFarm.id)}>Add an animal group</Link></Button><Button asChild variant="outline"><Link to="/marketplace">Browse farm supplies</Link></Button><Button variant="ghost" onClick={()=>setCreatedFarm(null)}>Dismiss confirmation</Button></div>
        </section>}
        {!ownerId ? (
          <p role="status">Loading your account…</p>
        ) : query.isLoading ? (
          <p role="status">Loading your farms…</p>
        ) : query.isError ? (
          <section role="alert" className="care-path">
            <h2 className="text-xl mb-3">We couldn’t load your farms.</h2>
            <p className="text-muted-foreground mb-5">
              Check your connection and try again. Your records have not been
              changed.
            </p>
            <Button variant="outline" onClick={() => query.refetch()}>
              Try again
            </Button>
          </section>
        ) : !query.data?.length ? (
          <section className="care-path text-center py-14">
            <Sprout className="mx-auto text-primary mb-5" size={40} />
            <h2 className="text-2xl mb-3">Start with your farm.</h2>
            <p className="text-muted-foreground max-w-lg mx-auto mb-6">
              Add your farm, create an animal group, then keep a record of the
              changes you observe.
            </p>
            <Button onClick={() => setOpen(true)}>Add your first farm</Button>
          </section>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {query.data.map((f) => (
              <Link className="care-path" to={farmPath(f.id)} key={f.id}>
                <Sprout className="text-primary mb-5" />
                <h2 className="text-xl mb-2">{f.farm_name}</h2>
                <p className="text-muted-foreground text-sm capitalize">
                  {f.farm_type.replaceAll('_', ' ')} · {f.city}, {f.state}
                </p>
                <span className="inline-flex gap-2 items-center text-sm font-semibold text-primary mt-6">
                  Open farm <ArrowUpRight size={16} />
                </span>
              </Link>
            ))}
          </div>
        )}
        <Dialog
          open={open}
          onOpenChange={(v) => {
            if (!actionLock.current) {setOpen(v);if(!v)draftId.current=undefined;}
          }}
        >
          <DialogContent className="max-h-[90dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add your farm</DialogTitle>
              <DialogDescription>
                Only add a farm you own or manage through this account.
              </DialogDescription>
            </DialogHeader>
            {save.isError && (
              <p role="alert" className="text-sm text-destructive">
                {farmSaveError(save.error)}
              </p>
            )}
            <FarmForm
              pending={save.isPending}
              onSave={(values) => {
                if(actionLock.current)return;actionLock.current=true;draftId.current??=crypto.randomUUID();
                save.mutate(values, {
                  onSuccess: () => {
                    setOpen(false);
                    toast.success('Farm saved');
                  },
                });
              }}
            />
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
export default function Farms() {
  const ownerId=useFarmOwner();
  return (
    <FarmAccess>
      <FarmsContent key={ownerId || 'loading'} />
    </FarmAccess>
  );
}
