import { ArrowLeft, Circle, MoreVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Consultation } from '@/hooks/useConsultations';

interface ConsultationHeaderProps {
  consultation: Consultation;
  isVet: boolean;
  onComplete?: () => void;
}

export function ConsultationHeader({ consultation, isVet, onComplete }: ConsultationHeaderProps) {
  const otherParty = isVet ? consultation.pet_owner : consultation.veterinarian;
  const otherName = otherParty
    ? `${otherParty.first_name} ${otherParty.last_name}`
    : isVet
    ? 'Pet Owner'
    : 'Waiting for a vet...';

  const initials = otherParty
    ? `${otherParty.first_name[0]}${otherParty.last_name[0]}`.toUpperCase()
    : 'U';

  const isOnline = otherParty?.is_available ?? false;

  const getStatusBadge = () => {
    switch (consultation.status) {
      case 'pending':
        return <Badge variant="secondary">Waiting</Badge>;
      case 'in_progress':
        return <Badge variant="default">Active</Badge>;
      case 'completed':
        return <Badge variant="outline">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center gap-4 p-4 border-b bg-background">
      {/* Back Button */}
      <Button variant="ghost" size="icon" asChild>
        <Link to="/consultations">
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </Button>

      {/* Avatar with Online Indicator */}
      <div className="relative">
        <Avatar className="h-10 w-10">
          <AvatarImage src={otherParty?.avatar_url || undefined} alt={otherName} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        {consultation.status === 'in_progress' && (
          <Circle
            className={cn(
              'absolute bottom-0 right-0 h-3 w-3 fill-current',
              isOnline ? 'text-success' : 'text-muted-foreground'
            )}
          />
        )}
      </div>

      {/* Name and Status */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold truncate">{otherName}</h2>
          {getStatusBadge()}
        </div>
        {consultation.pet && (
          <p className="text-sm text-muted-foreground truncate">
            Re: {consultation.pet.name} ({consultation.pet.species})
          </p>
        )}
      </div>

      {/* Actions */}
      {isVet && consultation.status === 'in_progress' && onComplete && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onComplete}>
              Complete Consultation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
