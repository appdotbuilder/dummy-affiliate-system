import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import { Users, DollarSign, CreditCard, Settings, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';
import type { Affiliate, WithdrawalRequest, CommissionSettings } from '../../../server/src/schema';

export function AdminDashboard() {
  const { toast } = useToast();
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [commissionSettings, setCommissionSettings] = useState<CommissionSettings>({
    recurring_percentage: 0,
    one_time_percentage: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [paymentProofUrl, setPaymentProofUrl] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [affiliatesData, withdrawalsData, settingsData] = await Promise.all([
        trpc.admin.getAffiliates.query(),
        trpc.admin.getPendingWithdrawals.query(),
        trpc.admin.getCommissionSettings.query()
      ]);
      
      setAffiliates(affiliatesData);
      setPendingWithdrawals(withdrawalsData);
      setCommissionSettings(settingsData);
    } catch (error) {
      console.error('Failed to load admin data:', error);
      toast.error('Failed to load dashboard data');
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApproveWithdrawal = async () => {
    if (!selectedWithdrawal) return;
    
    setIsLoading(true);
    try {
      await trpc.admin.approveWithdrawal.mutate({
        id: selectedWithdrawal.id,
        payment_proof_url: paymentProofUrl || undefined
      });
      
      setPendingWithdrawals((prev: WithdrawalRequest[]) => 
        prev.filter((w: WithdrawalRequest) => w.id !== selectedWithdrawal.id)
      );
      
      toast.success(`Withdrawal ${selectedWithdrawal.id} approved successfully`);
    } catch (error) {
      console.error('Failed to approve withdrawal:', error);
      toast.error('Failed to approve withdrawal');
    } finally {
      setIsLoading(false);
      setShowApprovalDialog(false);
      setSelectedWithdrawal(null);
      setPaymentProofUrl('');
    }
  };

  const handleDeclineWithdrawal = async () => {
    if (!selectedWithdrawal) return;
    
    setIsLoading(true);
    try {
      await trpc.admin.declineWithdrawal.mutate({
        id: selectedWithdrawal.id
      });
      
      setPendingWithdrawals((prev: WithdrawalRequest[]) => 
        prev.filter((w: WithdrawalRequest) => w.id !== selectedWithdrawal.id)
      );
      
      toast.success(`Withdrawal ${selectedWithdrawal.id} declined`);
    } catch (error) {
      console.error('Failed to decline withdrawal:', error);
      toast.error('Failed to decline withdrawal');
    } finally {
      setIsLoading(false);
      setShowDeclineDialog(false);
      setSelectedWithdrawal(null);
    }
  };

  const handleUpdateCommissionSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const updatedSettings = await trpc.admin.updateCommissionSettings.mutate(commissionSettings);
      setCommissionSettings(updatedSettings);
      toast.success('Commission settings updated successfully');
    } catch (error) {
      console.error('Failed to update commission settings:', error);
      toast.error('Failed to update commission settings');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate summary statistics
  const totalAffiliates = affiliates.length;
  const totalRevenue = affiliates.reduce((sum, affiliate) => sum + affiliate.total_revenue, 0);
  const totalCommissions = affiliates.reduce((sum, affiliate) => sum + affiliate.total_commission, 0);
  const pendingWithdrawalAmount = pendingWithdrawals.reduce((sum, withdrawal) => sum + withdrawal.amount, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Affiliates</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAffiliates}</div>
            <p className="text-xs text-muted-foreground">Active partners</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Generated by affiliates</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCommissions.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Paid to affiliates</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Withdrawals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${pendingWithdrawalAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{pendingWithdrawals.length} requests</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="affiliates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="affiliates">Affiliates</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawal Requests</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="affiliates">
          <Card>
            <CardHeader>
              <CardTitle>Affiliate Management</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Referral Code</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Customers</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {affiliates.map((affiliate: Affiliate) => (
                    <TableRow key={affiliate.id}>
                      <TableCell className="font-medium">{affiliate.id}</TableCell>
                      <TableCell>{affiliate.name}</TableCell>
                      <TableCell>{affiliate.email}</TableCell>
                      <TableCell>
                        <Badge variant={affiliate.plan === 'Premium' ? 'default' : 'secondary'}>
                          {affiliate.plan}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{affiliate.referral_code}</TableCell>
                      <TableCell>${affiliate.total_revenue.toFixed(2)}</TableCell>
                      <TableCell>${affiliate.total_commission.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>Recurring: {affiliate.recurring_customers}</div>
                          <div>One-time: {affiliate.one_time_customers}</div>
                        </div>
                      </TableCell>
                      <TableCell>{affiliate.created_at.toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals">
          <Card>
            <CardHeader>
              <CardTitle>Pending Withdrawal Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingWithdrawals.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No pending withdrawal requests</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Request ID</TableHead>
                      <TableHead>Affiliate</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingWithdrawals.map((withdrawal: WithdrawalRequest) => (
                      <TableRow key={withdrawal.id}>
                        <TableCell className="font-medium">{withdrawal.id}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{withdrawal.affiliate_name}</div>
                            <div className="text-sm text-gray-500">{withdrawal.affiliate_id}</div>
                          </div>
                        </TableCell>
                        <TableCell>${withdrawal.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                            {withdrawal.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{withdrawal.created_at.toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedWithdrawal(withdrawal);
                                setShowApprovalDialog(true);
                              }}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedWithdrawal(withdrawal);
                                setShowDeclineDialog(true);
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Decline
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Commission Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateCommissionSettings} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recurring">Recurring Sales Commission (%)</Label>
                    <Input
                      id="recurring"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={commissionSettings.recurring_percentage}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCommissionSettings((prev: CommissionSettings) => ({
                          ...prev,
                          recurring_percentage: parseFloat(e.target.value) || 0
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="onetime">One-time Sales Commission (%)</Label>
                    <Input
                      id="onetime"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={commissionSettings.one_time_percentage}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCommissionSettings((prev: CommissionSettings) => ({
                          ...prev,
                          one_time_percentage: parseFloat(e.target.value) || 0
                        }))
                      }
                      required
                    />
                  </div>
                </div>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update Commission Settings'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approval Dialog */}
      <AlertDialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Withdrawal Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve withdrawal request {selectedWithdrawal?.id} for ${selectedWithdrawal?.amount.toFixed(2)}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="paymentProof">Payment Proof URL (optional)</Label>
            <Input
              id="paymentProof"
              placeholder="https://example.com/payment-proof.jpg"
              value={paymentProofUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPaymentProofUrl(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApproveWithdrawal}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? 'Approving...' : 'Approve'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Decline Dialog */}
      <AlertDialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Decline Withdrawal Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to decline withdrawal request {selectedWithdrawal?.id} for ${selectedWithdrawal?.amount.toFixed(2)}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeclineWithdrawal}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? 'Declining...' : 'Decline'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}