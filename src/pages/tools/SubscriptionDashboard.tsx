import { useEffect, useState } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, TrendingUp, Calendar, AlertCircle, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function SubscriptionDashboard() {
  const supabase = useSupabaseClient();
  const user = useUser();
  const { toast } = useToast();
  
  const [trackingEmail, setTrackingEmail] = useState('');
  const [subscriptions, setSubscriptions] = useState([]);
  const [stats, setStats] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTrackingEmail();
      fetchSubscriptions();
      fetchStats();
    }
  }, [user]);

  const fetchTrackingEmail = async () => {
    const { data } = await supabase
      .from('user_tracking_emails')
      .select('tracking_email')
      .eq('user_id', user?.id)
      .single();

    if (data) {
      setTrackingEmail(data.tracking_email);
    }
  };

  const fetchSubscriptions = async () => {
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user?.id)
      .is('deleted_at', null)
      .order('next_billing_date', { ascending: true });

    setSubscriptions(data || []);
  };

  const fetchStats = async () => {
    const { data } = await supabase
      .from('subscription_stats')
      .select('*')
      .eq('user_id', user?.id)
      .single();

    setStats(data);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(trackingEmail);
    setCopied(true);
    toast({
      title: 'Copied!',
      description: 'Forward your subscription emails to this address',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Tracking Email Card */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
        <div className="flex items-start gap-4">
          <Mail className="w-8 h-8 text-blue-600 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">Your Tracking Email</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Forward subscription emails, receipts, and invoices to this address to track them automatically:
            </p>
            <div className="flex gap-2">
              <code className="flex-1 bg-white px-4 py-3 rounded border text-sm font-mono">
                {trackingEmail}
              </code>
              <Button onClick={copyToClipboard} variant="outline">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Subscriptions</p>
              <h3 className="text-3xl font-bold mt-2">{stats?.total_subscriptions || 0}</h3>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Monthly Spend</p>
              <h3 className="text-3xl font-bold mt-2">
                ${(stats?.monthly_spend || 0).toFixed(2)}
              </h3>
            </div>
            <Calendar className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Yearly Projection</p>
              <h3 className="text-3xl font-bold mt-2">
                ${(stats?.yearly_spend || 0).toFixed(2)}
              </h3>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <h3 className="text-3xl font-bold mt-2">{stats?.active_count || 0}</h3>
            </div>
            <AlertCircle className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Subscriptions List */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Your Subscriptions</h3>
        <div className="space-y-3">
          {subscriptions.map((sub: any) => (
            <div
              key={sub.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex-1">
                <h4 className="font-semibold">{sub.vendor}</h4>
                <p className="text-sm text-muted-foreground">
                  {sub.category} • {sub.billing_cycle}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">
                  {sub.currency} {sub.amount}
                </p>
                <p className="text-sm text-muted-foreground">
                  Next: {new Date(sub.next_billing_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
          
          {subscriptions.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No subscriptions tracked yet.</p>
              <p className="text-sm mt-2">Forward your first subscription email to get started!</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
