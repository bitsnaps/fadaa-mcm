export function getPreferredLanguage() {
    let defaultLocale = 'en-US';
    if (typeof window !== 'undefined'){
        return (navigator.languages[0] || navigator.language || navigator.browserLanguage || navigator.systemLanguage || navigator.userLanguage || import.meta.env.VITE_LOCALE)
    }
    return import.meta.env.VITE_LOCALE || defaultLocale;
}

export const formatCurrency = (value) => {
    if (typeof value !== 'number') return '-';
    return new Intl.NumberFormat(getPreferredLanguage(), { style: 'currency', currency: 'DZD' }).format(value);
  };