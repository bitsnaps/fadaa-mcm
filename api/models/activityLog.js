const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ActivityLog = sequelize.define('ActivityLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    action: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    target_entity_type: {
      type: DataTypes.STRING(50),
    },
    target_entity_id: {
      type: DataTypes.INTEGER,
    },
    details: {
      type: DataTypes.JSON,
    },
  }, {
    tableName: 'activity_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return ActivityLog;
};