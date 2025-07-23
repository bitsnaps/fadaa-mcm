require('dotenv').config({ path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env' });
const { Role, Branch, User, Income, Expense } = require('./models');

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

        // Create the admin user (since password should be hashed, this will be don through cli)
        // await User.findOrCreate({ where: { email: 'admin@fadaa.dz'}, defaults: { first_name: 'admin', last_name: 'admin', password: 'admin' }})

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