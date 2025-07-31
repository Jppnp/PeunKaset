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

// Utility function to get today's date in YYYY-MM-DD format
export function getTodayDate() {
  try {
    // Create a new Date object for the current moment
    const now = new Date();
    
    // Handle timezone considerations by using local date components
    // This ensures we get the correct "today" based on the user's local timezone
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // getMonth() returns 0-11
    const day = String(now.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    // Error handling for date formatting edge cases
    console.error('Error formatting today\'s date:', error);
    
    // Fallback: try alternative approach
    try {
      const fallbackDate = new Date();
      return fallbackDate.toISOString().split('T')[0];
    } catch (fallbackError) {
      console.error('Fallback date formatting also failed:', fallbackError);
      
      // Last resort: return a reasonable default (current date manually constructed)
      const safeDate = new Date();
      const safeYear = safeDate.getFullYear() || new Date().getFullYear();
      const safeMonth = String((safeDate.getMonth() + 1) || 1).padStart(2, '0');
      const safeDay = String(safeDate.getDate() || 1).padStart(2, '0');
      
      return `${safeYear}-${safeMonth}-${safeDay}`;
    }
  }
}