const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ClientInvestment = sequelize.define('ClientInvestment', {
    amount_invested: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    purchase_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  }, {
    tableName: 'client_investments',
    timestamps: false,
  });

  return ClientInvestment;
};