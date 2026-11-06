/** Only accept an internal route recorded by our protected-route guard. */
export function getAuthReturnPath(state: unknown): string | null {
  if (!state || typeof state !== 'object' || !('from' in state)) return null;
  const from = state.from;
  if (!from || typeof from !== 'object' || !('pathname' in from)) return null;
  const path = from.pathname;
  if (
    typeof path !== 'string' ||
    !path.startsWith('/') ||
    path.startsWith('//') ||
    path.includes('\\') ||
    /^\/auth(?:\/|$)/.test(path)
  )
    return null;
  const search =
    'search' in from &&
    typeof from.search === 'string' &&
    from.search.startsWith('?')
      ? from.search
      : '';
  const hash =
    'hash' in from && typeof from.hash === 'string' && from.hash.startsWith('#')
      ? from.hash
      : '';
  return path + search + hash;
}
