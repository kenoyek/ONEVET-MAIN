import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/lib/auth-context';
import { verificationService } from '@/lib/services/verification-service';
import { ProviderVerificationStatus } from '@/types/platform';
import { toast } from 'sonner';
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, AlertCircle, FileText, Loader2, Eye } from 'lucide-react';

export interface VerificationCaseItem {
  id: string;
  provider_id: string;
  submitted_at: string;
  risk_level: string;
  organization?: {
    name?: string | null;
    provider_type?: string | null;
    email?: string | null;
    city?: string | null;
    country?: string | null;
  } | null;
  [key: string]: unknown;
}

export interface VerificationDocumentItem {
  id: string;
  document_type: string;
  document_number?: string | null;
  issuing_authority?: string | null;
  verification_status: string;
  [key: string]: unknown;
}

export default function ProviderVerificationQueue() {
  const { user } = useAuth();
  const [queue, setQueue] = useState<VerificationCaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<VerificationCaseItem | null>(null);
  const [documents, setDocuments] = useState<VerificationDocumentItem[]>([]);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<ProviderVerificationStatus | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const data = await verificationService.getVerificationQueue();
      setQueue((data || []) as unknown as VerificationCaseItem[]);
    } catch (err: unknown) {
      console.error('Failed to fetch verification queue:', err);
      toast.error('Failed to load verification queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleOpenReview = async (item: VerificationCaseItem) => {
    setSelectedCase(item);
    setReviewOpen(true);
    try {
      const docs = await verificationService.getProviderDocuments(item.provider_id);
      setDocuments((docs || []) as unknown as VerificationDocumentItem[]);
    } catch {
      setDocuments([]);
    }
  };

  const handleExecuteReview = async () => {
    if (!selectedCase || !reviewAction || !user) return;
    if (reviewAction === 'rejected' && !rejectionReason.trim()) {
      toast.error('Please specify a rejection reason');
      return;
    }

    setProcessing(true);
    try {
      await verificationService.reviewVerificationCase({
        case_id: selectedCase.id,
        provider_id: selectedCase.provider_id,
        new_status: reviewAction,
        rejection_reason: rejectionReason,
        internal_notes: internalNotes,
        admin_id: user.id,
      });

      toast.success(`Provider ${reviewAction.toUpperCase()} successfully`);
      setReviewOpen(false);
      setReviewAction(null);
      setRejectionReason('');
      setInternalNotes('');
      fetchQueue();
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to update verification status');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-2">
              <ShieldCheck className="h-8 w-8 text-primary" /> Provider Verification Command Queue
            </h1>
            <p className="text-muted-foreground">
              Review verification cases, license documents, and regulatory compliance for healthcare providers.
            </p>
          </div>
          <Button variant="outline" onClick={fetchQueue} className="gap-2">
            Refresh Queue
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : queue.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent className="space-y-3">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
              <h3 className="text-xl font-semibold">Verification Queue Clear</h3>
              <p className="text-muted-foreground">There are currently no pending provider applications awaiting review.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {queue.map((item) => (
              <Card key={item.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold">{item.organization?.name || 'Provider Organization'}</h3>
                      <Badge variant={item.risk_level === 'high' ? 'destructive' : 'outline'}>
                        Risk: {item.risk_level.toUpperCase()}
                      </Badge>
                      <Badge variant="secondary" className="capitalize">
                        {item.organization?.provider_type?.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Submitted: {new Date(item.submitted_at).toLocaleDateString()} • Location: {item.organization?.city || 'N/A'}, {item.organization?.country}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button variant="outline" className="gap-2" onClick={() => handleOpenReview(item)}>
                      <Eye className="h-4 w-4" /> Review Application
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Review Dialog */}
        <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Review Case: {selectedCase?.organization?.name}
              </DialogTitle>
              <DialogDescription>
                Inspect compliance credentials, uploaded licenses, and execute review decision.
              </DialogDescription>
            </DialogHeader>

            {selectedCase && (
              <div className="space-y-6 py-2">
                <div className="grid grid-cols-2 gap-4 text-sm p-4 bg-muted/40 rounded-lg">
                  <div>
                    <span className="text-muted-foreground block text-xs">Provider Type</span>
                    <span className="font-semibold capitalize">{selectedCase.organization?.provider_type?.replace(/_/g, ' ')}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Email</span>
                    <span className="font-semibold">{selectedCase.organization?.email}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Submission Date</span>
                    <span className="font-semibold">{new Date(selectedCase.submitted_at).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Current Risk Level</span>
                    <span className="font-semibold capitalize">{selectedCase.risk_level}</span>
                  </div>
                </div>

                {/* Document Verification Section */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Verification Documents & Credentials
                  </h4>
                  {documents.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic p-3 border rounded">
                      No document attachments uploaded yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 border rounded-md">
                          <div>
                            <p className="font-medium text-sm capitalize">{doc.document_type.replace(/_/g, ' ')}</p>
                            <p className="text-xs text-muted-foreground">
                              Doc #: {doc.document_number || 'N/A'} • Authority: {doc.issuing_authority || 'N/A'}
                            </p>
                          </div>
                          <Badge variant={doc.verification_status === 'verified' ? 'default' : 'outline'}>
                            {doc.verification_status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Review Action Controls */}
                <div className="border-t pt-4 space-y-4">
                  <h4 className="font-semibold">Review Decision</h4>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant={reviewAction === 'approved' ? 'default' : 'outline'}
                      className="gap-2"
                      onClick={() => setReviewAction('approved')}
                    >
                      <CheckCircle2 className="h-4 w-4 text-green-500" /> Approve Application
                    </Button>

                    <Button
                      type="button"
                      variant={reviewAction === 'more_info_required' ? 'default' : 'outline'}
                      className="gap-2"
                      onClick={() => setReviewAction('more_info_required')}
                    >
                      <AlertCircle className="h-4 w-4 text-yellow-500" /> Request More Info
                    </Button>

                    <Button
                      type="button"
                      variant={reviewAction === 'rejected' ? 'destructive' : 'outline'}
                      className="gap-2"
                      onClick={() => setReviewAction('rejected')}
                    >
                      <XCircle className="h-4 w-4 text-red-500" /> Reject Application
                    </Button>

                    <Button
                      type="button"
                      variant={reviewAction === 'suspended' ? 'destructive' : 'outline'}
                      className="gap-2"
                      onClick={() => setReviewAction('suspended')}
                    >
                      <ShieldAlert className="h-4 w-4" /> Suspend Provider
                    </Button>
                  </div>

                  {reviewAction === 'rejected' && (
                    <div className="space-y-2">
                      <Label htmlFor="rejection">Rejection Reason *</Label>
                      <Textarea
                        id="rejection"
                        required
                        placeholder="State clear regulatory or documentation missing reasons for applicant..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="notes">Internal Admin Audit Notes</Label>
                    <Textarea
                      id="notes"
                      rows={2}
                      placeholder="Notes visible only to platform admins & compliance officers..."
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => setReviewOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      disabled={!reviewAction || processing}
                      onClick={handleExecuteReview}
                    >
                      {processing ? 'Saving Decision...' : 'Confirm Decision'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
