import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { hashPassword } from "../../lib/auth";

const models = require('../../models');
const { getInvestmentCalculations } = require('../../controllers/investmentController');

describe('Investment Profit Calculations', () => {
  
  beforeEach(async () => {
    // Re-create the database schema for each test to ensure a clean state
    // force: true drops tables if they exist
    await models.sequelize.sync({ force: true });
    
    // Debug: Check created tables
    // const tables = await models.sequelize.getQueryInterface().showAllTables();
    // console.error('DEBUG: Created tables:', tables);
    // console.error('DEBUG: ClientService tableName:', models.ClientService.tableName);
    // console.error('DEBUG: Tax tableName:', models.Tax.tableName);
  });

  afterAll(async () => {
    await models.sequelize.close();
  });

  it('should correctly calculate Comprehensive investment profits including taxes from contracts', async () => {
    // 1. Setup Data
    
    const branch = await models.Branch.create({ name: 'Test Branch' });
    const adminRole = await models.Role.create({ name: 'admin' });
    // Create the admin user
    const adminUser = await models.User.create({
            email: 'admin@fadaa.dz',
            first_name: 'admin',
            last_name: 'admin',
            phone: '+213555000001',
            role_id: adminRole.id,
            branch_id: branch.id,
            password_hash: hashPassword('admin$123')
        });    
    const office = await models.Office.create({ name: 'Test Office', branch_id: branch.id, type: 'Coworking Desk' });
    const profile = await models.Profile.create({ name: 'Test Profile' });
    const client = await models.Client.create({ company_name: 'Test Client', first_name: 'Test Client 3', last_name: 'Test Client', phone_number: '+1234567890', status: 'Active' });

    // Investment
    const investment = await models.Investment.create({
      name: 'Inv 1',
      type: 'Comprehensive',
      percentage: 50,
      starting_date: new Date('2024-01-01'),
      ending_date: new Date('2024-12-31'),
      profile_id: profile.id,
      branch_id: branch.id,
      investment_amount: 10000
    });

    // Tax
    const tax = await models.Tax.create({ name: 'VAT', rate: 10, bearer: 'Client' });

    // Contract
    const contract = await models.Contract.create({
      name: 'Contract A',
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-12-31'),
      monthly_rate: 1000,
      client_id: client.id,
      office_id: office.id,
      profile_id: profile.id,
      status: 'Active'
    });
    
    // Associate Tax
    await contract.addTax(tax);
    
    const serviceCategory = await models.ServiceCategory.create({
      name: 'Energy'
    });

    // Service (Linked to Contract to satisfy branch filter)
    await models.ClientService.create({
      price: 1000,
      transaction_date: new Date('2024-06-01'),
      profile_id: profile.id,
      contract_id: contract.id,
      client_id: client.id,
      payment_type: 'Cash',
      service_category_id: serviceCategory.id
    });

    const incomeCategory = await models.IncomeCategory.create({ name: 'Basic Income'})
    // Income
    await models.Income.create({
      amount: 500,
      transaction_date: new Date('2024-06-01'),
      profile_id: profile.id,
      branch_id: branch.id,
      description: 'Training',
      registered_by: adminUser.id,
      category_id: incomeCategory.id
    });

    // Expense
    await models.Expense.create({
      amount: 1000,
      transaction_date: new Date('2024-06-01'),
      profile_id: profile.id,
      branch_id: branch.id,
      description: 'Invoice',
      registered_by: adminUser.id
    });

    // 2. Execute
    const result = await getInvestmentCalculations([investment]);
    const calculation = result[investment.id];

    // 3. Verify
    // Contract Revenue: 12 months * 1000 = 12000
    // Service Revenue: 1000
    // Other Income: 500
    // Total Income: 13500
    // Total Expense: 1000
    // Net Profit: 12500
    // Gross Share (50%): 6250
    // Tax (10% of Gross Share): 625
    // Net Share: 5625

    expect(calculation).toBeDefined();
    expect(calculation.branchNetProfitSelectedPeriod).toBeCloseTo(12500); //12500.000000000002
    expect(calculation.details.totalIncome).toBeCloseTo(13500); //13500.000000000002
    expect(calculation.details.grossProfitShare).toBeCloseTo(6250); //6250.000000000001
    expect(calculation.details.totalTaxAmount).toBeCloseTo(625); //625.0000000000001
    expect(calculation.details.netProfitShare).toBeCloseTo(5625); //5625.000000000001
    expect(calculation.yourProfitShareSelectedPeriod).toBeCloseTo(5625); //5625.000000000001

    // Verify Taxes
    expect(calculation.details.appliedTaxes).toHaveLength(1);
    expect(calculation.details.appliedTaxes[0].name).toBe('VAT');
    expect(calculation.details.appliedTaxes[0].amount).toBeCloseTo(625); //625.0000000000001
  });

  it('should correctly calculate Contractual investment profits including taxes from contracts', async () => {
    // 1. Setup Data
    const branch = await models.Branch.create({ name: 'Test Branch 2' });
    const office = await models.Office.create({ name: 'Test Office 2', branch_id: branch.id, type: 'Coworking Desk' });
    const profile = await models.Profile.create({ name: 'Test Profile 2' });
    const client = await models.Client.create({ company_name: 'Test Client 2', first_name: 'Test Client 3', last_name: 'Test Client 2', phone_number: '+1234567890', status: 'Active' });

    const investment = await models.Investment.create({
      name: 'Inv 2',
      type: 'Contractual',
      percentage: 20,
      starting_date: new Date('2024-01-01'),
      ending_date: new Date('2024-12-31'),
      profile_id: profile.id,
      branch_id: branch.id,
      investment_amount: 5000
    });

    const tax = await models.Tax.create({ name: 'Service Tax', rate: 5, bearer: 'Client' });

    const contract = await models.Contract.create({
      name: 'Contract B',
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-12-31'),
      monthly_rate: 2000,
      client_id: client.id,
      office_id: office.id,
      profile_id: profile.id,
      status: 'Active'
    });

    await contract.addTax(tax);

    // 2. Execute
    const result = await getInvestmentCalculations([investment]);
    const calculation = result[investment.id];

    // 3. Verify
    // Contract Revenue: 12 * 2000 = 24000
    // Net Profit (Contractual) = Contract Revenue = 24000
    // Gross Share (20%): 4800
    // Tax (5% of Gross Share): 240
    // Net Share: 4560

    expect(calculation).toBeDefined();
    expect(calculation.branchNetProfitSelectedPeriod).toBeCloseTo(24000); //24000.000000000004
    expect(calculation.details.contractRevenue).toBeCloseTo(24000);
    expect(calculation.details.grossProfitShare).toBeCloseTo(4800);
    expect(calculation.details.totalTaxAmount).toBeCloseTo(240);
    expect(calculation.details.netProfitShare).toBeCloseTo(4560);
    expect(calculation.yourProfitShareSelectedPeriod).toBeCloseTo(4560);
  });

  it('should handle duplicate taxes correctly across multiple contracts', async () => {
    // 1. Setup Data
    const branch = await models.Branch.create({ name: 'Test Branch 3' });
    const office = await models.Office.create({ name: 'Test Office 3', branch_id: branch.id, type: 'Coworking Desk' });
    const profile = await models.Profile.create({ name: 'Test Profile 3' });
    const client = await models.Client.create({ company_name: 'Test Client 3', first_name: 'Test Client 3', last_name: 'Test Client 3', phone_number: '+1234567890', status: 'Active' });

    const investment = await models.Investment.create({
      name: 'Inv 3',
      type: 'Comprehensive',
      percentage: 100,
      starting_date: new Date('2024-01-01'),
      ending_date: new Date('2024-12-31'),
      profile_id: profile.id,
      branch_id: branch.id,
      investment_amount: 1000
    });

    const tax = await models.Tax.create({ name: 'VAT', rate: 10, bearer: 'Client' });

    // Contract 1
    const contract1 = await models.Contract.create({
      name: 'Contract C1',
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-12-31'),
      monthly_rate: 100, // 1200
      client_id: client.id,
      office_id: office.id,
      profile_id: profile.id,
      status: 'Active'
    });
    await contract1.addTax(tax);

    // Contract 2 (Same tax)
    const contract2 = await models.Contract.create({
      name: 'Contract C2',
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-12-31'),
      monthly_rate: 100, // 1200
      client_id: client.id,
      office_id: office.id,
      profile_id: profile.id,
      status: 'Active'
    });
    await contract2.addTax(tax);

    // 2. Execute
    const result = await getInvestmentCalculations([investment]);
    const calculation = result[investment.id];

    // 3. Verify
    // Contract Revenue: 1200 + 1200 = 2400
    // Total Income: 2400
    // Net Profit: 2400
    // Gross Share (100%): 2400
    // Tax (10% of Gross Share): 240 (Applied ONCE because it's the same tax ID)
    // Net Share: 2160

    expect(calculation.details.appliedTaxes).toHaveLength(1);
    expect(calculation.details.totalTaxAmount).toBe(240);
    expect(calculation.yourProfitShareSelectedPeriod).toBe(2160);
  });
  
});
