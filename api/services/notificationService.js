const models = require('../models');

/**
 * Creates a new notification.
 *
 * @param {Object} data - The notification data.
 * @param {number} data.userId - The ID of the user to notify.
 * @param {string} data.type - The notification type.
 * @param {string} data.message - The notification message.
 * @param {string} [data.relatedEntityType] - The type of the related entity.
 * @param {number} [data.relatedEntityId] - The ID of the related entity.
 * @returns {Promise<void>}
 */
const createNotification = async (data) => {
  try {
    await models.Notification.create({
      user_id: data.userId,
      type: data.type,
      message: data.message,
      related_entity_type: data.relatedEntityType,
      related_entity_id: data.relatedEntityId,
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    // Depending on requirements, you might want to throw the error
    // to be handled by the calling function.
  }
};

module.exports = {
  createNotification,
};