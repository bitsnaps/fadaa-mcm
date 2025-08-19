const { Hono } = require('hono');
const jwt = require('jsonwebtoken');
const models = require('../models');
const { hashPassword, verifyPassword } = require('../lib/auth');
const { authMiddleware } = require('../middleware/auth');
const { uploadMiddleware } = require('../middleware/upload');
const { handleRouteError } = require('../lib/errorHandler');

const userApp = new Hono();

// Get all users
userApp.get('/', authMiddleware, async (c) => {
    try {
        const users = await models.User.findAll({
            include: [
                { model: models.Role, as: 'role' },
                { model: models.Branch, as: 'branch' }
            ],
            order: [['created_at', 'DESC']]
        });
        return c.json({ success: true, data: users });
    } catch (error) {
        console.error('Error fetching users:', error);
        return c.json({ success: false, message: 'Failed to fetch users' }, 500);
    }
});

// Get users by role
userApp.get('/role/:roleName', authMiddleware, async (c) => {
    const { roleName } = c.req.param();
    try {
        const users = await models.User.findAll({
            include: [
                {
                    model: models.Role,
                    as: 'role',
                    where: { name: roleName }
                },
                { model: models.Branch, as: 'branch' }
            ],
            order: [['created_at', 'DESC']]
        });
        return c.json({ success: true, data: users });
    } catch (error) {
        console.error(`Error fetching users with role ${roleName}:`, error);
        return c.json({ success: false, message: 'Failed to fetch users' }, 500);
    }
});

// Get a single user by ID
userApp.get('/:id', authMiddleware, async (c) => {
    const { id } = c.req.param();
    try {
        const user = await models.User.findByPk(id, {
            include: [
                { model: models.Role, as: 'role' },
                { model: models.Branch, as: 'branch' }
            ]
        });
        if (!user) {
            return c.json({ success: false, message: 'User not found' }, 404);
        }
        return c.json({ success: true, data: user });
    } catch (error) {
        return handleRouteError(c, `Error fetching user ${id}`, error);
    }
});

userApp.post('/', authMiddleware, async (c) => {
    try {
        const { first_name, last_name, email, password, role_id, branch_id, is_active, preferences } = await c.req.json();

        if (!email || !password || !first_name || !last_name || !role_id) {
            return c.json({ success: false, message: 'Missing required fields' }, 400);
        }

        const existingUser = await models.User.findOne({ where: { email } });
        if (existingUser) {
            return c.json({ success: false, message: 'User already exists' }, 409);
        }

        const newUser = await models.User.create({
            first_name,
            last_name,
            email,
            password_hash: hashPassword(password),
            role_id,
            branch_id,
            is_active,
            preferences
        });

        console.log('User created:', email);
        return c.json({ success: true, message: 'User created successfully', userId: newUser.id });
    } catch (error) {
        console.error('User creation error:', error);
        return c.json({ success: false, message: 'An error occurred during user creation' }, 500);
    }
});

// Update a user
userApp.put('/:id', authMiddleware, async (c) => {
    const { id } = c.req.param();
    try {
        const { first_name, last_name, email, phone, role_id, branch_id, is_active } = await c.req.json();

        const user = await models.User.findByPk(id);
        if (!user) {
            return c.json({ success: false, message: 'User not found' }, 404);
        }

        await user.update({
            first_name,
            last_name,
            email,
            phone,
            role_id,
            branch_id,
            is_active
        });

        return c.json({ success: true, message: 'User updated successfully' });
    } catch (error) {
        return handleRouteError(c, `Error updating user ${id}`, error);
    }
});

// Update user profile
userApp.put('/profile/:id', authMiddleware, async (c) => {
    const { id } = c.req.param();
    try {
        const { first_name, last_name, phone } = await c.req.json();

        const user = await models.User.findByPk(id);
        if (!user) {
            return c.json({ success: false, message: 'User not found' }, 404);
        }

        await user.update({
            first_name,
            last_name,
            phone,
        });

        return c.json({ success: true, message: 'User profile updated successfully' });
    } catch (error) {
        return handleRouteError(c, `Error updating user profile ${id}`, error);
    }
});

// Change password
userApp.post('/change-password/:id', authMiddleware, async (c) => {
    const { id } = c.req.param();
    try {
        const { currentPassword, newPassword } = await c.req.json();
        
        const user = await models.User.findByPk(id);
        if (!user) {
            return c.json({ success: false, message: 'User not found' }, 404);
        }

        if (!verifyPassword(currentPassword, user.password_hash)) {
            return c.json({ success: false, message: 'Invalid current password' }, 400);
        }

        await user.update({
            password_hash: hashPassword(newPassword),
        });

        return c.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        return handleRouteError(c, `Error changing password for user ${id}`, error);
    }
});

// Upload profile picture
userApp.post('/profile-picture/:id', authMiddleware, uploadMiddleware('avatars', 'profile_picture'), async (c) => {
    const { id } = c.req.param();
    const filePath = c.req.filePath;

    try {
        const user = await models.User.findByPk(id);
        if (!user) {
            return c.json({ success: false, message: 'User not found' }, 404);
        }

        await user.update({ profile_picture: filePath });

        return c.json({ success: true, message: 'Profile picture uploaded successfully', filePath });
    } catch (error) {
        return handleRouteError(c, `Error updating profile picture for user ${id}`, error);
    }
});

// Delete a user
userApp.delete('/:id', authMiddleware, async (c) => {
    const { id } = c.req.param();
    try {
        const user = await models.User.findByPk(id);
        if (!user) {
            return c.json({ success: false, message: 'User not found' }, 404);
        }

        await user.destroy();
        return c.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        return handleRouteError(c, `Error deleting user ${id}`, error);
    }
});
// Get available roles
userApp.get('/data/roles', authMiddleware, async (c) => {
    try {
        const roles = await models.Role.findAll({ order: [['name', 'ASC']] });
        return c.json({ success: true, data: roles });
    } catch (error) {
        console.error('Error fetching roles:', error);
        return c.json({ success: false, message: 'Failed to fetch roles' }, 500);
    }
});

// Get available branches
userApp.get('/data/branches', authMiddleware, async (c) => {
    try {
        const branches = await models.Branch.findAll({ order: [['name', 'ASC']] });
        return c.json({ success: true, data: branches });
    } catch (error) {
        console.error('Error fetching branches:', error);
        return c.json({ success: false, message: 'Failed to fetch branches' }, 500);
    }
});

module.exports = userApp;