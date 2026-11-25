import { MessageCircle } from 'lucide-react';
import { Link, matchPath, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const publicCarePages = [
  '/', '/about', '/pricing', '/subscription', '/contact',
  '/articles', '/articles/:slug', '/education',
  '/services', '/boarding', '/boarding/:slug', '/pet-care', '/farm-care', '/find-a-vet', '/provider-marketplace',
  '/provider/public/:slug', '/marketplace', '/marketplace/:id',
];

export function CareChatLauncher() {
  const { pathname } = useLocation();
  if (!publicCarePages.some(path => matchPath(path, pathname))) return null;

  return (
    <Button asChild size="icon" className="pointer-events-auto size-14 shadow-elevated [&_svg]:size-6">
      <Link to="/care-chat" aria-label="Chat with our care team" title="Chat with our care team">
        <MessageCircle aria-hidden="true" />
      </Link>
    </Button>
  );
}
