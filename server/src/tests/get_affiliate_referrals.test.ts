import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { affiliatesTable, referredCustomersTable } from '../db/schema';
import { getAffiliateReferrals } from '../handlers/get_affiliate_referrals';
import { eq } from 'drizzle-orm';

// Test data
const testAffiliate = {
  id: 'AFF001',
  name: 'Test Affiliate',
  email: 'test@example.com',
  referral_code: 'TEST123',
  plan: 'Basic' as const,
  total_revenue: '0',
  total_commission: '0',
  recurring_customers: 0,
  one_time_customers: 0
};

const testReferrals = [
  {
    id: 'CUST001',
    name: 'Alice Johnson',
    affiliate_id: 'AFF001',
    order_amount: '299.99',
    order_type: 'recurring' as const,
    commission_earned: '29.99'
  },
  {
    id: 'CUST002',
    name: 'Bob Wilson',
    affiliate_id: 'AFF001',
    order_amount: '149.99',
    order_type: 'one-time' as const,
    commission_earned: '7.50'
  },
  {
    id: 'CUST003',
    name: 'Carol Davis',
    affiliate_id: 'AFF001',
    order_amount: '499.99',
    order_type: 'recurring' as const,
    commission_earned: '49.99'
  },
  {
    id: 'CUST004',
    name: 'David Smith',
    affiliate_id: 'AFF002', // Different affiliate
    order_amount: '199.99',
    order_type: 'one-time' as const,
    commission_earned: '9.99'
  }
];

describe('getAffiliateReferrals', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all referrals for a specific affiliate', async () => {
    // Create test affiliate
    await db.insert(affiliatesTable)
      .values(testAffiliate)
      .execute();

    // Create test referrals
    await db.insert(referredCustomersTable)
      .values(testReferrals)
      .execute();

    const result = await getAffiliateReferrals('AFF001');

    // Should return only referrals for AFF001 (3 out of 4)
    expect(result).toHaveLength(3);
    
    // Verify all returned referrals belong to AFF001
    result.forEach(referral => {
      expect(referral.affiliate_id).toEqual('AFF001');
    });

    // Verify numeric conversions
    expect(typeof result[0].order_amount).toBe('number');
    expect(typeof result[0].commission_earned).toBe('number');
    
    // Verify specific values
    const aliceReferral = result.find(r => r.name === 'Alice Johnson');
    expect(aliceReferral).toBeDefined();
    expect(aliceReferral!.order_amount).toEqual(299.99);
    expect(aliceReferral!.commission_earned).toEqual(29.99);
    expect(aliceReferral!.order_type).toEqual('recurring');
  });

  it('should return empty array for affiliate with no referrals', async () => {
    // Create test affiliate
    await db.insert(affiliatesTable)
      .values(testAffiliate)
      .execute();

    // No referrals created

    const result = await getAffiliateReferrals('AFF001');

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return empty array for non-existent affiliate', async () => {
    const result = await getAffiliateReferrals('NONEXISTENT');

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return referrals ordered by creation date (newest first)', async () => {
    // Create test affiliate
    await db.insert(affiliatesTable)
      .values(testAffiliate)
      .execute();

    // Create referrals with specific dates (insert in random order)
    const referralsWithDates = [
      {
        id: 'CUST001',
        name: 'First Customer',
        affiliate_id: 'AFF001',
        order_amount: '100.00',
        order_type: 'one-time' as const,
        commission_earned: '5.00',
        created_at: new Date('2024-01-01')
      },
      {
        id: 'CUST002',
        name: 'Third Customer',
        affiliate_id: 'AFF001',
        order_amount: '300.00',
        order_type: 'recurring' as const,
        commission_earned: '30.00',
        created_at: new Date('2024-03-01')
      },
      {
        id: 'CUST003',
        name: 'Second Customer',
        affiliate_id: 'AFF001',
        order_amount: '200.00',
        order_type: 'one-time' as const,
        commission_earned: '10.00',
        created_at: new Date('2024-02-01')
      }
    ];

    await db.insert(referredCustomersTable)
      .values(referralsWithDates)
      .execute();

    const result = await getAffiliateReferrals('AFF001');

    expect(result).toHaveLength(3);
    
    // Should be ordered by creation date (newest first)
    expect(result[0].name).toEqual('Third Customer'); // 2024-03-01
    expect(result[1].name).toEqual('Second Customer'); // 2024-02-01
    expect(result[2].name).toEqual('First Customer'); // 2024-01-01
    
    // Verify dates are in descending order
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
  });

  it('should handle different order types correctly', async () => {
    // Create test affiliate
    await db.insert(affiliatesTable)
      .values(testAffiliate)
      .execute();

    const mixedOrderTypes = [
      {
        id: 'CUST001',
        name: 'Recurring Customer',
        affiliate_id: 'AFF001',
        order_amount: '299.99',
        order_type: 'recurring' as const,
        commission_earned: '29.99'
      },
      {
        id: 'CUST002',
        name: 'One-time Customer',
        affiliate_id: 'AFF001',
        order_amount: '149.99',
        order_type: 'one-time' as const,
        commission_earned: '7.50'
      }
    ];

    await db.insert(referredCustomersTable)
      .values(mixedOrderTypes)
      .execute();

    const result = await getAffiliateReferrals('AFF001');

    expect(result).toHaveLength(2);
    
    const recurringCustomer = result.find(r => r.order_type === 'recurring');
    const oneTimeCustomer = result.find(r => r.order_type === 'one-time');
    
    expect(recurringCustomer).toBeDefined();
    expect(oneTimeCustomer).toBeDefined();
    expect(recurringCustomer!.name).toEqual('Recurring Customer');
    expect(oneTimeCustomer!.name).toEqual('One-time Customer');
  });

  it('should verify data is saved correctly in database', async () => {
    // Create test affiliate
    await db.insert(affiliatesTable)
      .values(testAffiliate)
      .execute();

    // Create single referral
    await db.insert(referredCustomersTable)
      .values([testReferrals[0]])
      .execute();

    const result = await getAffiliateReferrals('AFF001');

    // Verify handler result
    expect(result).toHaveLength(1);
    
    // Verify data persists in database
    const dbReferrals = await db.select()
      .from(referredCustomersTable)
      .where(eq(referredCustomersTable.affiliate_id, 'AFF001'))
      .execute();

    expect(dbReferrals).toHaveLength(1);
    expect(dbReferrals[0].name).toEqual('Alice Johnson');
    expect(parseFloat(dbReferrals[0].order_amount)).toEqual(299.99);
    expect(parseFloat(dbReferrals[0].commission_earned)).toEqual(29.99);
    expect(dbReferrals[0].created_at).toBeInstanceOf(Date);
  });
});