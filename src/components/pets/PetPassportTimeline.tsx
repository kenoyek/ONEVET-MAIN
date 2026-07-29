import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Stethoscope, Syringe, Pill, FileText, Weight, Scissors, Activity, FileCode } from 'lucide-react';
import { format } from 'date-fns';

interface TimelineEvent {
  id: string;
  event_type: 'consultation' | 'diagnosis' | 'vaccination' | 'prescription' | 'lab_result' | 'grooming' | 'weight_update' | 'admission' | 'procedure' | 'document_upload';
  title: string;
  description?: string | null;
  event_date: string;
}

interface PetPassportTimelineProps {
  timeline: TimelineEvent[];
}

const EVENT_ICONS: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; badge: string }> = {
  consultation: { icon: Stethoscope, color: 'text-blue-500 bg-blue-50 border-blue-200', badge: 'Consultation' },
  diagnosis: { icon: Activity, color: 'text-amber-500 bg-amber-50 border-amber-200', badge: 'Diagnosis' },
  vaccination: { icon: Syringe, color: 'text-emerald-500 bg-emerald-50 border-emerald-200', badge: 'Vaccination' },
  prescription: { icon: Pill, color: 'text-purple-500 bg-purple-50 border-purple-200', badge: 'Prescription' },
  lab_result: { icon: FileText, color: 'text-indigo-500 bg-indigo-50 border-indigo-200', badge: 'Lab Result' },
  grooming: { icon: Scissors, color: 'text-pink-500 bg-pink-50 border-pink-200', badge: 'Grooming' },
  weight_update: { icon: Weight, color: 'text-cyan-500 bg-cyan-50 border-cyan-200', badge: 'Weight Record' },
  document_upload: { icon: FileCode, color: 'text-gray-500 bg-gray-50 border-gray-200', badge: 'Document' },
};

export const PetPassportTimeline: React.FC<PetPassportTimelineProps> = ({ timeline }) => {
  if (!timeline || timeline.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Health History Timeline</CardTitle>
          <CardDescription>Unified timeline of consultations, vaccinations, diagnoses and care records.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8 text-sm">
            No health records logged yet for this pet passport.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Digital Health Timeline</span>
          <Badge variant="outline">{timeline.length} Records</Badge>
        </CardTitle>
        <CardDescription>Chronological health records and medical timeline.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="relative border-l-2 border-muted ml-4 pl-6 space-y-6">
          {timeline.map((event) => {
            const config = EVENT_ICONS[event.event_type] || EVENT_ICONS.consultation;
            const Icon = config.icon;

            return (
              <div key={event.id} className="relative group">
                {/* Timeline Dot */}
                <div
                  className={`absolute -left-[35px] top-0 p-1.5 rounded-full border ${config.color} shadow-sm transition-transform group-hover:scale-110`}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <div className="bg-muted/30 p-4 rounded-lg border space-y-1 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-semibold text-sm">{event.title}</h4>
                    <span className="text-xs text-muted-foreground font-medium">
                      {format(new Date(event.event_date), 'MMM d, yyyy • h:mm a')}
                    </span>
                  </div>

                  {event.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed">{event.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
