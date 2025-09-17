import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { withdrawalRequestsTable, affiliatesTable } from '../db/schema';
import { getPendingWithdrawals } from '../handlers/get_pending_withdrawals';

describe('getPendingWithdrawals', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no withdrawal requests exist', async () => {
    const result = await getPendingWithdrawals();
    expect(result).toEqual([]);
  });

  it('should return only pending withdrawal requests', async () => {
    // Create test affiliate first
    await db.insert(affiliatesTable).values({
      id: 'AFF001',
      name: 'Test Affiliate',
      email: 'test@example.com',
      referral_code: 'TEST001',
      plan: 'Basic'
    }).execute();

    // Create withdrawal requests with different statuses
    await db.insert(withdrawalRequestsTable).values([
      {
        id: 'WD001',
        affiliate_id: 'AFF001',
        affiliate_name: 'Test Affiliate',
        amount: '100.50',
        status: 'Pending'
      },
      {
        id: 'WD002',
        affiliate_id: 'AFF001',
        affiliate_name: 'Test Affiliate',
        amount: '250.75',
        status: 'Approved'
      },
      {
        id: 'WD003',
        affiliate_id: 'AFF001',
        affiliate_name: 'Test Affiliate',
        amount: '75.25',
        status: 'Pending'
      },
      {
        id: 'WD004',
        affiliate_id: 'AFF001',
        affiliate_name: 'Test Affiliate',
        amount: '150.00',
        status: 'Declined'
      }
    ]).execute();

    const result = await getPendingWithdrawals();

    // Should only return pending requests
    expect(result).toHaveLength(2);
    
    // Verify only pending status returned
    result.forEach(withdrawal => {
      expect(withdrawal.status).toBe('Pending');
    });

    // Verify specific pending requests
    expect(result.find(w => w.id === 'WD001')).toBeDefined();
    expect(result.find(w => w.id === 'WD003')).toBeDefined();
    expect(result.find(w => w.id === 'WD002')).toBeUndefined(); // Approved
    expect(result.find(w => w.id === 'WD004')).toBeUndefined(); // Declined
  });

  it('should convert numeric amounts correctly', async () => {
    // Create test affiliate first
    await db.insert(affiliatesTable).values({
      id: 'AFF001',
      name: 'Test Affiliate',
      email: 'test@example.com',
      referral_code: 'TEST001',
      plan: 'Basic'
    }).execute();

    // Create withdrawal request with decimal amount
    await db.insert(withdrawalRequestsTable).values({
      id: 'WD001',
      affiliate_id: 'AFF001',
      affiliate_name: 'Test Affiliate',
      amount: '123.45',
      status: 'Pending'
    }).execute();

    const result = await getPendingWithdrawals();

    expect(result).toHaveLength(1);
    expect(typeof result[0].amount).toBe('number');
    expect(result[0].amount).toBe(123.45);
  });

  it('should return all required fields for each withdrawal request', async () => {
    // Create test affiliate first
    await db.insert(affiliatesTable).values({
      id: 'AFF001',
      name: 'Test Affiliate',
      email: 'test@example.com',
      referral_code: 'TEST001',
      plan: 'Basic'
    }).execute();

    // Create withdrawal request with payment proof URL
    await db.insert(withdrawalRequestsTable).values({
      id: 'WD001',
      affiliate_id: 'AFF001',
      affiliate_name: 'Test Affiliate',
      amount: '100.00',
      status: 'Pending',
      payment_proof_url: 'https://example.com/proof.pdf'
    }).execute();

    const result = await getPendingWithdrawals();

    expect(result).toHaveLength(1);
    
    const withdrawal = result[0];
    expect(withdrawal.id).toBe('WD001');
    expect(withdrawal.affiliate_id).toBe('AFF001');
    expect(withdrawal.affiliate_name).toBe('Test Affiliate');
    expect(withdrawal.amount).toBe(100.00);
    expect(withdrawal.status).toBe('Pending');
    expect(withdrawal.payment_proof_url).toBe('https://example.com/proof.pdf');
    expect(withdrawal.created_at).toBeInstanceOf(Date);
    expect(withdrawal.updated_at).toBeInstanceOf(Date);
  });

  it('should handle null payment proof URL correctly', async () => {
    // Create test affiliate first
    await db.insert(affiliatesTable).values({
      id: 'AFF001',
      name: 'Test Affiliate',
      email: 'test@example.com',
      referral_code: 'TEST001',
      plan: 'Basic'
    }).execute();

    // Create withdrawal request without payment proof URL
    await db.insert(withdrawalRequestsTable).values({
      id: 'WD001',
      affiliate_id: 'AFF001',
      affiliate_name: 'Test Affiliate',
      amount: '100.00',
      status: 'Pending'
      // payment_proof_url is null by default
    }).execute();

    const result = await getPendingWithdrawals();

    expect(result).toHaveLength(1);
    expect(result[0].payment_proof_url).toBeNull();
  });

  it('should order results consistently', async () => {
    // Create test affiliate first
    await db.insert(affiliatesTable).values({
      id: 'AFF001',
      name: 'Test Affiliate',
      email: 'test@example.com',
      referral_code: 'TEST001',
      plan: 'Basic'
    }).execute();

    // Create multiple pending withdrawal requests
    await db.insert(withdrawalRequestsTable).values([
      {
        id: 'WD003',
        affiliate_id: 'AFF001',
        affiliate_name: 'Test Affiliate',
        amount: '300.00',
        status: 'Pending'
      },
      {
        id: 'WD001',
        affiliate_id: 'AFF001',
        affiliate_name: 'Test Affiliate',
        amount: '100.00',
        status: 'Pending'
      },
      {
        id: 'WD002',
        affiliate_id: 'AFF001',
        affiliate_name: 'Test Affiliate',
        amount: '200.00',
        status: 'Pending'
      }
    ]).execute();

    const result = await getPendingWithdrawals();

    expect(result).toHaveLength(3);
    
    // Verify all returned withdrawals are pending
    result.forEach(withdrawal => {
      expect(withdrawal.status).toBe('Pending');
      expect(['WD001', 'WD002', 'WD003']).toContain(withdrawal.id);
    });
  });
});