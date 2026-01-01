import { describe, it, expect, beforeAll } from "vitest";
const app = require('../../index');
const models = require('../../models');
const jwt = require('jsonwebtoken');

describe('System Settings API', () => {
    let adminToken;
    let adminUser;

    beforeAll(async () => {
        // Sync database
        await models.sequelize.sync({ force: true });

        // Create Admin Role
        const adminRole = await models.Role.create({
            name: 'admin',
            description: 'Administrator'
        });

        // Create Admin User
        adminUser = await models.User.create({
            username: 'admin',
            first_name: 'admin',
            last_name: 'admin',
            email: 'admin@example.com',
            password_hash: 'password123',
            role_id: adminRole.id
        });

        // Generate Token
        adminToken = jwt.sign({ id: adminUser.id }, process.env.JWT_SECRET || 'your_jwt_secret');
    });

    it('should return public settings for unauthenticated user', async () => {
        const res = await app.request('/api/system-settings');
        expect(res.status).toBe(200);
        
        const data = await res.json();
        // Should have public keys
        expect(data).toHaveProperty('siteName');
        expect(data).toHaveProperty('siteLogo');
        expect(data).toHaveProperty('defaultTheme');
        expect(data).toHaveProperty('googleMaps');
        
        // Should NOT have private keys
        expect(data).not.toHaveProperty('smtpPassword');
        expect(data).not.toHaveProperty('smtpUser');
        expect(data).not.toHaveProperty('openAI');
    });

    it('should return all settings for authenticated admin user', async () => {
        const res = await app.request('/api/system-settings', {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        expect(res.status).toBe(200);
        
        const data = await res.json();
        // Should have public keys
        expect(data).toHaveProperty('siteName');
        
        // Should HAVE private keys (even if empty string in default)
        expect(data).toHaveProperty('smtpHost');
        expect(data).toHaveProperty('smtpUser');
        expect(data).toHaveProperty('smtpPassword');
    });
});
