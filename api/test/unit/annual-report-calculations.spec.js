import { describe, it, expect } from "vitest";
import {
  calculateContractRevenueForPeriod,
  calculateTotalRevenue,
  calculateProfit,
  calculateOccupancyRate,
} from '../../lib/calculations';

describe('Annual Report - Pure Calculations', () => {

  it('should calculate contract revenue for a specific period', () => {
    const contracts = [
      { start_date: '2025-01-01', end_date: '2025-12-31', monthly_rate: 1000 }, // 12 months
      { start_date: '2025-07-01', end_date: '2025-12-31', monthly_rate: 500 },  // 6 months
    ];
    const startDate = new Date('2025-01-01');
    const endDate = new Date('2025-12-31');
    const revenue = calculateContractRevenueForPeriod(contracts, startDate, endDate);
    // 1000*12 + 500*6 = 12000 + 3000 = 15000
    expect(revenue).toBeCloseTo(15000, 2);
  });

  it('should calculate total revenue correctly', () => {
    const totalRevenue = calculateTotalRevenue(50000, 5000, 15600);
    expect(totalRevenue).toBe(70600);
  });

  it('should calculate profit correctly', () => {
    const profit = calculateProfit(70600, 15000);
    expect(profit).toBe(55600);
  });

  it('should calculate occupancy rate correctly', () => {
    const occupancyRate = calculateOccupancyRate(15, 20);
    expect(occupancyRate).toBe(75);
  });

  it('should handle zero total offices for occupancy rate', () => {
    const occupancyRate = calculateOccupancyRate(0, 0);
    expect(occupancyRate).toBe(0);
  });

});