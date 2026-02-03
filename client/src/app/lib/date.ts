const IST_TIMEZONE = 'Asia/Kolkata';

const toDate = (value: string | number | Date) => {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatParts = (date: Date, options: Intl.DateTimeFormatOptions) => {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: IST_TIMEZONE,
    ...options
  });
  return formatter.formatToParts(date);
};

/**
 * Get current timestamp in IST as ISO string with +05:30 offset.
 * Use this for optimistic updates in stores to match server-side timestamps.
 */
export const getISTTimestamp = (): string => {
  const date = new Date();
  const year = date.toLocaleString('en-US', { timeZone: IST_TIMEZONE, year: 'numeric' });
  const month = date.toLocaleString('en-US', { timeZone: IST_TIMEZONE, month: '2-digit' });
  const day = date.toLocaleString('en-US', { timeZone: IST_TIMEZONE, day: '2-digit' });
  const hour = date.toLocaleString('en-US', { timeZone: IST_TIMEZONE, hour: '2-digit', hour12: false });
  const minute = date.toLocaleString('en-US', { timeZone: IST_TIMEZONE, minute: '2-digit' });
  const second = date.toLocaleString('en-US', { timeZone: IST_TIMEZONE, second: '2-digit' });
  
  return `${year}-${month}-${day}T${hour}:${minute}:${second}+05:30`;
};

export const formatDate = (value: string | number | Date) => {
  const date = toDate(value);
  if (!date) return 'N/A';
  const parts = formatParts(date, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const day = parts.find((part) => part.type === 'day')?.value ?? '00';
  const month = parts.find((part) => part.type === 'month')?.value ?? '00';
  const year = parts.find((part) => part.type === 'year')?.value ?? '0000';
  return `${day}/${month}/${year}`;
};

export const formatDateTime = (value: string | number | Date) => {
  const date = toDate(value);
  if (!date) return 'N/A';
  const parts = formatParts(date, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const day = parts.find((part) => part.type === 'day')?.value ?? '00';
  const month = parts.find((part) => part.type === 'month')?.value ?? '00';
  const year = parts.find((part) => part.type === 'year')?.value ?? '0000';
  const hour = parts.find((part) => part.type === 'hour')?.value ?? '00';
  const minute = parts.find((part) => part.type === 'minute')?.value ?? '00';
  return `${day}/${month}/${year} ${hour}:${minute}`;
};

export const formatMonthYear = (value: string | number | Date) => {
  const date = toDate(value);
  if (!date) return 'N/A';
  const parts = formatParts(date, {
    month: '2-digit',
    year: 'numeric'
  });
  const month = parts.find((part) => part.type === 'month')?.value ?? '00';
  const year = parts.find((part) => part.type === 'year')?.value ?? '0000';
  return `${month}/${year}`;
};
