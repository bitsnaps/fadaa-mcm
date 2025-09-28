require('dotenv').config({ path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env' });
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
// const { Hono } = require('hono');
// import clientsApp from '../../routes/clients';
const models = require('../../models');
import { hashPassword } from "../../lib/auth";
import jwt from 'jsonwebtoken';
import app from '../../index';

describe('Branch Restriction for Assistants', () => {
    let adminToken, assistant1Token, branch1, branch2, client1, client2, client3;

    beforeAll(async () => {
        // 1. Clear and seed database
        await models.sequelize.sync({ force: true });

        const adminRole = await models.Role.create({ name: 'admin' });
        const role = await models.Role.create({ name: 'assistant' });
        branch1 = await models.Branch.create({ name: 'Branch A' });
        branch2 = await models.Branch.create({ name: 'Branch B' });

        // Create the admin user
        const adminUser = await models.User.create({
                email: 'admin@fadaa.dz',
                first_name: 'admin',
                last_name: 'admin',
                phone: '+213555000001',
                role_id: adminRole.id,
                branch_id: branch1.id,
                password_hash: hashPassword('admin$123')
            });

        const assistant1 = await models.User.create({
            first_name: 'Assistant',
            last_name: 'One',
            email: 'assistant1@test.com',
            password_hash: hashPassword('password'),
            role_id: role.id,
            branch_id: branch1.id
        });

        // Generate JWT for adminUser
        adminToken = jwt.sign({ id: adminUser.id, email: adminUser.email }, process.env.JWT_SECRET || 'secret');

        // Generate JWT for assistant1
        assistant1Token = jwt.sign({ id: assistant1.id, email: assistant1.email }, process.env.JWT_SECRET || 'secret');

        // Create clients
        client1 = await models.Client.create({ company_name: 'Client A - Branch A', first_name: 'Client', last_name: 'A', email: 'clienta@test.com', phone_number: '111' });
        client2 = await models.Client.create({ company_name: 'Client B - Branch B', first_name: 'Client', last_name: 'B', email: 'clientb@test.com', phone_number: '222' });
        client3 = await models.Client.create({ company_name: 'Client C - No Branch', first_name: 'Client', last_name: 'C', email: 'clientc@test.com', phone_number: '333' });

        const office1 = await models.Office.create({ name: 'Office 1A', branch_id: branch1.id, type: 'Private Suite' });
        const office2 = await models.Office.create({ name: 'Office 2B', branch_id: branch2.id, type: 'Private Suite' });

        const profile1 = await models.Profile.create({ name: 'Profile 1' });
        const profile2 = await models.Profile.create({ name: 'Profile 2' });


        // Create contracts to link clients to branches
        await models.Contract.create({ client_id: client1.id, office_id: office1.id, start_date: new Date(), end_date: new Date(), profile_id: profile1.id });
        await models.Contract.create({ client_id: client2.id, office_id: office2.id, start_date: new Date(), end_date: new Date(), profile_id: profile2.id });
    });

    afterAll(async () => {
        await models.sequelize.close();
    });

    it('tha admin should be able to access listing of clients', async () => {
        // const app = new Hono();
        // app.route('/api/clients', clientsApp);

        const res = await app.request('/api/clients', {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        expect(res.status).toBe(200);
    });

    it('should only return clients from the assistant branch and unassigned clients', async () => {
        // const app = new Hono();
        // app.route('/api/clients', clientsApp);

        const res = await app.request(`/api/clients?branchId=${branch1.id}`, {
            headers: {
                'Authorization': `Bearer ${assistant1Token}`                
            }
        });

        
        expect(res.status).toBe(200);
        const { data } = await res.json();

        // 3. Assert the response
        const clientNames = data.map(c => c.company_name);

        expect(data.length).toBe(2); // Should only see "2" clients
        expect(clientNames).toContain('Client A - Branch A');
        expect(clientNames).toContain('Client C - No Branch');
        expect(clientNames).not.toContain('Client B - Branch B');
    });
});