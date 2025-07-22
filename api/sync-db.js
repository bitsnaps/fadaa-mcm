const models = require('./models');

const syncDatabase = async () => {
    try {
        await models.sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { raw: true });
        // await models.sequelize.sync({ force: true });
        await models.sequelize.sync({ force: false });
        console.log('Database synchronized successfully.');
    } catch (error) {
        console.error('Failed to synchronize database:', error);
    } finally {
        await models.sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { raw: true });
        await models.sequelize.close();
    }
};

syncDatabase();