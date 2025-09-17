import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { affiliatesTable, referredCustomersTable, commissionSettingsTable } from '../db/schema';
import { type ConfirmOrderInput } from '../schema';
import { confirmOrder } from '../handlers/confirm_order';
import { eq } from 'drizzle-orm';

// Test affiliate data
const testAffiliate = {
  id: 'AFF001',
  name: 'Test Affiliate',
  email: 'test@affiliate.com',
  referral_code: 'TEST001',
  plan: 'Basic' as const,
  total_revenue: '100.00',
  total_commission: '10.00',
  recurring_customers: 1,
  one_time_customers: 2
};

// Test commission settings
const testCommissionSettings = {
  id: 1,
  recurring_percentage: '15.00',
  one_time_percentage: '8.00'
};

describe('confirmOrder', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create test affiliate
    await db.insert(affiliatesTable)
      .values(testAffiliate)
      .execute();

    // Create test commission settings
    await db.insert(commissionSettingsTable)
      .values(testCommissionSettings)
      .execute();
  });

  afterEach(resetDB);

  it('should confirm recurring order successfully', async () => {
    const input: ConfirmOrderInput = {
      user_id: 'USER001',
      affiliate_id: 'AFF001',
      order_amount: 100.0,
      recurring: true
    };

    const result = await confirmOrder(input);

    expect(result.success).toBe(true);
    expect(result.commission).toEqual(15.0); // 100 * 0.15 (15% from settings)
  });

  it('should confirm one-time order successfully', async () => {
    const input: ConfirmOrderInput = {
      user_id: 'USER002',
      affiliate_id: 'AFF001',
      order_amount: 200.0,
      recurring: false
    };

    const result = await confirmOrder(input);

    expect(result.success).toBe(true);
    expect(result.commission).toEqual(16.0); // 200 * 0.08 (8% from settings)
  });

  it('should create referred customer record', async () => {
    const input: ConfirmOrderInput = {
      user_id: 'USER003',
      affiliate_id: 'AFF001',
      order_amount: 150.0,
      recurring: true
    };

    await confirmOrder(input);

    const customers = await db.select()
      .from(referredCustomersTable)
      .where(eq(referredCustomersTable.id, 'USER003'))
      .execute();

    expect(customers).toHaveLength(1);
    const customer = customers[0];
    expect(customer.name).toEqual('Customer USER003');
    expect(customer.affiliate_id).toEqual('AFF001');
    expect(parseFloat(customer.order_amount)).toEqual(150.0);
    expect(customer.order_type).toEqual('recurring');
    expect(parseFloat(customer.commission_earned)).toEqual(22.5); // 150 * 0.15
    expect(customer.created_at).toBeInstanceOf(Date);
  });

  it('should update affiliate stats for recurring order', async () => {
    const input: ConfirmOrderInput = {
      user_id: 'USER004',
      affiliate_id: 'AFF001',
      order_amount: 300.0,
      recurring: true
    };

    await confirmOrder(input);

    const affiliates = await db.select()
      .from(affiliatesTable)
      .where(eq(affiliatesTable.id, 'AFF001'))
      .execute();

    expect(affiliates).toHaveLength(1);
    const affiliate = affiliates[0];
    expect(parseFloat(affiliate.total_revenue)).toEqual(400.0); // 100 + 300
    expect(parseFloat(affiliate.total_commission)).toEqual(55.0); // 10 + 45 (300 * 0.15)
    expect(affiliate.recurring_customers).toEqual(2); // 1 + 1
    expect(affiliate.one_time_customers).toEqual(2); // unchanged
  });

  it('should update affiliate stats for one-time order', async () => {
    const input: ConfirmOrderInput = {
      user_id: 'USER005',
      affiliate_id: 'AFF001',
      order_amount: 250.0,
      recurring: false
    };

    await confirmOrder(input);

    const affiliates = await db.select()
      .from(affiliatesTable)
      .where(eq(affiliatesTable.id, 'AFF001'))
      .execute();

    expect(affiliates).toHaveLength(1);
    const affiliate = affiliates[0];
    expect(parseFloat(affiliate.total_revenue)).toEqual(350.0); // 100 + 250
    expect(parseFloat(affiliate.total_commission)).toEqual(30.0); // 10 + 20 (250 * 0.08)
    expect(affiliate.recurring_customers).toEqual(1); // unchanged
    expect(affiliate.one_time_customers).toEqual(3); // 2 + 1
  });

  it('should return failure for non-existent affiliate', async () => {
    const input: ConfirmOrderInput = {
      user_id: 'USER006',
      affiliate_id: 'NONEXISTENT',
      order_amount: 100.0,
      recurring: true
    };

    const result = await confirmOrder(input);

    expect(result.success).toBe(false);
    expect(result.commission).toBeUndefined();
  });

  it('should use default commission rates when settings do not exist', async () => {
    // Remove commission settings
    await db.delete(commissionSettingsTable).execute();

    const input: ConfirmOrderInput = {
      user_id: 'USER007',
      affiliate_id: 'AFF001',
      order_amount: 100.0,
      recurring: true
    };

    const result = await confirmOrder(input);

    expect(result.success).toBe(true);
    expect(result.commission).toEqual(10.0); // 100 * 0.10 (default 10%)
  });

  it('should handle decimal order amounts correctly', async () => {
    const input: ConfirmOrderInput = {
      user_id: 'USER008',
      affiliate_id: 'AFF001',
      order_amount: 99.99,
      recurring: false
    };

    const result = await confirmOrder(input);

    expect(result.success).toBe(true);
    expect(typeof result.commission).toBe('number');
    expect(result.commission).toBeCloseTo(7.9992); // 99.99 * 0.08
  });

  it('should not create customer record when affiliate does not exist', async () => {
    const input: ConfirmOrderInput = {
      user_id: 'USER009',
      affiliate_id: 'NONEXISTENT',
      order_amount: 100.0,
      recurring: true
    };

    await confirmOrder(input);

    // Check that no customer record was created
    const customers = await db.select()
      .from(referredCustomersTable)
      .where(eq(referredCustomersTable.id, 'USER009'))
      .execute();

    expect(customers).toHaveLength(0);
  });
});