import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { withdrawalRequestsTable, affiliatesTable } from '../db/schema';
import { getAffiliateWithdrawals } from '../handlers/get_affiliate_withdrawals';

describe('getAffiliateWithdrawals', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return withdrawal requests for specific affiliate', async () => {
    // Create test affiliate
    await db.insert(affiliatesTable)
      .values({
        id: 'AFF001',
        name: 'John Doe',
        email: 'john@example.com',
        referral_code: 'JOHN123',
        plan: 'Basic',
        total_revenue: '500.00',
        total_commission: '50.00',
        recurring_customers: 2,
        one_time_customers: 3
      })
      .execute();

    // Create withdrawal requests for this affiliate
    await db.insert(withdrawalRequestsTable)
      .values([
        {
          id: 'WD001',
          affiliate_id: 'AFF001',
          affiliate_name: 'John Doe',
          amount: '100.00',
          status: 'Pending',
          payment_proof_url: null
        },
        {
          id: 'WD002',
          affiliate_id: 'AFF001',
          affiliate_name: 'John Doe',
          amount: '75.50',
          status: 'Approved',
          payment_proof_url: 'https://example.com/proof.jpg'
        }
      ])
      .execute();

    // Create withdrawal request for different affiliate
    await db.insert(withdrawalRequestsTable)
      .values({
        id: 'WD003',
        affiliate_id: 'AFF002',
        affiliate_name: 'Jane Smith',
        amount: '50.00',
        status: 'Declined',
        payment_proof_url: null
      })
      .execute();

    const result = await getAffiliateWithdrawals('AFF001');

    // Should return only withdrawals for AFF001
    expect(result).toHaveLength(2);
    
    // Verify first withdrawal
    const withdrawal1 = result.find(w => w.id === 'WD001');
    expect(withdrawal1).toBeDefined();
    expect(withdrawal1!.affiliate_id).toEqual('AFF001');
    expect(withdrawal1!.affiliate_name).toEqual('John Doe');
    expect(withdrawal1!.amount).toEqual(100.00);
    expect(typeof withdrawal1!.amount).toBe('number');
    expect(withdrawal1!.status).toEqual('Pending');
    expect(withdrawal1!.payment_proof_url).toBeNull();
    expect(withdrawal1!.created_at).toBeInstanceOf(Date);
    expect(withdrawal1!.updated_at).toBeInstanceOf(Date);

    // Verify second withdrawal
    const withdrawal2 = result.find(w => w.id === 'WD002');
    expect(withdrawal2).toBeDefined();
    expect(withdrawal2!.affiliate_id).toEqual('AFF001');
    expect(withdrawal2!.amount).toEqual(75.50);
    expect(typeof withdrawal2!.amount).toBe('number');
    expect(withdrawal2!.status).toEqual('Approved');
    expect(withdrawal2!.payment_proof_url).toEqual('https://example.com/proof.jpg');
  });

  it('should return empty array for affiliate with no withdrawals', async () => {
    // Create affiliate without any withdrawal requests
    await db.insert(affiliatesTable)
      .values({
        id: 'AFF003',
        name: 'Bob Wilson',
        email: 'bob@example.com',
        referral_code: 'BOB456',
        plan: 'Premium',
        total_revenue: '0.00',
        total_commission: '0.00',
        recurring_customers: 0,
        one_time_customers: 0
      })
      .execute();

    const result = await getAffiliateWithdrawals('AFF003');

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return empty array for non-existent affiliate', async () => {
    const result = await getAffiliateWithdrawals('NONEXISTENT');

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle multiple withdrawal statuses correctly', async () => {
    // Create test affiliate
    await db.insert(affiliatesTable)
      .values({
        id: 'AFF004',
        name: 'Alice Brown',
        email: 'alice@example.com',
        referral_code: 'ALICE789',
        plan: 'Premium',
        total_revenue: '1000.00',
        total_commission: '100.00',
        recurring_customers: 5,
        one_time_customers: 2
      })
      .execute();

    // Create withdrawal requests with all possible statuses
    await db.insert(withdrawalRequestsTable)
      .values([
        {
          id: 'WD004',
          affiliate_id: 'AFF004',
          affiliate_name: 'Alice Brown',
          amount: '25.00',
          status: 'Pending',
          payment_proof_url: null
        },
        {
          id: 'WD005',
          affiliate_id: 'AFF004',
          affiliate_name: 'Alice Brown',
          amount: '50.00',
          status: 'Approved',
          payment_proof_url: 'https://example.com/proof2.jpg'
        },
        {
          id: 'WD006',
          affiliate_id: 'AFF004',
          affiliate_name: 'Alice Brown',
          amount: '75.00',
          status: 'Declined',
          payment_proof_url: null
        }
      ])
      .execute();

    const result = await getAffiliateWithdrawals('AFF004');

    expect(result).toHaveLength(3);

    // Verify all statuses are present
    const statuses = result.map(w => w.status);
    expect(statuses).toContain('Pending');
    expect(statuses).toContain('Approved');
    expect(statuses).toContain('Declined');

    // Verify numeric conversion for all amounts
    result.forEach(withdrawal => {
      expect(typeof withdrawal.amount).toBe('number');
      expect(withdrawal.amount).toBeGreaterThan(0);
    });
  });

  it('should return withdrawals ordered by creation date', async () => {
    // Create test affiliate
    await db.insert(affiliatesTable)
      .values({
        id: 'AFF005',
        name: 'Charlie Green',
        email: 'charlie@example.com',
        referral_code: 'CHARLIE123',
        plan: 'Basic',
        total_revenue: '200.00',
        total_commission: '20.00',
        recurring_customers: 1,
        one_time_customers: 1
      })
      .execute();

    // Create withdrawal requests with different creation times
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    await db.insert(withdrawalRequestsTable)
      .values([
        {
          id: 'WD007',
          affiliate_id: 'AFF005',
          affiliate_name: 'Charlie Green',
          amount: '30.00',
          status: 'Approved',
          payment_proof_url: null,
          created_at: yesterday,
          updated_at: yesterday
        },
        {
          id: 'WD008',
          affiliate_id: 'AFF005',
          affiliate_name: 'Charlie Green',
          amount: '40.00',
          status: 'Pending',
          payment_proof_url: null,
          created_at: now,
          updated_at: now
        },
        {
          id: 'WD009',
          affiliate_id: 'AFF005',
          affiliate_name: 'Charlie Green',
          amount: '20.00',
          status: 'Declined',
          payment_proof_url: null,
          created_at: twoDaysAgo,
          updated_at: twoDaysAgo
        }
      ])
      .execute();

    const result = await getAffiliateWithdrawals('AFF005');

    expect(result).toHaveLength(3);

    // All results should have valid dates
    result.forEach(withdrawal => {
      expect(withdrawal.created_at).toBeInstanceOf(Date);
      expect(withdrawal.updated_at).toBeInstanceOf(Date);
    });

    // Find specific withdrawals and verify their dates
    const wd007 = result.find(w => w.id === 'WD007');
    const wd008 = result.find(w => w.id === 'WD008');
    const wd009 = result.find(w => w.id === 'WD009');

    expect(wd007!.created_at.getTime()).toBe(yesterday.getTime());
    expect(wd008!.created_at.getTime()).toBe(now.getTime());
    expect(wd009!.created_at.getTime()).toBe(twoDaysAgo.getTime());
  });
});