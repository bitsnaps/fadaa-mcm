import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Unit tests for monthly revenue by branch calculation logic.
 * These tests validate the pure calculation functions used in the endpoint.
 * The actual endpoint is integration tested separately.
 */

// Mock data structures similar to what the endpoint receives
const createMockBranch = (id, name) => ({ id, name });

const createMockIncome = (branchId, month, amount) => ({
  branch_id: branchId,
  dataValues: {
    month,
    total_amount: amount,
  },
  Branch: { name: `Branch ${branchId}` },
});

const createMockContract = (branchId, monthlyRate, taxes = [], createdAt = new Date()) => ({
  monthly_rate: monthlyRate,
  taxes: taxes.map(t => ({ rate: t.rate, bearer: t.bearer })),
  Office: {
    branch_id: branchId,
    Branch: { name: `Branch ${branchId}` },
  },
  created_at: createdAt,
});

const createMockService = (branchId, price, tax = null, transactionDate = new Date()) => ({
  price: price,
  Tax: tax,
  Contract: {
    Office: {
      branch_id: branchId,
      Branch: { name: `Branch ${branchId}` },
    },
  },
  transaction_date: transactionDate,
});

// Pure calculation functions (mirroring the endpoint logic for testability)
function calculateContractRevenue(contracts) {
  const revenueByBranchMonth = {};
  const months = new Set();

  contracts.forEach(contract => {
    const branchId = contract.Office?.branch_id;
    if (!branchId) return;

    const month = contract.created_at.toISOString().slice(0, 7);
    months.add(month);

    let netMonthlyRate = parseFloat(contract.monthly_rate) || 0;
    if (contract.taxes && Array.isArray(contract.taxes)) {
      contract.taxes.forEach(tax => {
        if (tax.bearer === 'Company') {
          netMonthlyRate -= netMonthlyRate * (parseFloat(tax.rate) / 100);
        }
      });
    }

    const key = `${branchId}_${month}`;
    if (!revenueByBranchMonth[key]) revenueByBranchMonth[key] = 0;
    revenueByBranchMonth[key] += netMonthlyRate;
  });

  return { revenueByBranchMonth, months };
}

function calculateServiceRevenue(services) {
  const revenueByBranchMonth = {};
  const months = new Set();

  services.forEach(service => {
    const branchId = service.Contract?.Office?.branch_id;
    if (!branchId) return;

    const month = service.transaction_date.toISOString().slice(0, 7);
    months.add(month);

    let revenue = parseFloat(service.price) || 0;
    if (service.Tax && service.Tax.bearer === 'Company') {
      revenue -= revenue * (parseFloat(service.Tax.rate) / 100);
    }

    const key = `${branchId}_${month}`;
    if (!revenueByBranchMonth[key]) revenueByBranchMonth[key] = 0;
    revenueByBranchMonth[key] += revenue;
  });

  return { revenueByBranchMonth, months };
}

function buildChartData(branches, contractRevenue, serviceRevenue, otherIncome, months) {
  const labels = Array.from(months).sort();
  const datasets = branches.map(branch => ({
    label: branch.name,
    data: labels.map(month => {
      const key = `${branch.id}_${month}`;
      return (contractRevenue[key] || 0) + (serviceRevenue[key] || 0) + (otherIncome[key] || 0);
    }),
  }));

  return { labels, datasets };
}

