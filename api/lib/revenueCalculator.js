const { Op } = require('sequelize');
const models = require('../models');
const { calculateServiceRevenue } = require('./calculations');

/**
 * Calculates the total revenue from client services based on specified criteria.
 *
 * @param {object} options - The options for calculation.
 * @param {Date} [options.startDate] - The start date of the period.
 * @param {Date} [options.endDate] - The end date of the period.
 * @param {number} [options.profile_id] - The ID of the profile to filter by.
 * @param {boolean} [options.withTaxes=false] - Whether to include company-borne taxes in the revenue.
 * @returns {Promise<number>} The calculated total services revenue.
 */
async function calculateServiceRevenueExlcTax({ startDate, endDate, profile_id, withTaxes = false }) {
    const where = {};
    if (startDate && endDate) {
        where.transaction_date = { [Op.between]: [startDate, endDate] };
    }
    if (profile_id) {
        where.profile_id = profile_id;
    }

    const clientServices = await models.ClientService.findAll({
        where,
        include: [{ model: models.Tax, attributes: ['rate', 'bearer'] }]
    });

    const totalRevenue = calculateServiceRevenue({ clientServices, withTaxes });
    return totalRevenue;
}

module.exports = {
  calculateServiceRevenueExlcTax,
};