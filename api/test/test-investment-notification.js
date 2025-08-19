require('dotenv').config({ path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env' });
const { Investment, User, Branch, Profile, Client } = require('./models');

const createTestInvestment = async () => {
    try {
        const investorUser = await User.findOne({ where: { email: 'investor@fadaa.dz' } });
        const mainBranch = await Branch.findOne({ where: { name: 'Main Branch' } });
        const realValuesProfile = await Profile.findOne({ where: { name: 'Real Values' } });
        const mainClient = await Client.findOne({ where: { company_name: 'Main Client' } });

        if (!investorUser || !mainBranch || !realValuesProfile || !mainClient) {
            console.error('Could not find required seed data. Please run the seeder first.');
            return;
        }

        const ending_date = new Date();
        ending_date.setDate(ending_date.getDate() + 15); // Expiring in 15 days

        await Investment.create({
            name: 'Test Expiring Investment',
            percentage: 5,
            investment_amount: 25000,
            client_id: mainClient.id,
            branch_id: mainBranch.id,
            investor_id: investorUser.id,
            profile_id: realValuesProfile.id,
            starting_date: new Date(),
            ending_date: ending_date,
        });

        console.log('Test investment created successfully.');

    } catch (error) {
        console.error('Error creating test investment:', error);
    } finally {
        const { sequelize } = require('./models');
        if (sequelize) {
            await sequelize.close();
        }
    }
};

createTestInvestment();