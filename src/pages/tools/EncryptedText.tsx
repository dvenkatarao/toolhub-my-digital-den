import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Copy, Lock, Unlock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function EncryptedText() {
  const [encryptText, setEncryptText] = useState('');
  const [encryptPassword, setEncryptPassword] = useState('');
  const [encryptedResult, setEncryptedResult] = useState('');
  const [decryptText, setDecryptText] = useState('');
  const [decryptPassword, setDecryptPassword] = useState('');
  const [decryptedResult, setDecryptedResult] = useState('');
  const [showEncryptPassword, setShowEncryptPassword] = useState(false);
  const [showDecryptPassword, setShowDecryptPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Simple encryption using Base64 and XOR cipher
  const encrypt = (text: string, password: string): string => {
    if (!text || !password) return '';
    
    let encrypted = '';
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ password.charCodeAt(i % password.length);
      encrypted += String.fromCharCode(charCode);
    }
    return btoa(encrypted);
  };

  const decrypt = (encryptedText: string, password: string): string => {
    if (!encryptedText || !password) return '';
    
    try {
      const decoded = atob(encryptedText);
      let decrypted = '';
      for (let i = 0; i < decoded.length; i++) {
        const charCode = decoded.charCodeAt(i) ^ password.charCodeAt(i % password.length);
        decrypted += String.fromCharCode(charCode);
      }
      return decrypted;
    } catch (error) {
      return '';
    }
  };

  const handleEncrypt = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!encryptText || !encryptPassword) {
      toast({
        title: "Error",
        description: "Please enter both text and password",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const result = encrypt(encryptText, encryptPassword);
      setEncryptedResult(result);
      setLoading(false);
      toast({
        title: "Success!",
        description: "Text encrypted successfully",
      });
    }, 500);
  };

  const handleDecrypt = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!decryptText || !decryptPassword) {
      toast({
        title: "Error",
        description: "Please enter both encrypted text and password",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const result = decrypt(decryptText, decryptPassword);
      if (result) {
        setDecryptedResult(result);
        toast({
          title: "Success!",
          description: "Text decrypted successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to decrypt. Check your password.",
          variant: "destructive",
        });
      }
      setLoading(false);
    }, 500);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Text copied to clipboard",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="h-8 w-8" />
          Encrypted Text Sender
        </h1>
        <p className="text-muted-foreground mt-2">
          Send encrypted messages securely with password protection
        </p>
      </div>

      <Tabs defaultValue="encrypt" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="encrypt">
            <Lock className="h-4 w-4 mr-2" />
            Encrypt
          </TabsTrigger>
          <TabsTrigger value="decrypt">
            <Unlock className="h-4 w-4 mr-2" />
            Decrypt
          </TabsTrigger>
        </TabsList>

        <TabsContent value="encrypt" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Encrypt Your Message</CardTitle>
              <CardDescription>
                Enter your message and a password to create an encrypted text
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEncrypt} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="encrypt-text">Message to Encrypt *</Label>
                  <Textarea
                    id="encrypt-text"
                    placeholder="Enter your secret message here..."
                    value={encryptText}
                    onChange={(e) => setEncryptText(e.target.value)}
                    rows={6}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {encryptText.length} characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="encrypt-password">Encryption Password *</Label>
                  <div className="relative">
                    <Input
                      id="encrypt-password"
                      type={showEncryptPassword ? "text" : "password"}
                      placeholder="Enter a strong password"
                      value={encryptPassword}
                      onChange={(e) => setEncryptPassword(e.target.value)}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0"
                      onClick={() => setShowEncryptPassword(!showEncryptPassword)}
                    >
                      {showEncryptPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Remember this password - you'll need it to decrypt the message
                  </p>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Encrypting...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Encrypt Message
                    </>
                  )}
                </Button>
              </form>

              {encryptedResult && (
                <div className="mt-6 space-y-4 p-4 border rounded-lg bg-muted/50">
                  <div>
                    <Label className="text-xs text-muted-foreground">Encrypted Text</Label>
                    <div className="flex items-start gap-2 mt-1">
                      <Textarea
                        value={encryptedResult}
                        readOnly
                        className="font-mono text-xs"
                        rows={6}
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => copyToClipboard(encryptedResult)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Share this encrypted text and password separately with your recipient
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="decrypt" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Decrypt a Message</CardTitle>
              <CardDescription>
                Enter the encrypted text and password to reveal the original message
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDecrypt} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="decrypt-text">Encrypted Text *</Label>
                  <Textarea
                    id="decrypt-text"
                    placeholder="Paste the encrypted text here..."
                    value={decryptText}
                    onChange={(e) => setDecryptText(e.target.value)}
                    rows={6}
                    required
                    className="font-mono text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="decrypt-password">Decryption Password *</Label>
                  <div className="relative">
                    <Input
                      id="decrypt-password"
                      type={showDecryptPassword ? "text" : "password"}
                      placeholder="Enter the password"
                      value={decryptPassword}
                      onChange={(e) => setDecryptPassword(e.target.value)}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0"
                      onClick={() => setShowDecryptPassword(!showDecryptPassword)}
                    >
                      {showDecryptPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Decrypting...
                    </>
                  ) : (
                    <>
                      <Unlock className="h-4 w-4 mr-2" />
                      Decrypt Message
                    </>
                  )}
                </Button>
              </form>

              {decryptedResult && (
                <div className="mt-6 space-y-4 p-4 border rounded-lg bg-muted/50">
                  <div>
                    <Label className="text-xs text-muted-foreground">Decrypted Message</Label>
                    <div className="flex items-start gap-2 mt-1">
                      <Textarea
                        value={decryptedResult}
                        readOnly
                        rows={6}
                        className="bg-background"
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => copyToClipboard(decryptedResult)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="text-base">Security Notice</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            This tool uses client-side encryption for basic message security. For highly sensitive information, consider using end-to-end encrypted messaging services.
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Always use strong, unique passwords</li>
            <li>Share passwords through a different channel than the encrypted text</li>
            <li>Never reuse passwords across different messages</li>
            <li>Messages are not stored on any server</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
