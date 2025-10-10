'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Lock, Eye, EyeOff, Copy, Trash2, Plus, Search, Shield, Upload, Key, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface PasswordEntry {
  id: string;
  website: string;
  username: string;
  password: string;
  strength: 'weak' | 'medium' | 'strong';
  created_at?: string;
}

interface EncryptedEntry {
  id: string;
  user_id: string;
  website: string;
  username: string;
  password: string;
  strength: 'weak' | 'medium' | 'strong';
  created_at: string;
  updated_at: string;
}

const PasswordManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Form state
  const [website, setWebsite] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Password generator state
  const [passwordLength, setPasswordLength] = useState(12);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  
  // Password entries
  const [decryptedEntries, setDecryptedEntries] = useState<PasswordEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Import state
  const [importSource, setImportSource] = useState('chrome');
  const [importData, setImportData] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Master password state
  const [masterPassword, setMasterPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showMasterPassword, setShowMasterPassword] = useState(false);
  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});

  // Encryption functions
  const deriveKey = async (password: string, salt: Uint8Array) => {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  };
  
  const encryptData = async (data: string, password: string) => {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const key = await deriveKey(password, salt);
    const encodedData = encoder.encode(data);
    
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encodedData
    );
    
    const encryptedArray = new Uint8Array(encryptedData);
    const result = new Uint8Array(salt.length + iv.length + encryptedArray.length);
    result.set(salt, 0);
    result.set(iv, salt.length);
    result.set(encryptedArray, salt.length + iv.length);
    
    return btoa(String.fromCharCode(...result));
  };
  
  const decryptData = async (encryptedData: string, password: string) => {
    try {
      const decoder = new TextDecoder();
      const data = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
      
      const salt = data.slice(0, 16);
      const iv = data.slice(16, 28);
      const encrypted = data.slice(28);
      
      const key = await deriveKey(password, salt);
      
      const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encrypted
      );
      
      return decoder.decode(decryptedData);
    } catch (error) {
      throw new Error('Decryption failed');
    }
  };

  // Calculate password strength
  const calculateStrength = (pwd: string): 'weak' | 'medium' | 'strong' => {
    if (pwd.length < 8) return 'weak';
    if (pwd.length < 12) return 'medium';
    return 'strong';
  };

  // Generate password
  const generatePassword = () => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    let characters = '';
    if (includeUppercase) characters += uppercase;
    if (includeLowercase) characters += lowercase;
    if (includeNumbers) characters += numbers;
    if (includeSymbols) characters += symbols;
    
    if (characters === '') {
      toast({
        title: "Error",
        description: "Please select at least one character type",
        variant: "destructive"
      });
      return;
    }
    
    let result = '';
    for (let i = 0; i < passwordLength; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    setPassword(result);
  };

  // Load encrypted entries from Supabase
  const loadEntries = async () => {
    if (!user || !isUnlocked) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('password_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const decrypted = await Promise.all(
          data.map(async (entry: EncryptedEntry) => ({
            id: entry.id,
            website: await decryptData(entry.website, masterPassword),
            username: await decryptData(entry.username, masterPassword),
            password: await decryptData(entry.password, masterPassword),
            strength: entry.strength,
            created_at: entry.created_at
          }))
        );
        setDecryptedEntries(decrypted);
      }
    } catch (error) {
      console.error('Error loading entries:', error);
      toast({
        title: "Error",
        description: "Failed to load password entries. Please check your master password.",
        variant: "destructive"
      });
      lockVault();
    } finally {
      setIsLoading(false);
    }
  };

  // Unlock vault
  const unlockVault = async () => {
    if (!masterPassword) {
      toast({
        title: "Error",
        description: "Please enter your master password",
        variant: "destructive"
      });
      return;
    }
    
    setIsUnlocked(true);
    toast({
      title: "Success",
      description: "Vault unlocked successfully"
    });
  };

  // Lock vault
  const lockVault = () => {
    setIsUnlocked(false);
    setDecryptedEntries([]);
    setMasterPassword('');
    setWebsite('');
    setUsername('');
    setPassword('');
  };

  // Add password entry
  const addPasswordEntry = async () => {
    if (!website || !username || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }
    
    if (!isUnlocked || !user) {
      toast({
        title: "Error",
        description: "Please unlock the vault first",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const encryptedWebsite = await encryptData(website, masterPassword);
      const encryptedUsername = await encryptData(username, masterPassword);
      const encryptedPassword = await encryptData(password, masterPassword);
      
      const { data, error } = await supabase
        .from('password_entries')
        .insert({
          user_id: user.id,
          website: encryptedWebsite,
          username: encryptedUsername,
          password: encryptedPassword,
          strength: calculateStrength(password)
        })
        .select()
        .single();

      if (error) throw error;

      const newEntry: PasswordEntry = {
        id: data.id,
        website,
        username,
        password,
        strength: calculateStrength(password)
      };
      
      setDecryptedEntries([newEntry, ...decryptedEntries]);
      
      setWebsite('');
      setUsername('');
      setPassword('');
      
      toast({
        title: "Success",
        description: "Password saved successfully"
      });
    } catch (error) {
      console.error('Error saving password:', error);
      toast({
        title: "Error",
        description: "Failed to save password",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Delete entry
  const deleteEntry = async (id: string) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('password_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setDecryptedEntries(decryptedEntries.filter(entry => entry.id !== id));
      
      toast({
        title: "Success",
        description: "Password deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({
        title: "Error",
        description: "Failed to delete password",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Copied to clipboard"
    });
  };

  // Handle import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImportData(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!importData || !isUnlocked || !user) {
      toast({
        title: "Error",
        description: "Please select a file and unlock the vault",
        variant: "destructive"
      });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const lines = content.split('\n').slice(1);
        let imported = 0;
        
        for (const line of lines) {
          if (!line.trim()) continue;
          
          const parts = line.split(',').map(p => p.replace(/"/g, '').trim());
          let url = '', user = '', pass = '';
          
          if (importSource === 'chrome' && parts.length >= 4) {
            [, url, user, pass] = parts;
          } else if (importSource === 'firefox' && parts.length >= 3) {
            [url, user, pass] = parts;
          } else if (importSource === 'lastpass' && parts.length >= 4) {
            [, url, user, pass] = parts;
          }
          
          if (url && user && pass) {
            const encryptedWebsite = await encryptData(url, masterPassword);
            const encryptedUsername = await encryptData(user, masterPassword);
            const encryptedPassword = await encryptData(pass, masterPassword);
            
            await supabase
              .from('password_entries')
              .insert({
                user_id: user.id,
                website: encryptedWebsite,
                username: encryptedUsername,
                password: encryptedPassword,
                strength: calculateStrength(pass)
              });
            
            imported++;
          }
        }
        
        await loadEntries();
        
        toast({
          title: "Success",
          description: `Imported ${imported} passwords successfully`
        });
        
        setImportData(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        console.error('Import error:', error);
        toast({
          title: "Error",
          description: "Failed to import passwords",
          variant: "destructive"
        });
      }
    };
    
    reader.readAsText(importData);
  };

  // Filter entries
  const filteredEntries = decryptedEntries.filter(entry => 
    entry.website.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Load entries when unlocked
  useEffect(() => {
    if (isUnlocked) {
      loadEntries();
    }
  }, [isUnlocked]);

  // Initialize with generated password
  useEffect(() => {
    generatePassword();
  }, []);

  if (!isUnlocked) {
    return (
      <div className="container mx-auto p-6 max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>Unlock Password Vault</CardTitle>
            <CardDescription>
              Enter your master password to access your encrypted passwords
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="master-password">Master Password</Label>
              <div className="relative">
                <Input
                  id="master-password"
                  type={showMasterPassword ? "text" : "password"}
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  placeholder="Enter your master password"
                  onKeyDown={(e) => e.key === 'Enter' && unlockVault()}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowMasterPassword(!showMasterPassword)}
                >
                  {showMasterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            
            <Button onClick={unlockVault} className="w-full">
              <Key className="w-4 h-4 mr-2" />
              Unlock Vault
            </Button>
            
            <Alert>
              <Shield className="w-4 h-4" />
              <AlertDescription>
                <p className="font-medium mb-2">Security Features:</p>
                <ul className="text-sm space-y-1">
                  <li>• AES-256-GCM encryption</li>
                  <li>• PBKDF2 key derivation (100k iterations)</li>
                  <li>• Master password never stored</li>
                  <li>• Unique salt & IV per entry</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Password Manager</h1>
          <p className="text-muted-foreground">Securely manage your passwords</p>
        </div>
        <Button onClick={lockVault} variant="outline">
          <Lock className="w-4 h-4 mr-2" />
          Lock Vault
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Add password */}
          <Card>
            <CardHeader>
              <CardTitle>Add New Password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="example.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="username">Username/Email</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="flex gap-2">
                  <Input
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter or generate password"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => copyToClipboard(password)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <Button onClick={addPasswordEntry} className="w-full" disabled={isLoading}>
                <Plus className="w-4 h-4 mr-2" />
                Save Password
              </Button>
            </CardContent>
          </Card>

          {/* Password generator */}
          <Card>
            <CardHeader>
              <CardTitle>Password Generator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Length: {passwordLength}</Label>
                <Slider
                  value={[passwordLength]}
                  onValueChange={(value) => setPasswordLength(value[0])}
                  min={6}
                  max={30}
                  step={1}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="uppercase"
                    checked={includeUppercase}
                    onCheckedChange={(checked) => setIncludeUppercase(checked as boolean)}
                  />
                  <Label htmlFor="uppercase">Uppercase</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="lowercase"
                    checked={includeLowercase}
                    onCheckedChange={(checked) => setIncludeLowercase(checked as boolean)}
                  />
                  <Label htmlFor="lowercase">Lowercase</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="numbers"
                    checked={includeNumbers}
                    onCheckedChange={(checked) => setIncludeNumbers(checked as boolean)}
                  />
                  <Label htmlFor="numbers">Numbers</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="symbols"
                    checked={includeSymbols}
                    onCheckedChange={(checked) => setIncludeSymbols(checked as boolean)}
                  />
                  <Label htmlFor="symbols">Symbols</Label>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={generatePassword} className="flex-1">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Generate
                </Button>
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(password)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Import */}
          <Card>
            <CardHeader>
              <CardTitle>Import Passwords</CardTitle>
              <CardDescription>Import from browser or password manager</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {['chrome', 'firefox', 'lastpass', 'other'].map((source) => (
                  <Button
                    key={source}
                    variant={importSource === source ? "default" : "outline"}
                    onClick={() => setImportSource(source)}
                    className="capitalize"
                  >
                    {source}
                  </Button>
                ))}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="file">CSV File</Label>
                <Input
                  id="file"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv"
                />
              </div>
              
              <Button onClick={handleImport} disabled={!importData || isLoading} className="w-full">
                <Upload className="w-4 h-4 mr-2" />
                Import Passwords
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Saved Passwords</CardTitle>
                <Badge>{decryptedEntries.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search passwords..."
                  className="pl-9"
                />
              </div>
              
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredEntries.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'No passwords found' : 'No passwords yet'}
                  </div>
                ) : (
                  filteredEntries.map((entry) => (
                    <Card key={entry.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="font-medium">{entry.website}</p>
                            <p className="text-sm text-muted-foreground">{entry.username}</p>
                          </div>
                          <Badge
                            variant={
                              entry.strength === 'weak' ? 'destructive' :
                              entry.strength === 'medium' ? 'secondary' :
                              'default'
                            }
                          >
                            {entry.strength}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Input
                            type={showPassword[entry.id] ? "text" : "password"}
                            value={entry.password}
                            readOnly
                            className="flex-1 font-mono text-sm"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowPassword({ ...showPassword, [entry.id]: !showPassword[entry.id] })}
                          >
                            {showPassword[entry.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(entry.password)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteEntry(entry.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PasswordManager;
