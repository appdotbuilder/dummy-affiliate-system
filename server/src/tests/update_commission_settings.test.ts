import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { commissionSettingsTable } from '../db/schema';
import { type UpdateCommissionSettingsInput } from '../schema';
import { updateCommissionSettings } from '../handlers/update_commission_settings';
import { eq } from 'drizzle-orm';

// Test input with valid commission percentages
const testInput: UpdateCommissionSettingsInput = {
  recurring_percentage: 15.0,
  one_time_percentage: 8.5
};

describe('updateCommissionSettings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create commission settings when none exist', async () => {
    const result = await updateCommissionSettings(testInput);

    // Basic field validation
    expect(result.recurring_percentage).toEqual(15.0);
    expect(result.one_time_percentage).toEqual(8.5);
    expect(typeof result.recurring_percentage).toBe('number');
    expect(typeof result.one_time_percentage).toBe('number');
  });

  it('should save commission settings to database when creating new', async () => {
    const result = await updateCommissionSettings(testInput);

    // Query database to verify settings were created
    const settings = await db.select()
      .from(commissionSettingsTable)
      .where(eq(commissionSettingsTable.id, 1))
      .execute();

    expect(settings).toHaveLength(1);
    expect(parseFloat(settings[0].recurring_percentage)).toEqual(15.0);
    expect(parseFloat(settings[0].one_time_percentage)).toEqual(8.5);
    expect(settings[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update existing commission settings', async () => {
    // First, create initial settings
    await db.insert(commissionSettingsTable)
      .values({
        id: 1,
        recurring_percentage: '10.0',
        one_time_percentage: '5.0',
        updated_at: new Date()
      })
      .execute();

    // Update with new values
    const updateInput: UpdateCommissionSettingsInput = {
      recurring_percentage: 20.0,
      one_time_percentage: 12.0
    };

    const result = await updateCommissionSettings(updateInput);

    // Verify return values
    expect(result.recurring_percentage).toEqual(20.0);
    expect(result.one_time_percentage).toEqual(12.0);
  });

  it('should update database when existing settings are present', async () => {
    // Create initial settings
    await db.insert(commissionSettingsTable)
      .values({
        id: 1,
        recurring_percentage: '10.0',
        one_time_percentage: '5.0',
        updated_at: new Date()
      })
      .execute();

    // Update settings
    const updateInput: UpdateCommissionSettingsInput = {
      recurring_percentage: 25.5,
      one_time_percentage: 15.75
    };

    await updateCommissionSettings(updateInput);

    // Verify database was updated
    const settings = await db.select()
      .from(commissionSettingsTable)
      .where(eq(commissionSettingsTable.id, 1))
      .execute();

    expect(settings).toHaveLength(1);
    expect(parseFloat(settings[0].recurring_percentage)).toEqual(25.5);
    expect(parseFloat(settings[0].one_time_percentage)).toEqual(15.75);
    expect(settings[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle boundary values correctly', async () => {
    // Test with edge cases (0% and 100%)
    const boundaryInput: UpdateCommissionSettingsInput = {
      recurring_percentage: 0.0,
      one_time_percentage: 100.0
    };

    const result = await updateCommissionSettings(boundaryInput);

    expect(result.recurring_percentage).toEqual(0.0);
    expect(result.one_time_percentage).toEqual(100.0);

    // Verify in database
    const settings = await db.select()
      .from(commissionSettingsTable)
      .where(eq(commissionSettingsTable.id, 1))
      .execute();

    expect(parseFloat(settings[0].recurring_percentage)).toEqual(0.0);
    expect(parseFloat(settings[0].one_time_percentage)).toEqual(100.0);
  });

  it('should handle decimal precision correctly', async () => {
    // Test with high precision decimal values
    const precisionInput: UpdateCommissionSettingsInput = {
      recurring_percentage: 12.75,
      one_time_percentage: 7.25
    };

    const result = await updateCommissionSettings(precisionInput);

    expect(result.recurring_percentage).toEqual(12.75);
    expect(result.one_time_percentage).toEqual(7.25);

    // Verify precise storage and retrieval
    const settings = await db.select()
      .from(commissionSettingsTable)
      .where(eq(commissionSettingsTable.id, 1))
      .execute();

    expect(parseFloat(settings[0].recurring_percentage)).toEqual(12.75);
    expect(parseFloat(settings[0].one_time_percentage)).toEqual(7.25);
  });

  it('should update the updated_at timestamp', async () => {
    // Create initial settings with a known timestamp
    const initialTime = new Date('2023-01-01T00:00:00Z');
    await db.insert(commissionSettingsTable)
      .values({
        id: 1,
        recurring_percentage: '10.0',
        one_time_percentage: '5.0',
        updated_at: initialTime
      })
      .execute();

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update settings
    await updateCommissionSettings(testInput);

    // Verify timestamp was updated
    const settings = await db.select()
      .from(commissionSettingsTable)
      .where(eq(commissionSettingsTable.id, 1))
      .execute();

    expect(settings[0].updated_at).toBeInstanceOf(Date);
    expect(settings[0].updated_at > initialTime).toBe(true);
  });
});