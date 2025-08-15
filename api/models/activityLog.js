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
    context: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'The context of the activity, e.g., "Compliance", "Client"',
    },
    details: {
      type: DataTypes.TEXT,
      get() {
        const value = this.getDataValue('details');
        return value ? JSON.parse(value) : null;
      },
      set(value) {
        this.setDataValue('details', value ? JSON.stringify(value) : null);
      },
    },
  }, {
    tableName: 'activity_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return ActivityLog;
};