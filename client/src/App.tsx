import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ToastProvider } from '@/components/ToastProvider';
import { AdminDashboard } from '@/components/AdminDashboard';
import { AffiliateDashboard } from '@/components/AffiliateDashboard';
import { Users, DollarSign, Settings, UserCheck } from 'lucide-react';

function App() {
  const [currentView, setCurrentView] = useState<'home' | 'admin' | 'affiliate'>('home');

  if (currentView === 'admin') {
    return (
      <ToastProvider>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="container mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Settings className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                  <p className="text-gray-600">Manage affiliates and withdrawal requests</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setCurrentView('home')}
              >
                ← Back to Home
              </Button>
            </div>
            <AdminDashboard />
          </div>
        </div>
      </ToastProvider>
    );
  }

  if (currentView === 'affiliate') {
    return (
      <ToastProvider>
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
          <div className="container mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-600 rounded-lg">
                  <UserCheck className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Affiliate Dashboard</h1>
                  <p className="text-gray-600">Track your performance and earnings</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setCurrentView('home')}
              >
                ← Back to Home
              </Button>
            </div>
            <AffiliateDashboard />
          </div>
        </div>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
        <div className="container mx-auto p-6">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-purple-600 rounded-xl">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900">
                Affiliate Management System
              </h1>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Manage your affiliate program with ease. Track performance, handle withdrawals, and grow your network.
            </p>
            <Badge variant="secondary" className="mt-4 text-sm">
              🚀 Demo System with Dummy Data
            </Badge>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-200" 
                  onClick={() => setCurrentView('admin')}>
              <CardHeader className="text-center">
                <div className="mx-auto p-4 bg-blue-100 rounded-full w-fit mb-4">
                  <Settings className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl text-blue-900">Admin Dashboard</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-gray-600">
                  Manage affiliates, review withdrawal requests, and configure system settings.
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                    <div className="font-medium">Manage Affiliates</div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <DollarSign className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                    <div className="font-medium">Handle Withdrawals</div>
                  </div>
                </div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Access Admin Panel
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-green-200"
                  onClick={() => setCurrentView('affiliate')}>
              <CardHeader className="text-center">
                <div className="mx-auto p-4 bg-green-100 rounded-full w-fit mb-4">
                  <UserCheck className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl text-green-900">Affiliate Dashboard</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-gray-600">
                  View your performance metrics, manage referrals, and request withdrawals.
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <DollarSign className="h-5 w-5 text-green-600 mx-auto mb-1" />
                    <div className="font-medium">Track Earnings</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <Users className="h-5 w-5 text-green-600 mx-auto mb-1" />
                    <div className="font-medium">View Referrals</div>
                  </div>
                </div>
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Access Affiliate Panel
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 text-center">
            <Card className="max-w-2xl mx-auto bg-white/70">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-3">💡 Demo Information</h3>
                <p className="text-gray-600 text-sm">
                  This is a demonstration system using dummy data. All affiliates, withdrawal requests, 
                  and transactions are simulated for testing purposes. No real payments are processed.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}

export default App;