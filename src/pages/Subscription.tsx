import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, CreditCard, Calendar, Star } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function Subscription() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { session, isPremium, subscriptionEnd, checkSubscription } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    // Show success or canceled message
    if (searchParams.get('success')) {
      toast({
        title: "Subscription activated!",
        description: "Welcome to Personal Pro. Your premium features are now active.",
      });
      // Delay subscription check to allow Stripe webhook to process
      setTimeout(() => {
        checkSubscription();
      }, 2000);
      navigate('/dashboard/subscription', { replace: true });
    } else if (searchParams.get('canceled')) {
      toast({
        title: "Subscription canceled",
        description: "You can try again anytime.",
        variant: "destructive",
      });
      navigate('/dashboard/subscription', { replace: true });
    }
  }, [searchParams]);

  const handleUpgrade = async () => {
    if (!session) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error",
        description: "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!session) return;
    
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening portal:', error);
      toast({
        title: "Error",
        description: "Failed to open customer portal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPortalLoading(false);
    }
  };

  const features = [
    "Unlimited link shortening with custom keywords",
    "Advanced link analytics and click tracking",
    "Password manager with encryption",
    "Personal cloud storage (5GB)",
    "Document manager",
    "Photo library",
    "Priority support",
    "No advertisements",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subscription</h1>
        <p className="text-muted-foreground mt-2">
          Manage your subscription and billing
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Free Plan */}
        <Card className={!isPremium ? "border-primary" : ""}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Free Forever</CardTitle>
              {!isPremium && (
                <Badge variant="secondary">Current Plan</Badge>
              )}
            </div>
            <CardDescription>
              <span className="text-3xl font-bold">$0</span>
              <span className="text-muted-foreground">/month</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>Basic link shortening</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>QR code generation</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>Encrypted text sharing</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>Image compression</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Premium Plan */}
        <Card className={isPremium ? "border-primary bg-gradient-subtle" : ""}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle>Personal Pro</CardTitle>
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              </div>
              {isPremium && (
                <Badge variant="secondary">Active</Badge>
              )}
            </div>
            <CardDescription>
              <span className="text-3xl font-bold">$9.99</span>
              <span className="text-muted-foreground">/month</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {isPremium ? (
              <div className="pt-4 space-y-3">
                {subscriptionEnd && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Renews on {new Date(subscriptionEnd).toLocaleDateString()}</span>
                  </div>
                )}
                <Button 
                  onClick={handleManageSubscription} 
                  variant="outline" 
                  className="w-full"
                  disabled={portalLoading}
                >
                  {portalLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Opening...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Manage Subscription
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <Button 
                onClick={handleUpgrade} 
                className="w-full mt-4"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Upgrade to Pro'
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
