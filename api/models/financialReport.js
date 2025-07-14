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
      type: DataTypes.TEXT,
      note: 'Can store structured data of the report',
      get() {
        const value = this.getDataValue('content');
        return value ? JSON.parse(value) : null;
      },
      set(value) {
        this.setDataValue('content', value ? JSON.stringify(value) : null);
      },
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