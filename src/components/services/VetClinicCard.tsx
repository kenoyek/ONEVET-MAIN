import { Link } from 'react-router-dom';
import { Star, MapPin, Stethoscope } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { VetClinicListing } from '@/hooks/useVetClinics';

interface VetClinicCardProps {
  clinic: VetClinicListing;
}

export function VetClinicCard({ clinic }: VetClinicCardProps) {
  const displayName = clinic.provider.business_name ||
    `${clinic.provider.first_name} ${clinic.provider.last_name}`.trim() ||
    'Vet Clinic';
  const initials = (clinic.provider.first_name?.[0] || '') + (clinic.provider.last_name?.[0] || '');
  const imageUrl = clinic.image_url || clinic.provider.avatar_url;

  return (
    <Card className="h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 overflow-hidden">
      <div className="relative h-48 bg-muted">
        {imageUrl ? (
          <img src={imageUrl} alt={displayName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-success/10">
            <Stethoscope className="w-12 h-12 text-success/40" />
          </div>
        )}
      </div>

      <CardContent className="p-5 space-y-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 border-2 border-primary/20">
            <AvatarImage src={clinic.provider.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {initials || 'VC'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-semibold text-foreground truncate">{displayName}</h3>
            {clinic.location && (
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{clinic.location}</span>
              </p>
            )}
          </div>
        </div>

        {clinic.avg_rating !== null && (
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${i < Math.round(clinic.avg_rating!) ? 'fill-accent text-accent' : 'text-border'}`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {clinic.avg_rating} ({clinic.review_count})
            </span>
          </div>
        )}

        {clinic.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{clinic.description}</p>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border">
          {clinic.price ? (
            <span className="font-semibold text-foreground">
              ₦{clinic.price.toLocaleString()}<span className="text-sm font-normal text-muted-foreground">/{clinic.price_unit || 'visit'}</span>
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">Contact for pricing</span>
          )}
          <Button size="sm" asChild>
            <Link to="/auth">View Clinic</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
