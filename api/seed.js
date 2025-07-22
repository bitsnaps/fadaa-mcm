require('dotenv').config({ path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env' });
const { Role, Branch, User } = require('./models');

const seedDatabase = async () => {
    try {
        // Create roles
        await Role.findOrCreate({ where: { name: 'Admin' }, defaults: { description: 'Super user with all permissions' } });
        await Role.findOrCreate({ where: { name: 'Assistant' }, defaults: { description: 'Assists with managing clients and daily tasks' } });
        await Role.findOrCreate({ where: { name: 'Investor' }, defaults: { description: 'Can view investment-related data' } });
        await Role.findOrCreate({ where: { name: 'Client' }, defaults: { description: 'A paying customer' } });

        console.log('Roles seeded successfully.');

        // Create a default branch
        await Branch.findOrCreate({ where: { name: 'Main Branch' }, defaults: { location: 'Headquarters', status: 'active' } });

        // Create the admin user (since password should be hashed, this will be don through cli)
        // await User.findOrCreate({ where: { email: 'admin@fadaa.dz'}, defaults: { first_name: 'admin', last_name: 'admin', password: 'admin' }})

        console.log('Branches seeded successfully.');

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