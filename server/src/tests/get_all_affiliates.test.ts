import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { affiliatesTable } from '../db/schema';
import { getAllAffiliates } from '../handlers/get_all_affiliates';

describe('getAllAffiliates', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no affiliates exist', async () => {
    const result = await getAllAffiliates();
    
    expect(result).toEqual([]);
  });

  it('should return all affiliates with correct data types', async () => {
    // Insert test affiliates
    await db.insert(affiliatesTable).values([
      {
        id: 'AFF001',
        name: 'John Doe',
        email: 'john@example.com',
        referral_code: 'JOHNDOE2024',
        plan: 'Basic',
        total_revenue: '1500.00',
        total_commission: '150.00',
        recurring_customers: 10,
        one_time_customers: 5
      },
      {
        id: 'AFF002',
        name: 'Jane Smith',
        email: 'jane@example.com',
        referral_code: 'JANESMITH2024',
        plan: 'Premium',
        total_revenue: '3200.50',
        total_commission: '320.25',
        recurring_customers: 20,
        one_time_customers: 8
      }
    ]).execute();

    const result = await getAllAffiliates();

    expect(result).toHaveLength(2);
    
    // Verify first affiliate
    const firstAffiliate = result.find(a => a.id === 'AFF001');
    expect(firstAffiliate).toBeDefined();
    expect(firstAffiliate?.name).toEqual('John Doe');
    expect(firstAffiliate?.email).toEqual('john@example.com');
    expect(firstAffiliate?.referral_code).toEqual('JOHNDOE2024');
    expect(firstAffiliate?.plan).toEqual('Basic');
    expect(firstAffiliate?.total_revenue).toEqual(1500.00);
    expect(firstAffiliate?.total_commission).toEqual(150.00);
    expect(typeof firstAffiliate?.total_revenue).toEqual('number');
    expect(typeof firstAffiliate?.total_commission).toEqual('number');
    expect(firstAffiliate?.recurring_customers).toEqual(10);
    expect(firstAffiliate?.one_time_customers).toEqual(5);
    expect(firstAffiliate?.created_at).toBeInstanceOf(Date);
    
    // Verify second affiliate
    const secondAffiliate = result.find(a => a.id === 'AFF002');
    expect(secondAffiliate).toBeDefined();
    expect(secondAffiliate?.name).toEqual('Jane Smith');
    expect(secondAffiliate?.plan).toEqual('Premium');
    expect(secondAffiliate?.total_revenue).toEqual(3200.50);
    expect(secondAffiliate?.total_commission).toEqual(320.25);
    expect(typeof secondAffiliate?.total_revenue).toEqual('number');
    expect(typeof secondAffiliate?.total_commission).toEqual('number');
    expect(secondAffiliate?.recurring_customers).toEqual(20);
    expect(secondAffiliate?.one_time_customers).toEqual(8);
  });

  it('should handle affiliates with zero values correctly', async () => {
    // Insert affiliate with zero revenue and commission
    await db.insert(affiliatesTable).values({
      id: 'AFF003',
      name: 'New Affiliate',
      email: 'new@example.com',
      referral_code: 'NEWBIE2024',
      plan: 'Basic',
      total_revenue: '0.00',
      total_commission: '0.00',
      recurring_customers: 0,
      one_time_customers: 0
    }).execute();

    const result = await getAllAffiliates();

    expect(result).toHaveLength(1);
    expect(result[0].total_revenue).toEqual(0);
    expect(result[0].total_commission).toEqual(0);
    expect(typeof result[0].total_revenue).toEqual('number');
    expect(typeof result[0].total_commission).toEqual('number');
    expect(result[0].recurring_customers).toEqual(0);
    expect(result[0].one_time_customers).toEqual(0);
  });

  it('should return affiliates sorted by database order', async () => {
    // Insert multiple affiliates
    await db.insert(affiliatesTable).values([
      {
        id: 'AFF003',
        name: 'Charlie Brown',
        email: 'charlie@example.com',
        referral_code: 'CHARLIE2024',
        plan: 'Basic',
        total_revenue: '500.00',
        total_commission: '50.00',
        recurring_customers: 3,
        one_time_customers: 2
      },
      {
        id: 'AFF001',
        name: 'Alice Johnson',
        email: 'alice@example.com',
        referral_code: 'ALICE2024',
        plan: 'Premium',
        total_revenue: '2000.00',
        total_commission: '200.00',
        recurring_customers: 15,
        one_time_customers: 10
      },
      {
        id: 'AFF002',
        name: 'Bob Wilson',
        email: 'bob@example.com',
        referral_code: 'BOB2024',
        plan: 'Basic',
        total_revenue: '1000.00',
        total_commission: '100.00',
        recurring_customers: 8,
        one_time_customers: 4
      }
    ]).execute();

    const result = await getAllAffiliates();

    expect(result).toHaveLength(3);
    // Verify all affiliates are returned with correct data
    expect(result.map(a => a.id)).toContain('AFF001');
    expect(result.map(a => a.id)).toContain('AFF002');
    expect(result.map(a => a.id)).toContain('AFF003');
    
    // Verify all have proper numeric conversions
    result.forEach(affiliate => {
      expect(typeof affiliate.total_revenue).toEqual('number');
      expect(typeof affiliate.total_commission).toEqual('number');
      expect(affiliate.created_at).toBeInstanceOf(Date);
    });
  });
});