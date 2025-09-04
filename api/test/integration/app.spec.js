import { describe, it, expect } from "vitest";
const app = require('../../index');

describe('API Endpoints', () => {
    it('should return a 404 for a non-existent route', async () => {
        const res = await app.request('/api/non-existent-route');
        expect(res.status).toBe(404);
    });

    it('should return a 200 for the csrf route', async () => {
        const res = await app.request('/api/csrf?ts=123');
        expect(res.status).toBe(200);
    });
});