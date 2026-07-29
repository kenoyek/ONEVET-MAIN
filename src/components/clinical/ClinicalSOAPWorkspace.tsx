import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { clinicalService, PrescriptionItemInput } from '@/lib/services/clinical-service';
import { toast } from 'sonner';
import { Stethoscope, FileText, Pill, CheckCircle2, Lock, Plus, Trash2, AlertTriangle } from 'lucide-react';

interface ClinicalSOAPWorkspaceProps {
  consultation: any;
  vetProfileId: string;
  currentUserId: string;
  onRefresh: () => void;
}

export const ClinicalSOAPWorkspace: React.FC<ClinicalSOAPWorkspaceProps> = ({
  consultation,
  vetProfileId,
  currentUserId,
  onRefresh,
}) => {
  const isSigned = !!consultation.signed_at;

  const [subjective, setSubjective] = useState(consultation.subjective_notes || '');
  const [objective, setObjective] = useState(consultation.objective_notes || '');
  const [assessment, setAssessment] = useState(consultation.assessment || '');
  const [treatmentPlan, setTreatmentPlan] = useState(consultation.treatment_plan || '');
  const [diagnosis, setDiagnosis] = useState(consultation.diagnosis || '');
  const [followUpRequired, setFollowUpRequired] = useState(consultation.follow_up_required || false);
  const [followUpDate, setFollowUpDate] = useState(consultation.follow_up_date || '');

  const [savingNotes, setSavingNotes] = useState(false);
  const [signing, setSigning] = useState(false);

  // Prescription builder state
  const [rxOpen, setRxOpen] = useState(false);
  const [rxItems, setRxItems] = useState<PrescriptionItemInput[]>([]);
  const [medName, setMedName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [duration, setDuration] = useState('7 days');
  const [qty, setQty] = useState(1);
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [submittingRx, setSubmittingRx] = useState(false);

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await clinicalService.updateSOAPNotes({
        consultation_id: consultation.id,
        chief_complaint: consultation.chief_complaint,
        subjective_notes: subjective,
        objective_notes: objective,
        assessment,
        treatment_plan: treatmentPlan,
        diagnosis,
        clinical_summary: `${diagnosis ? `Diagnosis: ${diagnosis}. ` : ''}${assessment || ''}`,
        follow_up_required: followUpRequired,
        follow_up_date: followUpDate || undefined,
      });

      toast.success('Clinical SOAP notes saved');
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleSignConsultation = async () => {
    setSigning(true);
    try {
      await clinicalService.signClinicalSummary(consultation.id, currentUserId);
      toast.success('Clinical consultation signed and locked');
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to sign consultation');
    } finally {
      setSigning(false);
    }
  };

  const handleAddMedicationItem = () => {
    if (!medName || !dosage || !frequency) {
      toast.error('Please fill medication name, dosage and frequency');
      return;
    }

    setRxItems((prev) => [
      ...prev,
      {
        medication_name: medName,
        dosage,
        frequency,
        duration,
        quantity: qty,
      },
    ]);

    setMedName('');
    setDosage('');
    setFrequency('');
  };

  const handleRemoveRxItem = (index: number) => {
    setRxItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleIssuePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultation.pet_id) {
      toast.error('No pet associated with consultation');
      return;
    }
    if (rxItems.length === 0) {
      toast.error('Add at least one medication item');
      return;
    }

    setSubmittingRx(true);
    try {
      await clinicalService.issuePrescription(
        {
          consultation_id: consultation.id,
          pet_id: consultation.pet_id,
          veterinarian_profile_id: vetProfileId,
          valid_until: validUntil,
          items: rxItems,
        },
        currentUserId
      );

      toast.success('Prescription issued & added to pet passport');
      setRxOpen(false);
      setRxItems([]);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to issue prescription');
    } finally {
      setSubmittingRx(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header / Lock Status Banner */}
      <Card className={isSigned ? 'border-green-500/30 bg-green-50/20' : 'border-primary/20'}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-xl flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-primary" /> Clinical SOAP Workspace
              </CardTitle>
              {isSigned ? (
                <Badge variant="default" className="gap-1 bg-green-600">
                  <Lock className="h-3 w-3" /> Signed & Locked
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300">
                  In Progress (Draft)
                </Badge>
              )}
            </div>
            <CardDescription>
              Structured SOAP Notes (Subjective, Objective, Assessment, Plan) and Prescription Builder.
            </CardDescription>
          </div>

          {!isSigned && (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleSaveNotes} disabled={savingNotes}>
                {savingNotes ? 'Saving...' : 'Save Draft'}
              </Button>
              <Button onClick={handleSignConsultation} disabled={signing} className="gap-2 bg-green-600 hover:bg-green-700">
                <CheckCircle2 className="h-4 w-4" /> Sign & Lock Record
              </Button>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* SOAP Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Subjective (S) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-blue-600 flex items-center gap-2">
              <span>S</span> Subjective Notes (History & Symptoms)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={4}
              disabled={isSigned}
              placeholder="Client reported history, duration of symptoms, appetite, energy level, behavior..."
              value={subjective}
              onChange={(e) => setSubjective(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Objective (O) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-emerald-600 flex items-center gap-2">
              <span>O</span> Objective Notes (Physical Exam & Vitals)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={4}
              disabled={isSigned}
              placeholder="Body temp (°C), heart rate (bpm), respiratory rate, mucosal color, abdominal palpation..."
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Assessment (A) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-amber-600 flex items-center gap-2">
              <span>A</span> Assessment & Clinical Diagnosis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="diag" className="text-xs">Primary Diagnosis</Label>
              <Input
                id="diag"
                disabled={isSigned}
                placeholder="e.g. Acute Canine Gastroenteritis"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
              />
            </div>
            <Textarea
              rows={3}
              disabled={isSigned}
              placeholder="Clinical reasoning, differential diagnoses, rule-outs..."
              value={assessment}
              onChange={(e) => setAssessment(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Plan (P) */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base text-purple-600 flex items-center gap-2">
              <span>P</span> Plan & Treatment Strategy
            </CardTitle>

            {!isSigned && (
              <Dialog open={rxOpen} onOpenChange={setRxOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-2">
                    <Pill className="h-4 w-4" /> Issue Rx
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Prescription Builder</DialogTitle>
                    <DialogDescription>Create server-authorized Rx for pet health passport.</DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleIssuePrescription} className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="mName">Medication Name</Label>
                        <Input
                          id="mName"
                          placeholder="e.g. Amoxicillin"
                          value={medName}
                          onChange={(e) => setMedName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="dose">Dosage</Label>
                        <Input
                          id="dose"
                          placeholder="e.g. 250mg"
                          value={dosage}
                          onChange={(e) => setDosage(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="freq">Frequency</Label>
                        <Input
                          id="freq"
                          placeholder="Twice daily"
                          value={frequency}
                          onChange={(e) => setFrequency(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="dur">Duration</Label>
                        <Input
                          id="dur"
                          placeholder="7 days"
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="qtyIn">Qty</Label>
                        <Input
                          id="qtyIn"
                          type="number"
                          value={qty}
                          onChange={(e) => setQty(Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <Button type="button" variant="secondary" size="sm" className="w-full gap-2" onClick={handleAddMedicationItem}>
                      <Plus className="h-4 w-4" /> Add Item to Rx List
                    </Button>

                    {/* Added Items List */}
                    {rxItems.length > 0 && (
                      <div className="space-y-2 border p-2 rounded-md max-h-36 overflow-y-auto">
                        {rxItems.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs p-2 bg-muted rounded">
                            <div>
                              <p className="font-semibold">{item.medication_name} ({item.dosage})</p>
                              <p className="text-muted-foreground">{item.frequency} • {item.duration}</p>
                            </div>
                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveRxItem(idx)}>
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-1">
                      <Label htmlFor="vUntil">Prescription Expiry Date</Label>
                      <Input
                        id="vUntil"
                        type="date"
                        value={validUntil}
                        onChange={(e) => setValidUntil(e.target.value)}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button type="button" variant="outline" onClick={() => setRxOpen(false)}>Cancel</Button>
                      <Button type="submit" disabled={submittingRx}>
                        {submittingRx ? 'Issuing...' : 'Issue Prescription'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              rows={3}
              disabled={isSigned}
              placeholder="Treatment plan, fluid therapy, dietary advice, follow-up instructions..."
              value={treatmentPlan}
              onChange={(e) => setTreatmentPlan(e.target.value)}
            />

            <div className="flex items-center justify-between pt-2 border-t text-sm">
              <div className="flex items-center space-x-2">
                <Switch
                  id="fu"
                  disabled={isSigned}
                  checked={followUpRequired}
                  onCheckedChange={setFollowUpRequired}
                />
                <Label htmlFor="fu" className="cursor-pointer">Follow-up Required</Label>
              </div>

              {followUpRequired && (
                <Input
                  type="date"
                  disabled={isSigned}
                  className="w-40 h-8 text-xs"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
