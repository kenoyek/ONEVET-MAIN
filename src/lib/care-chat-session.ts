const storageKey = 'onevet-care-chat';
const readKey = 'onevet-care-chat-last-reply';
const guestKeyPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function getCareChatKey() {
  try {
    const key = sessionStorage.getItem(storageKey);
    return key && guestKeyPattern.test(key) ? key : null;
  } catch {
    return null;
  }
}

export function rememberCareChatKey(key: string) {
  try {
    if (getCareChatKey() !== key) sessionStorage.removeItem(readKey);
    sessionStorage.setItem(storageKey, key);
  } catch {
    // Chat can still work in memory when browser storage is unavailable.
  }
}

export function lastViewedCareChatReply(key: string) {
  try {
    if (getCareChatKey() !== key) return 0;
    const value = Number(sessionStorage.getItem(readKey));
    return Number.isSafeInteger(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

export function markCareChatReplyViewed(key: string, id: number) {
  try {
    if (getCareChatKey() === key && Number.isSafeInteger(id) && id > lastViewedCareChatReply(key)) {
      sessionStorage.setItem(readKey, String(id));
    }
  } catch {
    // Reply alerts depend on browser storage being available.
  }
}
