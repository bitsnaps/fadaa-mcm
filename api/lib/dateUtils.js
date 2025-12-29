/**
 * Calculates the duration in months between two dates.
 * 
 * @param {string|Date} startDate The start date of the period.
 * @param {string|Date} endDate The end date of the period.
 * @returns {number} The duration in months.
 */
function getContractDurationInMonths(startDate, endDate) {
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


module.exports = {
    getContractDurationInMonths
};