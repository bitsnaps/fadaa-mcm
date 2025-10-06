const { Op } = require('sequelize');
const models = require('../models');

const terminateExpiredContracts = async () => {
  console.log('Running cron job: Terminating expired contracts...');
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiredContracts = await models.Contract.findAll({
      where: {
        end_date: {
          [Op.lt]: today,
        },
        status: 'Active',
      },
    });

    if (expiredContracts.length === 0) {
      console.log('No expired contracts to terminate.');
      return;
    }

    for (const contract of expiredContracts) {
      contract.status = 'Expired';
      await contract.save();
      console.log(`Contract with ID ${contract.id} has been marked as expired.`);

      // Make the office available again
      await models.Office.update(
        { status: 'Available' },
        { where: { id: contract.office_id } }
      );
      console.log(`Office with ID ${contract.office_id} is now available.`);
    }

    console.log(`${expiredContracts.length} contracts have been marked as expired.`);
  } catch (error) {
    console.error('Error expiring contracts:', error);
  }
};

terminateExpiredContracts();