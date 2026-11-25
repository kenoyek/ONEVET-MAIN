import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BoardingEmailLink({ name, email }: { name: string; email: string }) {
  return (
    <Button asChild variant="outline" size="sm">
      <a href={`mailto:${encodeURIComponent(email).replace(/%40/g, '@')}`} aria-label={`Email ${name}`}>
        <Mail aria-hidden="true" />Email facility
      </a>
    </Button>
  );
}
