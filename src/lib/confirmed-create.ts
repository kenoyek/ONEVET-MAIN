type Result<T> = { data:T|null; error:unknown };
export async function confirmedCreate<T extends Record<string,unknown>>(result:Result<T>, recover:()=>PromiseLike<Result<T>>, expected:Record<string,unknown>):Promise<T> {
  let saved=result;
  if(saved.error && typeof saved.error==='object' && 'code' in saved.error && saved.error.code==='23505') {
    const original=saved.error;
    saved=await recover();
    if(saved.error||!saved.data)throw original;
    if(Object.entries(expected).some(([key,value])=>saved.data![key]!==value))throw new Error('This record was already saved with different details. Close this form and refresh your records to review it before adding another entry.');
  }
  if(saved.error)throw saved.error;
  if(!saved.data?.id)throw new Error('The save could not be confirmed. Keep your entries and try again.');
  return saved.data;
}
export function farmSaveError(cause:unknown) {
  if(cause instanceof Error && cause.message.startsWith('This record was already saved'))return cause.message;
  return 'We couldn’t confirm this save. Your entries are still here. Check your connection and try again.';
}
