/**
 * Format date to simple format: YYYY M D
 * Example: 2026 2 19
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 0-indexed
  const day = d.getDate();
  
  return `${year} ${month} ${day}`;
}

/**
 * Format date with time: YYYY M D HH:MM
 * Example: 2026 2 19 14:30
 */
export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${year} ${month} ${day} ${hours}:${minutes}`;
}
