import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { trpc } from '@/utils/trpc';
import { DollarSign, Users, Link, CreditCard, Copy, Plus, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';
import type { AffiliateDashboardResponse, ReferredCustomer, WithdrawalRequest } from '../../../server/src/schema';

// Fixed affiliate ID for demo purposes
const DEMO_AFFILIATE_ID = 'AFF001';

export function AffiliateDashboard() {
  const { toast } = useToast();
  const [dashboardData, setDashboardData] = useState<AffiliateDashboardResponse | null>(null);
  const [referrals, setReferrals] = useState<ReferredCustomer[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [showWithdrawalDialog, setShowWithdrawalDialog] = useState(false);

  const loadDashboardData = useCallback(async () => {
    try {
      const data = await trpc.affiliate.getDashboard.query({ affiliateId: DEMO_AFFILIATE_ID });
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    }
  }, [toast]);

  const loadReferrals = useCallback(async () => {
    try {
      const data = await trpc.affiliate.getReferrals.query({ affiliateId: DEMO_AFFILIATE_ID });
      setReferrals(data);
    } catch (error) {
      console.error('Failed to load referrals:', error);
      toast.error('Failed to load referrals data');
    }
  }, [toast]);

  const loadWithdrawals = useCallback(async () => {
    try {
      const data = await trpc.affiliate.getWithdrawals.query({ affiliateId: DEMO_AFFILIATE_ID });
      setWithdrawals(data);
    } catch (error) {
      console.error('Failed to load withdrawals:', error);
      toast.error('Failed to load withdrawals data');
    }
  }, [toast]);

  useEffect(() => {
    loadDashboardData();
    loadReferrals();
    loadWithdrawals();
  }, [loadDashboardData, loadReferrals, loadWithdrawals]);

  const handleCopyReferralCode = () => {
    if (dashboardData?.affiliate.referral_code) {
      navigator.clipboard.writeText(dashboardData.affiliate.referral_code);
      toast.success('Referral code copied to clipboard!');
    }
  };

  const handleCopyReferralLink = () => {
    if (dashboardData?.affiliate.referral_code) {
      const referralLink = `https://yourapp.com/signup?ref=${dashboardData.affiliate.referral_code}`;
      navigator.clipboard.writeText(referralLink);
      toast.success('Referral link copied to clipboard!');
    }
  };

  const handleCreateWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const amount = parseFloat(withdrawalAmount);
      if (amount <= 0) {
        toast.error('Please enter a valid amount');
        return;
      }

      if (dashboardData && amount > dashboardData.total_commissions) {
        toast.error('Withdrawal amount cannot exceed available commission');
        return;
      }

      await trpc.affiliate.createWithdrawalRequest.mutate({
        affiliate_id: DEMO_AFFILIATE_ID,
        amount: amount
      });

      toast.success('Withdrawal request submitted successfully!');
      setWithdrawalAmount('');
      setShowWithdrawalDialog(false);
      loadWithdrawals(); // Reload withdrawals data
    } catch (error) {
      console.error('Failed to create withdrawal request:', error);
      toast.error('Failed to submit withdrawal request');
    } finally {
      setIsLoading(false);
    }
  };

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const referralLink = `https://yourapp.com/signup?ref=${dashboardData.affiliate.referral_code}`;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Welcome back, {dashboardData.affiliate.name}!</h2>
              <p className="text-green-100">
                Affiliate ID: {dashboardData.affiliate.id} • Plan: {dashboardData.affiliate.plan}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">${dashboardData.total_earnings.toFixed(2)}</div>
              <div className="text-green-100">Total Earnings</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${dashboardData.total_sales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Revenue generated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${dashboardData.total_commissions.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Available for withdrawal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.affiliate.recurring_customers + dashboardData.affiliate.one_time_customers}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.affiliate.recurring_customers} recurring, {dashboardData.affiliate.one_time_customers} one-time
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="referrals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="referrals">Referral Management</TabsTrigger>
          <TabsTrigger value="customers">Referred Customers</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
        </TabsList>

        <TabsContent value="referrals">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="h-5 w-5" />
                  Your Referral Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Referral Code</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={dashboardData.affiliate.referral_code}
                      readOnly
                      className="font-mono"
                    />
                    <Button
                      onClick={handleCopyReferralCode}
                      variant="outline"
                      size="icon"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Referral Link</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={referralLink}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      onClick={handleCopyReferralLink}
                      variant="outline"
                      size="icon"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">💡 How to use your referral link:</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Share your referral link or code with potential customers</li>
                    <li>• When they sign up and make a purchase, you earn commission</li>
                    <li>• Track all your referrals in the "Referred Customers" tab</li>
                    <li>• Request withdrawals when you have available commission</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle>Referred Customers</CardTitle>
            </CardHeader>
            <CardContent>
              {referrals.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No referred customers yet</p>
                  <p className="text-sm text-gray-400 mt-1">Start sharing your referral link to earn commissions!</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Order Amount</TableHead>
                      <TableHead>Order Type</TableHead>
                      <TableHead>Commission Earned</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referrals.map((customer: ReferredCustomer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.id}</TableCell>
                        <TableCell>{customer.name}</TableCell>
                        <TableCell>${customer.order_amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={customer.order_type === 'recurring' ? 'default' : 'secondary'}>
                            {customer.order_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-green-600 font-medium">
                          ${customer.commission_earned.toFixed(2)}
                        </TableCell>
                        <TableCell>{customer.created_at.toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Withdrawal Requests</CardTitle>
                  <Dialog open={showWithdrawalDialog} onOpenChange={setShowWithdrawalDialog}>
                    <DialogTrigger asChild>
                      <Button className="bg-green-600 hover:bg-green-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Request Withdrawal
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Withdrawal Request</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCreateWithdrawal} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="amount">Amount</Label>
                          <Input
                            id="amount"
                            type="number"
                            placeholder="0.00"
                            min="0.01"
                            step="0.01"
                            value={withdrawalAmount}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWithdrawalAmount(e.target.value)}
                            required
                          />
                          <p className="text-sm text-gray-500">
                            Available: ${dashboardData.total_commissions.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowWithdrawalDialog(false)}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Submitting...' : 'Submit Request'}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {withdrawals.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No withdrawal requests yet</p>
                    <p className="text-sm text-gray-400 mt-1">Create your first withdrawal request to get paid!</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Request ID</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Updated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {withdrawals.map((withdrawal: WithdrawalRequest) => (
                        <TableRow key={withdrawal.id}>
                          <TableCell className="font-medium">{withdrawal.id}</TableCell>
                          <TableCell>${withdrawal.amount.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                withdrawal.status === 'Approved' ? 'default' :
                                withdrawal.status === 'Declined' ? 'destructive' : 
                                'outline'
                              }
                              className={
                                withdrawal.status === 'Approved' ? 'bg-green-600' :
                                withdrawal.status === 'Declined' ? '' :
                                'text-yellow-600 border-yellow-600'
                              }
                            >
                              {withdrawal.status === 'Approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                              {withdrawal.status === 'Declined' && <XCircle className="h-3 w-3 mr-1" />}
                              {withdrawal.status === 'Pending' && <Clock className="h-3 w-3 mr-1" />}
                              {withdrawal.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{withdrawal.created_at.toLocaleDateString()}</TableCell>
                          <TableCell>{withdrawal.updated_at.toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}