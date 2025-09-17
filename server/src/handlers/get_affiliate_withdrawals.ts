import { db } from '../db';
import { withdrawalRequestsTable } from '../db/schema';
import { type WithdrawalRequest } from '../schema';
import { eq } from 'drizzle-orm';

export const getAffiliateWithdrawals = async (affiliateId: string): Promise<WithdrawalRequest[]> => {
  try {
    // Query withdrawal requests for the specific affiliate
    const results = await db.select()
      .from(withdrawalRequestsTable)
      .where(eq(withdrawalRequestsTable.affiliate_id, affiliateId))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(request => ({
      ...request,
      amount: parseFloat(request.amount)
    }));
  } catch (error) {
    console.error('Failed to retrieve affiliate withdrawals:', error);
    throw error;
  }
};