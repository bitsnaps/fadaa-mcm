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

module.exports = {
    getContractDurationInMonths
};