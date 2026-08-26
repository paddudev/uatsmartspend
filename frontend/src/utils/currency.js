const inrWhole = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const inrPrecise = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export function formatINR(amount, { precise = false } = {}) {
  const value = Number(amount) || 0;
  return precise ? inrPrecise.format(value) : inrWhole.format(value);
}
