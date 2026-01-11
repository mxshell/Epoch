const DATE_PREFIX_REGEX = /^\s*(\d{4})-(\d{1,2})-(\d{1,2})/;

/**
 * Formats a Date object to YYYY-MM-DD string (local timezone).
 */
export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Normalizes a date string into YYYY-MM-DD (local date).
 * Accepts ISO-like strings or loose YYYY-M-D formats.
 */
export const normalizeDateString = (value: string): string => {
  if (!value) return "";
  const trimmed = value.trim();
  const prefixMatch = trimmed.match(DATE_PREFIX_REGEX);
  if (prefixMatch) {
    const [, year, month, day] = prefixMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const numeric = Number(trimmed);
  if (!Number.isNaN(numeric)) {
    return formatDate(new Date(numeric));
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return formatDate(parsed);
  }

  return "";
};

/**
 * Parses a YYYY-MM-DD string into a Date object (local midnight).
 */
export const parseDate = (dateStr: string): Date => {
  // Parse as local time by splitting the string
  // new Date("YYYY-MM-DD") treats the string as UTC, causing timezone issues
  const normalized = normalizeDateString(dateStr);
  if (!normalized) {
    return new Date(NaN);
  }
  const [year, month, day] = normalized.split("-").map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Formats a Date object to YYYY-MM-DD HH:mm string (local timezone).
 */
export const formatDateTime = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

/**
 * Calculates the number of days between two dates.
 */
export const getDaysDiff = (start: Date, end: Date): number => {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round((end.getTime() - start.getTime()) / oneDay);
};

/**
 * Adds days to a date and returns a new Date object.
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Adds hours to a date.
 */
export const addHours = (date: Date, hours: number): Date => {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
};

/**
 * Adds months to a date.
 */
export const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

/**
 * Adds years to a date.
 */
export const addYears = (date: Date, years: number): Date => {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
};

/**
 * Returns the start of the year for a given date.
 */
export const startOfYear = (date: Date): Date => {
  return new Date(date.getFullYear(), 0, 1);
};

/**
 * Returns the start of the month for a given date.
 */
export const startOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

/**
 * Returns the start of the day (00:00) for a given date.
 */
export const startOfDay = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

/**
 * Gets the month name and year.
 */
export const getMonthYear = (date: Date): string => {
  return date.toLocaleString('default', { month: 'short', year: 'numeric' });
};

/**
 * Ensures a date string is valid.
 */
export const isValidDate = (d: any): boolean => {
  return d instanceof Date && !isNaN(d.getTime());
};
