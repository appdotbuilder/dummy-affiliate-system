import { db } from '../db';
import { affiliatesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type ValidateReferralInput, type ValidateReferralResponse } from '../schema';

export async function validateReferral(input: ValidateReferralInput): Promise<ValidateReferralResponse> {
  try {
    // Query database for affiliate with matching referral code
    const affiliates = await db.select()
      .from(affiliatesTable)
      .where(eq(affiliatesTable.referral_code, input.referral_code))
      .execute();

    // Check if affiliate exists
    if (affiliates.length === 0) {
      return {
        valid: false
      };
    }

    const affiliate = affiliates[0];
    
    return {
      valid: true,
      affiliate_id: affiliate.id,
      affiliate_name: affiliate.name
    };
  } catch (error) {
    console.error('Referral validation failed:', error);
    throw error;
  }
}