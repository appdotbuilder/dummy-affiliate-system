import { db } from '../db';
import { referredCustomersTable } from '../db/schema';
import { type ReferredCustomer } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getAffiliateReferrals = async (affiliateId: string): Promise<ReferredCustomer[]> => {
  try {
    // Query referred customers for the specific affiliate, ordered by creation date (newest first)
    const results = await db.select()
      .from(referredCustomersTable)
      .where(eq(referredCustomersTable.affiliate_id, affiliateId))
      .orderBy(desc(referredCustomersTable.created_at))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(customer => ({
      ...customer,
      order_amount: parseFloat(customer.order_amount),
      commission_earned: parseFloat(customer.commission_earned)
    }));
  } catch (error) {
    console.error('Get affiliate referrals failed:', error);
    throw error;
  }
};