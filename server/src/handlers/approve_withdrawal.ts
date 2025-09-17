import { db } from '../db';
import { withdrawalRequestsTable } from '../db/schema';
import { type ApproveWithdrawalInput, type WithdrawalRequest } from '../schema';
import { eq } from 'drizzle-orm';

export const approveWithdrawal = async (input: ApproveWithdrawalInput): Promise<WithdrawalRequest> => {
  try {
    // Update the withdrawal request status to 'Approved'
    const updateData: any = {
      status: 'Approved' as const,
      updated_at: new Date()
    };

    // Add payment proof URL if provided
    if (input.payment_proof_url) {
      updateData.payment_proof_url = input.payment_proof_url;
    }

    const result = await db.update(withdrawalRequestsTable)
      .set(updateData)
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
      amount: parseFloat(withdrawalRequest.amount) // Convert string back to number
    };
  } catch (error) {
    console.error('Withdrawal approval failed:', error);
    throw error;
  }
};