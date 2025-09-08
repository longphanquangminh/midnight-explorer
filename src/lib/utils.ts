/**
 * Utility functions for Midnight Explorer
 */

/**
 * Formats a date to a human-friendly relative time string
 * Returns values like '2m', '3h', '1d' ago
 * 
 * @param date The date to format
 * @returns A human-friendly relative time string
 */
export function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  // Convert to seconds
  const diffSec = Math.floor(diffMs / 1000);
  
  // Less than a minute
  if (diffSec < 60) {
    return diffSec < 10 ? 'just now' : `${diffSec}s`;
  }
  
  // Less than an hour
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return `${diffMin}m`;
  }
  
  // Less than a day
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) {
    return `${diffHour}h`;
  }
  
  // Less than a week
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) {
    return `${diffDay}d`;
  }
  
  // Less than a month (approximated as 30 days)
  const diffWeek = Math.floor(diffDay / 7);
  if (diffDay < 30) {
    return `${diffWeek}w`;
  }
  
  // Months and years
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) {
    return `${diffMonth}mo`;
  }
  
  // Years
  const diffYear = Math.floor(diffMonth / 12);
  return `${diffYear}y`;
}
