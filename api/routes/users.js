const { Hono } = require('hono');
const jwt = require('jsonwebtoken');
const models = require('../models');
const { hashPassword, verifyPassword } = require('../lib/auth');
const { authMiddleware } = require('../middleware/auth');

const userApp = new Hono();

//curl -X POST http://localhost:3000/api/users \
// -H "Content-Type: application/json" \
// -d '{ "first_name": "Admin", "last_name": "User", "email": "admin@fadaa.dz", "password": "...", "role_id": 1, "branch_id": 1, "is_active": true }'
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

module.exports = userApp;