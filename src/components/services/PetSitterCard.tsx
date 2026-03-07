import { Link } from 'react-router-dom';
import { Star, MapPin, Home } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { PetSitterListing } from '@/hooks/usePetSitters';

interface PetSitterCardProps {
  sitter: PetSitterListing;
}

export function PetSitterCard({ sitter }: PetSitterCardProps) {
  const displayName = sitter.provider.business_name ||
    `${sitter.provider.first_name} ${sitter.provider.last_name}`.trim() ||
    'Pet Sitter';
  const initials = (sitter.provider.first_name?.[0] || '') + (sitter.provider.last_name?.[0] || '');
  const imageUrl = sitter.image_url || sitter.provider.avatar_url;

  return (
    <Card className="h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 overflow-hidden">
      <div className="relative h-48 bg-muted">
        {imageUrl ? (
          <img src={imageUrl} alt={displayName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-accent/10">
            <Home className="w-12 h-12 text-accent/40" />
          </div>
        )}
        <Badge className="absolute top-3 right-3" variant={sitter.category === 'boarding' ? 'secondary' : 'default'}>
          {sitter.category === 'boarding' ? 'Boarding' : 'Pet Sitting'}
        </Badge>
      </div>

      <CardContent className="p-5 space-y-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 border-2 border-primary/20">
            <AvatarImage src={sitter.provider.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {initials || 'PS'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-semibold text-foreground truncate">{displayName}</h3>
            {sitter.location && (
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{sitter.location}</span>
              </p>
            )}
          </div>
        </div>

        {sitter.avg_rating !== null && (
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${i < Math.round(sitter.avg_rating!) ? 'fill-accent text-accent' : 'text-border'}`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {sitter.avg_rating} ({sitter.review_count})
            </span>
          </div>
        )}

        {sitter.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{sitter.description}</p>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border">
          {sitter.price ? (
            <span className="font-semibold text-foreground">
              ₦{sitter.price.toLocaleString()}<span className="text-sm font-normal text-muted-foreground">/{sitter.price_unit || 'night'}</span>
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
