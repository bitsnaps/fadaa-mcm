const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Investment = sequelize.define('Investment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    percentage: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    starting_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    ending_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    investment_amount: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    client_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'clients',
        key: 'id'
      }
    },
    branch_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'branches',
        key: 'id'
      }
    }
  }, {
    tableName: 'investments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return Investment;
};