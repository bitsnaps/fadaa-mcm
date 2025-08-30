const { User, Role, Branch } = require('../models');
const { hashPassword, verifyPassword } = require('../lib/auth');
const { handleRouteError } = require('../lib/errorHandler');

exports.getAllUsers = async (c) => {
    try {
        const users = await User.findAll({
            include: [
                { model: Role, as: 'role' },
                { model: Branch, as: 'branch' }
            ],
            order: [['created_at', 'DESC']]
        });
        return c.json({ success: true, data: users });
    } catch (error) {
        return handleRouteError(c, 'Error fetching users', error);
    }
};

exports.getUsersByRole = async (c) => {
    const { roleName } = c.req.param();
    try {
        const users = await User.findAll({
            include: [
                {
                    model: Role,
                    as: 'role',
                    where: { name: roleName }
                },
                { model: Branch, as: 'branch' }
            ],
            order: [['created_at', 'DESC']]
        });
        return c.json({ success: true, data: users });
    } catch (error) {
        return handleRouteError(c, `Error fetching users with role ${roleName}`, error);
    }
};

exports.getUserById = async (c) => {
    const { id } = c.req.param();
    try {
        const user = await User.findByPk(id, {
            include: [
                { model: Role, as: 'role' },
                { model: Branch, as: 'branch' }
            ]
        });
        if (!user) {
            return c.json({ success: false, message: 'User not found' }, 404);
        }
        return c.json({ success: true, data: user });
    } catch (error) {
        return handleRouteError(c, `Error fetching user ${id}`, error);
    }
};

exports.createUser = async (c) => {
    try {
        const { first_name, last_name, email, password, role_id, branch_id, is_active, preferences } = await c.req.json();

        if (!email || !password || !first_name || !last_name || !role_id) {
            return c.json({ success: false, message: 'Missing required fields' }, 400);
        }

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return c.json({ success: false, message: 'User already exists' }, 409);
        }

        const newUser = await User.create({
            first_name,
            last_name,
            email,
            password_hash: hashPassword(password),
            role_id,
            branch_id,
            is_active,
            preferences
        });

        return c.json({ success: true, message: 'User created successfully', userId: newUser.id });
    } catch (error) {
        return handleRouteError(c, 'User creation error', error);
    }
};

exports.updateUser = async (c) => {
    const { id } = c.req.param();
    try {
        const { first_name, last_name, email, phone, role_id, branch_id, is_active } = await c.req.json();

        const user = await User.findByPk(id);
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
};

exports.updateUserProfile = async (c) => {
    const { id } = c.req.param();
    try {
        const { first_name, last_name, phone } = await c.req.json();

        const user = await User.findByPk(id);
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
};

exports.changePassword = async (c) => {
    const { id } = c.req.param();
    try {
        const { currentPassword, newPassword } = await c.req.json();
        
        const user = await User.findByPk(id);
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
};

exports.updateProfilePicture = async (c) => {
    const { id } = c.req.param();
    const filePath = c.req.filePath;

    try {
        const user = await User.findByPk(id);
        if (!user) {
            return c.json({ success: false, message: 'User not found' }, 404);
        }

        await user.update({ profile_picture: filePath });

        return c.json({ success: true, message: 'Profile picture uploaded successfully', filePath });
    } catch (error) {
        return handleRouteError(c, `Error updating profile picture for user ${id}`, error);
    }
};

exports.deleteUser = async (c) => {
    const { id } = c.req.param();
    try {
        const user = await User.findByPk(id);
        if (!user) {
            return c.json({ success: false, message: 'User not found' }, 404);
        }

        await user.destroy();
        return c.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        return handleRouteError(c, `Error deleting user ${id}`, error);
    }
};

exports.getRoles = async (c) => {
    try {
        const roles = await Role.findAll({ order: [['name', 'ASC']] });
        return c.json({ success: true, data: roles });
    } catch (error) {
        return handleRouteError(c, 'Error fetching roles', error);
    }
};

exports.getBranches = async (c) => {
    try {
        const branches = await Branch.findAll({ order: [['name', 'ASC']] });
        return c.json({ success: true, data: branches });
    } catch (error) {
        return handleRouteError(c, 'Error fetching branches', error);
    }
};

exports.updateUserPreferences = async (c) => {
    const { id } = c.req.param();
    try {
        const preferences = await c.req.json();
        const user = await User.findByPk(id);
        if (!user) {
            return c.json({ success: false, message: 'User not found' }, 404);
        }
        await user.update({ preferences });
        return c.json({ success: true, message: 'Preferences updated successfully' });
    } catch (error) {
        return handleRouteError(c, `Error updating preferences for user ${id}`, error);
    }
};