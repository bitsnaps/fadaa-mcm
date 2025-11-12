import { describe, it, expect, beforeEach } from 'vitest';
const models = require('../../models');

function getContractDurationInMonths(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  let months = (end.getFullYear() - start.getFullYear()) * 12;
  months -= start.getMonth();
  months += end.getMonth();

  return months <= 0 ? 1 : months + 1;
}

function calculateNetTotalAmount(contract) {
  const durationInMonths = getContractDurationInMonths(
    contract.start_date,
    contract.end_date,
  );

  const companyTaxRate = (contract.taxes || []).reduce((sum, tax) => {
    if (tax.bearer === 'Company') {
      return sum + (parseFloat(tax.rate) || 0);
    }
    return sum;
  }, 0);

  return (
    parseFloat(contract.monthly_rate) *
    durationInMonths *
    (1 - companyTaxRate / 100)
  );
}

describe('Contract API with Net Total Calculation', () => {
  let singleContract;
  let multipleContracts;

  beforeEach(() => {
    singleContract = {
      id: 1,
      start_date: '2025-04-15',
      end_date: '2026-04-14', // 12 months inclusive => 12
      monthly_rate: '1000.00',
      taxes: [{ name: 'Company Tax', rate: '15.00', bearer: 'Company' }],
    };

    multipleContracts = [
      {
        id: 1,
        start_date: '2025-04-15',
        end_date: '2026-04-14', // 12 months
        monthly_rate: '1000.00',
        taxes: [{ name: 'Company Tax', rate: '15.00', bearer: 'Company' }],
      },
      {
        id: 2,
        start_date: '2025-03-10',
        end_date: '2025-12-12', // 10 months
        monthly_rate: '1500.00',
        taxes: [{ name: 'Company Tax', rate: '15.00', bearer: 'Company' }],
      },
    ];
  });

  it('should calculate net_total_amount for a single contract', () => {
    const netTotal = calculateNetTotalAmount(singleContract);
    expect(netTotal).toBeCloseTo(11050);
  });

  it('should calculate net_total_amount for a list of contracts', () => {
    const [c1, c2] = multipleContracts;

    const net1 = calculateNetTotalAmount(c1);
    const net2 = calculateNetTotalAmount(c2);
    expect(net1).toBeCloseTo(11050);
    expect(net2).toBeCloseTo(12750);
  });
});