import { db } from '../db';
import { affiliatesTable, referredCustomersTable } from '../db/schema';
import { type AffiliateDashboardResponse } from '../schema';
import { eq, sum } from 'drizzle-orm';

export async function getAffiliateDashboard(affiliateId: string): Promise<AffiliateDashboardResponse> {
  try {
    // Find the affiliate by ID
    const affiliateResult = await db.select()
      .from(affiliatesTable)
      .where(eq(affiliatesTable.id, affiliateId))
      .execute();

    if (affiliateResult.length === 0) {
      throw new Error('Affiliate not found');
    }

    const affiliate = affiliateResult[0];

    // Calculate total earnings from referred customers
    const earningsResult = await db.select({
      total_earnings: sum(referredCustomersTable.commission_earned),
      total_sales: sum(referredCustomersTable.order_amount),
    })
      .from(referredCustomersTable)
      .where(eq(referredCustomersTable.affiliate_id, affiliateId))
      .execute();

    // Handle case where affiliate has no referrals yet
    const earnings = earningsResult[0];
    const totalEarnings = earnings.total_earnings ? parseFloat(earnings.total_earnings) : 0;
    const totalSales = earnings.total_sales ? parseFloat(earnings.total_sales) : 0;
    const totalCommissions = parseFloat(affiliate.total_commission);

    return {
      affiliate: {
        ...affiliate,
        total_revenue: parseFloat(affiliate.total_revenue),
        total_commission: totalCommissions,
      },
      total_earnings: totalEarnings,
      total_sales: totalSales,
      total_commissions: totalCommissions
    };
  } catch (error) {
    console.error('Get affiliate dashboard failed:', error);
    throw error;
  }
}