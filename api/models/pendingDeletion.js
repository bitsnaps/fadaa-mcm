'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PendingDeletion extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      PendingDeletion.belongsTo(models.User, {
        foreignKey: 'requester_id',
        as: 'requester',
      });
      PendingDeletion.belongsTo(models.User, {
        foreignKey: 'approved_by',
        as: 'approver',
      });
    }
  }
  PendingDeletion.init({
    requester_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    entity_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    entity_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'pending', // pending, approved, rejected
    },
    approved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'PendingDeletion',
    tableName: 'pending_deletions',
    timestamps: true,
    paranoid: true,
  });
  return PendingDeletion;
};