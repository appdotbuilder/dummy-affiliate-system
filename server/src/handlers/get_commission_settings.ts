import { db } from '../db';
import { commissionSettingsTable } from '../db/schema';
import { type CommissionSettings } from '../schema';

export const getCommissionSettings = async (): Promise<CommissionSettings> => {
  try {
    // Query the commission settings table
    const result = await db.select()
      .from(commissionSettingsTable)
      .execute();

    // If no settings exist, return default values
    if (result.length === 0) {
      return {
        recurring_percentage: 10.00,
        one_time_percentage: 5.00
      };
    }

    // Convert numeric fields back to numbers before returning
    const settings = result[0];
    return {
      recurring_percentage: parseFloat(settings.recurring_percentage),
      one_time_percentage: parseFloat(settings.one_time_percentage)
    };
  } catch (error) {
    console.error('Get commission settings failed:', error);
    throw error;
  }
};