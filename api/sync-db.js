const { sequelize } = require('./models');

async function syncDatabase() {
  try {
    // await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { raw: true });    
    await sequelize.sync({ alter: true });
    // await sequelize.sync({ force: true });    
    console.log('Database synchronized successfully.');
  } catch (error) {
    console.error('Unable to synchronize the database:', error);
  } finally {
    // await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { raw: true });    
    await sequelize.close();
  }
}

syncDatabase();