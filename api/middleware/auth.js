const jwt = require('jsonwebtoken');
const models = require('../models');

const authMiddleware = async (c, next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ success: false, message: 'Unauthorized' }, 401);
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await models.User.findByPk(decoded.id, {
            include: [{ model: models.Role, as: 'role' }]
        });

        if (!user) {
            return c.json({ success: false, message: 'Unauthorized' }, 401);
        }

        const userJSON = user.toJSON();
        userJSON.role = user.role ? user.role.name.toLowerCase() : null;
        userJSON.isAdmin = () => userJSON.role === 'admin';
        
        c.set('user', userJSON);
        await next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return c.json({ success: false, message: 'Invalid token' }, 401);
    }
};

const adminMiddleware = async (c, next) => {
    try {
        const user = c.get('user');
        if (!user || !user.role_id) {
            return c.json({ success: false, message: 'Forbidden' }, 403);
        }

        const role = await models.Role.findOne({ where: { id: user.role_id } });

        if (!role || role.name.toLowerCase() !== 'admin') {
            return c.json({ success: false, message: 'Forbidden, admins only' }, 403);
        }
        await next();
    } catch (error) {
        return c.json({ success: false, message: 'An error occurred during authorization' }, 500);
    }
};

const adminOrInvestorMiddleware = async (c, next) => {
    try {
        const user = c.get('user');
        if (!user || !user.role_id) {
            return c.json({ success: false, message: 'Forbidden' }, 403);
        }

        const role = await models.Role.findOne({ where: { id: user.role_id } });

        if (!role || !['admin', 'investor'].includes(role.name.toLowerCase())) {
            return c.json({ success: false, message: 'Forbidden, admins or investors only' }, 403);
        }
        await next();
    } catch (error) {
        return c.json({ success: false, message: 'An error occurred during authorization' }, 500);
    }
};

const adminOrAssistantMiddleware = async (c, next) => {
    try {
        const user = c.get('user');
        if (!user || !user.role_id) {
            return c.json({ success: false, message: 'Forbidden' }, 403);
        }

        const role = await models.Role.findOne({ where: { id: user.role_id } });

        if (!role || !['admin', 'assistant'].includes(role.name.toLowerCase())) {
            return c.json({ success: false, message: 'Forbidden, admins or assistants only' }, 403);
        }
        await next();
    } catch (error) {
        return c.json({ success: false, message: 'An error occurred during authorization' }, 500);
    }
};

// Investor-only middleware
const investorMiddleware = async (c, next) => {
    try {
        const user = c.get('user');
        if (!user || !user.role_id) {
            return c.json({ success: false, message: 'Forbidden' }, 403);
        }

        const role = await models.Role.findOne({ where: { id: user.role_id } });

        if (!role || role.name.toLowerCase() !== 'investor') {
            return c.json({ success: false, message: 'Forbidden, investors only' }, 403);
        }
        await next();
    } catch (error) {
        return c.json({ success: false, message: 'An error occurred during authorization' }, 500);
    }
};

module.exports = {
    authMiddleware,
    adminMiddleware,
    adminOrAssistantMiddleware,
    adminOrInvestorMiddleware,
    investorMiddleware
};