import { type WithdrawalRequest } from '../schema';

export async function getAffiliateWithdrawals(affiliateId: string): Promise<WithdrawalRequest[]> {
  // This is a placeholder declaration! Real code should be implemented here.
  // The goal of this handler is to return all withdrawal requests for a specific affiliate.
  // Should filter dummy withdrawal request data by affiliate_id.
  
  return [
    {
      id: 'WD001',
      affiliate_id: affiliateId,
      affiliate_name: 'John Doe',
      amount: 100.00,
      status: 'Pending',
      payment_proof_url: null,
      created_at: new Date('2024-03-01'),
      updated_at: new Date('2024-03-01')
    },
    {
      id: 'WD003',
      affiliate_id: affiliateId,
      affiliate_name: 'John Doe',
      amount: 50.00,
      status: 'Approved',
      payment_proof_url: 'https://example.com/payment-proof.jpg',
      created_at: new Date('2024-02-15'),
      updated_at: new Date('2024-02-16')
    }
  ];
}