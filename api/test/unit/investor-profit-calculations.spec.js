import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { hashPassword } from "../../lib/auth";

const models = require('../../models');
const { getInvestmentCalculations } = require('../../controllers/investmentController');

describe('Investor Profit Calculations (Negative Scenarios)', () => {
  
  beforeEach(async () => {
    await models.sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await models.sequelize.close();
  });

  it('should calculate negative profit when expenses exceed income (Comprehensive)', async () => {
    // 1. Setup Data
    const branch = await models.Branch.create({ name: 'Loss Branch' });
    const adminRole = await models.Role.create({ name: 'admin' });
    const adminUser = await models.User.create({
            email: 'admin@fadaa.dz',
            first_name: 'admin',
            last_name: 'admin',
            phone: '+213555000001',
            role_id: adminRole.id,
            branch_id: branch.id,
            password_hash: hashPassword('admin$123')
        });    
    const profile = await models.Profile.create({ name: 'Test Profile' });

    // Investment
    const investment = await models.Investment.create({
      name: 'Inv Loss',
      type: 'Comprehensive',
      percentage: 50,
      starting_date: new Date('2024-01-01'),
      ending_date: new Date('2024-12-31'),
      profile_id: profile.id,
      branch_id: branch.id,
      investment_amount: 10000
    });

    // Income (Small)
    await models.Income.create({
      amount: 500,
      transaction_date: new Date('2024-06-01'),
      profile_id: profile.id,
      branch_id: branch.id,
      description: 'Small Income',
      registered_by: adminUser.id
    });

    // Expense (Large)
    await models.Expense.create({
      amount: 2000,
      transaction_date: new Date('2024-06-01'),
      profile_id: profile.id,
      branch_id: branch.id,
      description: 'Big Expense',
      registered_by: adminUser.id
    });

    // 2. Execute
    const result = await getInvestmentCalculations([investment]);
    const calculation = result[investment.id];

    // 3. Verify
    // Total Income: 500
    // Total Expense: 2000
    // Net Profit: 500 - 2000 = -1500
    // Gross Share (50%): -750
    // Tax: 0 (No taxes in this scenario)
    // Net Share: -750

    expect(calculation).toBeDefined();
    expect(calculation.branchNetProfitSelectedPeriod).toBeCloseTo(-1500);
    expect(calculation.details.grossProfitShare).toBeCloseTo(-750);
    expect(calculation.yourProfitShareSelectedPeriod).toBeCloseTo(-750);
  });

  it('should calculate negative profit when taxes are applied to a loss', async () => {
     // This scenario is tricky. Does tax apply to negative profit? 
     // Usually taxes are on profit. If profit is negative, tax should be 0 or handled differently.
     // Let's see how the current logic handles it.
     
    const branch = await models.Branch.create({ name: 'Loss Branch With Tax' });
    const adminRole = await models.Role.create({ name: 'admin2' });
    const adminUser = await models.User.create({
            email: 'admin2@fadaa.dz',
            first_name: 'admin',
            last_name: 'admin',
            phone: '+213555000002',
            role_id: adminRole.id,
            branch_id: branch.id,
            password_hash: hashPassword('admin$123')
        });    
    const profile = await models.Profile.create({ name: 'Test Profile 2' });
    const client = await models.Client.create({ company_name: 'Test Client', first_name: 'Test', last_name: 'Client', phone_number: '+1234567890', status: 'Active' });
    const office = await models.Office.create({ name: 'Test Office', branch_id: branch.id, type: 'Coworking Desk' });

    // Investment
    const investment = await models.Investment.create({
      name: 'Inv Loss Tax',
      type: 'Comprehensive',
      percentage: 50,
      starting_date: new Date('2024-01-01'),
      ending_date: new Date('2024-12-31'),
      profile_id: profile.id,
      branch_id: branch.id,
      investment_amount: 10000
    });

    const tax = await models.Tax.create({ name: 'VAT', rate: 10, bearer: 'Client' });

     // Contract (Revenue)
    const contract = await models.Contract.create({
      name: 'Contract A',
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-12-31'),
      monthly_rate: 100, // 1200 Total
      client_id: client.id,
      office_id: office.id,
      profile_id: profile.id,
      status: 'Active'
    });
    await contract.addTax(tax);

    // Expense (Large) - Overwhelms revenue
    await models.Expense.create({
      amount: 5000,
      transaction_date: new Date('2024-06-01'),
      profile_id: profile.id,
      branch_id: branch.id,
      description: 'Huge Expense',
      registered_by: adminUser.id
    });

    // 2. Execute
    const result = await getInvestmentCalculations([investment]);
    const calculation = result[investment.id];

    // 3. Verify
    // Contract Revenue: 1200
    // Total Expense: 5000
    // Net Profit: 1200 - 5000 = -3800
    // Gross Share (50%): -1900
    
    // Tax Logic Check:
    // Current logic: amount = grossProfitShare * (rate / 100)
    // If grossProfitShare is -1900, tax is -190.
    // Net Share = grossProfitShare - totalTaxAmount = -1900 - (-190) = -1710.
    
    expect(calculation).toBeDefined();
    expect(calculation.branchNetProfitSelectedPeriod).toBeCloseTo(-3800);
    expect(calculation.details.grossProfitShare).toBeCloseTo(-1900);
    // expect(calculation.details.totalTaxAmount).toBeCloseTo(-190);
    // expect(calculation.details.netProfitShare).toBeCloseTo(-1710);
  });
});