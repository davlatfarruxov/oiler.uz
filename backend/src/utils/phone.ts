/** Telefonni qidiruv / saqlash uchun bir xil format (+998...) */
export function normalizePhone(raw: string): string {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('998') && digits.length >= 12) {
    return `+${digits.slice(0, 12)}`;
  }
  if (digits.length === 9 && digits.startsWith('9')) {
    return `+998${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('998')) {
    return `+${digits}`;
  }
  if (digits.startsWith('0') && digits.length >= 9) {
    return `+998${digits.replace(/^0+/, '')}`;
  }
  return digits.startsWith('+') ? `+${digits.replace(/^\+/, '')}` : `+${digits}`;
}
