require('dotenv').config({ path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env' });
const { Role, Branch, Office, User, Tax, Income, Expense, Client, Investment, ServiceCategory } = require('./models');

const seedDatabase = async () => {
    try {
        // Create roles
        await Role.findOrCreate({ where: { name: 'Admin' }, defaults: { description: 'Super user with all permissions' } });
        await Role.findOrCreate({ where: { name: 'Assistant' }, defaults: { description: 'Assists with managing clients and daily tasks' } });
        await Role.findOrCreate({ where: { name: 'Investor' }, defaults: { description: 'Can view investment-related data' } });
        await Role.findOrCreate({ where: { name: 'Client' }, defaults: { description: 'A paying customer' } });

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

        // Create the admin user (since password should be hashed, this will be don through cli)
        await User.findOrCreate({ where: { email: 'admin@fadaa.dz'}, defaults: { first_name: 'admin', last_name: 'admin', password_hash: '$2b$10$E2v.3E.6K2.a9jZ5l.8X.uY.8aJ5.j.J.j5.j.J.j5.j.J' }})

        console.log('Branches seeded successfully.');

        // Seed some incomes and expenses for the main branch
        await Income.bulkCreate([
            { amount: 5000, description: 'Client payment', transaction_date: new Date('2025-07-15'), branch_id: mainBranch.id, registered_by: 1 },
            { amount: 7500, description: 'Service subscription', transaction_date: new Date('2025-07-20'), branch_id: mainBranch.id, registered_by: 1 },
        ]);

        await Expense.bulkCreate([
            { amount: 1200, description: 'Office supplies', transaction_date: new Date('2025-07-16'), branch_id: mainBranch.id, registered_by: 1 },
            { amount: 300, description: 'Utilities', transaction_date: new Date('2025-07-18'), branch_id: mainBranch.id, registered_by: 1 },
        ]);

        console.log('Incomes and expenses seeded successfully.');

        // Create a default client for the main branch
        const [mainClient] = await Client.findOrCreate({
            where: { email: 'main.client@example.com' },
            defaults: {
                company_name: 'Main Client',
                first_name: 'Main',
                last_name: 'Client',
                managed_by_user_id: 1, // Assuming admin user with ID 1 exists
                status: 'active'
            }
        });

        console.log('Clients seeded successfully.');

        // Seed some investments for the main client and branch
        await Investment.bulkCreate([
            { name: 'Tech Startup Investment', percentage: 10, investment_amount: 50000, client_id: mainClient.id, branch_id: mainBranch.id, starting_date: new Date('2025-01-15') },
            { name: 'Real Estate Fund', percentage: 15, investment_amount: 100000, client_id: mainClient.id, branch_id: mainBranch.id, starting_date: new Date('2025-03-10') },
        ]);

        console.log('Investments seeded successfully.');

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