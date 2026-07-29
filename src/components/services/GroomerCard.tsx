import { Link } from 'react-router-dom';
import { Star, MapPin, Scissors } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { GroomerListing } from '@/hooks/useGroomers';

interface GroomerCardProps {
  groomer: GroomerListing;
}

export function GroomerCard({ groomer }: GroomerCardProps) {
  const displayName = groomer.provider.business_name ||
    `${groomer.provider.first_name} ${groomer.provider.last_name}`.trim() ||
    'Pet Groomer';
  const initials = (groomer.provider.first_name?.[0] || '') + (groomer.provider.last_name?.[0] || '');
  const imageUrl = groomer.image_url || groomer.provider.avatar_url;

  return (
    <Card className="h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 overflow-hidden">
      {/* Image */}
      <div className="relative h-48 bg-muted">
        {imageUrl ? (
          <img src={imageUrl} alt={displayName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary/10">
            <Scissors className="w-12 h-12 text-secondary/40" />
          </div>
        )}
      </div>

      <CardContent className="p-5 space-y-3">
        {/* Provider info */}
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 border-2 border-primary/20">
            <AvatarImage src={groomer.provider.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {initials || 'PG'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-semibold text-foreground truncate">{displayName}</h3>
            {groomer.location && (
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{groomer.location}</span>
              </p>
            )}
          </div>
        </div>

        {/* Rating */}
        {groomer.avg_rating !== null && (
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${i < Math.round(groomer.avg_rating!) ? 'fill-accent text-accent' : 'text-border'}`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {groomer.avg_rating} ({groomer.review_count})
            </span>
          </div>
        )}

        {/* Description */}
        {groomer.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{groomer.description}</p>
        )}

        {/* Price + CTA */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          {groomer.price ? (
            <span className="font-semibold text-foreground">
              ₦{groomer.price.toLocaleString()}<span className="text-sm font-normal text-muted-foreground">/{groomer.price_unit || 'session'}</span>
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">Contact for pricing</span>
          )}
          <Button size="sm" asChild>
            <Link to="/auth">Book Now</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
