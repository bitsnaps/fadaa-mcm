require('dotenv').config({ path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env' });
import { describe, it, expect, beforeAll, afterAll } from "vitest";
const models = require('../../models');
import { hashPassword } from "../../lib/auth";
import jwt from 'jsonwebtoken';
import app from '../../index';

describe('Withdrawal Flow Integration', () => {
    let adminToken, investorToken;
    let adminUser, investorUser;
    let branch, profile, investment;

    beforeAll(async () => {
        // Sync database (force: true to start fresh)
        await models.sequelize.sync({ force: true });

        // Create Roles
        const adminRole = await models.Role.create({ name: 'Admin' });
        const investorRole = await models.Role.create({ name: 'Investor' });

        // Create Branch
        branch = await models.Branch.create({ name: 'Test Branch', status: 'active' });

        // Create Profile
        profile = await models.Profile.create({ name: 'Test Profile', is_active: true });

        // Create Admin User
        adminUser = await models.User.create({
            email: 'admin-withdraw@fadaa.dz',
            first_name: 'Admin',
            last_name: 'Withdraw',
            role_id: adminRole.id,
            branch_id: branch.id,
            password_hash: hashPassword('password')
        });

        // Create Investor User
        investorUser = await models.User.create({
            email: 'investor-withdraw@fadaa.dz',
            first_name: 'Investor',
            last_name: 'Withdraw',
            role_id: investorRole.id,
            branch_id: branch.id,
            password_hash: hashPassword('password')
        });

        // Generate Tokens
        adminToken = jwt.sign({ id: adminUser.id, email: adminUser.email }, process.env.JWT_SECRET || 'secret');
        investorToken = jwt.sign({ id: investorUser.id, email: investorUser.email }, process.env.JWT_SECRET || 'secret');

        // Create Investment
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        investment = await models.Investment.create({
            name: 'Test Investment',
            percentage: 10,
            investment_amount: 10000,
            investor_id: investorUser.id,
            branch_id: branch.id,
            profile_id: profile.id,
            starting_date: sixMonthsAgo,
            type: 'Comprehensive'
        });

        // Add Income to ensure profit share
        await models.Income.create({
            amount: 50000,
            description: 'Test Income',
            transaction_date: new Date(),
            branch_id: branch.id,
            profile_id: profile.id,
            registered_by: adminUser.id
        });
    });

    afterAll(async () => {
        await models.sequelize.close();
    });

    it('should allow investor to create a withdrawal request and notify admin', async () => {
        const withdrawalAmount = 100;
        
        // Investor creates withdrawal request
        const res = await app.request('/api/investor/withdrawals', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${investorToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                investment_id: investment.id,
                amount: withdrawalAmount,
                notes: 'Test withdrawal'
            })
        });

        const body = await res.json();
        expect(res.status).toBe(201);
        expect(body.success).toBe(true);
        const withdrawalId = body.data.id;

        // Verify Notification created for Admin
        const notification = await models.Notification.findOne({
            where: {
                user_id: adminUser.id,
                type: 'WithdrawalRequest',
                related_entity_id: withdrawalId
            }
        });

        expect(notification).not.toBeNull();
        expect(notification.message).toContain('New withdrawal request');
    });

    it('should create an expense when admin marks withdrawal as paid', async () => {
        // 1. Get the withdrawal created in previous step (or create new one)
        const withdrawal = await models.Withdrawal.findOne({ where: { investor_id: investorUser.id } });
        expect(withdrawal).not.toBeNull();

        // 2. Admin updates status to 'paid'
        const res = await app.request(`/api/withdrawals/${withdrawal.id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'paid',
                amount: withdrawal.amount // Ensure amount is passed or handled by backend logic
            })
        });

        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.success).toBe(true);
        expect(body.data.status).toBe('paid');

        // 3. Verify Expense Creation
        const expense = await models.Expense.findOne({
            where: {
                description: `Withdrawal for investment #${withdrawal.investment_id}`,
                amount: withdrawal.amount
            }
        });

        expect(expense).not.toBeNull();
        expect(expense.branch_id).toBe(branch.id);
        
        // Verify Category
        const category = await models.ExpenseCategory.findByPk(expense.category_id);
        expect(category).not.toBeNull();
        expect(category.name).toBe('Withdrawal');
    });
});