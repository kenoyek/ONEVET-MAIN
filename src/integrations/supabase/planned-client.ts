import type { SupabaseClient } from '@supabase/supabase-js';
import type { PlannedDatabase } from './planned-types';

export class ModuleUnavailableError extends Error {
  constructor() { super('This module is not deployed. No request was sent to the database.'); this.name = 'ModuleUnavailableError'; }
}
const unavailable = (): never => { throw new ModuleUnavailableError(); };
/** Compile-check unreleased services against their blueprint without querying main.
 * Activation requires a reviewed schema deployment and a real authenticated adapter.
 * Feature flags alone cannot bypass this boundary. It never returns mock data.
 */
export const plannedSupabase: Pick<SupabaseClient<PlannedDatabase>, 'from' | 'rpc'> = {
  from: unavailable,
  rpc: unavailable,
};

export const plannedModulesAvailable = false;
