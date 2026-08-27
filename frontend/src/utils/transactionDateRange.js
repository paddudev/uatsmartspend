// Formats using local date parts, not toISOString() (which converts to UTC
// and shifts the calendar day back for any positive UTC-offset timezone,
// e.g. IST) — this app's users are in India, so that bug is real, not
// theoretical.
export function toIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Mirrors the backend's months_ago(): a transaction date must be within the
// last 3 calendar months and not in the future.
export function getTransactionDateRange() {
  const today = new Date();
  const max = toIsoDate(today);

  const min = new Date(today);
  min.setMonth(min.getMonth() - 3);

  return { min: toIsoDate(min), max };
}

// Given a "YYYY-MM-DD" from-date, returns the latest "YYYY-MM-DD" to-date
// that keeps the range within `months` calendar months (mirrors the
// backend's months_ago check for report date-range filters).
export function maxToDateForRange(fromDateString, months) {
  const from = new Date(`${fromDateString}T00:00:00`);
  from.setMonth(from.getMonth() + months);
  return toIsoDate(from);
}
