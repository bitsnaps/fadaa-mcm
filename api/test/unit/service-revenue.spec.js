import { describe, it, expect } from "vitest";
const { calculateServiceRevenue } = require('../../lib/calculations');

describe('Service Revenue Calculation', () => {
    it('should calculate the total revenue from a list of client services', async () => {
        const clientServices = [
            { price: '100.00' },
            { price: '250.50' },
            { price: '50.25' },
        ];
        const revenue = await calculateServiceRevenue({ clientServices });
        expect(revenue).toBe(400.75);
    });

    it('should calculate the total revenue with company-borne taxes', async () => {
        const clientServices = [
            { price: '100.00', Tax: { rate: '10.00', bearer: 'Company' } },
            { price: '200.00', Tax: { rate: '20.00', bearer: 'Company' } },
            { price: '300.00', Tax: { rate: '5.00', bearer: 'Client' } }, // This tax should be ignored
        ];
        // Calculation: (100 - 10) + (200 - 40) + 300 = 90 + 160 + 300 = 550
        const revenue = await calculateServiceRevenue({ clientServices, withTaxes: true });
        expect(revenue).toBe(550);
    });

    it('should return 0 if there are no client services', async () => {
        const clientServices = [];
        const revenue = await calculateServiceRevenue({ clientServices });
        expect(revenue).toBe(0);
    });

    it('should handle services with invalid prices', async () => {
        const clientServices = [
            { price: '100.00' },
            { price: 'invalid' },
            { price: '50.00' },
        ];
        const revenue = await calculateServiceRevenue({ clientServices });
        expect(revenue).toBe(150.00);
    });
});