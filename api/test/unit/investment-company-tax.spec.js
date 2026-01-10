import { describe, it, expect } from 'vitest';
import { calculateContractRevenueForPeriod, calculateServiceRevenue } from '../../lib/calculations';

describe('Investment Company Tax Calculations', () => {

  // Mock Data
  const companyTax = { id: 1, name: 'Company Tax', rate: 15, bearer: 'Company' };
  const clientTax = { id: 2, name: 'Client Tax', rate: 10, bearer: 'Client' };

  it('should deduct Company taxes from Contract Revenue', () => {
    // Setup
    const contracts = [
      {
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        monthly_rate: 10000,
        taxes: [companyTax]
      }
    ];
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-12-31');

    // Execute
    const revenue = calculateContractRevenueForPeriod(contracts, startDate, endDate);

    // Verify
    // Monthly Rate: 10000
    // Company Tax (15%): 1500
    // Net Monthly Rate: 8500
    // Duration: 12 months
    // Total Revenue: 8500 * 12 = 102000
    expect(revenue).toBeCloseTo(102000);
  });

  it('should NOT deduct Client taxes from Contract Revenue', () => {
    // Setup
    const contracts = [
      {
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        monthly_rate: 10000,
        taxes: [clientTax]
      }
    ];
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-12-31');

    // Execute
    const revenue = calculateContractRevenueForPeriod(contracts, startDate, endDate);

    // Verify
    // Monthly Rate: 10000
    // Client Tax is not deducted from revenue (it's added on top for client to pay)
    // Net Monthly Rate: 10000
    // Duration: 12 months
    // Total Revenue: 10000 * 12 = 120000
    expect(revenue).toBeCloseTo(120000); //119999.99999999999
  });

  it('should deduct Company taxes from Service Revenue', () => {
    // Setup
    const clientServices = [
      {
        price: 1000,
        Tax: companyTax
      }
    ];

    // Execute
    const revenue = calculateServiceRevenue({ clientServices, withTaxes: true });

    // Verify
    // Price: 1000
    // Company Tax (15%): 150
    // Net Revenue: 850
    expect(revenue).toBeCloseTo(850);
  });

  it('should NOT deduct Client taxes from Service Revenue', () => {
    // Setup
    const clientServices = [
      {
        price: 1000,
        Tax: clientTax
      }
    ];

    // Execute
    const revenue = calculateServiceRevenue({ clientServices, withTaxes: true });

    // Verify
    // Price: 1000
    // Client Tax is not deducted
    // Net Revenue: 1000
    expect(revenue).toBeCloseTo(1000);
  });

  it('should handle multiple taxes correctly (Company + Client)', () => {
     // Setup
     const contracts = [
        {
          start_date: new Date('2024-01-01'),
          end_date: new Date('2024-12-31'),
          monthly_rate: 10000,
          taxes: [companyTax, clientTax]
        }
      ];
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
  
      // Execute
      const revenue = calculateContractRevenueForPeriod(contracts, startDate, endDate);
  
      // Verify
      // Monthly Rate: 10000
      // Company Tax (15%): 1500 (Deducted)
      // Client Tax (10%): 1000 (Not Deducted from revenue)
      // Net Monthly Rate: 8500
      // Duration: 12 months
      // Total Revenue: 8500 * 12 = 102000
      expect(revenue).toBeCloseTo(102000);
  });

  it('should handle partial months correctly with Company tax', () => {
      // Setup: Contract lasts a full month
      const contracts = [
        {
          start_date: new Date('2024-01-01'),
          end_date: new Date('2024-01-31'),
          monthly_rate: 6000,
          taxes: [companyTax]
        }
      ];
      // Period covers only half the contract
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-15');
  
      // Execute
      const revenue = calculateContractRevenueForPeriod(contracts, startDate, endDate);
  
      // Verify
      // Monthly Rate: 6000
      // Company Tax (15%): 900
      // Net Monthly Rate: 5100
      // Contract Duration: 1 month
      // Total Contract Revenue: 5100
      // Daily Rate: 5100 / 30 = 170
      // Overlap (Jan 1 to Jan 15 midnight): 14 days
      // Revenue: 170 * 14 = 2380
      
      expect(revenue).toBeGreaterThan(0);
      expect(revenue).toBeLessThan(5100);
      expect(revenue).toBeCloseTo(2380);
  });

  it('should return 0 revenue if contract dates are invalid', () => {
      const contracts = [
        {
          start_date: 'invalid-date',
          end_date: new Date('2024-12-31'),
          monthly_rate: 10000,
          taxes: [companyTax]
        }
      ];
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
  
      const revenue = calculateContractRevenueForPeriod(contracts, startDate, endDate);
      expect(revenue).toBe(0);
  });

});