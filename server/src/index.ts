import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  validateReferralInputSchema,
  confirmOrderInputSchema,
  approveWithdrawalInputSchema,
  declineWithdrawalInputSchema,
  updateCommissionSettingsInputSchema,
  createWithdrawalRequestInputSchema
} from './schema';

// Import handlers
import { validateReferral } from './handlers/validate_referral';
import { confirmOrder } from './handlers/confirm_order';
import { getAllAffiliates } from './handlers/get_all_affiliates';
import { getPendingWithdrawals } from './handlers/get_pending_withdrawals';
import { approveWithdrawal } from './handlers/approve_withdrawal';
import { declineWithdrawal } from './handlers/decline_withdrawal';
import { getCommissionSettings } from './handlers/get_commission_settings';
import { updateCommissionSettings } from './handlers/update_commission_settings';
import { getAffiliateDashboard } from './handlers/get_affiliate_dashboard';
import { getAffiliateReferrals } from './handlers/get_affiliate_referrals';
import { createWithdrawalRequest } from './handlers/create_withdrawal_request';
import { getAffiliateWithdrawals } from './handlers/get_affiliate_withdrawals';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Public endpoints (for main app integration)
  validateReferral: publicProcedure
    .input(validateReferralInputSchema)
    .mutation(({ input }) => validateReferral(input)),
    
  confirmOrder: publicProcedure
    .input(confirmOrderInputSchema)
    .mutation(({ input }) => confirmOrder(input)),

  // Admin endpoints
  admin: router({
    // Get all affiliates
    getAffiliates: publicProcedure
      .query(() => getAllAffiliates()),
      
    // Get pending withdrawal requests
    getPendingWithdrawals: publicProcedure
      .query(() => getPendingWithdrawals()),
      
    // Approve withdrawal request
    approveWithdrawal: publicProcedure
      .input(approveWithdrawalInputSchema)
      .mutation(({ input }) => approveWithdrawal(input)),
      
    // Decline withdrawal request
    declineWithdrawal: publicProcedure
      .input(declineWithdrawalInputSchema)
      .mutation(({ input }) => declineWithdrawal(input)),
      
    // Get commission settings
    getCommissionSettings: publicProcedure
      .query(() => getCommissionSettings()),
      
    // Update commission settings
    updateCommissionSettings: publicProcedure
      .input(updateCommissionSettingsInputSchema)
      .mutation(({ input }) => updateCommissionSettings(input))
  }),

  // Affiliate endpoints
  affiliate: router({
    // Get affiliate dashboard data
    getDashboard: publicProcedure
      .input(z.object({ affiliateId: z.string() }))
      .query(({ input }) => getAffiliateDashboard(input.affiliateId)),
      
    // Get affiliate referrals
    getReferrals: publicProcedure
      .input(z.object({ affiliateId: z.string() }))
      .query(({ input }) => getAffiliateReferrals(input.affiliateId)),
      
    // Create withdrawal request
    createWithdrawalRequest: publicProcedure
      .input(createWithdrawalRequestInputSchema)
      .mutation(({ input }) => createWithdrawalRequest(input)),
      
    // Get affiliate withdrawals
    getWithdrawals: publicProcedure
      .input(z.object({ affiliateId: z.string() }))
      .query(({ input }) => getAffiliateWithdrawals(input.affiliateId))
  })
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();