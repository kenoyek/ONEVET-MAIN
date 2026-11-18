/** Format check only: this does not verify ownership or whether a number is reachable. */
export function validContactPhone(value: string | null | undefined): boolean {
  const phone = value?.trim() ?? '';
  if (!phone || phone.length > 40 || !/^\+?[0-9 ().-]+$/.test(phone)) return false;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}
