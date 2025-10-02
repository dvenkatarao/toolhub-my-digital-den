import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link2, Copy, ExternalLink, Crown, BarChart3, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import QRCode from 'qrcode';

interface ShortenedUrl {
  keyword: string;
  url: string;
  shorturl: string;
  title?: string;
  date?: string;
  clicks?: string;
}

export default function LinkShortener() {
  const [url, setUrl] = useState('');
  const [customKeyword, setCustomKeyword] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ShortenedUrl | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [stats, setStats] = useState<any>(null);
  const { toast } = useToast();
  const { session, isPremium } = useAuth();

  useEffect(() => {
    if (isPremium) {
      loadStats();
    }
  }, [isPremium]);

  const generateQRCode = async (url: string) => {
    try {
      const qr = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      setQrCodeUrl(qr);
    } catch (error) {
      console.error('QR Code generation error:', error);
    }
  };

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) {
      toast({
        title: "Error",
        description: "Please enter a URL to shorten",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);
    setQrCodeUrl('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to use this feature",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('yourls', {
        body: {
          action: 'shorten',
          url: url,
          keyword: customKeyword || undefined,
          title: title || undefined,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data.status === 'fail') {
        toast({
          title: "Error",
          description: data.message || "Failed to shorten URL",
          variant: "destructive",
        });
        return;
      }

      const shortened = {
        keyword: data.url?.keyword || data.shorturl?.split('/').pop(),
        url: data.url?.url || url,
        shorturl: data.shorturl || `https://lnk.wazir.ai/${data.url?.keyword}`,
        title: data.url?.title || title,
        date: data.url?.date,
      };

      setResult(shortened);
      await generateQRCode(shortened.shorturl);

      toast({
        title: "Success!",
        description: "Your link has been shortened",
      });
    } catch (error: any) {
      console.error('Shorten error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to shorten URL",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Link copied to clipboard",
    });
  };

  const loadStats = async () => {
    if (!isPremium) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const { data, error } = await supabase.functions.invoke('yourls', {
        body: { action: 'db-stats' },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error('Stats error:', error);
    }
  };

  useEffect(() => {
    if (isPremium) {
      loadStats();
    }
  }, [isPremium]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Link2 className="h-8 w-8" />
          Link Shortener
        </h1>
        <p className="text-muted-foreground mt-2">
          Create short, memorable links for easy sharing
        </p>
      </div>

      <Tabs defaultValue="shorten" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="shorten">Shorten URL</TabsTrigger>
          <TabsTrigger value="manage" disabled={!isPremium}>
            <Crown className="h-4 w-4 mr-2" />
            Manage Links
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shorten" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Shorten Your URL</CardTitle>
              <CardDescription>
                Enter a long URL to create a shortened version
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleShorten} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="url">Long URL *</Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://example.com/very/long/url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title (Optional)</Label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="My Link"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                {isPremium && (
                  <div className="space-y-2">
                    <Label htmlFor="keyword" className="flex items-center gap-2">
                      Custom Keyword (Optional)
                      <Badge variant="secondary" className="text-xs">
                        <Crown className="h-3 w-3 mr-1" />
                        Premium
                      </Badge>
                    </Label>
                    <Input
                      id="keyword"
                      type="text"
                      placeholder="my-custom-link"
                      value={customKeyword}
                      onChange={(e) => setCustomKeyword(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Create a custom short link like: lnk.wazir.ai/my-custom-link
                    </p>
                  </div>
                )}

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Shortening...
                    </>
                  ) : (
                    <>
                      <Link2 className="h-4 w-4 mr-2" />
                      Shorten URL
                    </>
                  )}
                </Button>
              </form>

              {result && (
                <div className="mt-6 space-y-4 p-4 border rounded-lg bg-muted/50">
                  <div>
                    <Label className="text-xs text-muted-foreground">Shortened URL</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        value={result.shorturl}
                        readOnly
                        className="font-mono"
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => copyToClipboard(result.shorturl)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        asChild
                      >
                        <a href={result.shorturl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>

                  {qrCodeUrl && (
                    <div className="flex flex-col items-center">
                      <Label className="text-xs text-muted-foreground mb-2">QR Code</Label>
                      <img src={qrCodeUrl} alt="QR Code" className="rounded-lg border" />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {!isPremium && (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  Upgrade to Premium
                </CardTitle>
                <CardDescription>
                  Unlock advanced features with a premium subscription
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Custom short URLs (branded links)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Link management and analytics
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Edit and delete links
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Detailed click statistics
                  </li>
                </ul>
                <Button className="w-full mt-4">
                  Upgrade Now
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="manage" className="space-y-4">
          {isPremium && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Link Management
                </CardTitle>
                <CardDescription>
                  View and manage your shortened links
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats && (
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{stats.total_links || 0}</div>
                      <div className="text-xs text-muted-foreground">Total Links</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{stats.total_clicks || 0}</div>
                      <div className="text-xs text-muted-foreground">Total Clicks</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">
                        {stats.total_links > 0 
                          ? Math.round(stats.total_clicks / stats.total_links) 
                          : 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Avg Clicks</div>
                    </div>
                  </div>
                )}
                <p className="text-sm text-muted-foreground text-center">
                  Full link management interface coming soon...
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
