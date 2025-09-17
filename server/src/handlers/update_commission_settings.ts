import { db } from '../db';
import { commissionSettingsTable } from '../db/schema';
import { type UpdateCommissionSettingsInput, type CommissionSettings } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateCommissionSettings(input: UpdateCommissionSettingsInput): Promise<CommissionSettings> {
  try {
    // Update the commission settings (there's only one row with id = 1)
    const result = await db.update(commissionSettingsTable)
      .set({
        recurring_percentage: input.recurring_percentage.toString(),
        one_time_percentage: input.one_time_percentage.toString(),
        updated_at: new Date()
      })
      .where(eq(commissionSettingsTable.id, 1))
      .returning()
      .execute();

    // If no existing settings, create them
    if (result.length === 0) {
      const insertResult = await db.insert(commissionSettingsTable)
        .values({
          id: 1,
          recurring_percentage: input.recurring_percentage.toString(),
          one_time_percentage: input.one_time_percentage.toString(),
          updated_at: new Date()
        })
        .returning()
        .execute();

      const settings = insertResult[0];
      return {
        recurring_percentage: parseFloat(settings.recurring_percentage),
        one_time_percentage: parseFloat(settings.one_time_percentage)
      };
    }

    // Convert numeric fields back to numbers before returning
    const settings = result[0];
    return {
      recurring_percentage: parseFloat(settings.recurring_percentage),
      one_time_percentage: parseFloat(settings.one_time_percentage)
    };
  } catch (error) {
    console.error('Commission settings update failed:', error);
    throw error;
  }
}