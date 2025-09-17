import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { affiliatesTable } from '../db/schema';
import { type ValidateReferralInput } from '../schema';
import { validateReferral } from '../handlers/validate_referral';

// Test data
const testAffiliate = {
  id: 'AFF001',
  name: 'John Doe',
  email: 'john@example.com',
  referral_code: 'JOHN123',
  plan: 'Basic' as const,
  total_revenue: '1000.00',
  total_commission: '50.00',
  recurring_customers: 5,
  one_time_customers: 10
};

const testAffiliate2 = {
  id: 'AFF002',
  name: 'Jane Smith',
  email: 'jane@example.com',
  referral_code: 'JANE456',
  plan: 'Premium' as const,
  total_revenue: '2000.00',
  total_commission: '150.00',
  recurring_customers: 8,
  one_time_customers: 12
};

describe('validateReferral', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should validate existing referral code', async () => {
    // Create test affiliate
    await db.insert(affiliatesTable)
      .values(testAffiliate)
      .execute();

    const input: ValidateReferralInput = {
      referral_code: 'JOHN123'
    };

    const result = await validateReferral(input);

    expect(result.valid).toBe(true);
    expect(result.affiliate_id).toBe('AFF001');
    expect(result.affiliate_name).toBe('John Doe');
  });

  it('should return invalid for non-existent referral code', async () => {
    const input: ValidateReferralInput = {
      referral_code: 'NONEXISTENT'
    };

    const result = await validateReferral(input);

    expect(result.valid).toBe(false);
    expect(result.affiliate_id).toBeUndefined();
    expect(result.affiliate_name).toBeUndefined();
  });

  it('should handle case-sensitive referral codes', async () => {
    // Create test affiliate
    await db.insert(affiliatesTable)
      .values(testAffiliate)
      .execute();

    const input: ValidateReferralInput = {
      referral_code: 'john123' // lowercase version
    };

    const result = await validateReferral(input);

    expect(result.valid).toBe(false);
    expect(result.affiliate_id).toBeUndefined();
    expect(result.affiliate_name).toBeUndefined();
  });

  it('should validate different affiliate referral codes', async () => {
    // Create multiple test affiliates
    await db.insert(affiliatesTable)
      .values([testAffiliate, testAffiliate2])
      .execute();

    // Test first affiliate
    const input1: ValidateReferralInput = {
      referral_code: 'JOHN123'
    };

    const result1 = await validateReferral(input1);

    expect(result1.valid).toBe(true);
    expect(result1.affiliate_id).toBe('AFF001');
    expect(result1.affiliate_name).toBe('John Doe');

    // Test second affiliate
    const input2: ValidateReferralInput = {
      referral_code: 'JANE456'
    };

    const result2 = await validateReferral(input2);

    expect(result2.valid).toBe(true);
    expect(result2.affiliate_id).toBe('AFF002');
    expect(result2.affiliate_name).toBe('Jane Smith');
  });

  it('should handle empty referral code', async () => {
    const input: ValidateReferralInput = {
      referral_code: ''
    };

    const result = await validateReferral(input);

    expect(result.valid).toBe(false);
    expect(result.affiliate_id).toBeUndefined();
    expect(result.affiliate_name).toBeUndefined();
  });

  it('should handle whitespace-only referral code', async () => {
    const input: ValidateReferralInput = {
      referral_code: '   '
    };

    const result = await validateReferral(input);

    expect(result.valid).toBe(false);
    expect(result.affiliate_id).toBeUndefined();
    expect(result.affiliate_name).toBeUndefined();
  });
});