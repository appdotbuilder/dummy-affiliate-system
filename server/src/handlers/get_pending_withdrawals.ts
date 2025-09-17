import { type WithdrawalRequest } from '../schema';

export async function getPendingWithdrawals(): Promise<WithdrawalRequest[]> {
  // This is a placeholder declaration! Real code should be implemented here.
  // The goal of this handler is to return all pending withdrawal requests for admin review.
  // Should filter dummy withdrawal data by status 'Pending'.
  
  return [
    {
      id: 'WD001',
      affiliate_id: 'AFF001',
      affiliate_name: 'John Doe',
      amount: 100.00,
      status: 'Pending',
      payment_proof_url: null,
      created_at: new Date('2024-03-01'),
      updated_at: new Date('2024-03-01')
    },
    {
      id: 'WD002',
      affiliate_id: 'AFF002',
      affiliate_name: 'Jane Smith',
      amount: 250.00,
      status: 'Pending',
      payment_proof_url: null,
      created_at: new Date('2024-03-02'),
      updated_at: new Date('2024-03-02')
    }
  ];
}