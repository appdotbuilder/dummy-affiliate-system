import { db } from '../db';
import { affiliatesTable, withdrawalRequestsTable } from '../db/schema';
import { type CreateWithdrawalRequestInput, type WithdrawalRequest } from '../schema';
import { eq } from 'drizzle-orm';

export const createWithdrawalRequest = async (input: CreateWithdrawalRequestInput): Promise<WithdrawalRequest> => {
  try {
    // First, verify that the affiliate exists and get their name
    const affiliate = await db.select()
      .from(affiliatesTable)
      .where(eq(affiliatesTable.id, input.affiliate_id))
      .execute();

    if (affiliate.length === 0) {
      throw new Error(`Affiliate with ID ${input.affiliate_id} not found`);
    }

    // Generate unique withdrawal request ID
    const withdrawalId = `WD${Date.now()}`;
    
    // Create the withdrawal request
    const result = await db.insert(withdrawalRequestsTable)
      .values({
        id: withdrawalId,
        affiliate_id: input.affiliate_id,
        affiliate_name: affiliate[0].name,
        amount: input.amount.toString(), // Convert number to string for numeric column
        status: 'Pending' // Default status as per schema
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const withdrawalRequest = result[0];
    return {
      ...withdrawalRequest,
      amount: parseFloat(withdrawalRequest.amount) // Convert string back to number
    };
  } catch (error) {
    console.error('Withdrawal request creation failed:', error);
    throw error;
  }
};