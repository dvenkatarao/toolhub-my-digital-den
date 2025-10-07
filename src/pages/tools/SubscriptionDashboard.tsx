import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Copy, Check, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function SubscriptionDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [trackingEmail, setTrackingEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const [isProUser, setIsProUser] = useState(false);

  useEffect(() => {
    if (user) {
      checkProStatus();
      fetchTrackingEmail();
    }
  }, [user]);

  const checkProStatus = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('plan')
      .eq('user_id', user.id)
      .single();

    setIsProUser(data?.plan === 'PRO');
  };

  const fetchTrackingEmail = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_tracking_emails')
      .select('tracking_email')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setTrackingEmail(data.tracking_email);
    }
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

  if (!isProUser) {
    return (
      <Card className="p-8 text-center">
        <Sparkles className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
        <h3 className="text-xl font-semibold mb-2">Upgrade to Pro</h3>
        <p className="text-muted-foreground mb-4">
          Get your personal tracking email and automatic subscription monitoring
        </p>
        <Button>Upgrade Now</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tracking Email Card */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
        <div className="flex items-start gap-4">
          <Mail className="w-8 h-8 text-blue-600 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">
              Your Personal Tracking Email
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Forward any subscription email, invoice, or receipt to this address:
            </p>
            <div className="flex gap-2">
              <code className="flex-1 bg-white px-4 py-3 rounded border text-sm font-mono select-all">
                {trackingEmail}
              </code>
              <Button onClick={copyToClipboard} variant="outline" size="icon">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            
            {/* Instructions */}
            <div className="mt-4 p-4 bg-white rounded border">
              <p className="text-sm font-semibold mb-2">How to use:</p>
              <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                <li>Get a subscription email from Netflix, Spotify, etc.</li>
                <li>Forward it to <code className="text-xs bg-gray-100 px-1 rounded">{trackingEmail}</code></li>
                <li>We'll automatically extract and track the subscription</li>
                <li>Get reminders before each payment</li>
              </ol>
            </div>
          </div>
        </div>
      </Card>

      {/* Rest of your dashboard */}
    </div>
  );
}
