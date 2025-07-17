const models = require('./models');

const syncDatabase = async () => {
    try {
        await models.sequelize.sync({ alter: true });
        console.log('Database synchronized successfully.');
    } catch (error) {
        console.error('Failed to synchronize database:', error);
    } finally {
        await models.sequelize.close();
    }
};

syncDatabase();