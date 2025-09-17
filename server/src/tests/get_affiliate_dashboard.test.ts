import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { affiliatesTable, referredCustomersTable } from '../db/schema';
import { getAffiliateDashboard } from '../handlers/get_affiliate_dashboard';

describe('getAffiliateDashboard', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return dashboard data for an affiliate with referrals', async () => {
    // Create test affiliate
    const affiliateId = 'AFF001';
    await db.insert(affiliatesTable)
      .values({
        id: affiliateId,
        name: 'John Doe',
        email: 'john@example.com',
        referral_code: 'JOHNDOE2024',
        plan: 'Basic',
        total_revenue: '1500.00',
        total_commission: '150.00',
        recurring_customers: 10,
        one_time_customers: 5,
      })
      .execute();

    // Create test referred customers
    await db.insert(referredCustomersTable)
      .values([
        {
          id: 'CUST001',
          name: 'Customer 1',
          affiliate_id: affiliateId,
          order_amount: '100.00',
          order_type: 'one-time',
          commission_earned: '5.00',
        },
        {
          id: 'CUST002',
          name: 'Customer 2',
          affiliate_id: affiliateId,
          order_amount: '200.00',
          order_type: 'recurring',
          commission_earned: '20.00',
        },
        {
          id: 'CUST003',
          name: 'Customer 3',
          affiliate_id: affiliateId,
          order_amount: '150.00',
          order_type: 'one-time',
          commission_earned: '7.50',
        }
      ])
      .execute();

    const result = await getAffiliateDashboard(affiliateId);

    // Verify affiliate data
    expect(result.affiliate.id).toBe(affiliateId);
    expect(result.affiliate.name).toBe('John Doe');
    expect(result.affiliate.email).toBe('john@example.com');
    expect(result.affiliate.referral_code).toBe('JOHNDOE2024');
    expect(result.affiliate.plan).toBe('Basic');
    expect(result.affiliate.total_revenue).toBe(1500);
    expect(result.affiliate.total_commission).toBe(150);
    expect(result.affiliate.recurring_customers).toBe(10);
    expect(result.affiliate.one_time_customers).toBe(5);
    expect(result.affiliate.created_at).toBeInstanceOf(Date);

    // Verify calculated metrics
    expect(result.total_earnings).toBe(32.5); // 5.00 + 20.00 + 7.50
    expect(result.total_sales).toBe(450); // 100 + 200 + 150
    expect(result.total_commissions).toBe(150); // From affiliate.total_commission

    // Verify types
    expect(typeof result.affiliate.total_revenue).toBe('number');
    expect(typeof result.affiliate.total_commission).toBe('number');
    expect(typeof result.total_earnings).toBe('number');
    expect(typeof result.total_sales).toBe('number');
    expect(typeof result.total_commissions).toBe('number');
  });

  it('should return dashboard data for an affiliate with no referrals', async () => {
    // Create test affiliate with no referrals
    const affiliateId = 'AFF002';
    await db.insert(affiliatesTable)
      .values({
        id: affiliateId,
        name: 'Jane Smith',
        email: 'jane@example.com',
        referral_code: 'JANESMITH2024',
        plan: 'Premium',
        total_revenue: '0.00',
        total_commission: '0.00',
        recurring_customers: 0,
        one_time_customers: 0,
      })
      .execute();

    const result = await getAffiliateDashboard(affiliateId);

    // Verify affiliate data
    expect(result.affiliate.id).toBe(affiliateId);
    expect(result.affiliate.name).toBe('Jane Smith');
    expect(result.affiliate.email).toBe('jane@example.com');
    expect(result.affiliate.referral_code).toBe('JANESMITH2024');
    expect(result.affiliate.plan).toBe('Premium');
    expect(result.affiliate.total_revenue).toBe(0);
    expect(result.affiliate.total_commission).toBe(0);
    expect(result.affiliate.recurring_customers).toBe(0);
    expect(result.affiliate.one_time_customers).toBe(0);

    // Verify calculated metrics are zero
    expect(result.total_earnings).toBe(0);
    expect(result.total_sales).toBe(0);
    expect(result.total_commissions).toBe(0);
  });

  it('should throw error for non-existent affiliate', async () => {
    // Try to get dashboard for non-existent affiliate
    expect(getAffiliateDashboard('NONEXISTENT')).rejects.toThrow(/Affiliate not found/i);
  });

  it('should handle affiliate with mixed order types correctly', async () => {
    // Create test affiliate
    const affiliateId = 'AFF003';
    await db.insert(affiliatesTable)
      .values({
        id: affiliateId,
        name: 'Bob Wilson',
        email: 'bob@example.com',
        referral_code: 'BOBWILSON2024',
        plan: 'Basic',
        total_revenue: '2000.00',
        total_commission: '180.00',
        recurring_customers: 3,
        one_time_customers: 2,
      })
      .execute();

    // Create mix of recurring and one-time customers
    await db.insert(referredCustomersTable)
      .values([
        {
          id: 'CUST004',
          name: 'Recurring Customer 1',
          affiliate_id: affiliateId,
          order_amount: '500.00',
          order_type: 'recurring',
          commission_earned: '50.00',
        },
        {
          id: 'CUST005',
          name: 'One-time Customer 1',
          affiliate_id: affiliateId,
          order_amount: '300.00',
          order_type: 'one-time',
          commission_earned: '15.00',
        },
        {
          id: 'CUST006',
          name: 'Recurring Customer 2',
          affiliate_id: affiliateId,
          order_amount: '800.00',
          order_type: 'recurring',
          commission_earned: '80.00',
        }
      ])
      .execute();

    const result = await getAffiliateDashboard(affiliateId);

    // Verify affiliate basic data
    expect(result.affiliate.id).toBe(affiliateId);
    expect(result.affiliate.name).toBe('Bob Wilson');
    expect(result.affiliate.plan).toBe('Basic');
    expect(result.affiliate.recurring_customers).toBe(3);
    expect(result.affiliate.one_time_customers).toBe(2);

    // Verify calculated metrics
    expect(result.total_earnings).toBe(145); // 50 + 15 + 80
    expect(result.total_sales).toBe(1600); // 500 + 300 + 800
    expect(result.total_commissions).toBe(180); // From affiliate record

    // Ensure numeric conversions are correct
    expect(typeof result.total_earnings).toBe('number');
    expect(typeof result.total_sales).toBe('number');
  });

  it('should handle large decimal amounts correctly', async () => {
    // Create test affiliate
    const affiliateId = 'AFF004';
    await db.insert(affiliatesTable)
      .values({
        id: affiliateId,
        name: 'Test Affiliate',
        email: 'test@example.com',
        referral_code: 'TEST2024',
        plan: 'Premium',
        total_revenue: '9999.99',
        total_commission: '999.99',
        recurring_customers: 1,
        one_time_customers: 1,
      })
      .execute();

    // Create referred customer with precise decimal amounts
    await db.insert(referredCustomersTable)
      .values({
        id: 'CUST007',
        name: 'Precision Customer',
        affiliate_id: affiliateId,
        order_amount: '1234.56',
        order_type: 'recurring',
        commission_earned: '123.46',
      })
      .execute();

    const result = await getAffiliateDashboard(affiliateId);

    // Verify precise decimal handling
    expect(result.affiliate.total_revenue).toBe(9999.99);
    expect(result.affiliate.total_commission).toBe(999.99);
    expect(result.total_earnings).toBe(123.46);
    expect(result.total_sales).toBe(1234.56);
    expect(result.total_commissions).toBe(999.99);
  });
});