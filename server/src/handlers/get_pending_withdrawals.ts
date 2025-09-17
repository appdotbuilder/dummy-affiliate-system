import { db } from '../db';
import { withdrawalRequestsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type WithdrawalRequest } from '../schema';

export const getPendingWithdrawals = async (): Promise<WithdrawalRequest[]> => {
  try {
    // Query for pending withdrawal requests
    const results = await db.select()
      .from(withdrawalRequestsTable)
      .where(eq(withdrawalRequestsTable.status, 'Pending'))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(withdrawal => ({
      ...withdrawal,
      amount: parseFloat(withdrawal.amount) // Convert numeric column from string to number
    }));
  } catch (error) {
    console.error('Failed to fetch pending withdrawals:', error);
    throw error;
  }
};