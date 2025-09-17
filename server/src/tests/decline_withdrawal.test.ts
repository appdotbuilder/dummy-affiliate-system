import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { withdrawalRequestsTable, affiliatesTable } from '../db/schema';
import { type DeclineWithdrawalInput } from '../schema';
import { declineWithdrawal } from '../handlers/decline_withdrawal';
import { eq } from 'drizzle-orm';

// Test input
const testInput: DeclineWithdrawalInput = {
  id: 'WD001'
};

describe('declineWithdrawal', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should decline a pending withdrawal request', async () => {
    // Create test affiliate first
    await db.insert(affiliatesTable).values({
      id: 'AFF001',
      name: 'Test Affiliate',
      email: 'test@example.com',
      referral_code: 'TEST001',
      plan: 'Basic',
      total_revenue: '1000.00',
      total_commission: '100.00',
      recurring_customers: 5,
      one_time_customers: 10
    }).execute();

    // Create test withdrawal request
    await db.insert(withdrawalRequestsTable).values({
      id: 'WD001',
      affiliate_id: 'AFF001',
      affiliate_name: 'Test Affiliate',
      amount: '250.00',
      status: 'Pending',
      payment_proof_url: null
    }).execute();

    const result = await declineWithdrawal(testInput);

    // Verify the response
    expect(result.id).toEqual('WD001');
    expect(result.affiliate_id).toEqual('AFF001');
    expect(result.affiliate_name).toEqual('Test Affiliate');
    expect(result.amount).toEqual(250.00);
    expect(typeof result.amount).toBe('number');
    expect(result.status).toEqual('Declined');
    expect(result.payment_proof_url).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update status in database', async () => {
    // Create test affiliate first
    await db.insert(affiliatesTable).values({
      id: 'AFF002',
      name: 'Another Affiliate',
      email: 'another@example.com',
      referral_code: 'TEST002',
      plan: 'Premium',
      total_revenue: '2000.00',
      total_commission: '200.00',
      recurring_customers: 8,
      one_time_customers: 15
    }).execute();

    // Create test withdrawal request with 'Pending' status
    await db.insert(withdrawalRequestsTable).values({
      id: 'WD002',
      affiliate_id: 'AFF002',
      affiliate_name: 'Another Affiliate',
      amount: '500.00',
      status: 'Pending',
      payment_proof_url: null
    }).execute();

    await declineWithdrawal({ id: 'WD002' });

    // Query the database to verify status was updated
    const withdrawalRequests = await db.select()
      .from(withdrawalRequestsTable)
      .where(eq(withdrawalRequestsTable.id, 'WD002'))
      .execute();

    expect(withdrawalRequests).toHaveLength(1);
    expect(withdrawalRequests[0].status).toEqual('Declined');
    expect(withdrawalRequests[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update timestamp when declining', async () => {
    // Create test affiliate first
    await db.insert(affiliatesTable).values({
      id: 'AFF003',
      name: 'Time Test Affiliate',
      email: 'timetest@example.com',
      referral_code: 'TIME001',
      plan: 'Basic',
      total_revenue: '500.00',
      total_commission: '50.00',
      recurring_customers: 2,
      one_time_customers: 5
    }).execute();

    const oldTimestamp = new Date('2024-01-01T00:00:00Z');
    
    // Create withdrawal with old timestamp
    await db.insert(withdrawalRequestsTable).values({
      id: 'WD003',
      affiliate_id: 'AFF003',
      affiliate_name: 'Time Test Affiliate',
      amount: '150.00',
      status: 'Pending',
      payment_proof_url: null,
      created_at: oldTimestamp,
      updated_at: oldTimestamp
    }).execute();

    const result = await declineWithdrawal({ id: 'WD003' });

    // Verify timestamp was updated (should be much newer than old timestamp)
    expect(result.created_at).toEqual(oldTimestamp);
    expect(result.updated_at.getTime()).toBeGreaterThan(oldTimestamp.getTime());
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent withdrawal request', async () => {
    await expect(declineWithdrawal({ id: 'NONEXISTENT' }))
      .rejects
      .toThrow(/Withdrawal request with ID NONEXISTENT not found/i);
  });

  it('should decline approved withdrawal request', async () => {
    // Create test affiliate first
    await db.insert(affiliatesTable).values({
      id: 'AFF004',
      name: 'Approved Test Affiliate',
      email: 'approved@example.com',
      referral_code: 'APPROVED001',
      plan: 'Premium',
      total_revenue: '3000.00',
      total_commission: '300.00',
      recurring_customers: 12,
      one_time_customers: 20
    }).execute();

    // Create test withdrawal request that's already approved
    await db.insert(withdrawalRequestsTable).values({
      id: 'WD004',
      affiliate_id: 'AFF004',
      affiliate_name: 'Approved Test Affiliate',
      amount: '300.00',
      status: 'Approved',
      payment_proof_url: 'https://example.com/proof.jpg'
    }).execute();

    const result = await declineWithdrawal({ id: 'WD004' });

    // Should successfully decline even if it was previously approved
    expect(result.status).toEqual('Declined');
    expect(result.payment_proof_url).toEqual('https://example.com/proof.jpg');
    
    // Verify in database
    const dbResult = await db.select()
      .from(withdrawalRequestsTable)
      .where(eq(withdrawalRequestsTable.id, 'WD004'))
      .execute();
    
    expect(dbResult[0].status).toEqual('Declined');
  });

  it('should handle numeric conversion correctly', async () => {
    // Create test affiliate first
    await db.insert(affiliatesTable).values({
      id: 'AFF005',
      name: 'Numeric Test Affiliate',
      email: 'numeric@example.com',
      referral_code: 'NUMERIC001',
      plan: 'Basic',
      total_revenue: '1500.00',
      total_commission: '150.00',
      recurring_customers: 7,
      one_time_customers: 12
    }).execute();

    // Create withdrawal with decimal amount
    await db.insert(withdrawalRequestsTable).values({
      id: 'WD005',
      affiliate_id: 'AFF005',
      affiliate_name: 'Numeric Test Affiliate',
      amount: '123.45',
      status: 'Pending',
      payment_proof_url: null
    }).execute();

    const result = await declineWithdrawal({ id: 'WD005' });

    // Verify numeric conversion
    expect(typeof result.amount).toBe('number');
    expect(result.amount).toEqual(123.45);
    expect(result.status).toEqual('Declined');
  });
});