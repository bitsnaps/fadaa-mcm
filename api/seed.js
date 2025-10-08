require('dotenv').config({ path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env' });
const { Role, Branch, Office, User, Tax, Income, Expense, Client, Investment, ServiceCategory, Profile, Withdrawal } = require('./models');

const seedDatabase = async () => {
    try {
        // Create roles
        const [adminRole] = await Role.findOrCreate({ where: { name: 'Admin' }, defaults: { description: 'Super user with all permissions' } });
        const [assistantRole] = await Role.findOrCreate({ where: { name: 'Assistant' }, defaults: { description: 'Assists with managing clients and daily tasks' } });
        const [investorRole] = await Role.findOrCreate({ where: { name: 'Investor' }, defaults: { description: 'Can view investment-related data' } });
        // await Role.findOrCreate({ where: { name: 'Client' }, defaults: { description: 'A paying customer' } });

        console.log('Roles seeded successfully.');

        // Create a default branch
        const [mainBranch] = await Branch.findOrCreate({ where: { name: 'Main Branch' }, defaults: { location: 'Headquarters', status: 'active' } });

        // Create an office for the "mainBranch" here
        await Office.findOrCreate({ where: { name: 'Big Room'}, defaults: { type: 'Coworking Desk', capacity: 30, status: 'Available', amenities: 'Wi-Fi, Coffee', branch_id: mainBranch.id }});

        // Create some category of services
        await ServiceCategory.findOrCreate({ where: { name: 'Rental Equipement' }, defaults: { description: 'Rental of any type of equipements.' } });
        await ServiceCategory.findOrCreate({ where: { name: 'Deep Cleaning' }, defaults: { description: 'Perform a deep clean to office.' } });

        // Create some taxes (TVA -> 19%, IBS -> 26%)
        await Tax.findOrCreate({ where: { name: 'VAT'}, defaults: { rate: '19.00', description: 'Value added tax', bearer: 'Client'}});

        // Create users (store references)
        const [adminUser] = await User.findOrCreate({
            where: { email: 'admin@fadaa.dz'},
            defaults: {
                first_name: 'admin',
                last_name: 'admin',
                phone: '+213555000001',
                role_id: adminRole.id,
                branch_id: mainBranch.id,
                password_hash: '$2b$10$E2v.3E.6K2.a9jZ5l.8X.uY.8aJ5.j.J.j5.j.J.j5.j.J'
            }
        });
        const [assistantUser] = await User.findOrCreate({
            where: { email: 'assistant@fadaa.dz'},
            defaults: {
                first_name: 'assistant',
                last_name: 'assistant',
                phone: '+213555000002',
                role_id: assistantRole.id,
                branch_id: mainBranch.id,
                password_hash: '$2b$10$E2v.3E.6K2.a9jZ5l.8X.uY.8aJ5.j.J.j5.j.J.j5.j.J'
            }
        });
        const [investorUser] = await User.findOrCreate({
            where: { email: 'investor@fadaa.dz'},
            defaults: {
                first_name: 'investor',
                last_name: 'investor',
                phone: '+213555000003',
                role_id: investorRole.id,
                branch_id: mainBranch.id,
                password_hash: '$2b$10$E2v.3E.6K2.a9jZ5l.8X.uY.8aJ5.j.J.j5.j.J.j5.j.J'
            }
        });

        // Ensure an active profile exists and will be used in financial calcs and investments
        const [realValuesProfile] = await Profile.findOrCreate({
            where: { name: 'Real' },
            defaults: { description: 'Default active profile for real operations', is_active: true }
        });

        console.log('Branches and users seeded successfully.');

        // Seed some incomes and expenses for the main branch (tagged to active profile)
        await Income.bulkCreate([
            { amount: 5000, description: 'Client payment', transaction_date: new Date('2025-07-15'), branch_id: mainBranch.id, registered_by: adminUser.id, profile_id: realValuesProfile.id },
            { amount: 7500, description: 'Service subscription', transaction_date: new Date('2025-07-20'), branch_id: mainBranch.id, registered_by: adminUser.id, profile_id: realValuesProfile.id },
        ]);

        await Expense.bulkCreate([
            { amount: 1200, description: 'Office supplies', transaction_date: new Date('2025-07-16'), branch_id: mainBranch.id, registered_by: adminUser.id, profile_id: realValuesProfile.id },
            { amount: 300, description: 'Utilities', transaction_date: new Date('2025-07-18'), branch_id: mainBranch.id, registered_by: adminUser.id, profile_id: realValuesProfile.id },
        ]);

        console.log('Incomes and expenses seeded successfully.');

        // Create a default client for the main branch
        const [mainClient] = await Client.findOrCreate({
            where: { company_name: 'Main Client' },
            defaults: {
                company_name: 'Main Client',
                first_name: 'Main',
                last_name: 'Client',
                email: 'main.client@fadaa.dz',
                phone_number: '+1234567890',
                managed_by_user_id: adminUser.id,
                status: 'active'
            }
        });

        console.log('Clients seeded successfully.');

        // Seed some investments for the main client and branch (owned by investor, tied to active profile)
        await Investment.bulkCreate([
            { name: 'Tech Startup Investment', percentage: 10, investment_amount: 50000, client_id: mainClient.id, branch_id: mainBranch.id, investor_id: investorUser.id, profile_id: realValuesProfile.id, starting_date: new Date('2025-01-15') },
            { name: 'Real Estate Fund', percentage: 15, investment_amount: 100000, client_id: mainClient.id, branch_id: mainBranch.id, investor_id: investorUser.id, profile_id: realValuesProfile.id, starting_date: new Date('2025-03-10') },
        ]);

        // Create sample withdrawals across statuses for the first investment
        const techInv = await Investment.findOne({ where: { name: 'Tech Startup Investment' } });
        if (techInv) {
            await Withdrawal.bulkCreate([
                // Pending request
                {
                    investment_id: techInv.id,
                    investor_id: investorUser.id,
                    profile_id: realValuesProfile.id,
                    amount: 5000,
                    status: 'pending',
                    payment_method: 'bank transfer',
                    notes: 'Initial withdrawal request',
                    requested_at: new Date('2025-07-21'),
                },
                // Approved request
                {
                    investment_id: techInv.id,
                    investor_id: investorUser.id,
                    profile_id: realValuesProfile.id,
                    amount: 3000,
                    status: 'approved',
                    payment_method: 'cash',
                    notes: 'Approved by admin',
                    requested_at: new Date('2025-07-10'),
                    approved_at: new Date('2025-07-11'),
                    processed_by: adminUser.id,
                },
                // Paid request
                {
                    investment_id: techInv.id,
                    investor_id: investorUser.id,
                    profile_id: realValuesProfile.id,
                    amount: 2000,
                    status: 'paid',
                    payment_method: 'bank transfer',
                    notes: 'Payout processed',
                    requested_at: new Date('2025-07-01'),
                    approved_at: new Date('2025-07-02'),
                    paid_at: new Date('2025-07-03'),
                    processed_by: adminUser.id,
                },
                // Rejected request
                {
                    investment_id: techInv.id,
                    investor_id: investorUser.id,
                    profile_id: realValuesProfile.id,
                    amount: 1500,
                    status: 'rejected',
                    payment_method: 'cash',
                    notes: 'Rejected due to limits',
                    requested_at: new Date('2025-06-20'),
                    processed_by: adminUser.id,
                },
            ]);
        }
        
        console.log('Investments and withdrawals seeded successfully.');

    } catch (error) {
        console.error('Error seeding the database:', error);
    } finally {
        // Close the database connection if your models module exports sequelize
        const { sequelize } = require('./models');
        if (sequelize) {
            await sequelize.close();
        }
    }
};

seedDatabase();