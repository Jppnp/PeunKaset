// Utility function to format numbers with commas
export function formatNumber(num) {
  const numericValue = Number(num);
  if (isNaN(numericValue)) return '0';
  return numericValue.toLocaleString('en-US');
}

// Utility function to format currency with commas
export function formatCurrency(amount) {
  const numericValue = Number(amount);
  if (isNaN(numericValue)) return '0.00';
  return numericValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}