import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { commissionSettingsTable } from '../db/schema';
import { getCommissionSettings } from '../handlers/get_commission_settings';

describe('getCommissionSettings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return default settings when no settings exist', async () => {
    const result = await getCommissionSettings();

    expect(result.recurring_percentage).toEqual(10.00);
    expect(result.one_time_percentage).toEqual(5.00);
    expect(typeof result.recurring_percentage).toEqual('number');
    expect(typeof result.one_time_percentage).toEqual('number');
  });

  it('should return existing settings from database', async () => {
    // Insert custom settings
    await db.insert(commissionSettingsTable)
      .values({
        recurring_percentage: '15.50',
        one_time_percentage: '7.25'
      })
      .execute();

    const result = await getCommissionSettings();

    expect(result.recurring_percentage).toEqual(15.50);
    expect(result.one_time_percentage).toEqual(7.25);
    expect(typeof result.recurring_percentage).toEqual('number');
    expect(typeof result.one_time_percentage).toEqual('number');
  });

  it('should handle numeric conversion correctly', async () => {
    // Insert settings with decimal values
    await db.insert(commissionSettingsTable)
      .values({
        recurring_percentage: '12.75',
        one_time_percentage: '8.33'
      })
      .execute();

    const result = await getCommissionSettings();

    // Verify numeric conversion maintains precision
    expect(result.recurring_percentage).toEqual(12.75);
    expect(result.one_time_percentage).toEqual(8.33);
    expect(Number.isInteger(result.recurring_percentage)).toBe(false);
    expect(Number.isInteger(result.one_time_percentage)).toBe(false);
  });

  it('should return first row when multiple settings exist', async () => {
    // Insert multiple settings (edge case)
    await db.insert(commissionSettingsTable)
      .values([
        {
          id: 1,
          recurring_percentage: '20.00',
          one_time_percentage: '10.00'
        },
        {
          id: 2,
          recurring_percentage: '25.00',
          one_time_percentage: '12.50'
        }
      ])
      .execute();

    const result = await getCommissionSettings();

    // Should return the first row
    expect(result.recurring_percentage).toEqual(20.00);
    expect(result.one_time_percentage).toEqual(10.00);
  });

  it('should handle zero percentage values', async () => {
    // Insert zero values
    await db.insert(commissionSettingsTable)
      .values({
        recurring_percentage: '0.00',
        one_time_percentage: '0.00'
      })
      .execute();

    const result = await getCommissionSettings();

    expect(result.recurring_percentage).toEqual(0.00);
    expect(result.one_time_percentage).toEqual(0.00);
    expect(typeof result.recurring_percentage).toEqual('number');
    expect(typeof result.one_time_percentage).toEqual('number');
  });
});