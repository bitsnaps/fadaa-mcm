const { Op } = require('sequelize');
const models = require('../models');
const { createNotification } = require('../services/notificationService');

const checkExpiringInvestments = async () => {
  console.log('Running cron job to check for expiring investment contracts...');
  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringInvestments = await models.Investment.findAll({
      where: {
        ending_date: {
          [Op.lte]: thirtyDaysFromNow,
          [Op.gte]: new Date(),
        },
      },
      include: [
        { model: models.User, as: 'investor' },
        { model: models.Branch },
      ],
    });

    if (expiringInvestments.length === 0) {
      console.log('No expiring investment contracts found.');
      return;
    }

    const adminsAndAssistants = await models.User.findAll({
      include: [{
        model: models.Role,
        as: 'role',
        where: { name: { [Op.in]: ['Admin', 'Assistant'] } },
        attributes: [],
      }],
    });

    for (const investment of expiringInvestments) {
      const message = `The investment contract for ${investment.investor.first_name} ${investment.investor.last_name} in branch ${investment.Branch.name} is expiring on ${investment.ending_date.toLocaleDateString()}.`;
      for (const user of adminsAndAssistants) {
        await createNotification({
          userId: user.id,
          type: 'InvestorContractExpiry',
          message: message,
          relatedEntityType: 'investment',
          relatedEntityId: investment.id,
        });
      }
    }

    console.log(`Successfully created notifications for ${expiringInvestments.length} expiring investment contracts.`);
  } catch (error) {
    console.error('Error checking for expiring investment contracts:', error);
  } finally {
    await models.sequelize.close();
  }
};

checkExpiringInvestments();