require('dotenv').config({ path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env' });
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
const models = require('../../models');
import { hashPassword } from "../../lib/auth";
import jwt from 'jsonwebtoken';
import app from '../../index';

describe('Pending Deletion Workflow', () => {
    let adminToken, assistantToken, client;

    beforeAll(async () => {
        await models.sequelize.sync({ force: true });

        const adminRole = await models.Role.create({ name: 'admin' });
        const assistantRole = await models.Role.create({ name: 'assistant' });
        const branch = await models.Branch.create({ name: 'Test Branch' });

        const adminUser = await models.User.create({
            email: 'admin-test@fadaa.dz',
            first_name: 'Admin',
            last_name: 'Test',
            role_id: adminRole.id,
            branch_id: branch.id,
            password_hash: hashPassword('password')
        });

        const assistantUser = await models.User.create({
            email: 'assistant-test@fadaa.dz',
            first_name: 'Assistant',
            last_name: 'Test',
            role_id: assistantRole.id,
            branch_id: branch.id,
            password_hash: hashPassword('password')
        });

        adminToken = jwt.sign({ id: adminUser.id, email: adminUser.email }, process.env.JWT_SECRET || 'secret');
        assistantToken = jwt.sign({ id: assistantUser.id, email: assistantUser.email }, process.env.JWT_SECRET || 'secret');

        client = await models.Client.create({ company_name: 'Test Client', first_name: 'Test', last_name: 'Client', email: 'testclient@test.com', phone_number: '12345' });
    });

    afterAll(async () => {
        await models.sequelize.close();
    });

    it('should create a pending deletion when an assistant deletes a client', async () => {
        const res = await app.request(`/api/clients/${client.id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${assistantToken}`
            }
        });

        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.message).toBe('Client deletion request submitted for admin approval');

        const pendingDeletion = await models.PendingDeletion.findOne({ where: { entity_id: client.id, entity_type: 'client' } });
        expect(pendingDeletion).not.toBeNull();

        // const notification = await models.Notification.findOne({ where: { relatedEntityId: client.id, type: 'DeletionRequest' } });
        // expect(notification).not.toBeNull();
    });

    it('should allow an admin to approve a pending deletion', async () => {
        const pendingDeletion = await models.PendingDeletion.findOne({ where: { entity_id: client.id, entity_type: 'client' } });

        const res = await app.request(`/api/pending-deletions/${pendingDeletion.id}/status`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'approved' })
        });

        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.message).toBe('Deletion request approved');

        const deletedClient = await models.Client.findByPk(client.id);
        expect(deletedClient).toBeNull();
    });

    it('should delete a client directly when an admin deletes it', async () => {
        const newClient = await models.Client.create({ company_name: 'Another Client', first_name: 'Another', last_name: 'Client', email: 'another@test.com', phone_number: '54321' });

        const res = await app.request(`/api/clients/${newClient.id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.message).toBe('Client deleted successfully');

        const deletedClient = await models.Client.findByPk(newClient.id);
        expect(deletedClient).toBeNull();
    });

    // it('should not create a new pending deletion if one already exists', async () => {
    //     const res1 = await app.request(`/api/clients/${client.id}`, {
    //         method: 'DELETE',
    //         headers: {
    //             'Authorization': `Bearer ${assistantToken}`
    //         }
    //     });
    //     expect(res1.status).toBe(200);

    //     const res2 = await app.request(`/api/clients/${client.id}`, {
    //         method: 'DELETE',
    //         headers: {
    //             'Authorization': `Bearer ${assistantToken}`
    //         }
    //     });
    //     expect(res2.status).toBe(409);
    //     const body = await res2.json();
    //     expect(body.message).toBe('A deletion request for this client already exists.');
    // });
});