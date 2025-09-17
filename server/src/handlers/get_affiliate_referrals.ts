import { type ReferredCustomer } from '../schema';

export async function getAffiliateReferrals(affiliateId: string): Promise<ReferredCustomer[]> {
  // This is a placeholder declaration! Real code should be implemented here.
  // The goal of this handler is to return all referred customers for a specific affiliate.
  // Should filter dummy referred customer data by affiliate_id.
  
  return [
    {
      id: 'CUST001',
      name: 'Alice Johnson',
      affiliate_id: affiliateId,
      order_amount: 299.99,
      order_type: 'recurring',
      commission_earned: 29.99,
      created_at: new Date('2024-02-15')
    },
    {
      id: 'CUST002',
      name: 'Bob Wilson',
      affiliate_id: affiliateId,
      order_amount: 149.99,
      order_type: 'one-time',
      commission_earned: 7.50,
      created_at: new Date('2024-02-20')
    },
    {
      id: 'CUST003',
      name: 'Carol Davis',
      affiliate_id: affiliateId,
      order_amount: 499.99,
      order_type: 'recurring',
      commission_earned: 49.99,
      created_at: new Date('2024-03-01')
    }
  ];
}