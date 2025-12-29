export function getPreferredLanguage() {
    let defaultLocale = 'en-US';
    if (typeof window !== 'undefined'){
        return (navigator.languages[0] || navigator.language || navigator.browserLanguage || navigator.systemLanguage || navigator.userLanguage || import.meta.env.VITE_LOCALE)
    }
    return import.meta.env.VITE_LOCALE || defaultLocale;
}

export const formatCurrency = (value, currency = 'DZD') => {
    const number = typeof value === 'number' ? value : parseFloat(value);
    if (!Number.isFinite(number)) return '-';
    if (currency){
      return new Intl.NumberFormat(getPreferredLanguage(), { style: 'currency', currency }).format(number);
    }
    return new Intl.NumberFormat(getPreferredLanguage(), { style: 'decimal' }).format(number);
};

export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(getPreferredLanguage(), {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

export const formatDateForInput = (dateString = null) => {
  const date = dateString ? new Date(dateString) : new Date();
  // Adjust for timezone offset to prevent off-by-one-day errors
  const offset = date.getTimezoneOffset();
  const adjustedDate = new Date(date.getTime() - (offset*60*1000));
  return adjustedDate.toISOString().split('T')[0];
};


/**
 * Calculates the duration in months between two dates.
 * 
 * @param {string|Date} startDate The start date of the period.
 * @param {string|Date} endDate The end date of the period.
 * @returns {number} The duration in months.
 */
export function getContractDurationInMonths(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    let months = (end.getFullYear() - start.getFullYear()) * 12;
    months -= start.getMonth();
    months += end.getMonth();

    // Adjust if the end day is less than the start day
    if (end.getDate() < start.getDate()) {
        months--;
    }
    
    // Ensure minimum of 1 month if start <= end
    return months <= 0 ? 1 : months;
}
