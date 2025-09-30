const { Op } = require('sequelize');
const models = require('../models');

const getOffices = async (c) => {
    try {
        const { page = 1, pageSize = 10, q = '', profile_id } = c.req.query();
        const branchId = c.get('user').isAdmin()?null:(c.req.query('branchId') || c.req.branch_id || c.get('user')['branch_id']);
        const offset = (page - 1) * pageSize;

        const whereClause = q ? {
            [Op.or]: [
                { name: { [Op.like]: `%${q}%` } },
                { '$branch.name$': { [Op.like]: `%${q}%` } },
                { status: { [Op.like]: `%${q}%` } }
            ]
        } : {};

        if (branchId) {
            whereClause.branch_id = branchId;
        }

        const includeClause = [{ model: models.Branch, as: 'branch' }];

        if (profile_id) {
            includeClause.push({
                model: models.Contract,
                where: { profile_id },
                required: true,
                attributes: [] // We only need the join for filtering
            });
        }

        const { count, rows } = await models.Office.findAndCountAll({
            where: whereClause,
            include: includeClause,
            order: [['name', 'ASC']],
            limit: parseInt(pageSize),
            offset: parseInt(offset),
        });

        return c.json({
            success: true,
            items: rows,
            total: count,
        });
    } catch (error) {
        console.error('Error fetching offices:', error);
        return c.json({ success: false, message: 'Failed to fetch offices' }, 500);
    }
};

module.exports = {
    getOffices,
};