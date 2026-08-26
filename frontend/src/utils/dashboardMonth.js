const MONTH_LABEL = new Intl.DateTimeFormat("en-US", { month: "short" });
const MONTH_LABEL_LONG = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });

export function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date, delta) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

export function daysInMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLongLabel(date) {
  return MONTH_LABEL_LONG.format(date);
}

export function monthDateRangeLabel(date) {
  const last = daysInMonth(date);
  const short = MONTH_LABEL.format(date);
  return `${short} 1 - ${short} ${last}`;
}

// transaction_date values are "YYYY-MM-DD" strings; comparing the "YYYY-MM"
// prefix avoids timezone drift from parsing them as Date objects.
export function isInMonth(isoDateString, date) {
  return typeof isoDateString === "string" && isoDateString.startsWith(monthKey(date));
}

export function dayOfMonth(isoDateString) {
  return Number(isoDateString.slice(8, 10));
}
