import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { PageHeading } from '@/components/layout/PageHeading';
import { CareChatThread } from '@/components/chat/CareChatThread';
import { Button } from '@/components/ui/button';
import { visitCareChat } from '@/lib/services/care-chat-service';

const storageKey = 'onevet-care-chat';
const guestKeyPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function loadGuestKey() {
  try {
    const previous = sessionStorage.getItem(storageKey);
    if (previous && guestKeyPattern.test(previous)) return previous;
  } catch {
    // Chat can still work in memory when browser storage is unavailable.
  }
  return crypto.randomUUID();
}

export default function CareChat() {
  const [key, setKey] = useState(loadGuestKey);

  function remember(guestKey: string) {
    try { sessionStorage.setItem(storageKey, guestKey); } catch { /* In-memory session */ }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="container-wide max-w-3xl space-y-6 pb-16 pt-28">
        <PageHeading title="Chat with our care team" description="Ask a general care or booking question. If the team is away, leave a message and check back in this tab for a reply." />
        <p className="text-sm text-muted-foreground">This chat is for general guidance and booking. Avoid sharing payment details, passwords, or medical records. Chat access lasts up to seven days.</p>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline"><Link to="/find-a-vet">Find veterinary care</Link></Button>
          <Button asChild variant="outline"><Link to="/urgent-care">Urgent care guidance</Link></Button>
          <Button asChild variant="ghost"><Link to="/contact">Contact form</Link></Button>
        </div>
        <CareChatThread key={key} queryKey={['care-chat', 'guest', key]}
          load={() => visitCareChat(key)}
          send={message => {
            remember(key);
            return visitCareChat(key, message);
          }} />
        <Button variant="outline" onClick={() => {
          if (!window.confirm('Start a new chat? This tab will stop showing the previous conversation.')) return;
          const next = crypto.randomUUID();
          remember(next);
          setKey(next);
        }}>Start a new chat</Button>
      </main>
    </div>
  );
}
