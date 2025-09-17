import { db } from '../db';
import { affiliatesTable, referredCustomersTable, commissionSettingsTable } from '../db/schema';
import { type ConfirmOrderInput, type ConfirmOrderResponse } from '../schema';
import { eq } from 'drizzle-orm';

export async function confirmOrder(input: ConfirmOrderInput): Promise<ConfirmOrderResponse> {
  try {
    // 1. Validate the affiliate exists
    const affiliates = await db.select()
      .from(affiliatesTable)
      .where(eq(affiliatesTable.id, input.affiliate_id))
      .execute();

    if (affiliates.length === 0) {
      return {
        success: false
      };
    }

    const affiliate = affiliates[0];

    // 2. Get commission settings
    const commissionSettingsResults = await db.select()
      .from(commissionSettingsTable)
      .execute();

    let recurringPercentage = 10.0; // default
    let oneTimePercentage = 5.0; // default

    if (commissionSettingsResults.length > 0) {
      recurringPercentage = parseFloat(commissionSettingsResults[0].recurring_percentage);
      oneTimePercentage = parseFloat(commissionSettingsResults[0].one_time_percentage);
    }

    // 3. Calculate commission based on order type
    const commissionRate = input.recurring ? (recurringPercentage / 100) : (oneTimePercentage / 100);
    const commission = input.order_amount * commissionRate;

    // 4. Create referred customer record
    await db.insert(referredCustomersTable)
      .values({
        id: input.user_id, // Use user_id as the customer id
        name: `Customer ${input.user_id}`, // Default name since not provided in input
        affiliate_id: input.affiliate_id,
        order_amount: input.order_amount.toString(),
        order_type: input.recurring ? 'recurring' : 'one-time',
        commission_earned: commission.toString()
      })
      .execute();

    // 5. Update affiliate stats
    const newTotalRevenue = parseFloat(affiliate.total_revenue) + input.order_amount;
    const newTotalCommission = parseFloat(affiliate.total_commission) + commission;
    const newRecurringCustomers = affiliate.recurring_customers + (input.recurring ? 1 : 0);
    const newOneTimeCustomers = affiliate.one_time_customers + (input.recurring ? 0 : 1);

    await db.update(affiliatesTable)
      .set({
        total_revenue: newTotalRevenue.toString(),
        total_commission: newTotalCommission.toString(),
        recurring_customers: newRecurringCustomers,
        one_time_customers: newOneTimeCustomers
      })
      .where(eq(affiliatesTable.id, input.affiliate_id))
      .execute();

    return {
      success: true,
      commission: commission
    };
  } catch (error) {
    console.error('Order confirmation failed:', error);
    throw error;
  }
}