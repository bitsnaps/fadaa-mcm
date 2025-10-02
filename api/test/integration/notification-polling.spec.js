require('dotenv').config({ path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env' });
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
const models = require('../../models');
import { hashPassword } from "../../lib/auth";
import jwt from 'jsonwebtoken';
import app from '../../index'; // Assuming your Hono app is exported from index.js

describe('Notification Polling API', () => {
  let testUser;
  let authToken;

  beforeAll(async () => {

    await models.sequelize.sync({ force: true });

    // 1. Find or create a test user to make authenticated requests
      const adminRole = await models.Role.create({ name: 'admin' });
      const role = await models.Role.create({ name: 'assistant' });
      const branch1 = await models.Branch.create({ name: 'Branch A' });
          
    testUser = await models.User.create({
        first_name: 'Test',
        last_name: 'User',
        password_hash: hashPassword('admin$123'),
        role_id: adminRole.id, // Assuming a role_id exists
        branch_id: branch1.id,
        email: 'test-notification-user@example.com'
    });

    authToken = jwt.sign({ id: testUser.id, email: testUser.email }, process.env.JWT_SECRET || 'secret');

    // 2. Clean up any old notifications for this user
    await models.Notification.destroy({ where: { user_id: testUser.id } });
  });

  afterAll(async () => {
    // Clean up created test data
    if (testUser) {
      await models.Notification.destroy({ where: { user_id: testUser.id } });
      // You might want to destroy the user as well if it's only for testing
      await models.User.destroy({ where: { id: testUser.id } });
    }
    await models.sequelize.close();
  });

  it('should fetch unread notifications and count correctly', async () => {
    // 1. Arrange: Create a new unread notification for our test user
    await models.Notification.create({
      user_id: testUser.id,
      type: 'SystemAlert',
      message: 'This is a test notification.',
      is_read: false,
    });

    // 2. Act: Call the new /unread endpoint
    const response = await app.request('/api/notifications/unread', {
      headers: { 
        'Authorization': `Bearer ${authToken}`
       }
    });
    // const response = await app.fetch(request);
    const data = await response.json();


    // 3. Assert: Check if the response is correct
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.unreadCount).toBe(1);
    expect(data.latestUnread).toHaveLength(1);
    expect(data.latestUnread[0].message).toBe('This is a test notification.');
  });
});