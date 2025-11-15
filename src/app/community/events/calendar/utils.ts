import { startOfMonth, parse, isValid } from "date-fns";

/**
 * Parse a month string (YYYY-MM format) into a Date object
 * Falls back to current month if invalid
 */
export function parseMonthParam(monthParam?: string): Date {
  if (!monthParam) {
    return startOfMonth(new Date());
  }

  const parsed = parse(monthParam, "yyyy-MM", new Date());
  if (!isValid(parsed)) {
    return startOfMonth(new Date());
  }

  return parsed;
}