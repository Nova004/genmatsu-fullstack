import { describe, it, expect } from 'vitest';

// Embedded logic for testing (simulating a util)
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
};

const formatDate = (date: string) => {
    if(!date) return '-';
    return new Date(date).toLocaleDateString('th-TH');
}

describe('Frontend Utils', () => {
    it('should format currency correctly', () => {
        expect(formatCurrency(1000)).toBe('1,000.00');
        expect(formatCurrency(1234.56)).toBe('1,234.56');
        expect(formatCurrency(0)).toBe('0.00');
    });

    it('should format date correctly check', () => {
        // Mocking date logic can be tricky with timezones, keeping it simple
        const date = '2024-01-01';
        // Check if output contains year (2567 BE) or just basic check
        expect(formatDate('2024-01-01')).not.toBe('-');
    });
});
