import { useCallback, useEffect, useRef, useState } from 'react';
import { readArticleDraft, writeArticleDraft, type ArticleBrowserDraft } from '@/lib/article-browser-draft';

export function useArticleBrowserDraft({ storageKey, serializedValues, dirty, paused }: {
  storageKey: string | null; serializedValues: string; dirty: boolean; paused: boolean;
}) {
  const [recovery, setRecovery] = useState<ArticleBrowserDraft | null>(null);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<'idle' | 'pending' | 'saved' | 'unavailable'>('idle');
  const cleared = useRef(false);
  const flush = useRef<() => boolean>(() => true);

  // Existing articles must finish loading before examining their browser backup.
  useEffect(() => {
    if (ready || !storageKey || paused) return;
    try { setRecovery(readArticleDraft(localStorage, storageKey)); }
    catch { setStatus('unavailable'); }
    setReady(true);
  }, [ready, storageKey, paused]);

  useEffect(() => {
    const active = !!storageKey && ready && dirty && !paused && !recovery && !cleared.current;
    let saved = false;
    const persist = () => {
      if (!active || saved || cleared.current) return true;
      try {
        writeArticleDraft(localStorage, storageKey!, JSON.parse(serializedValues));
        saved = true;
        setStatus('saved');
        return true;
      } catch { setStatus('unavailable'); return false; }
    };
    flush.current = persist;
    if (storageKey && ready && !dirty && !paused && !recovery && !cleared.current) {
      try { localStorage.removeItem(storageKey); setStatus(current => current === 'unavailable' ? current : 'idle'); }
      catch { setStatus('unavailable'); }
    }
    if (!active) return;
    setStatus('pending');
    const timer = window.setTimeout(persist, 700);
    const onPageHide = () => { persist(); };
    const onVisibility = () => { if (document.visibilityState === 'hidden') persist(); };
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!persist()) { event.preventDefault(); event.returnValue = ''; }
    };
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [storageKey, serializedValues, dirty, paused, ready, recovery]);

  useEffect(() => () => { flush.current(); }, []);

  const clear = useCallback(() => {
    cleared.current = true;
    flush.current = () => true;
    try { if (storageKey) localStorage.removeItem(storageKey); }
    catch { setStatus('unavailable'); }
  }, [storageKey]);
  const dismissRecovery = useCallback(() => {
    try { if (storageKey) localStorage.removeItem(storageKey); }
    catch { setStatus('unavailable'); }
    setRecovery(null);
  }, [storageKey]);

  return { recovery, status, clear, dismissRecovery };
}
