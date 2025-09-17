import { z } from 'zod';

// Enums for status and plan types
export const affiliatePlanSchema = z.enum(['Basic', 'Premium']);
export type AffiliatePlan = z.infer<typeof affiliatePlanSchema>;

export const withdrawalStatusSchema = z.enum(['Pending', 'Approved', 'Declined']);
export type WithdrawalStatus = z.infer<typeof withdrawalStatusSchema>;

export const orderTypeSchema = z.enum(['recurring', 'one-time']);
export type OrderType = z.infer<typeof orderTypeSchema>;

// Affiliate schema
export const affiliateSchema = z.object({
  id: z.string(), // AFF001, AFF002, etc.
  name: z.string(),
  email: z.string().email(),
  referral_code: z.string(),
  plan: affiliatePlanSchema,
  total_revenue: z.number(),
  total_commission: z.number(),
  recurring_customers: z.number().int(),
  one_time_customers: z.number().int(),
  created_at: z.coerce.date()
});

export type Affiliate = z.infer<typeof affiliateSchema>;

// Withdrawal request schema
export const withdrawalRequestSchema = z.object({
  id: z.string(),
  affiliate_id: z.string(),
  affiliate_name: z.string(),
  amount: z.number().positive(),
  status: withdrawalStatusSchema,
  payment_proof_url: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type WithdrawalRequest = z.infer<typeof withdrawalRequestSchema>;

// Referred customer schema
export const referredCustomerSchema = z.object({
  id: z.string(),
  name: z.string(),
  affiliate_id: z.string(),
  order_amount: z.number().positive(),
  order_type: orderTypeSchema,
  commission_earned: z.number(),
  created_at: z.coerce.date()
});

export type ReferredCustomer = z.infer<typeof referredCustomerSchema>;

// Commission settings schema
export const commissionSettingsSchema = z.object({
  recurring_percentage: z.number().min(0).max(100),
  one_time_percentage: z.number().min(0).max(100)
});

export type CommissionSettings = z.infer<typeof commissionSettingsSchema>;

// Input schemas for API endpoints

// Public API inputs
export const validateReferralInputSchema = z.object({
  referral_code: z.string()
});

export type ValidateReferralInput = z.infer<typeof validateReferralInputSchema>;

export const confirmOrderInputSchema = z.object({
  user_id: z.string(),
  affiliate_id: z.string(),
  order_amount: z.number().positive(),
  recurring: z.boolean()
});

export type ConfirmOrderInput = z.infer<typeof confirmOrderInputSchema>;

// Admin API inputs
export const approveWithdrawalInputSchema = z.object({
  id: z.string(),
  payment_proof_url: z.string().optional()
});

export type ApproveWithdrawalInput = z.infer<typeof approveWithdrawalInputSchema>;

export const declineWithdrawalInputSchema = z.object({
  id: z.string()
});

export type DeclineWithdrawalInput = z.infer<typeof declineWithdrawalInputSchema>;

export const updateCommissionSettingsInputSchema = z.object({
  recurring_percentage: z.number().min(0).max(100),
  one_time_percentage: z.number().min(0).max(100)
});

export type UpdateCommissionSettingsInput = z.infer<typeof updateCommissionSettingsInputSchema>;

// Affiliate API inputs
export const createWithdrawalRequestInputSchema = z.object({
  affiliate_id: z.string(),
  amount: z.number().positive()
});

export type CreateWithdrawalRequestInput = z.infer<typeof createWithdrawalRequestInputSchema>;

// Response schemas
export const validateReferralResponseSchema = z.object({
  valid: z.boolean(),
  affiliate_id: z.string().optional(),
  affiliate_name: z.string().optional()
});

export type ValidateReferralResponse = z.infer<typeof validateReferralResponseSchema>;

export const confirmOrderResponseSchema = z.object({
  success: z.boolean(),
  commission: z.number().optional()
});

export type ConfirmOrderResponse = z.infer<typeof confirmOrderResponseSchema>;

export const affiliateDashboardResponseSchema = z.object({
  affiliate: affiliateSchema,
  total_earnings: z.number(),
  total_sales: z.number(),
  total_commissions: z.number()
});

export type AffiliateDashboardResponse = z.infer<typeof affiliateDashboardResponseSchema>;