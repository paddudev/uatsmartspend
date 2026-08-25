function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
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
