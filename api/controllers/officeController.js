const { Op } = require('sequelize');
const models = require('../models');

const getOffices = async (c) => {
    try {
        const { page = 1, limit = 10, search = '', profile_id } = c.req.query();
        const branchId = c.get('user').isAdmin()?null:(c.req.query('branchId') || c.req.branch_id || c.get('user')['branch_id']);
        const offset = (page - 1) * limit;

        const whereClause = search ? {
            [Op.or]: [
                { name: { [Op.like]: `%${search}%` } },
                { '$branch.name$': { [Op.like]: `%${search}%` } },
                { status: { [Op.like]: `%${search}%` } }
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
            limit: parseInt(limit),
            offset: parseInt(offset),
        });

        return c.json({
            success: true,
            data: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit),
            }
        });
    } catch (error) {
        console.error('Error fetching offices:', error);
        return c.json({ success: false, message: 'Failed to fetch offices' }, 500);
    }
};

module.exports = {
    getOffices,
};