import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Copy, RefreshCw, Trash2, Clock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
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

export default function TempEmail() {
  const [tempEmailName, setTempEmailName] = useState('');
  const [destinationEmail, setDestinationEmail] = useState('');
  const [forwards, setForwards] = useState<TempEmailForward[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingForwards, setLoadingForwards] = useState(true);
  const { toast } = useToast();
  const { session, isPremium } = useAuth();

  const domain = 'poofemail.com';

  useEffect(() => {
    if (session) {
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

    if (!tempEmailName || !destinationEmail) {
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
          destinationEmail: destinationEmail,
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

      // Refresh the list
      await loadForwards();

      // Reset form
      generateRandomName();
      setDestinationEmail('');
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

      // Refresh the list
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
              <Label htmlFor="destination-email">Your Email Address</Label>
              <Input
                id="destination-email"
                type="email"
                placeholder="your@email.com"
                value={destinationEmail}
                onChange={(e) => setDestinationEmail(e.target.value)}
                required
              />
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

            <Button type="submit" disabled={loading} className="w-full">
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
                          {forward.is_verified ? (
                            <Badge variant="secondary" className="flex-shrink-0">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="flex-shrink-0">
                              Pending
                            </Badge>
                          )}
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
            <Button className="w-full">
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
            <li>All emails sent to this address are forwarded to your real email</li>
            <li>The forward is active for 24 hours from creation</li>
            <li>After 24 hours, the forwarding rule is automatically deleted</li>
            <li>No emails are stored on our servers - everything is forwarded directly</li>
            <li>You can delete a forward anytime before it expires</li>
            <li>Free users: 5 active forwards maximum</li>
            <li>Premium users: 20 active forwards maximum</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="border-yellow-500/20 bg-yellow-500/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Important Privacy Notice
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            This service forwards emails to YOUR personal email address. Please be aware:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2 text-muted-foreground">
            <li>Do not use this for illegal activities or spam</li>
            <li>Your destination email address is stored securely but is visible to you</li>
            <li>We do not read or store the content of forwarded emails</li>
            <li>Abuse of this service may result in account suspension</li>
            <li>This is not suitable for highly sensitive communications</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
/*
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Mail, Copy, RefreshCw, Inbox, Clock, Trash2, ExternalLink, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface EmailMessage {
  id: string;
  from: string;
  subject: string;
  body: string;
  timestamp: Date;
  read: boolean;
}

export default function TempEmail() {
  const [email, setEmail] = useState('');
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<EmailMessage | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(3600); // 1 hour in seconds
  const [isActive, setIsActive] = useState(false);
  const { toast } = useToast();
  const { isPremium } = useAuth();

  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeRemaining === 0) {
      handleExpire();
    }
  }, [isActive, timeRemaining]);

  const generateEmail = () => {
    const randomString = Math.random().toString(36).substring(2, 10);
    const domains = ['tempmail.net', 'disposable.email', 'throwaway.email'];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    const newEmail = `${randomString}@${domain}`;
    setEmail(newEmail);
    setIsActive(true);
    setTimeRemaining(isPremium ? 7200 : 3600); // 2 hours for premium, 1 hour for free
    setMessages([]);
    setSelectedMessage(null);
    
    toast({
      title: "Email Created!",
      description: "Your temporary email is ready to use",
    });

    // Simulate receiving emails after a delay
    setTimeout(() => {
      addDemoEmail();
    }, 5000);
  };

  const addDemoEmail = () => {
    const demoEmails = [
      {
        from: 'noreply@example.com',
        subject: 'Welcome to our service!',
        body: 'Thank you for signing up. We\'re excited to have you on board!',
      },
      {
        from: 'newsletter@company.com',
        subject: 'Weekly Newsletter - Don\'t miss out!',
        body: 'Check out this week\'s top stories and exclusive offers...',
      },
      {
        from: 'verify@service.com',
        subject: 'Verify your email address',
        body: 'Please click the link below to verify your email address and complete your registration.',
      },
    ];

    const randomEmail = demoEmails[Math.floor(Math.random() * demoEmails.length)];
    const newMessage: EmailMessage = {
      id: Math.random().toString(36).substring(7),
      ...randomEmail,
      timestamp: new Date(),
      read: false,
    };

    setMessages((prev) => [newMessage, ...prev]);
    
    toast({
      title: "New Email Received",
      description: `From: ${newMessage.from}`,
    });
  };

  const handleExpire = () => {
    setIsActive(false);
    toast({
      title: "Email Expired",
      description: "Your temporary email has expired. Generate a new one to continue.",
      variant: "destructive",
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(email);
    toast({
      title: "Copied!",
      description: "Email address copied to clipboard",
    });
  };

  const refreshInbox = () => {
    toast({
      title: "Refreshing...",
      description: "Checking for new messages",
    });
    
    // Simulate new email occasionally
    if (Math.random() > 0.5) {
      setTimeout(() => addDemoEmail(), 1000);
    }
  };

  const deleteMessage = (id: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
    if (selectedMessage?.id === id) {
      setSelectedMessage(null);
    }
    toast({
      title: "Deleted",
      description: "Message removed from inbox",
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const markAsRead = (message: EmailMessage) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === message.id ? { ...msg, read: true } : msg
      )
    );
    setSelectedMessage({ ...message, read: true });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Mail className="h-8 w-8" />
          Temporary Email
        </h1>
        <p className="text-muted-foreground mt-2">
          Create disposable email addresses for temporary use
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Temporary Email</CardTitle>
          <CardDescription>
            Use this email for signups, verifications, or any temporary needs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isActive ? (
            <div className="text-center py-8">
              <Mail className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Generate a temporary email address to get started
              </p>
              <Button onClick={generateEmail} size="lg">
                <Mail className="h-4 w-4 mr-2" />
                Generate Email
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    value={email}
                    readOnly
                    className="font-mono"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={copyToClipboard}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={generateEmail}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Expires in: {formatTime(timeRemaining)}</span>
                  </div>
                  {isPremium && (
                    <Badge variant="secondary">
                      Extended Duration (2 hours)
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Inbox className="h-5 w-5" />
                  Inbox ({messages.length})
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={refreshInbox}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {isActive && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Messages</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {messages.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <Inbox className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No messages yet</p>
                  <p className="text-sm">New emails will appear here automatically</p>
                </div>
              ) : (
                <div className="divide-y">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                        !message.read ? 'bg-muted/30' : ''
                      } ${
                        selectedMessage?.id === message.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => markAsRead(message)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm truncate">
                              {message.from}
                            </p>
                            {!message.read && (
                              <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm font-medium truncate">
                            {message.subject}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMessage(message.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Message Content</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedMessage ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground">From</p>
                    <p className="font-medium">{selectedMessage.from}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Subject</p>
                    <p className="font-medium">{selectedMessage.subject}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Received</p>
                    <p className="text-sm">
                      {selectedMessage.timestamp.toLocaleString()}
                    </p>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="whitespace-pre-wrap">{selectedMessage.body}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Mail className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Select a message to view</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Important Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Temporary emails are automatically deleted after expiration</li>
            <li>Free users get 1 hour of email validity</li>
            <li>Premium users get 2 hours of extended validity</li>
            <li>Do not use for important or sensitive communications</li>
            <li>All emails are permanently deleted and cannot be recovered</li>
            <li>This is a demo - actual email functionality requires backend integration</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
*/
