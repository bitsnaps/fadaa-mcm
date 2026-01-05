import { describe, it, expect, beforeAll, afterAll } from "vitest";
const models = require('../../models');
const userService = require('../../services/userService');

describe('UserService Unit Tests', () => {
    beforeAll(async () => {
        await models.sequelize.sync({ force: true });
        
        const adminRole = await models.Role.create({ name: 'Admin' });
        const investorRole = await models.Role.create({ name: 'Investor' });
        const branch = await models.Branch.create({ name: 'Test Branch' });

        await models.User.create({
            email: 'admin1@test.com',
            first_name: 'Admin',
            last_name: 'One',
            role_id: adminRole.id,
            branch_id: branch.id,
            password_hash: 'hash'
        });

        await models.User.create({
            email: 'admin2@test.com',
            first_name: 'Admin',
            last_name: 'Two',
            role_id: adminRole.id,
            branch_id: branch.id,
            password_hash: 'hash'
        });

        await models.User.create({
            email: 'investor@test.com',
            first_name: 'Investor',
            last_name: 'One',
            role_id: investorRole.id,
            branch_id: branch.id,
            password_hash: 'hash'
        });
    });

    afterAll(async () => {
        await models.sequelize.close();
    });

    it('getAdmins should return only users with Admin role', async () => {
        const admins = await userService.getAdmins();
        expect(admins.length).toBe(2);
        expect(admins.every(a => a.email.startsWith('admin'))).toBe(true);
    });
});