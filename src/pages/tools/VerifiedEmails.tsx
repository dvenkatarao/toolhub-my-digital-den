import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Mail, Plus, Trash2, CheckCircle2, Clock, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface VerifiedEmail {
  id: string;
  user_id: string;
  email: string;
  cloudflare_email_id: string;
  is_verified: boolean;
  created_at: string;
}

export default function VerifiedEmails() {
  const [emails, setEmails] = useState<VerifiedEmail[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingEmails, setLoadingEmails] = useState(true);
  const { toast } = useToast();
  const { session } = useAuth();

  useEffect(() => {
    if (session) {
      loadVerifiedEmails();
    }
  }, [session]);

  const loadVerifiedEmails = async () => {
    try {
      const { data, error } = await supabase
        .from('verified_destination_emails')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmails(data || []);
    } catch (error: any) {
      console.error('Error loading verified emails:', error);
      toast({
        title: "Error",
        description: "Failed to load verified emails",
        variant: "destructive",
      });
    } finally {
      setLoadingEmails(false);
    }
  };

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newEmail) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
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

      const { data, error } = await supabase.functions.invoke('add-verified-email', {
        body: { email: newEmail },
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
        title: "Verification Email Sent",
        description: "Check your inbox and click the verification link",
      });

      // Refresh the list
      await loadVerifiedEmails();
      setNewEmail('');
    } catch (error: any) {
      console.error('Add email error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add email",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmail = async (emailId: string) => {
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

      const { data, error } = await supabase.functions.invoke('delete-verified-email', {
        body: { emailId },
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
        description: "Email removed successfully",
      });

      await loadVerifiedEmails();
    } catch (error: any) {
      console.error('Delete email error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete email",
        variant: "destructive",
      });
    }
  };

  const handleRefreshStatus = async () => {
    setLoadingEmails(true);
    
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();

      if (!currentSession?.access_token) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to use this feature",
          variant: "destructive",
        });
        setLoadingEmails(false);
        return;
      }

      // Call sync function
      const { data, error } = await supabase.functions.invoke('sync-verified-emails', {
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
        setLoadingEmails(false);
        return;
      }

      // Use the emails returned directly from the sync function
      // This bypasses any database read lag issues
      if (data.emails && Array.isArray(data.emails)) {
        setEmails(data.emails);
        console.log('Updated emails from sync response:', data.emails);
      } else {
        // Fallback: query database if emails not in response
        const { data: freshEmails, error: reloadError } = await supabase
          .from('verified_destination_emails')
          .select('*')
          .order('created_at', { ascending: false });

        if (reloadError) {
          console.error('Reload error:', reloadError);
        } else if (freshEmails) {
          setEmails(freshEmails);
        }
      }

      toast({
        title: "Synced!",
        description: data.message || "Email statuses updated",
      });
    } catch (error: any) {
      console.error('Sync error:', error);
      toast({
        title: "Error",
        description: "Failed to sync email statuses",
        variant: "destructive",
      });
    } finally {
      setLoadingEmails(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Mail className="h-8 w-8" />
          Verified Email Addresses
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage destination emails for temporary email forwarding
        </p>
      </div>

      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-500" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            Before creating temporary email forwards, you must verify at least one destination email address.
          </p>
          <ol className="list-decimal list-inside space-y-1 ml-2 text-muted-foreground">
            <li>Add your personal email address below</li>
            <li>Check your inbox for a verification email from Cloudflare</li>
            <li>Click the verification link</li>
            <li>Once verified, you can create temporary forwards to this address</li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add Verified Email</CardTitle>
          <CardDescription>
            Add a destination email address for forwarding
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddEmail} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-email">Email Address</Label>
              <Input
                id="new-email"
                type="email"
                placeholder="your@email.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                This email will receive a verification link from Cloudflare
              </p>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending Verification...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Email Address
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
              <CardTitle>Your Verified Emails</CardTitle>
              <CardDescription>
                {emails.length} email address{emails.length !== 1 ? 'es' : ''} registered
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshStatus}
              disabled={loadingEmails}
            >
              <RefreshCw className={`h-4 w-4 ${loadingEmails ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingEmails ? (
            <div className="text-center py-8 text-muted-foreground">
              <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
              <p>Loading emails...</p>
            </div>
          ) : emails.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Mail className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No verified emails yet</p>
              <p className="text-sm">Add one above to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {emails.map((email) => (
                <Card key={email.id} className="border-2">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium truncate">{email.email}</p>
                          {email.is_verified ? (
                            <Badge variant="default" className="flex-shrink-0">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="flex-shrink-0">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Added: {new Date(email.created_at).toLocaleString()}
                        </p>
                        {!email.is_verified && (
                          <p className="text-xs text-yellow-600 mt-1">
                            Check your inbox and click the verification link
                          </p>
                        )}
                      </div>

                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleDeleteEmail(email.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="text-base">Important Notes</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>You can add multiple email addresses for different purposes</li>
            <li>Verification emails are sent by Cloudflare (check spam folder)</li>
            <li>Only verified emails can be used as forwarding destinations</li>
            <li>Verified emails remain active even after temp forwards expire</li>
            <li>No additional cost for verified emails - they're just stored in Cloudflare</li>
            <li>You can delete emails anytime (existing forwards will stop working)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
