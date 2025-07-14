const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const FinancialReport = sequelize.define('FinancialReport', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('MonthlySummary', 'QuarterlyReview', 'AnnualReport', 'InvestmentPerformance'),
      allowNull: false,
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    content: {
      type: DataTypes.JSON,
      note: 'Can store structured data of the report',
    },
    file_path: {
      type: DataTypes.STRING(255),
      note: 'Path to the generated PDF/CSV file',
    },
  }, {
    tableName: 'financial_reports',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return FinancialReport;
};