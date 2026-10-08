import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date to Egypt format (dd/mm/yyyy)
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
}

// Format date with time to Egypt format (dd/mm/yyyy HH:mm)
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

// Parse dd/mm/yyyy string to ISO date string (yyyy-mm-dd)
export function parseDateInput(dateStr: string): string {
  if (!dateStr) return '';

  // If already in ISO format (yyyy-mm-dd), return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  // Parse dd/mm/yyyy format
  const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  return '';
}

// Parse dd/mm/yyyy or ISO date string to ISO datetime string for API
export function parseDateToISO(dateStr: string): string {
  if (!dateStr) return '';

  let year: number, month: number, day: number;

  // Check if ISO format (yyyy-mm-dd)
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    year = parseInt(isoMatch[1], 10);
    month = parseInt(isoMatch[2], 10) - 1; // JS months are 0-indexed
    day = parseInt(isoMatch[3], 10);
  } else {
    // Parse dd/mm/yyyy format
    const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!match) return '';
    day = parseInt(match[1], 10);
    month = parseInt(match[2], 10) - 1; // JS months are 0-indexed
    year = parseInt(match[3], 10);
  }

  // Create date at noon to avoid timezone issues
  const date = new Date(year, month, day, 12, 0, 0);
  if (isNaN(date.getTime())) return '';

  return date.toISOString();
}

// Format ISO date string (yyyy-mm-dd) or Date to dd/mm/yyyy for input display
export function formatDateForInput(date: string | Date | null | undefined): string {
  if (!date) return '';

  // If it's a string in dd/mm/yyyy format, return as is
  if (typeof date === 'string' && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(date)) {
    return date;
  }

  // If it's an ISO date string (yyyy-mm-dd), parse directly to avoid timezone issues
  if (typeof date === 'string') {
    const isoMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      return `${day}/${month}/${year}`;
    }
  }

  // For Date objects, use UTC methods to avoid timezone shifts
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';

  // Use UTC to avoid timezone issues
  const day = d.getUTCDate().toString().padStart(2, '0');
  const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
  const year = d.getUTCFullYear();

  return `${day}/${month}/${year}`;
}
