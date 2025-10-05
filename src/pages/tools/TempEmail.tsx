import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Copy, RefreshCw, Trash2, Clock, AlertCircle, CheckCircle2, Loader2, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface TempEmailForward {
  id: string;
  temp_email_name: string;
  destination_email: string;
  created_at: string;
  expires_at: string;
  is_verified: boolean;
  full_email?: string;
}

interface VerifiedEmail {
  id: string;
  email: string;
  is_verified: boolean;
}

export default function TempEmail() {
  const navigate = useNavigate();
  const [tempEmailName, setTempEmailName] = useState('');
  const [selectedDestination, setSelectedDestination] = useState('');
  const [verifiedEmails, setVerifiedEmails] = useState<VerifiedEmail[]>([]);
  const [forwards, setForwards] = useState<TempEmailForward[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingForwards, setLoadingForwards] = useState(true);
  const [loadingVerifiedEmails, setLoadingVerifiedEmails] = useState(true);
  const { toast } = useToast();
  const { session, isPremium } = useAuth();

  const domain = 'poofemail.com';

  useEffect(() => {
    if (session) {
      loadVerifiedEmails();
      loadForwards();
      generateRandomName();
    }
  }, [session]);

  const generateRandomName = () => {
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setTempEmailName(result);
  };

  const loadVerifiedEmails = async () => {
    try {
      // First, sync with Cloudflare
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession?.access_token) {
          await supabase.functions.invoke('sync-verified-emails', {
            headers: {
              Authorization: `Bearer ${currentSession.access_token}`,
            },
          });
        }
      } catch (syncError) {
        console.error('Sync error (non-critical):', syncError);
        // Continue even if sync fails
      }

      // Then load from database
      const { data, error } = await supabase
        .from('verified_destination_emails')
        .select('id, email, is_verified')
        .eq('is_verified', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVerifiedEmails(data || []);
      
      // Auto-select first verified email if available
      if (data && data.length > 0 && !selectedDestination) {
        setSelectedDestination(data[0].email);
      }
    } catch (error: any) {
      console.error('Error loading verified emails:', error);
    } finally {
      setLoadingVerifiedEmails(false);
    }
  };

  const loadForwards = async () => {
    try {
      const { data, error } = await supabase
        .from('temp_email_forwards')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const forwardsWithFullEmail = data.map(forward => ({
        ...forward,
        full_email: `${forward.temp_email_name}@${domain}`
      }));

      setForwards(forwardsWithFullEmail);
    } catch (error: any) {
      console.error('Error loading forwards:', error);
      toast({
        title: "Error",
        description: "Failed to load your email forwards",
        variant: "destructive",
      });
    } finally {
      setLoadingForwards(false);
    }
  };

  const handleCreateForward = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tempEmailName || !selectedDestination) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();

      if (!currentSession?.access_token) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to use this feature",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-temp-email', {
        body: {
          tempEmailName: tempEmailName.toLowerCase(),
          destinationEmail: selectedDestination,
        },
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`,
        },
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success!",
        description: "Your temporary email has been created",
      });

      await loadForwards();
      generateRandomName();
    } catch (error: any) {
      console.error('Create forward error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create temporary email",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteForward = async (forwardId: string) => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();

      if (!currentSession?.access_token) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to use this feature",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('delete-temp-email', {
        body: { forwardId },
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`,
        },
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Deleted",
        description: "Email forward removed successfully",
      });

      await loadForwards();
    } catch (error: any) {
      console.error('Delete forward error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete forward",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Email address copied to clipboard",
    });
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  };

  // Show setup prompt if no verified emails
  if (!loadingVerifiedEmails && verifiedEmails.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Mail className="h-8 w-8" />
            Temporary Email Forwarding
          </h1>
          <p className="text-muted-foreground mt-2">
            Create temporary email addresses that forward to your real email
          </p>
        </div>

        <Card className="border-yellow-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Setup Required
            </CardTitle>
            <CardDescription>
              Before creating temporary emails, you need to verify at least one destination email address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>To use temporary email forwarding:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Go to Settings and add your email address</li>
                <li>Check your inbox for a verification email from Cloudflare</li>
                <li>Click the verification link</li>
                <li>Return here to create temporary forwards</li>
              </ol>
            </div>

            <Button onClick={() => navigate('/dashboard/verified-emails')} className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              Go to Email Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Mail className="h-8 w-8" />
          Temporary Email Forwarding
        </h1>
        <p className="text-muted-foreground mt-2">
          Create temporary email addresses that forward to your real email
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Temporary Email</CardTitle>
          <CardDescription>
            Generate a temporary email that forwards to your inbox for 24 hours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateForward} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="temp-email">Temporary Email Name</Label>
              <div className="flex gap-2">
                <div className="flex-1 flex gap-2">
                  <Input
                    id="temp-email"
                    type="text"
                    placeholder="yourname"
                    value={tempEmailName}
                    onChange={(e) => setTempEmailName(e.target.value.toLowerCase())}
                    pattern="[a-z0-9-]+"
                    required
                  />
                  <span className="text-muted-foreground self-center whitespace-nowrap">
                    @{domain}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateRandomName}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Only lowercase letters, numbers, and hyphens allowed
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="destination-email">Forward To</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/dashboard/verified-emails')}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Emails
                </Button>
              </div>
              <Select value={selectedDestination} onValueChange={setSelectedDestination} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select verified email" />
                </SelectTrigger>
                <SelectContent>
                  {verifiedEmails.map((email) => (
                    <SelectItem key={email.id} value={email.email}>
                      {email.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Emails sent to your temporary address will be forwarded here
              </p>
            </div>

            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Active for 24 hours • {isPremium ? '20 max forwards' : '5 max forwards'}
              </span>
            </div>

            <Button type="submit" disabled={loading || verifiedEmails.length === 0} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Create Temporary Email
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Active Forwards</CardTitle>
              <CardDescription>
                {forwards.length} of {isPremium ? '20' : '5'} forwards in use
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadForwards}
              disabled={loadingForwards}
            >
              <RefreshCw className={`h-4 w-4 ${loadingForwards ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingForwards ? (
            <div className="text-center py-8 text-muted-foreground">
              <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
              <p>Loading forwards...</p>
            </div>
          ) : forwards.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Mail className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No active email forwards</p>
              <p className="text-sm">Create one above to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {forwards.map((forward) => (
                <Card key={forward.id} className="border-2">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-mono font-semibold truncate">
                            {forward.full_email}
                          </p>
                          <Badge variant="secondary" className="flex-shrink-0">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        </div>
                        
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Forwards to:</span>
                            <span className="truncate">{forward.destination_email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            <span>Expires in: {getTimeRemaining(forward.expires_at)}</span>
                          </div>
                          <div className="text-xs">
                            Created: {new Date(forward.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => copyToClipboard(forward.full_email!)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => handleDeleteForward(forward.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {!isPremium && forwards.length >= 3 && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Upgrade for More Forwards
            </CardTitle>
            <CardDescription>
              Free users are limited to 5 active forwards. Upgrade to Premium for 20 forwards.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate('/dashboard/subscription')}>
              Upgrade to Premium
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Create a temporary email address (e.g., random123@{domain})</li>
            <li>All emails sent to this address are forwarded to your verified email</li>
            <li>The forward is active for 24 hours from creation</li>
            <li>After 24 hours, the forwarding rule is automatically deleted</li>
            <li>No emails are stored on our servers - everything is forwarded directly</li>
            <li>You can delete a forward anytime before it expires</li>
            <li>Free users: 5 active forwards maximum</li>
            <li>Premium users: 20 active forwards maximum</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
