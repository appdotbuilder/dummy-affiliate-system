import { db } from '../db';
import { affiliatesTable } from '../db/schema';
import { type Affiliate } from '../schema';

export const getAllAffiliates = async (): Promise<Affiliate[]> => {
  try {
    const results = await db.select()
      .from(affiliatesTable)
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(affiliate => ({
      ...affiliate,
      total_revenue: parseFloat(affiliate.total_revenue),
      total_commission: parseFloat(affiliate.total_commission)
    }));
  } catch (error) {
    console.error('Failed to fetch affiliates:', error);
    throw error;
  }
};