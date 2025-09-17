import { pgTable, text, numeric, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core';

// Define enums for PostgreSQL
export const affiliatePlanEnum = pgEnum('affiliate_plan', ['Basic', 'Premium']);
export const withdrawalStatusEnum = pgEnum('withdrawal_status', ['Pending', 'Approved', 'Declined']);
export const orderTypeEnum = pgEnum('order_type', ['recurring', 'one-time']);

// Affiliates table
export const affiliatesTable = pgTable('affiliates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  referral_code: text('referral_code').notNull().unique(),
  plan: affiliatePlanEnum('plan').notNull(),
  total_revenue: numeric('total_revenue', { precision: 10, scale: 2 }).notNull().default('0'),
  total_commission: numeric('total_commission', { precision: 10, scale: 2 }).notNull().default('0'),
  recurring_customers: integer('recurring_customers').notNull().default(0),
  one_time_customers: integer('one_time_customers').notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Withdrawal requests table
export const withdrawalRequestsTable = pgTable('withdrawal_requests', {
  id: text('id').primaryKey(),
  affiliate_id: text('affiliate_id').notNull(),
  affiliate_name: text('affiliate_name').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  status: withdrawalStatusEnum('status').notNull().default('Pending'),
  payment_proof_url: text('payment_proof_url'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Referred customers table
export const referredCustomersTable = pgTable('referred_customers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  affiliate_id: text('affiliate_id').notNull(),
  order_amount: numeric('order_amount', { precision: 10, scale: 2 }).notNull(),
  order_type: orderTypeEnum('order_type').notNull(),
  commission_earned: numeric('commission_earned', { precision: 10, scale: 2 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Commission settings table (single row for global settings)
export const commissionSettingsTable = pgTable('commission_settings', {
  id: integer('id').primaryKey().default(1),
  recurring_percentage: numeric('recurring_percentage', { precision: 5, scale: 2 }).notNull().default('10.00'),
  one_time_percentage: numeric('one_time_percentage', { precision: 5, scale: 2 }).notNull().default('5.00'),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript types for the table schemas
export type Affiliate = typeof affiliatesTable.$inferSelect;
export type NewAffiliate = typeof affiliatesTable.$inferInsert;

export type WithdrawalRequest = typeof withdrawalRequestsTable.$inferSelect;
export type NewWithdrawalRequest = typeof withdrawalRequestsTable.$inferInsert;

export type ReferredCustomer = typeof referredCustomersTable.$inferSelect;
export type NewReferredCustomer = typeof referredCustomersTable.$inferInsert;

export type CommissionSettings = typeof commissionSettingsTable.$inferSelect;
export type NewCommissionSettings = typeof commissionSettingsTable.$inferInsert;

// Export all tables for proper query building
export const tables = {
  affiliates: affiliatesTable,
  withdrawalRequests: withdrawalRequestsTable,
  referredCustomers: referredCustomersTable,
  commissionSettings: commissionSettingsTable
};