/**
 * Parses a YYYY-MM-DD string into a Date object (UTC midnight).
 */
export const parseDate = (dateStr: string): Date => {
  return new Date(dateStr);
};

/**
 * Formats a Date object to YYYY-MM-DD string.
 */
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Formats a Date object to YYYY-MM-DD HH:mm string.
 */
export const formatDateTime = (date: Date): string => {
  return date.toISOString().replace('T', ' ').substring(0, 16);
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