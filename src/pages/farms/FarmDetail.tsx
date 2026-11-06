import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, ClipboardList, Sprout } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { BatchForm, ObservationForm } from '@/components/farms/FarmForms';
import { FarmAccess } from '@/components/farms/FarmAccess';
import { useFarmOwner, useFarmWorkspace } from '@/hooks/useFarms';
import { livestockService } from '@/lib/services/livestock-service';
import type { BatchValues, ObservationValues } from '@/lib/farm-validation';

function FarmDetailContent() {
  const { farmId } = useParams();
  const ownerId = useFarmOwner();
  const query = useFarmWorkspace(farmId);
  const client = useQueryClient();
  const [dialog, setDialog] = useState<'batch' | 'observation' | null>(null);
  const save = useMutation({
    mutationFn: async (
      input:
        | { kind: 'batch'; values: BatchValues }
        | { kind: 'observation'; values: ObservationValues },
    ) => {
      if (!ownerId || !query.data?.farm) throw new Error('Farm not available');
      if (input.kind === 'batch')
        return livestockService.createHerdBatch({
          ...input.values,
          farm_id: query.data.farm.id,
        });
      if (!query.data.batches.some((b) => b.id === input.values.batch_id))
        throw new Error('Group not available');
      return livestockService.logFlockHealthRecord({
        ...input.values,
        recorded_by_id: ownerId,
        record_type: 'owner_observation',
      });
    },
    onSuccess: () =>
      client.invalidateQueries({
        queryKey: ['customer-farm', ownerId, farmId],
      }),
  });
  const done = () => {
    setDialog(null);
    toast.success('Record saved');
  };
  const data = query.data;
  const activeGroups =
    data?.batches.filter(
      (b) => b.status === 'active' || b.status === 'quarantined',
    ) ?? [];
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main
        id="main-content"
        tabIndex={-1}
        className="container-wide pt-28 md:pt-36 pb-20"
      >
        <Link
          to="/farms"
          className="text-sm text-muted-foreground underline underline-offset-4"
        >
          Back to farms
        </Link>
        {!ownerId || query.isLoading ? (
          <p role="status" className="mt-8">
            Loading farm records…
          </p>
        ) : query.isError ? (
          <section role="alert" className="care-path mt-8">
            <h1 className="text-2xl mb-3">Farm records could not be loaded.</h1>
            <p className="text-muted-foreground mb-5">
              Check your connection and try again.
            </p>
            <Button onClick={() => query.refetch()}>Try again</Button>
          </section>
        ) : !data ? (
          <section className="care-path mt-8">
            <h1 className="text-2xl">Farm not available</h1>
            <p className="text-muted-foreground mt-4">
              This farm may have been removed, or it isn’t available to this
              account.
            </p>
          </section>
        ) : (
          <>
            <header className="mt-7 mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <p className="eyebrow mb-3">Farm health workspace</p>
                <h1 className="text-3xl md:text-4xl">{data.farm.farm_name}</h1>
                <p className="text-muted-foreground mt-3">
                  {data.farm.city}, {data.farm.state} ·{' '}
                  <span className="capitalize">
                    {data.farm.farm_type.replaceAll('_', ' ')}
                  </span>
                </p>
              </div>
              <Button asChild variant="outline">
                <Link to="/find-a-vet">Find veterinary care</Link>
              </Button>
            </header>
            <section aria-labelledby="groups-title">
              <div className="flex flex-wrap gap-4 items-center justify-between mb-5">
                <h2 id="groups-title" className="text-2xl">
                  Animal groups
                </h2>
                <Button
                  onClick={() => {
                    save.reset();
                    setDialog('batch');
                  }}
                >
                  <Plus size={16} />
                  Add animal group
                </Button>
              </div>
              {!data.batches.length ? (
                <div className="care-path">
                  <Sprout className="text-primary mb-4" />
                  <h3 className="text-lg mb-2">
                    A flock, herd, pond, or batch.
                  </h3>
                  <p className="text-muted-foreground">
                    Create your first group and record its species, production
                    stage, and registered size.
                  </p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.batches.map((b) => (
                    <article className="care-path" key={b.id}>
                      <p className="text-xs text-muted-foreground capitalize mb-3">
                        {b.species} · {b.status}
                      </p>
                      <h3 className="text-xl">
                        {b.housing_unit || b.batch_code}
                      </h3>
                      <p className="mt-4 font-semibold">
                        {b.head_count.toLocaleString()} animals registered
                      </p>
                      {b.purpose && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {b.purpose}
                        </p>
                      )}
                      {b.breed && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {b.breed}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
            <section aria-labelledby="records-title" className="mt-12">
              <div className="flex flex-wrap gap-4 items-center justify-between mb-5">
                <h2 id="records-title" className="text-2xl">
                  Health observations
                </h2>
                <Button
                  variant="outline"
                  disabled={!activeGroups.length}
                  onClick={() => {
                    save.reset();
                    setDialog('observation');
                  }}
                >
                  <ClipboardList size={16} />
                  Add observation
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mb-5">
                Your latest 50 records. Times shown in West Africa Time
                (Africa/Lagos). Owner observations do not replace veterinary
                assessment.
              </p>
              {!data.records.length ? (
                <div className="care-path">
                  <h3 className="text-lg mb-2">
                    No observations recorded yet.
                  </h3>
                  <p className="text-muted-foreground">
                    Add an animal group, then record changes in behaviour,
                    feeding, or health.
                  </p>
                </div>
              ) : (
                <ol className="space-y-4">
                  {data.records.map((record) => (
                    <li
                      key={record.id}
                      className="rounded-xl border bg-card p-5"
                    >
                      <div className="flex flex-wrap justify-between gap-2 text-sm">
                        <span className="font-semibold">
                          {data.batches.find((b) => b.id === record.batch_id)
                            ?.housing_unit || 'Animal group'}{' '}
                          · {record.record_type.replaceAll('_', ' ')}
                        </span>
                        <time
                          dateTime={record.recorded_at}
                          className="text-muted-foreground"
                        >
                          {new Intl.DateTimeFormat('en-NG', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                            timeZone: 'Africa/Lagos',
                          }).format(new Date(record.recorded_at))}{' '}
                          WAT
                        </time>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap break-words">
                        {record.observations}
                      </p>
                      <p className="mt-3 text-sm text-muted-foreground">
                        Affected: {record.affected_count ?? '—'} · Deaths
                        observed: {record.mortality_count ?? '—'}
                      </p>
                      {record.treatment_administered && (
                        <p className="text-sm mt-3">
                          Recorded treatment: {record.treatment_administered}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </section>
            <Dialog
              open={!!dialog}
              onOpenChange={(open) => {
                if (!open && !save.isPending) setDialog(null);
              }}
            >
              <DialogContent className="max-h-[90dvh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {dialog === 'batch'
                      ? 'Add animal group'
                      : 'Add health observation'}
                  </DialogTitle>
                  <DialogDescription>
                    {dialog === 'batch'
                      ? 'Keep group-level records for your farm.'
                      : 'Record what you observed for this animal group.'}
                  </DialogDescription>
                </DialogHeader>
                {save.isError && (
                  <p role="alert" className="text-sm text-destructive">
                    We couldn’t save this record. Your entered details are still
                    here. Please try again.
                  </p>
                )}
                {dialog === 'batch' ? (
                  <BatchForm
                    pending={save.isPending}
                    onSave={(values) =>
                      save.mutate(
                        { kind: 'batch', values },
                        { onSuccess: done },
                      )
                    }
                  />
                ) : (
                  <ObservationForm
                    batches={activeGroups}
                    pending={save.isPending}
                    onSave={(values) =>
                      save.mutate(
                        { kind: 'observation', values },
                        { onSuccess: done },
                      )
                    }
                  />
                )}
              </DialogContent>
            </Dialog>
          </>
        )}
      </main>
    </div>
  );
}
export default function FarmDetail() {
  return (
    <FarmAccess>
      <FarmDetailContent />
    </FarmAccess>
  );
}
