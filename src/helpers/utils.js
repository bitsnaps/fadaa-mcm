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

    // European method (30/360):
    // Set day to 30 if it is 31
    const startDay = Math.min(start.getDate(), 30);
    const endDay = Math.min(end.getDate(), 30);
    
    const startMonth = start.getMonth();
    const endMonth = end.getMonth();
    
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();

    const days360 = (endYear - startYear) * 360 + 
                    (endMonth - startMonth) * 30 + 
                    (endDay - startDay);

    const months = Math.round(days360 / 30);

    return months <= 0 ? 1 : months;
}
