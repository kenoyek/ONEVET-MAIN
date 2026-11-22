import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { PageHeading } from '@/components/layout/PageHeading';
import { VisitorChatAvailability } from '@/components/chat/CareChatAvailability';
import { CareChatThread } from '@/components/chat/CareChatThread';
import { Button } from '@/components/ui/button';
import { getCareChatKey, markCareChatReplyViewed, rememberCareChatKey } from '@/lib/care-chat-session';
import { visitCareChat } from '@/lib/services/care-chat-service';

export default function CareChat() {
  const [key, setKey] = useState(() => getCareChatKey() ?? crypto.randomUUID());

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="container-wide max-w-3xl space-y-6 pb-16 pt-28">
        <PageHeading title="Chat with our care team" description="Ask a general care or booking question, without signing in." />
        <VisitorChatAvailability />
        <p className="text-sm text-muted-foreground">This chat is for general guidance and booking. Avoid sharing payment details, passwords, or medical records. Chat access lasts up to seven days.</p>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline"><Link to="/find-a-vet">Find veterinary care</Link></Button>
          <Button asChild variant="outline"><Link to="/urgent-care">Urgent care guidance</Link></Button>
          <Button asChild variant="ghost"><Link to="/contact">Contact form</Link></Button>
        </div>
        <CareChatThread key={key} queryKey={['care-chat', 'guest', key]}
          load={() => visitCareChat(key)}
          send={message => {
            rememberCareChatKey(key);
            return visitCareChat(key, message);
          }}
          onReplyViewed={id => markCareChatReplyViewed(key, id)} />
        <Button variant="outline" onClick={() => {
          if (!window.confirm('Start a new chat? This tab will stop showing the previous conversation.')) return;
          const next = crypto.randomUUID();
          rememberCareChatKey(next);
          setKey(next);
        }}>Start a new chat</Button>
      </main>
    </div>
  );
}
