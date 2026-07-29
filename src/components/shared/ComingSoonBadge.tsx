import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface ComingSoonBadgeProps {
  className?: string;
}

export function ComingSoonBadge({ className }: ComingSoonBadgeProps) {
  return (
    <Badge 
      variant="secondary" 
      className={`bg-accent/20 text-accent border-accent/30 ${className}`}
    >
      <Clock className="w-3 h-3 mr-1" />
      Coming Soon
    </Badge>
  );
}
