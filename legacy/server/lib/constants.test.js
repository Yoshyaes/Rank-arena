import { describe, it, expect } from 'vitest';

// Need to set up env before requiring modules
process.env.SQLITE_PATH = ':memory:';
process.env.ADMIN_PASSWORD = 'test';

const { STAT_LABELS, VALID_STAT_CATEGORIES } = require('./constants');

describe('constants', () => {
  it('should have STAT_LABELS for all categories', () => {
    expect(STAT_LABELS).toBeDefined();
    expect(STAT_LABELS.metacritic).toBe('Metacritic Score');
    expect(STAT_LABELS.sales_millions).toBe('Total Sales');
    expect(STAT_LABELS.peak_players).toBe('Peak Steam Players');
    expect(STAT_LABELS.avg_playtime_hours).toBe('Avg Playtime');
    expect(STAT_LABELS.user_score).toBe('User Score');
  });

  it('should have VALID_STAT_CATEGORIES matching STAT_LABELS keys', () => {
    expect(VALID_STAT_CATEGORIES).toEqual(Object.keys(STAT_LABELS));
  });

  it('should have exactly 5 stat categories', () => {
    expect(VALID_STAT_CATEGORIES).toHaveLength(5);
  });
});
