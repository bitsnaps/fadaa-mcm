import { describe, it, expect } from "vitest";
const { calculateContractRevenue } = require('../../lib/calculations');

describe('Investment Revenue Calculation', () => {
    it('should correctly calculate the investment revenue, excluding contracts signed before the investment start date', () => {
        const investment_start_date = new Date('2024-08-10');
        const investment_end_date = new Date('2025-12-14');

        const contracts = [
            {
                name: 'Old Contract',
                start_date: new Date('2024-07-15'),
                end_date: new Date('2025-12-14'),
                monthly_rate: 1000,
            },
            {
                name: 'New Contract',
                start_date: new Date('2024-09-01'),
                end_date: new Date('2025-09-01'),
                monthly_rate: 2000,
            },
        ];

        const investment = {
            starting_date: investment_start_date,
            ending_date: investment_end_date,
        };

        const revenue = calculateContractRevenue(contracts, investment);

        expect(revenue).toBe(24000);
    });
});