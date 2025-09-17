import { type Affiliate } from '../schema';

export async function getAllAffiliates(): Promise<Affiliate[]> {
  // This is a placeholder declaration! Real code should be implemented here.
  // The goal of this handler is to return all dummy affiliates for admin dashboard.
  // Should return hardcoded affiliate data with all required fields.
  
  return [
    {
      id: 'AFF001',
      name: 'John Doe',
      email: 'john@example.com',
      referral_code: 'JOHNDOE2024',
      plan: 'Basic',
      total_revenue: 1500.00,
      total_commission: 150.00,
      recurring_customers: 10,
      one_time_customers: 5,
      created_at: new Date('2024-01-15')
    },
    {
      id: 'AFF002',
      name: 'Jane Smith',
      email: 'jane@example.com',
      referral_code: 'JANESMITH2024',
      plan: 'Premium',
      total_revenue: 3200.00,
      total_commission: 320.00,
      recurring_customers: 20,
      one_time_customers: 8,
      created_at: new Date('2024-02-01')
    }
  ];
}