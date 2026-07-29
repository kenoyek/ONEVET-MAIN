import { Link } from 'react-router-dom';
import { PawPrint, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PetCardProps {
  pet: {
    id: string;
    name: string;
    species: string;
    breed: string | null;
    avatar_url: string | null;
    is_livestock: boolean | null;
    livestock_count: number | null;
  };
}

export const PetCard = ({ pet }: PetCardProps) => {
  return (
    <Link to={`/pets/${pet.id}`}>
      <Card className="group hover:shadow-md transition-all hover:border-primary/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center flex-shrink-0">
              {pet.avatar_url ? (
                <img 
                  src={pet.avatar_url} 
                  alt={pet.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <PawPrint className="h-8 w-8 text-primary" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                  {pet.name}
                </h3>
                {pet.is_livestock && pet.livestock_count && pet.livestock_count > 1 && (
                  <Badge variant="secondary" className="text-xs">
                    ×{pet.livestock_count}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground capitalize truncate">
                {pet.species}{pet.breed ? ` • ${pet.breed}` : ''}
              </p>
            </div>
            
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
