'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.js')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Define associations
const {
  User, Role, Branch, Client, Office, Contract, ServiceCategory,
  ClientService, Document, Task, Notification, FinancialReport,
  ComplianceReport, Investment, OfficeDesign,
  SystemSetting, ActivityLog, Tax, ContractTax, Income, Expense, Profile, Withdrawal
} = db;

// User associations
User.belongsTo(Role, { as: 'role', foreignKey: 'role_id' });
Role.hasMany(User, { foreignKey: 'role_id' });

User.belongsTo(Branch, { as: 'branch', foreignKey: 'branch_id' });
Branch.hasMany(User, { foreignKey: 'branch_id' });

// Client associations
Client.belongsTo(User, { as: 'managed_by', foreignKey: 'managed_by_user_id' });
User.hasMany(Client, { foreignKey: 'managed_by_user_id' });

Client.belongsTo(Office, { as: 'office', foreignKey: 'office_id' });
Office.hasMany(Client, { as: 'clients', foreignKey: 'office_id' });

// Profile associations
Profile.hasMany(Investment, { foreignKey: 'profile_id' });
Investment.belongsTo(Profile, { foreignKey: 'profile_id' });

Profile.hasMany(Income, { foreignKey: 'profile_id' });
Income.belongsTo(Profile, { foreignKey: 'profile_id' });

Profile.hasMany(Expense, { foreignKey: 'profile_id' });
Expense.belongsTo(Profile, { foreignKey: 'profile_id' });

// Office associations
Office.belongsTo(Branch, { as: 'branch', foreignKey: 'branch_id' });
Branch.hasMany(Office, { foreignKey: 'branch_id' });

// Contract associations
Contract.belongsTo(Client, { foreignKey: 'client_id' });
Client.hasMany(Contract, { foreignKey: 'client_id' });
Contract.belongsTo(Office, { foreignKey: 'office_id' });
Office.hasMany(Contract, { foreignKey: 'office_id' });

// Contract-Tax many-to-many relationship
Contract.belongsToMany(Tax, { through: ContractTax, foreignKey: 'contract_id', as: 'taxes' });
Tax.belongsToMany(Contract, { through: ContractTax, foreignKey: 'tax_id' });

// ClientService associations
ClientService.belongsTo(Client, { foreignKey: 'client_id' });
Client.hasMany(ClientService, { foreignKey: 'client_id' });
ClientService.belongsTo(ServiceCategory, { foreignKey: 'service_category_id' });
ServiceCategory.hasMany(ClientService, { foreignKey: 'service_category_id' });
ClientService.belongsTo(Contract, { foreignKey: 'contract_id' });
Contract.hasMany(ClientService, { foreignKey: 'contract_id' });

// Document associations
Document.belongsTo(Client, { foreignKey: 'client_id' });
Client.hasMany(Document, { foreignKey: 'client_id' });
Document.belongsTo(User, { as: 'uploaded_by', foreignKey: 'uploaded_by_user_id' });
User.hasMany(Document, { foreignKey: 'uploaded_by_user_id' });
Document.belongsTo(Investment, { foreignKey: 'investment_id' });
Investment.hasMany(Document, { foreignKey: 'investment_id' });

Profile.hasMany(Contract, { foreignKey: 'profile_id' });
Contract.belongsTo(Profile, { foreignKey: 'profile_id' });

// Task associations
Task.belongsTo(User, { as: 'assigned_to', foreignKey: 'assigned_to_user_id' });
User.hasMany(Task, { foreignKey: 'assigned_to_user_id', as: 'assigned_tasks' });
Task.belongsTo(User, { as: 'created_by', foreignKey: 'created_by_user_id' });
User.hasMany(Task, { foreignKey: 'created_by_user_id', as: 'created_tasks' });
Task.belongsTo(Client, { foreignKey: 'client_id' });
Client.hasMany(Task, { foreignKey: 'client_id' });

// Notification associations
Notification.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Notification, { foreignKey: 'user_id' });

// FinancialReport associations
FinancialReport.belongsTo(User, { foreignKey: 'generated_by_user_id' });
User.hasMany(FinancialReport, { foreignKey: 'generated_by_user_id' });

// ClientInvestment (Many-to-Many)
Investment.belongsTo(User, { as: 'investor', foreignKey: 'investor_id' });
User.hasMany(Investment, { as: 'investments', foreignKey: 'investor_id' });

Investment.belongsTo(Branch, { foreignKey: 'branch_id' });
Branch.hasMany(Investment, { foreignKey: 'branch_id' });

// OfficeDesign associations
OfficeDesign.belongsTo(Branch, { foreignKey: 'branch_id' });
Branch.hasOne(OfficeDesign, { foreignKey: 'branch_id' });

// ActivityLog associations
ActivityLog.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(ActivityLog, { foreignKey: 'user_id' });

// Withdrawal associations
if (Withdrawal) {
  // Link to investor (user who requested)
  Withdrawal.belongsTo(User, { as: 'investor', foreignKey: 'investor_id' });
  User.hasMany(Withdrawal, { as: 'withdrawals', foreignKey: 'investor_id' });

  // Link to processor (admin/assistant who processed)
  Withdrawal.belongsTo(User, { as: 'processed_by_user', foreignKey: 'processed_by' });
  User.hasMany(Withdrawal, { as: 'processed_withdrawals', foreignKey: 'processed_by' });

  // Link to investment
  Withdrawal.belongsTo(Investment, { foreignKey: 'investment_id' });
  Investment.hasMany(Withdrawal, { foreignKey: 'investment_id' });

  // Link to profile
  Withdrawal.belongsTo(Profile, { foreignKey: 'profile_id' });
  Profile.hasMany(Withdrawal, { foreignKey: 'profile_id' });
}

// Income associations
Income.belongsTo(Branch, { foreignKey: 'branch_id' });
Branch.hasMany(Income, { foreignKey: 'branch_id' });
Income.belongsTo(User, { as: 'registered_by_user', foreignKey: 'registered_by' });
User.hasMany(Income, { as: 'registered_incomes', foreignKey: 'registered_by' });

// Expense associations
Expense.belongsTo(Branch, { foreignKey: 'branch_id' });
Branch.hasMany(Expense, { foreignKey: 'branch_id' });
Expense.belongsTo(User, { as: 'registered_by_user', foreignKey: 'registered_by' });
User.hasMany(Expense, { as: 'registered_expenses', foreignKey: 'registered_by' });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
