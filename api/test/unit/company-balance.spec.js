import { describe, it, expect } from "vitest";
import { calculateCompanyBalance } from '../../lib/calculations';

describe('Company Balance Calculation (Pure)', () => {

  it('should correctly calculate positive balance with all inflows and outflows', () => {
    const data = {
      lifetimeServicesRevenue: 1000,
      lifetimeContractsRevenue: 2000,
      lifetimeIncomes: 500,
      lifetimeInvestments: 10000, // Total Inflow: 13500
      lifetimeExpenses: 3000,
      lifetimeWithdrawals: 2000   // Total Outflow: 5000
    };
    // Balance = 13500 - 5000 = 8500
    const balance = calculateCompanyBalance(data);
    expect(balance).toBe(8500);
  });

  it('should correctly calculate negative balance (deficit)', () => {
    const data = {
      lifetimeServicesRevenue: 0,
      lifetimeContractsRevenue: 0,
      lifetimeIncomes: 0,
      lifetimeInvestments: 1000, 
      lifetimeExpenses: 5000,
      lifetimeWithdrawals: 0
    };
    // Balance = 1000 - 5000 = -4000
    const balance = calculateCompanyBalance(data);
    expect(balance).toBe(-4000);
  });

  it('should handle missing or zero values gracefully', () => {
    const data = {
      lifetimeInvestments: 1000,
      // others undefined
    };
    const balance = calculateCompanyBalance(data);
    expect(balance).toBe(1000);
  });

  it('should return zero when no data is provided', () => {
    const balance = calculateCompanyBalance({});
    expect(balance).toBe(0);
  });

  it('should calculate balance with floating point numbers correctly', () => {
    const data = {
      lifetimeServicesRevenue: 100.50,
      lifetimeInvestments: 50.25,
      lifetimeExpenses: 20.25
    };
    // 150.75 - 20.25 = 130.5
    const balance = calculateCompanyBalance(data);
    expect(balance).toBeCloseTo(130.5, 2);
  });

});
