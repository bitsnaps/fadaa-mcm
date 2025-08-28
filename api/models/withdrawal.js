const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Withdrawal = sequelize.define('Withdrawal', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    investment_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'investments', key: 'id' }
    },
    investor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    profile_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'profiles', key: 'id' }
    },
    amount: { type: DataTypes.FLOAT, allowNull: false },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'pending',
      comment: 'pending|paid|cancelled'
    },
    payment_method: { type: DataTypes.STRING(50), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    requested_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    approved_at: { type: DataTypes.DATE, allowNull: true },
    paid_at: { type: DataTypes.DATE, allowNull: true },
    processed_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
  }, {
    tableName: 'withdrawals',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return Withdrawal;
};