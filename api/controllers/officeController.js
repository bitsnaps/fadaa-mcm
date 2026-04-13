const { Op, Sequelize } = require('sequelize');
const models = require('../models');

const getOffices = async (c) => {
    try {
        const { page, pageSize, q, profile_id, limit, search } = c.req.query();
        const isSmartSelect = page && pageSize;
        const pageNumber = parseInt(page) || 1;
        const limitNumber = parseInt(pageSize || limit) || 10;
        const searchQuery = q || search || '';
        const offset = (pageNumber - 1) * limitNumber;

        const branchId = c.get('user').isAdmin()?null:(c.req.query('branchId') || c.req.branch_id || c.get('user')['branch_id']);

        const whereClause = searchQuery ? {
            [Op.or]: [
                { '$Office.name$': { [Op.like]: `%${searchQuery}%` } },
                // { name: { [Op.like]: `%${searchQuery}%` } },
                // { status: { [Op.like]: `%${searchQuery}%` } },
                // { area: { [Op.like]: `%${searchQuery}%` } }
            ]
        } : {};

        if (branchId) {
            whereClause.branch_id = branchId;
        }

        const includeClause = [{ model: models.Branch, as: 'branch' }];

        // Cause conflict when searching by office's name, because it seems that it includes search by branch's name
        /*if (searchQuery) {
            // Add branch name search using a nested WHERE condition on the include
            includeClause[0].where = {
                name: { [Op.like]: `%${searchQuery}%` }
            };
        }*/

        if (profile_id) {
            // Use LEFT JOIN to include offices even if they have no contracts for this profile
            // This shows all offices for the admin to manage
            includeClause.push({
                model: models.Contract,
                where: { profile_id },
                required: false, // Changed from true to false - LEFT JOIN instead of INNER JOIN
                attributes: [] // We only need the join for filtering
            });
        }

        const { count, rows } = await models.Office.findAndCountAll({
            where: whereClause,
            include: includeClause,
            order: [['name', 'ASC']],
            limit: limitNumber,
            offset: offset,
        });

        if (isSmartSelect) {
            return c.json({
                success: true,
                items: rows,
                total: count,
            });
        } else {
            return c.json({
                success: true,
                data: rows,
                pagination: {
                    total: count,
                    page: pageNumber,
                    limit: limitNumber,
                    totalPages: Math.ceil(count / limitNumber),
                }
            });
        }
    } catch (error) {
        console.error('Error fetching offices:', error);
        return c.json({ success: false, message: 'Failed to fetch offices' }, 500);
    }
};

module.exports = {
    getOffices,
};