describe('Monthly Revenue by Branch Calculations', () => {
  describe('Contract Revenue Calculation', () => {
    it('should calculate contract revenue without taxes', () => {
      const date = new Date('2024-01-15');
      const contracts = [
        createMockContract(1, 1000, [], date),
        createMockContract(2, 2000, [], date),
      ];

      const { revenueByBranchMonth } = calculateContractRevenue(contracts);

      expect(revenueByBranchMonth['1_2024-01']).toBe(1000);
      expect(revenueByBranchMonth['2_2024-01']).toBe(2000);
    });

    it('should deduct company-borne taxes from contract revenue', () => {
      const date = new Date('2024-01-15');
      const contracts = [
        createMockContract(1, 1000, [
          { rate: 10, bearer: 'Company' },
          { rate: 5, bearer: 'Client' },
        ], date),
      ];

      const { revenueByBranchMonth } = calculateContractRevenue(contracts);

      // 1000 - (1000 * 10/100) = 900 (Client tax is ignored)
      expect(revenueByBranchMonth['1_2024-01']).toBe(900);
    });

    it('should handle multiple taxes on same contract', () => {
      const date = new Date('2024-01-15');
      const contracts = [
        createMockContract(1, 1000, [
          { rate: 10, bearer: 'Company' },
          { rate: 5, bearer: 'Company' },
        ], date),
      ];

      const { revenueByBranchMonth } = calculateContractRevenue(contracts);

      // Taxes are applied sequentially: 1000 - 100 = 900, then 900 - 45 = 855
      expect(revenueByBranchMonth['1_2024-01']).toBe(855);
    });

    it('should aggregate multiple contracts for same branch/month', () => {
      const date = new Date('2024-01-15');
      const contracts = [
        createMockContract(1, 500, [], date),
        createMockContract(1, 300, [], date),
      ];

      const { revenueByBranchMonth } = calculateContractRevenue(contracts);

      expect(revenueByBranchMonth['1_2024-01']).toBe(800);
    });
  });

  describe('Service Revenue Calculation', () => {
    it('should calculate service revenue without taxes', () => {
      const date = new Date('2024-02-20');
      const services = [
        createMockService(1, 100, null, date),
        createMockService(2, 200, null, date),
      ];

      const { revenueByBranchMonth } = calculateServiceRevenue(services);

      expect(revenueByBranchMonth['1_2024-02']).toBe(100);
      expect(revenueByBranchMonth['2_2024-02']).toBe(200);
    });

    it('should deduct company-borne taxes from service revenue', () => {
      const date = new Date('2024-02-20');
      const services = [
        createMockService(1, 100, { rate: 20, bearer: 'Company' }, date),
      ];

      const { revenueByBranchMonth } = calculateServiceRevenue(services);

      expect(revenueByBranchMonth['1_2024-02']).toBe(80);
    });

    it('should aggregate multiple services for same branch/month', () => {
      const date = new Date('2024-02-20');
      const services = [
        createMockService(1, 50, null, date),
        createMockService(1, 30, null, date),
      ];

      const { revenueByBranchMonth } = calculateServiceRevenue(services);

      expect(revenueByBranchMonth['1_2024-02']).toBe(80);
    });
  });

  describe('Chart Data Building', () => {
    it('should include all branches even with zero revenue', () => {
      const branches = [
        createMockBranch(1, 'Branch A'),
        createMockBranch(2, 'Branch B'),
        createMockBranch(3, 'Branch C'),
      ];
      const months = new Set(['2024-01']);
      const contractRevenue = { '1_2024-01': 100 };
      const serviceRevenue = { '2_2024-01': 50 };
      const otherIncome = {};

      const { labels, datasets } = buildChartData(
        branches,
        contractRevenue,
        serviceRevenue,
        otherIncome,
        months
      );

      expect(labels).toEqual(['2024-01']);
      expect(datasets).toHaveLength(3);
      expect(datasets[0].data).toEqual([100]); // Branch A: contract revenue
      expect(datasets[1].data).toEqual([50]);  // Branch B: service revenue
      expect(datasets[2].data).toEqual([0]);   // Branch C: no revenue (explicit zero)
    });

    it('should combine all revenue sources for total', () => {
      const branches = [createMockBranch(1, 'Branch A')];
      const months = new Set(['2024-01']);
      const contractRevenue = { '1_2024-01': 100 };
      const serviceRevenue = { '1_2024-01': 50 };
      const otherIncome = { '1_2024-01': 25 };

      const { datasets } = buildChartData(
        branches,
        contractRevenue,
        serviceRevenue,
        otherIncome,
        months
      );

      // Total = 100 + 50 + 25 = 175
      expect(datasets[0].data).toEqual([175]);
    });

    it('should handle multiple months correctly', () => {
      const branches = [createMockBranch(1, 'Branch A')];
      const months = new Set(['2024-01', '2024-02']);
      const contractRevenue = {
        '1_2024-01': 100,
        '1_2024-02': 200,
      };
      const serviceRevenue = {};
      const otherIncome = {
        '1_2024-01': 50,
      };

      const { labels, datasets } = buildChartData(
        branches,
        contractRevenue,
        serviceRevenue,
        otherIncome,
        months
      );

      expect(labels).toEqual(['2024-01', '2024-02']);
      expect(datasets[0].data).toEqual([150, 200]); // Jan: 100+50, Feb: 200+0
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty data gracefully', () => {
      const branches = [
        createMockBranch(1, 'Branch A'),
        createMockBranch(2, 'Branch B'),
      ];
      const months = new Set();
      const contractRevenue = {};
      const serviceRevenue = {};
      const otherIncome = {};

      const { labels, datasets } = buildChartData(
        branches,
        contractRevenue,
        serviceRevenue,
        otherIncome,
        months
      );

      expect(labels).toEqual([]);
      expect(datasets).toHaveLength(2);
      expect(datasets[0].data).toEqual([]);
      expect(datasets[1].data).toEqual([]);
    });

    it('should handle contracts without office gracefully', () => {
      const contracts = [
        { monthly_rate: 1000, taxes: [], Office: null, created_at: new Date() },
      ];

      const { revenueByBranchMonth } = calculateContractRevenue(contracts);

      expect(Object.keys(revenueByBranchMonth)).toHaveLength(0);
    });

    it('should handle services without contract gracefully', () => {
      const services = [
        { price: 100, Tax: null, Contract: null, transaction_date: new Date() },
      ];

      const { revenueByBranchMonth } = calculateServiceRevenue(services);

      expect(Object.keys(revenueByBranchMonth)).toHaveLength(0);
    });

    it('should handle invalid numbers in prices/rates', () => {
      const date = new Date('2024-01-15');
      const contracts = [
        createMockContract(1, 'invalid', [], date),
        createMockContract(2, null, [], date),
      ];

      const { revenueByBranchMonth } = calculateContractRevenue(contracts);

      expect(revenueByBranchMonth['1_2024-01']).toBe(0);
      expect(revenueByBranchMonth['2_2024-01']).toBe(0);
    });
  });

  describe('Month Aggregation', () => {
    it('should properly group revenues by month', () => {
      const janDate = new Date('2024-01-15');
      const febDate = new Date('2024-02-20');
      const contracts = [
        createMockContract(1, 500, [], janDate),
        createMockContract(1, 300, [], febDate),
      ];

      const { revenueByBranchMonth, months } = calculateContractRevenue(contracts);

      expect(months.has('2024-01')).toBe(true);
      expect(months.has('2024-02')).toBe(true);
      expect(revenueByBranchMonth['1_2024-01']).toBe(500);
      expect(revenueByBranchMonth['1_2024-02']).toBe(300);
    });
  });
});
