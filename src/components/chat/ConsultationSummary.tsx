import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, FileText, Pill, StickyNote, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const summarySchema = z.object({
  diagnosis: z.string().min(1, 'Please provide a diagnosis'),
  prescription: z.string().optional(),
  notes: z.string().optional(),
});

type SummaryFormData = z.infer<typeof summarySchema>;

interface ConsultationSummaryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (data: SummaryFormData) => Promise<void>;
  petName?: string;
}

export function ConsultationSummary({
  open,
  onOpenChange,
  onComplete,
  petName = 'the pet',
}: ConsultationSummaryProps) {
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<SummaryFormData>({
    resolver: zodResolver(summarySchema),
    defaultValues: {
      diagnosis: '',
      prescription: '',
      notes: '',
    },
  });

  const handleSubmit = async (data: SummaryFormData) => {
    setSubmitting(true);
    try {
      await onComplete(data);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to complete consultation:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            Complete Consultation
          </DialogTitle>
          <DialogDescription>
            Provide a summary for {petName}'s consultation. This will be saved to the medical record.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="diagnosis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Diagnosis *
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter your diagnosis..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="prescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Pill className="h-4 w-4" />
                    Prescription (Optional)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Medications, dosages, and instructions..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <StickyNote className="h-4 w-4" />
                    Additional Notes (Optional)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Follow-up recommendations, care instructions..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Complete Consultation
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
