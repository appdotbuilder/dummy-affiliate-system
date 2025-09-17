import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { withdrawalRequestsTable, affiliatesTable } from '../db/schema';
import { type ApproveWithdrawalInput } from '../schema';
import { approveWithdrawal } from '../handlers/approve_withdrawal';
import { eq } from 'drizzle-orm';

// Test data
const testAffiliate = {
  id: 'AFF001',
  name: 'John Doe',
  email: 'john@example.com',
  referral_code: 'JOHN2024',
  plan: 'Basic' as const,
  total_revenue: '1000.00',
  total_commission: '100.00',
  recurring_customers: 5,
  one_time_customers: 10
};

const testWithdrawalRequest = {
  id: 'WR001',
  affiliate_id: 'AFF001',
  affiliate_name: 'John Doe',
  amount: '250.75',
  status: 'Pending' as const,
  payment_proof_url: null
};

describe('approveWithdrawal', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should approve a withdrawal request without payment proof', async () => {
    // Create prerequisite data
    await db.insert(affiliatesTable).values(testAffiliate).execute();
    await db.insert(withdrawalRequestsTable).values(testWithdrawalRequest).execute();

    const input: ApproveWithdrawalInput = {
      id: 'WR001'
    };

    const result = await approveWithdrawal(input);

    // Verify the returned result
    expect(result.id).toEqual('WR001');
    expect(result.affiliate_id).toEqual('AFF001');
    expect(result.affiliate_name).toEqual('John Doe');
    expect(result.amount).toEqual(250.75);
    expect(typeof result.amount).toEqual('number');
    expect(result.status).toEqual('Approved');
    expect(result.payment_proof_url).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should approve a withdrawal request with payment proof URL', async () => {
    // Create prerequisite data
    await db.insert(affiliatesTable).values(testAffiliate).execute();
    await db.insert(withdrawalRequestsTable).values(testWithdrawalRequest).execute();

    const input: ApproveWithdrawalInput = {
      id: 'WR001',
      payment_proof_url: 'https://example.com/payment-proof.pdf'
    };

    const result = await approveWithdrawal(input);

    // Verify the returned result
    expect(result.id).toEqual('WR001');
    expect(result.status).toEqual('Approved');
    expect(result.payment_proof_url).toEqual('https://example.com/payment-proof.pdf');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update the withdrawal request in the database', async () => {
    // Create prerequisite data
    await db.insert(affiliatesTable).values(testAffiliate).execute();
    await db.insert(withdrawalRequestsTable).values(testWithdrawalRequest).execute();

    const input: ApproveWithdrawalInput = {
      id: 'WR001',
      payment_proof_url: 'https://example.com/proof.jpg'
    };

    await approveWithdrawal(input);

    // Query the database to verify the update
    const updatedRequests = await db.select()
      .from(withdrawalRequestsTable)
      .where(eq(withdrawalRequestsTable.id, 'WR001'))
      .execute();

    expect(updatedRequests).toHaveLength(1);
    const updatedRequest = updatedRequests[0];
    expect(updatedRequest.status).toEqual('Approved');
    expect(updatedRequest.payment_proof_url).toEqual('https://example.com/proof.jpg');
    expect(parseFloat(updatedRequest.amount)).toEqual(250.75);
    expect(updatedRequest.updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent withdrawal request', async () => {
    const input: ApproveWithdrawalInput = {
      id: 'NON_EXISTENT'
    };

    await expect(approveWithdrawal(input)).rejects.toThrow(/not found/i);
  });

  it('should preserve original created_at timestamp', async () => {
    // Create prerequisite data
    await db.insert(affiliatesTable).values(testAffiliate).execute();
    
    const originalCreatedAt = new Date('2024-01-15T10:00:00Z');
    const withdrawalWithSpecificDate = {
      ...testWithdrawalRequest,
      created_at: originalCreatedAt
    };
    
    await db.insert(withdrawalRequestsTable).values(withdrawalWithSpecificDate).execute();

    const input: ApproveWithdrawalInput = {
      id: 'WR001'
    };

    const result = await approveWithdrawal(input);

    // Verify created_at is preserved but updated_at is new
    expect(result.created_at.getTime()).toEqual(originalCreatedAt.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThan(originalCreatedAt.getTime());
  });

  it('should handle approval of already approved withdrawal', async () => {
    // Create prerequisite data
    await db.insert(affiliatesTable).values(testAffiliate).execute();
    
    const alreadyApprovedRequest = {
      ...testWithdrawalRequest,
      status: 'Approved' as const,
      payment_proof_url: 'https://old-proof.com/file.pdf'
    };
    
    await db.insert(withdrawalRequestsTable).values(alreadyApprovedRequest).execute();

    const input: ApproveWithdrawalInput = {
      id: 'WR001',
      payment_proof_url: 'https://new-proof.com/updated.pdf'
    };

    const result = await approveWithdrawal(input);

    // Should still work and update the payment proof URL
    expect(result.status).toEqual('Approved');
    expect(result.payment_proof_url).toEqual('https://new-proof.com/updated.pdf');
  });
});