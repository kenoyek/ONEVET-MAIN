import { useState } from 'react';
import { MessageCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { useAuth } from '@/lib/auth-context';
import { useSubscription } from '@/hooks/useSubscription';
import { useVetPresence } from '@/hooks/useVetPresence';
import { useLiveChat } from '@/hooks/useLiveChat';

export function LiveChatWidget() {
  const { user, profile, role } = useAuth();
  const { isActive } = useSubscription();
  const { onlineVetsCount } = useVetPresence();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const {
    status,
    messages,
    messagesLoading,
    messagesError,
    refetchMessages,
    loading,
    startChat,
    sendMessage,
    closeChat,
  } = useLiveChat();

  // Don't render for vets/admins, unauthenticated, or on consultation chat pages
  if (!user || !profile) return null;
  if (role === 'veterinarian' || role === 'admin') return null;
  if (!isActive) return null;
  if (location.pathname.match(/^\/consultations\/[^/]+$/)) return null;

  const handleSend = async (content: string) => {
    if (status === 'idle') {
      await startChat(content);
    } else {
      await sendMessage(content);
    }
  };

  const handleClose = () => {
    setOpen(false);
    if (status === 'completed') {
      closeChat();
    }
  };

  const vetsOnline = onlineVetsCount > 0;

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="pointer-events-auto"
          >
            <Button
              onClick={() => setOpen(true)}
              size="icon"
              variant="outline"
              aria-label="Open veterinary consultation chat"
              className="relative size-14 shadow-lg [&_svg]:size-6"
            >
              <MessageCircle className="h-6 w-6" aria-hidden="true" />
              {vetsOnline && (
                <span className="absolute top-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-background">
                  <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
                </span>
              )}
              {(status === 'waiting' || status === 'active') && (
                <span className="absolute -top-1 -left-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                  1
                </span>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Sheet */}
      <Sheet open={open} onOpenChange={(o) => { if (!o) handleClose(); else setOpen(true); }}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-[26rem]">
          <SheetHeader className="border-b bg-card p-4 pr-12 text-left">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                <span>
                  {status === 'idle' && 'Urgent Live Chat'}
                  {status === 'waiting' && 'Connecting...'}
                  {status === 'active' && 'Live Chat'}
                  {status === 'completed' && 'Chat Completed'}
                </span>
              </SheetTitle>
            </div>
            <SheetDescription>
              {status === 'idle' && (vetsOnline
                ? `${onlineVetsCount} vet${onlineVetsCount > 1 ? 's' : ''} online. Describe your concern to start.`
                : 'No vets are online right now. Your message will be queued.')}
              {status !== 'idle' && 'Veterinary consultation messages'}
            </SheetDescription>
          </SheetHeader>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3 sm:p-4">
            {status === 'waiting' && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm font-medium">Connecting you to a vet...</p>
                <p className="text-xs text-muted-foreground">A veterinarian will accept your request shortly.</p>
              </div>
            )}

            {status === 'completed' && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
                <CheckCircle2 className="h-10 w-10 text-primary" />
                <p className="text-sm font-medium">Consultation completed</p>
                <p className="text-xs text-muted-foreground">
                  Thank you for using live chat. You can view the full consultation in your dashboard.
                </p>
                <Button variant="outline" size="sm" onClick={() => { closeChat(); setOpen(false); }}>
                  Close
                </Button>
              </div>
            )}

            {status === 'idle' && (
              <div className="flex-1 flex flex-col justify-end">
                <ChatInput onSend={handleSend} disabled={loading} placeholder="Describe your urgent concern..." />
              </div>
            )}

            {status === 'active' && (
              <ChatWindow messages={messages} loading={messagesLoading} onSendMessage={handleSend}
                error={Boolean(messagesError)} onRetry={() => void refetchMessages()} />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
