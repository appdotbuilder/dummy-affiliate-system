import { db } from '../db';
import { withdrawalRequestsTable } from '../db/schema';
import { type DeclineWithdrawalInput, type WithdrawalRequest } from '../schema';
import { eq } from 'drizzle-orm';

export const declineWithdrawal = async (input: DeclineWithdrawalInput): Promise<WithdrawalRequest> => {
  try {
    // Update the withdrawal request status to 'Declined' and update timestamp
    const result = await db.update(withdrawalRequestsTable)
      .set({
        status: 'Declined',
        updated_at: new Date()
      })
      .where(eq(withdrawalRequestsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Withdrawal request with ID ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const withdrawalRequest = result[0];
    return {
      ...withdrawalRequest,
      amount: parseFloat(withdrawalRequest.amount)
    };
  } catch (error) {
    console.error('Withdrawal decline failed:', error);
    throw error;
  }
};