import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { affiliatesTable, withdrawalRequestsTable } from '../db/schema';
import { type CreateWithdrawalRequestInput } from '../schema';
import { createWithdrawalRequest } from '../handlers/create_withdrawal_request';
import { eq } from 'drizzle-orm';

// Test affiliate data
const testAffiliate = {
  id: 'AFF001',
  name: 'John Smith',
  email: 'john@example.com',
  referral_code: 'JOHN123',
  plan: 'Basic' as const,
  total_revenue: '1000.00',
  total_commission: '100.00',
  recurring_customers: 5,
  one_time_customers: 3
};

// Simple test input
const testInput: CreateWithdrawalRequestInput = {
  affiliate_id: 'AFF001',
  amount: 250.50
};

describe('createWithdrawalRequest', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a withdrawal request', async () => {
    // Create prerequisite affiliate
    await db.insert(affiliatesTable).values(testAffiliate).execute();

    const result = await createWithdrawalRequest(testInput);

    // Basic field validation
    expect(result.affiliate_id).toEqual('AFF001');
    expect(result.affiliate_name).toEqual('John Smith');
    expect(result.amount).toEqual(250.50);
    expect(typeof result.amount).toBe('number');
    expect(result.status).toEqual('Pending');
    expect(result.payment_proof_url).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.id).toMatch(/^WD\d+$/);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save withdrawal request to database', async () => {
    // Create prerequisite affiliate
    await db.insert(affiliatesTable).values(testAffiliate).execute();

    const result = await createWithdrawalRequest(testInput);

    // Query database to verify the record was saved
    const withdrawalRequests = await db.select()
      .from(withdrawalRequestsTable)
      .where(eq(withdrawalRequestsTable.id, result.id))
      .execute();

    expect(withdrawalRequests).toHaveLength(1);
    expect(withdrawalRequests[0].affiliate_id).toEqual('AFF001');
    expect(withdrawalRequests[0].affiliate_name).toEqual('John Smith');
    expect(parseFloat(withdrawalRequests[0].amount)).toEqual(250.50);
    expect(withdrawalRequests[0].status).toEqual('Pending');
    expect(withdrawalRequests[0].payment_proof_url).toBeNull();
    expect(withdrawalRequests[0].created_at).toBeInstanceOf(Date);
    expect(withdrawalRequests[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle different withdrawal amounts correctly', async () => {
    // Create prerequisite affiliate
    await db.insert(affiliatesTable).values(testAffiliate).execute();

    const testCases = [
      { amount: 100.00 },
      { amount: 999.99 },
      { amount: 1.50 },
      { amount: 5000 }
    ];

    for (const testCase of testCases) {
      const input = { ...testInput, amount: testCase.amount };
      const result = await createWithdrawalRequest(input);

      expect(result.amount).toEqual(testCase.amount);
      expect(typeof result.amount).toBe('number');
    }
  });

  it('should throw error when affiliate does not exist', async () => {
    const inputWithInvalidAffiliate: CreateWithdrawalRequestInput = {
      affiliate_id: 'INVALID_ID',
      amount: 100.00
    };

    await expect(createWithdrawalRequest(inputWithInvalidAffiliate))
      .rejects
      .toThrow(/Affiliate with ID INVALID_ID not found/i);
  });

  it('should use correct affiliate name from database', async () => {
    // Create multiple affiliates to ensure correct one is selected
    const affiliate1 = { ...testAffiliate, id: 'AFF001', name: 'Alice Johnson' };
    const affiliate2 = { ...testAffiliate, id: 'AFF002', name: 'Bob Wilson', email: 'bob@example.com', referral_code: 'BOB456' };
    
    await db.insert(affiliatesTable).values([affiliate1, affiliate2]).execute();

    // Test with first affiliate
    const result1 = await createWithdrawalRequest({ affiliate_id: 'AFF001', amount: 100 });
    expect(result1.affiliate_name).toEqual('Alice Johnson');

    // Test with second affiliate
    const result2 = await createWithdrawalRequest({ affiliate_id: 'AFF002', amount: 200 });
    expect(result2.affiliate_name).toEqual('Bob Wilson');
  });

  it('should generate unique withdrawal request IDs', async () => {
    // Create prerequisite affiliate
    await db.insert(affiliatesTable).values(testAffiliate).execute();

    // Create multiple withdrawal requests
    const result1 = await createWithdrawalRequest(testInput);
    const result2 = await createWithdrawalRequest({ ...testInput, amount: 100 });
    const result3 = await createWithdrawalRequest({ ...testInput, amount: 300 });

    // Verify all IDs are unique
    const ids = [result1.id, result2.id, result3.id];
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toEqual(3);

    // Verify ID format
    ids.forEach(id => {
      expect(id).toMatch(/^WD\d+$/);
    });
  });
});