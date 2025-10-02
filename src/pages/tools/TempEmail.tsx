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
