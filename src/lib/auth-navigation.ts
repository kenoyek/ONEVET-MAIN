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
    path.includes('\\') || path.includes('?') || path.includes('#') || Array.from(path).some(c=>c.charCodeAt(0)<=32||c.charCodeAt(0)===127) ||
    /^\/auth(?:\/|$)/i.test(path)
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

/** Database-verified roles may arrive in any order; portal priority is stable. */
export function primaryAccountRole<T extends string>(roles:readonly T[]):T|null{
 return roles.find(role=>role==='admin')??roles.find(role=>role==='veterinarian')??roles[0]??null;
}
export function getAccountHome(role:string|null|undefined,roles:readonly string[]=[]):'/admin'|'/vet-dashboard'|'/dashboard'{
 if(role==='admin'||roles.includes('admin'))return '/admin';
 if(role==='veterinarian'||roles.includes('veterinarian'))return '/vet-dashboard';
 return '/dashboard';
}
