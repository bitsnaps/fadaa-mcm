const models = require('../models');

/**
 * Service for handling user-related operations.
 */
const userService = {
  /**
   * Retrieves all users with the 'Admin' role.
   * @returns {Promise<Array<models.User>>} List of admin users.
   */
  getAdmins: async () => {
    return await models.User.findAll({
      include: [{
        model: models.Role,
        as: 'role',
        where: { name: 'Admin' },
        attributes: [], // We only need to filter by role, not include role data in result if not needed
      }],
    });
  }
};

module.exports = userService;
