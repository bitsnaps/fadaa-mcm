const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ComplianceReport = sequelize.define('ComplianceReport', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    status: {
      type: DataTypes.ENUM('In Progress', 'Completed', 'Overdue'),
      allowNull: false,
      defaultValue: 'In Progress',
    },
    due_date: {
      type: DataTypes.DATE,
    },
    completed_date: {
      type: DataTypes.DATE,
    },
    file_path: {
      type: DataTypes.STRING(255),
    },
  }, {
    tableName: 'compliance_reports',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return ComplianceReport;
};