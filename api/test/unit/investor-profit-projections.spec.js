import { describe, it, expect, beforeEach, afterAll } from 'vitest';
const models = require('../../models');
const { getInvestmentCalculations } = require('../../controllers/investmentController');

describe('Investor Profit Projections', () => {
  
  beforeEach(async () => {
    await models.sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await models.sequelize.close();
  });

  it('should correctly calculate Monthly and Projected profits for an investment', async () => {
    // 1. Setup Data
    const branch = await models.Branch.create({ name: 'Test Branch Proj' });
    const office = await models.Office.create({ name: 'Test Office Proj', branch_id: branch.id, type: 'Coworking Desk' });
    const profile = await models.Profile.create({ name: 'Test Profile Proj' });
    const client = await models.Client.create({ company_name: 'Test Client Proj', first_name: 'Test', last_name: 'Client', phone_number: '+1234567890', status: 'Active' });

    // Investment spanning a year
    const investmentStart = new Date('2024-01-01');
    const investmentEnd = new Date('2024-12-31');
    
    const investment = await models.Investment.create({
      name: 'Inv Proj',
      type: 'Contractual', // Easier to predict for projection test
      percentage: 10,
      starting_date: investmentStart,
      ending_date: investmentEnd,
      profile_id: profile.id,
      branch_id: branch.id,
      investment_amount: 10000
    });

    // Contract covering the whole period
    await models.Contract.create({
      name: 'Contract Proj',
      start_date: investmentStart,
      end_date: investmentEnd,
      monthly_rate: 1000,
      client_id: client.id,
      office_id: office.id,
      profile_id: profile.id,
      status: 'Active'
    });

    // 2. Simulate Logic from api/routes/investor.js
    
    // --- Monthly Profit Calculation (Simulate "Current Month" as Jan 2024) ---
    // Note: In a real scenario, "now" is dynamic. Here we simulate a specific month window.
    const startOfMonth = new Date('2024-01-01');
    const endOfMonth = new Date('2024-01-31T23:59:59.999Z');
    
    const monthlyInput = { 
        ...investment.toJSON(), 
        starting_date: startOfMonth, 
        ending_date: endOfMonth 
    };
    
    const monthlyCalcMap = await getInvestmentCalculations([monthlyInput]);
    const monthlyProfit = monthlyCalcMap[investment.id].yourProfitShareSelectedPeriod;

    // Verify Monthly Profit
    // Revenue for Jan: 1000
    // Profit Share (10%): 100
    expect(monthlyProfit).toBeCloseTo(101.92); // 101.91780818112636


    // --- Projected Profit Calculation (Full Duration) ---
    const projectedInput = { ...investment.toJSON() }; // Uses original start/end dates
    const projectedCalcMap = await getInvestmentCalculations([projectedInput]);
    const projectedProfit = projectedCalcMap[investment.id].yourProfitShareSelectedPeriod;

    // Verify Projected Profit
    // Total Revenue (12 months): 12 * 1000 = 12000
    // Profit Share (10%): 1200
    expect(projectedProfit).toBeCloseTo(1200);
  });
});