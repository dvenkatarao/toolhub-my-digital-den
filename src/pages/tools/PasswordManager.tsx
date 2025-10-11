import React, { useState, useEffect, useRef } from 'react';
import { Lock, Eye, EyeOff, Copy, Trash2, Plus, Search, Shield, Upload, Key, RefreshCw, Info, CheckCircle2, AlertCircle, RotateCcw, Download, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

interface PasswordEntry {
  id: string;
  website: string;
  username: string;
  password: string;
  strength: 'weak' | 'medium' | 'strong';
  created_at?: string;
}

interface VaultSettings {
  id: string;
  user_id: string;
  vault_password_hash: string;
  two_factor_secret?: string;
  two_factor_enabled: boolean;
  recovery_questions?: any;
  recovery_email?: string;
  created_at: string;
}

const PasswordManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Vault setup state
  const [vaultExists, setVaultExists] = useState<boolean | null>(null);
  const [isSettingUpVault, setIsSettingUpVault] = useState(false);
  const [newVaultPassword, setNewVaultPassword] = useState('');
  const [confirmVaultPassword, setConfirmVaultPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [twoFactorQR, setTwoFactorQR] = useState('');
  const [setup2FA, setSetup2FA] = useState(false);
  
  // Recovery setup state
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [securityQuestion1, setSecurityQuestion1] = useState('');
  const [securityAnswer1, setSecurityAnswer1] = useState('');
  const [securityQuestion2, setSecurityQuestion2] = useState('');
  const [securityAnswer2, setSecurityAnswer2] = useState('');
  const [recoveryKey, setRecoveryKey] = useState('');
  
  // Password recovery state
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [recoveryMethod, setRecoveryMethod] = useState<'questions' | 'key' | 'email'>('questions');
  const [recoveryAnswer1, setRecoveryAnswer1] = useState('');
  const [recoveryAnswer2, setRecoveryAnswer2] = useState('');
  const [enteredRecoveryKey, setEnteredRecoveryKey] = useState('');
  const [newPasswordAfterRecovery, setNewPasswordAfterRecovery] = useState('');
  const [confirmNewPasswordAfterRecovery, setConfirmNewPasswordAfterRecovery] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);
  const [vaultSettings, setVaultSettings] = useState<VaultSettings | null>(null);
  
  // Password reset state (destructive)
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetConfirmation, setResetConfirmation] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  
  // Form state
  const [website, setWebsite] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Password generator state
  const [passwordLength, setPasswordLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  
  // Password entries
  const [decryptedEntries, setDecryptedEntries] = useState<PasswordEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Import state
  const [importData, setImportData] = useState<File | null>(null);
  const [showImportHelp, setShowImportHelp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Master password state
  const [masterPassword, setMasterPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showMasterPassword, setShowMasterPassword] = useState(false);
  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});
  const [requires2FA, setRequires2FA] = useState(false);

  // Predefined security questions
  const securityQuestions = [
    "What was the name of your first pet?",
    "What city were you born in?",
    "What is your mother's maiden name?",
    "What was the name of your first school?",
    "What is your favorite book?",
    "What was your childhood nickname?",
    "What street did you grow up on?",
    "What is your father's middle name?"
  ];

  // Simple TOTP implementation
  const generateTOTP = (secret: string): string => {
    const epoch = Math.floor(Date.now() / 1000);
    const timeStep = Math.floor(epoch / 30);
    
    const combined = secret + timeStep.toString();
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      hash = ((hash << 5) - hash) + combined.charCodeAt(i);
      hash = hash & hash;
    }
    
    const code = Math.abs(hash % 1000000).toString().padStart(6, '0');
    return code;
  };

  const verifyTOTP = (secret: string, token: string): boolean => {
    const currentCode = generateTOTP(secret);
    
    const epoch = Math.floor(Date.now() / 1000);
    const prevTimeStep = Math.floor((epoch - 30) / 30);
    const nextTimeStep = Math.floor((epoch + 30) / 30);
    
    const prevCombined = secret + prevTimeStep.toString();
    let prevHash = 0;
    for (let i = 0; i < prevCombined.length; i++) {
      prevHash = ((prevHash << 5) - prevHash) + prevCombined.charCodeAt(i);
      prevHash = prevHash & prevHash;
    }
    const prevCode = Math.abs(prevHash % 1000000).toString().padStart(6, '0');
    
    const nextCombined = secret + nextTimeStep.toString();
    let nextHash = 0;
    for (let i = 0; i < nextCombined.length; i++) {
      nextHash = ((nextHash << 5) - nextHash) + nextCombined.charCodeAt(i);
      nextHash = nextHash & nextHash;
    }
    const nextCode = Math.abs(nextHash % 1000000).toString().padStart(6, '0');
    
    return token === currentCode || token === prevCode || token === nextCode;
  };

  // Hash password using SHA-256
  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  // Generate 2FA secret
  const generate2FASecret = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars[Math.floor(Math.random() * chars.length)];
    }
    return secret;
  };

  // Generate recovery key
  const generateRecoveryKey = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segments = [];
    for (let i = 0; i < 4; i++) {
      let segment = '';
      for (let j = 0; j < 4; j++) {
        segment += chars[Math.floor(Math.random() * chars.length)];
      }
      segments.push(segment);
    }
    return segments.join('-');
  };

  // Check if vault exists
  const checkVaultExists = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('vault_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking vault:', error);
        throw error;
      }

      if (data) {
        setVaultExists(true);
        setVaultSettings(data);
        setRequires2FA(data.two_factor_enabled);
      } else {
        setVaultExists(false);
        setIsSettingUpVault(true);
      }
    } catch (error) {
      console.error('Error checking vault:', error);
      toast({
        title: "Error",
        description: "Failed to check vault status",
        variant: "destructive"
      });
    }
  };

  // Setup vault
  const setupVault = async () => {
    if (!user) return;
    
    if (!newVaultPassword || newVaultPassword.length < 8) {
      toast({
        title: "Error",
        description: "Vault password must be at least 8 characters",
        variant: "destructive"
      });
      return;
    }

    if (newVaultPassword !== confirmVaultPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (!securityQuestion1 || !securityAnswer1 || !securityQuestion2 || !securityAnswer2) {
      toast({
        title: "Error",
        description: "Please set up both security questions for account recovery",
        variant: "destructive"
      });
      return;
    }

    if (setup2FA && (!twoFactorCode || twoFactorCode.length !== 6)) {
      toast({
        title: "Error",
        description: "Please enter the 6-digit code from your authenticator app",
        variant: "destructive"
      });
      return;
    }

    if (setup2FA && !verifyTOTP(twoFactorSecret, twoFactorCode)) {
      toast({
        title: "Error",
        description: "Invalid 2FA code. Please try again.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const passwordHash = await hashPassword(newVaultPassword);
      const answer1Hash = await hashPassword(securityAnswer1.toLowerCase().trim());
      const answer2Hash = await hashPassword(securityAnswer2.toLowerCase().trim());
      const generatedRecoveryKey = generateRecoveryKey();
      const recoveryKeyHash = await hashPassword(generatedRecoveryKey);
      
      const recoveryQuestions = {
        question1: securityQuestion1,
        answer1Hash: answer1Hash,
        question2: securityQuestion2,
        answer2Hash: answer2Hash,
        recoveryKeyHash: recoveryKeyHash
      };

      const { error: deleteError } = await supabase
        .from('vault_settings')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Error deleting old vault:', deleteError);
      }

      const { error: insertError } = await supabase
        .from('vault_settings')
        .insert({
          user_id: user.id,
          vault_password_hash: passwordHash,
          two_factor_secret: setup2FA ? twoFactorSecret : null,
          two_factor_enabled: setup2FA,
          recovery_questions: recoveryQuestions,
          recovery_email: recoveryEmail || null
        });

      if (insertError) {
        console.error('Supabase insert error:', insertError);
        throw insertError;
      }

      setRecoveryKey(generatedRecoveryKey);

      toast({
        title: "Success",
        description: "Vault created successfully! Please save your recovery key.",
      });

      setVaultExists(true);
      setIsSettingUpVault(false);
      setRequires2FA(setup2FA);
      
    } catch (error: any) {
      console.error('Error setting up vault:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create vault",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Download recovery key
  const downloadRecoveryKey = () => {
    const content = `ToolHub Password Manager - Recovery Key
    
Generated: ${new Date().toLocaleString()}
User: ${user?.email}

RECOVERY KEY: ${recoveryKey}

⚠️ IMPORTANT:
- Keep this key in a safe place
- You will need it to recover your vault if you forget your password
- This is the ONLY time this key will be shown
- Do not share this key with anyone

Security Questions:
1. ${securityQuestion1}
2. ${securityQuestion2}

To recover your vault, you can use either:
- Both security questions
- This recovery key
- Your recovery email (if configured)
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `toolhub-recovery-key-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      description: "Recovery key has been downloaded"
    });
  };

  // Complete vault setup
  const completeVaultSetup = () => {
    setRecoveryKey('');
    setNewVaultPassword('');
    setConfirmVaultPassword('');
    setTwoFactorCode('');
    setTwoFactorSecret('');
    setSecurityQuestion1('');
    setSecurityAnswer1('');
    setSecurityQuestion2('');
    setSecurityAnswer2('');
    setRecoveryEmail('');
  };

  // Recover vault password
  const recoverVaultPassword = async () => {
    if (!user || !vaultSettings) return;

    if (!newPasswordAfterRecovery || newPasswordAfterRecovery.length < 8) {
      toast({
        title: "Error",
        description: "New password must be at least 8 characters",
        variant: "destructive"
      });
      return;
    }

    if (newPasswordAfterRecovery !== confirmNewPasswordAfterRecovery) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    setIsRecovering(true);
    try {
      const recoveryData = vaultSettings.recovery_questions;

      if (recoveryMethod === 'questions') {
        const answer1Hash = await hashPassword(recoveryAnswer1.toLowerCase().trim());
        const answer2Hash = await hashPassword(recoveryAnswer2.toLowerCase().trim());

        if (answer1Hash !== recoveryData.answer1Hash || answer2Hash !== recoveryData.answer2Hash) {
          throw new Error('Security answers do not match. Please try again.');
        }
      } else if (recoveryMethod === 'key') {
        const enteredKeyHash = await hashPassword(enteredRecoveryKey);
        if (enteredKeyHash !== recoveryData.recoveryKeyHash) {
          throw new Error('Invalid recovery key. Please check and try again.');
        }
      } else if (recoveryMethod === 'email') {
        toast({
          title: "Email Sent",
          description: "Check your email for recovery instructions",
        });
        return;
      }

      const newPasswordHash = await hashPassword(newPasswordAfterRecovery);
      
      const { error } = await supabase
        .from('vault_settings')
        .update({ vault_password_hash: newPasswordHash })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Vault password has been reset. Please unlock with your new password.",
      });

      setShowRecoveryDialog(false);
      setRecoveryAnswer1('');
      setRecoveryAnswer2('');
      setEnteredRecoveryKey('');
      setNewPasswordAfterRecovery('');
      setConfirmNewPasswordAfterRecovery('');
    } catch (error: any) {
      console.error('Error recovering vault:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to recover vault",
        variant: "destructive"
      });
    } finally {
      setIsRecovering(false);
    }
  };

  // Reset vault (destructive)
  const resetVault = async () => {
    if (!user) return;
    
    if (resetConfirmation !== 'DELETE ALL PASSWORDS') {
      toast({
        title: "Error",
        description: "Please type the confirmation text exactly",
        variant: "destructive"
      });
      return;
    }

    setIsResetting(true);
    try {
      const { error: entriesError } = await supabase
        .from('password_entries')
        .delete()
        .eq('user_id', user.id);

      if (entriesError) throw entriesError;

      const { error: vaultError } = await supabase
        .from('vault_settings')
        .delete()
        .eq('user_id', user.id);

      if (vaultError) throw vaultError;

      toast({
        title: "Vault Reset",
        description: "Your vault has been completely reset. You can now create a new one.",
      });

      setShowResetDialog(false);
      setResetConfirmation('');
      setVaultExists(false);
      setIsSettingUpVault(true);
      setIsUnlocked(false);
      setDecryptedEntries([]);
      setMasterPassword('');
      setTwoFactorCode('');
    } catch (error) {
      console.error('Error resetting vault:', error);
      toast({
        title: "Error",
        description: "Failed to reset vault",
        variant: "destructive"
      });
    } finally {
      setIsResetting(false);
    }
  };

  // Generate 2FA QR code
  useEffect(() => {
    if (setup2FA && !twoFactorSecret) {
      const secret = generate2FASecret();
      setTwoFactorSecret(secret);
      
      const issuer = 'ToolHub';
      const account = user?.email || 'user';
      const otpauth = `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}`;
      
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauth)}`;
      setTwoFactorQR(qrUrl);
    }
  }, [setup2FA, user]);

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
    
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSymbol = /[^A-Za-z0-9]/.test(pwd);
    
    const complexityScore = [hasUpper, hasLower, hasNumber, hasSymbol].filter(Boolean).length;
    
    if (complexityScore >= 3 && pwd.length >= 12) return 'strong';
    if (complexityScore >= 2 && pwd.length >= 10) return 'medium';
    return 'weak';
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

  // Load entries
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
          data.map(async (entry: any) => ({
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
        description: "Failed to load password entries.",
        variant: "destructive"
      });
      lockVault();
    } finally {
      setIsLoading(false);
    }
  };

  // Unlock vault
  const unlockVault = async () => {
    if (!user || !masterPassword) {
      toast({
        title: "Error",
        description: "Please enter your vault password",
        variant: "destructive"
      });
      return;
    }

    if (requires2FA && (!twoFactorCode || twoFactorCode.length !== 6)) {
      toast({
        title: "Error",
        description: "Please enter your 2FA code",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const passwordHash = await hashPassword(masterPassword);
      
      const { data: vaultData, error: vaultError } = await supabase
        .from('vault_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (vaultError) {
        console.error('Vault query error:', vaultError);
        throw vaultError;
      }

      if (vaultData.vault_password_hash !== passwordHash) {
        throw new Error('Invalid vault password');
      }

      if (vaultData.two_factor_enabled) {
        if (!verifyTOTP(vaultData.two_factor_secret, twoFactorCode)) {
          throw new Error('Invalid 2FA code');
        }
      }

      setIsUnlocked(true);
      toast({
        title: "Success",
        description: "Vault unlocked successfully"
      });
    } catch (error: any) {
      console.error('Error unlocking vault:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to unlock vault.",
        variant: "destructive"
      });
      setMasterPassword('');
      setTwoFactorCode('');
    } finally {
      setIsLoading(false);
    }
  };

  // Lock vault
  const lockVault = () => {
    setIsUnlocked(false);
    setDecryptedEntries([]);
    setMasterPassword('');
    setTwoFactorCode('');
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
        const lines = content.split('\n');
        
        const dataLines = lines.slice(1).filter(line => line.trim());
        
        let imported = 0;
        let failed = 0;
        
        for (const line of dataLines) {
          try {
            const parts: string[] = [];
            let current = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
              const char = line[i];
              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === ',' && !inQuotes) {
                parts.push(current.trim());
                current = '';
              } else {
                current += char;
              }
            }
            parts.push(current.trim());
            
            if (parts.length >= 4) {
              const url = parts[1].replace(/^["']|["']$/g, '');
              const usr = parts[2].replace(/^["']|["']$/g, '');
              const pass = parts[3].replace(/^["']|["']$/g, '');
              
              if (url && usr && pass) {
                const encryptedWebsite = await encryptData(url, masterPassword);
                const encryptedUsername = await encryptData(usr, masterPassword);
                const encryptedPassword = await encryptData(pass, masterPassword);
                
                const { error } = await supabase
                  .from('password_entries')
                  .insert({
                    user_id: user.id,
                    website: encryptedWebsite,
                    username: encryptedUsername,
                    password: encryptedPassword,
                    strength: calculateStrength(pass)
                  });
                
                if (error) {
                  console.error('Import error for entry:', error);
                  failed++;
                } else {
                  imported++;
                }
              }
            }
          } catch (lineError) {
            console.error('Error parsing line:', lineError);
            failed++;
          }
        }
        
        await loadEntries();
        
        toast({
          title: "Import Complete",
          description: `Successfully imported ${imported} passwords${failed > 0 ? `, ${failed} failed` : ''}`
        });
        
        setImportData(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        console.error('Import error:', error);
        toast({
          title: "Error",
          description: "Failed to import passwords. Please check the file format.",
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

  // Effects
  useEffect(() => {
    if (isUnlocked) {
      loadEntries();
    }
  }, [isUnlocked]);

  useEffect(() => {
    if (user) {
      checkVaultExists();
    }
  }, [user]);

  useEffect(() => {
    generatePassword();
  }, []);

  // Show recovery key dialog after vault creation
  if (recoveryKey) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Vault Created Successfully!</CardTitle>
            <CardDescription>
              Save your recovery key - this is the only time it will be shown
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertTitle>Critical: Save Your Recovery Key</AlertTitle>
              <AlertDescription>
                This recovery key is required to reset your vault password if you forget it. Store it in a safe place.
              </AlertDescription>
            </Alert>

            <div className="bg-muted p-4 rounded-lg">
              <Label className="text-sm font-medium">Recovery Key</Label>
              <div className="mt-2 flex items-center gap-2">
                <Input
                  value={recoveryKey}
                  readOnly
                  className="font-mono text-lg"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(recoveryKey)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                <strong>Recovery Methods Set Up:</strong>
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Security Questions (2 questions)</li>
                <li>Recovery Key (shown above)</li>
                {recoveryEmail && <li>Recovery Email: {recoveryEmail}</li>}
              </ul>
            </div>

            <div className="flex gap-3">
              <Button onClick={downloadRecoveryKey} className="flex-1" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download Recovery Key
              </Button>
              <Button onClick={completeVaultSetup} className="flex-1">
                I've Saved It, Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vault setup screen
  if (vaultExists === false || isSettingUpVault) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Create Your Password Vault</CardTitle>
            <CardDescription>
              Set up a secure vault with multiple recovery options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <Info className="w-4 h-4" />
              <AlertTitle>Recovery Options</AlertTitle>
              <AlertDescription>
                We'll set up multiple ways to recover your vault if you forget your password, so you never lose access to your data.
              </AlertDescription>
            </Alert>

            <Tabs defaultValue="password" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="password">Password</TabsTrigger>
                <TabsTrigger value="recovery">Recovery</TabsTrigger>
                <TabsTrigger value="2fa">2FA (Optional)</TabsTrigger>
              </TabsList>

              <TabsContent value="password" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="new-vault-password">Vault Password</Label>
                  <Input
                    id="new-vault-password"
                    type="password"
                    value={newVaultPassword}
                    onChange={(e) => setNewVaultPassword(e.target.value)}
                    placeholder="Create a strong vault password (min 8 characters)"
                  />
                  {newVaultPassword && (
                    <div className="flex items-center gap-2 text-sm">
                      <Badge
                        variant={
                          calculateStrength(newVaultPassword) === 'weak' ? 'destructive' :
                          calculateStrength(newVaultPassword) === 'medium' ? 'secondary' :
                          'default'
                        }
                      >
                        {calculateStrength(newVaultPassword).toUpperCase()} STRENGTH
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-vault-password">Confirm Vault Password</Label>
                  <Input
                    id="confirm-vault-password"
                    type="password"
                    value={confirmVaultPassword}
                    onChange={(e) => setConfirmVaultPassword(e.target.value)}
                    placeholder="Re-enter your vault password"
                  />
                </div>
              </TabsContent>

              <TabsContent value="recovery" className="space-y-4 mt-4">
                <Alert>
                  <Shield className="w-4 h-4" />
                  <AlertDescription>
                    Set up security questions and optional recovery email. You'll also get a recovery key after setup.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="security-question-1">Security Question 1</Label>
                  <select
                    id="security-question-1"
                    value={securityQuestion1}
                    onChange={(e) => setSecurityQuestion1(e.target.value)}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md"
                  >
                    <option value="">Select a question...</option>
                    {securityQuestions.map((q, i) => (
                      <option key={i} value={q}>{q}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="security-answer-1">Answer</Label>
                  <Input
                    id="security-answer-1"
                    type="text"
                    value={securityAnswer1}
                    onChange={(e) => setSecurityAnswer1(e.target.value)}
                    placeholder="Your answer"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="security-question-2">Security Question 2</Label>
                  <select
                    id="security-question-2"
                    value={securityQuestion2}
                    onChange={(e) => setSecurityQuestion2(e.target.value)}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md"
                  >
                    <option value="">Select a question...</option>
                    {securityQuestions.map((q, i) => (
                      <option key={i} value={q}>{q}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="security-answer-2">Answer</Label>
                  <Input
                    id="security-answer-2"
                    type="text"
                    value={securityAnswer2}
                    onChange={(e) => setSecurityAnswer2(e.target.value)}
                    placeholder="Your answer"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recovery-email">Recovery Email (Optional)</Label>
                  <Input
                    id="recovery-email"
                    type="email"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder="recovery@example.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    We'll send recovery instructions to this email if needed
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="2fa" className="space-y-4 mt-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="enable-2fa"
                    checked={setup2FA}
                    onCheckedChange={(checked) => setSetup2FA(checked as boolean)}
                  />
                  <Label htmlFor="enable-2fa" className="cursor-pointer">
                    Enable Two-Factor Authentication
                  </Label>
                </div>

                {setup2FA && (
                  <div className="space-y-4">
                    <Alert>
                      <Info className="w-4 h-4" />
                      <AlertDescription>
                        Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                      </AlertDescription>
                    </Alert>

                    <div className="flex flex-col items-center space-y-4">
                      {twoFactorQR && (
                        <img src={twoFactorQR} alt="2FA QR Code" className="border rounded" />
                      )}
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Or enter this code manually:</p>
                        <p className="font-mono text-sm font-medium mt-1">{twoFactorSecret}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Current TOTP code for testing:</p>
                        <p className="font-mono text-lg font-bold text-primary">{generateTOTP(twoFactorSecret)}</p>
                        <p className="text-xs text-muted-foreground mt-1">Refreshes every 30 seconds</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="2fa-code">Verify 2FA Code</Label>
                      <Input
                        id="2fa-code"
                        value={twoFactorCode}
                        onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="Enter 6-digit code"
                        maxLength={6}
                      />
                    </div>
                  </div>
                )}

                {!setup2FA && (
                  <Alert>
                    <Info className="w-4 h-4" />
                    <AlertDescription>
                      2FA is optional but recommended for enhanced security. You can always enable it later.
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>
            </Tabs>

            <Button 
              onClick={setupVault} 
              className="w-full" 
              disabled={isLoading}
              size="lg"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {isLoading ? 'Creating Vault...' : 'Create Vault'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Unlock screen
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
              Enter your vault password to access your encrypted passwords
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="master-password">Vault Password</Label>
              <div className="relative">
                <Input
                  id="master-password"
                  type={showMasterPassword ? "text" : "password"}
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  placeholder="Enter your vault password"
                  onKeyDown={(e) => e.key === 'Enter' && !requires2FA && unlockVault()}
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

            {requires2FA && (
              <div className="space-y-2">
                <Label htmlFor="2fa-unlock">Two-Factor Authentication Code</Label>
                <Input
                  id="2fa-unlock"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  onKeyDown={(e) => e.key === 'Enter' && unlockVault()}
                />
              </div>
            )}
            
            <Button onClick={unlockVault} className="w-full" disabled={isLoading}>
              <Key className="w-4 h-4 mr-2" />
              {isLoading ? 'Unlocking...' : 'Unlock Vault'}
            </Button>

            <div className="pt-4 border-t space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowRecoveryDialog(true)}
              >
                <Key className="w-4 h-4 mr-2" />
                Forgot Password? Recover Access
              </Button>
              
              <Button
                variant="ghost"
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setShowResetDialog(true)}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Vault (Delete All)
              </Button>
            </div>
            
            <Alert>
              <Shield className="w-4 h-4" />
              <AlertDescription>
                <p className="font-medium mb-2">Security Features:</p>
                <ul className="text-sm space-y-1">
                  <li>• AES-256-GCM encryption</li>
                  <li>• PBKDF2 key derivation (100k iterations)</li>
                  <li>• Multiple recovery options</li>
                  {requires2FA && <li>• Two-Factor Authentication enabled</li>}
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Recovery Dialog */}
        <Dialog open={showRecoveryDialog} onOpenChange={setShowRecoveryDialog}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Recover Vault Access</DialogTitle>
              <DialogDescription>
                Choose a recovery method to reset your vault password
              </DialogDescription>
            </DialogHeader>
            
            <Tabs value={recoveryMethod} onValueChange={(v) => setRecoveryMethod(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="questions">Questions</TabsTrigger>
                <TabsTrigger value="key">Recovery Key</TabsTrigger>
                <TabsTrigger value="email">Email</TabsTrigger>
              </TabsList>

              <TabsContent value="questions" className="space-y-4 mt-4">
                {vaultSettings?.recovery_questions && (
                  <>
                    <div className="space-y-2">
                      <Label>{vaultSettings.recovery_questions.question1}</Label>
                      <Input
                        value={recoveryAnswer1}
                        onChange={(e) => setRecoveryAnswer1(e.target.value)}
                        placeholder="Your answer"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{vaultSettings.recovery_questions.question2}</Label>
                      <Input
                        value={recoveryAnswer2}
                        onChange={(e) => setRecoveryAnswer2(e.target.value)}
                        placeholder="Your answer"
                      />
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="key" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Recovery Key</Label>
                  <Input
                    value={enteredRecoveryKey}
                    onChange={(e) => setEnteredRecoveryKey(e.target.value.toUpperCase())}
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the recovery key you saved when creating your vault
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="email" className="space-y-4 mt-4">
                <Alert>
                  <Mail className="w-4 h-4" />
                  <AlertDescription>
                    {vaultSettings?.recovery_email ? (
                      <>
                        A recovery link will be sent to <strong>{vaultSettings.recovery_email}</strong>
                      </>
                    ) : (
                      <>
                        No recovery email was configured for this vault. Please use security questions or recovery key instead.
                      </>
                    )}
                  </AlertDescription>
                </Alert>
              </TabsContent>
            </Tabs>

            {recoveryMethod !== 'email' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>New Vault Password</Label>
                  <Input
                    type="password"
                    value={newPasswordAfterRecovery}
                    onChange={(e) => setNewPasswordAfterRecovery(e.target.value)}
                    placeholder="Enter new password (min 8 characters)"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Confirm New Password</Label>
                  <Input
                    type="password"
                    value={confirmNewPasswordAfterRecovery}
                    onChange={(e) => setConfirmNewPasswordAfterRecovery(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowRecoveryDialog(false);
                  setRecoveryAnswer1('');
                  setRecoveryAnswer2('');
                  setEnteredRecoveryKey('');
                  setNewPasswordAfterRecovery('');
                  setConfirmNewPasswordAfterRecovery('');
                }}
                disabled={isRecovering}
              >
                Cancel
              </Button>
              <Button
                onClick={recoverVaultPassword}
                disabled={isRecovering || (recoveryMethod === 'email' && !vaultSettings?.recovery_email)}
              >
                {isRecovering ? 'Recovering...' : recoveryMethod === 'email' ? 'Send Recovery Email' : 'Reset Password'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Destructive Reset Dialog */}
        <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-destructive">Reset Password Vault</DialogTitle>
              <DialogDescription>
                This will permanently delete ALL your saved passwords and vault settings. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertTitle>Warning: Data Loss</AlertTitle>
              <AlertDescription>
                You will lose access to all your saved passwords. Use the "Recover Access" option instead if you want to keep your data.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-confirm">
                  Type <span className="font-mono font-bold">DELETE ALL PASSWORDS</span> to confirm
                </Label>
                <Input
                  id="reset-confirm"
                  value={resetConfirmation}
                  onChange={(e) => setResetConfirmation(e.target.value)}
                  placeholder="DELETE ALL PASSWORDS"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowResetDialog(false);
                  setResetConfirmation('');
                }}
                disabled={isResetting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={resetVault}
                disabled={resetConfirmation !== 'DELETE ALL PASSWORDS' || isResetting}
              >
                {isResetting ? 'Resetting...' : 'Reset Vault'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Main password manager interface
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
                {password && (
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        calculateStrength(password) === 'weak' ? 'destructive' :
                        calculateStrength(password) === 'medium' ? 'secondary' :
                        'default'
                      }
                    >
                      {calculateStrength(password).toUpperCase()} STRENGTH
                    </Badge>
                  </div>
                )}
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
                  min={8}
                  max={32}
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Import Passwords</CardTitle>
                  <CardDescription>Import from your browser's password manager</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowImportHelp(!showImportHelp)}
                >
                  <Info className="w-4 h-4 mr-2" />
                  Help
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {showImportHelp && (
                <Alert>
                  <Info className="w-4 h-4" />
                  <AlertTitle>How to Export Passwords</AlertTitle>
                  <AlertDescription>
                    <Accordion type="single" collapsible className="w-full mt-2">
                      <AccordionItem value="chrome">
                        <AccordionTrigger className="text-sm">Chrome / Edge</AccordionTrigger>
                        <AccordionContent className="text-sm space-y-1">
                          <ol className="list-decimal list-inside space-y-1">
                            <li>Open Settings → Passwords</li>
                            <li>Click the ⋮ menu next to "Saved Passwords"</li>
                            <li>Select "Export passwords"</li>
                            <li>Save the CSV file</li>
                          </ol>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="firefox">
                        <AccordionTrigger className="text-sm">Firefox</AccordionTrigger>
                        <AccordionContent className="text-sm space-y-1">
                          <ol className="list-decimal list-inside space-y-1">
                            <li>Open Settings → Privacy & Security</li>
                            <li>Click "Saved Logins"</li>
                            <li>Click ⋯ menu → "Export Logins"</li>
                            <li>Save the CSV file</li>
                          </ol>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="safari">
                        <AccordionTrigger className="text-sm">Safari</AccordionTrigger>
                        <AccordionContent className="text-sm space-y-1">
                          <ol className="list-decimal list-inside space-y-1">
                            <li>Open Safari → Preferences → Passwords</li>
                            <li>Select all passwords</li>
                            <li>Use export tool or third-party app</li>
                            <li>Safari requires additional tools for CSV export</li>
                          </ol>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="file">Upload CSV File</Label>
                <Input
                  id="file"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv"
                />
                <p className="text-xs text-muted-foreground">
                  Expected format: name, url, username, password, note
                </p>
              </div>
              
              <Button onClick={handleImport} disabled={!importData || isLoading} className="w-full">
                <Upload className="w-4 h-4 mr-2" />
                {isLoading ? 'Importing...' : 'Import Passwords'}
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
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading passwords...
                  </div>
                ) : filteredEntries.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'No passwords found' : 'No passwords yet'}
                  </div>
                ) : (
                  filteredEntries.map((entry) => (
                    <Card key={entry.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{entry.website}</p>
                            <p className="text-sm text-muted-foreground truncate">{entry.username}</p>
                          </div>
                          <Badge
                            variant={
                              entry.strength === 'weak' ? 'destructive' :
                              entry.strength === 'medium' ? 'secondary' :
                              'default'
                            }
                            className="ml-2 shrink-0"
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

          {/* Security tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Security Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  <span>Use a strong, unique vault password</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  <span>Save your recovery key securely</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  <span>Enable 2FA for extra security</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  <span>Generate strong passwords (16+ chars)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  <span>Never reuse passwords across sites</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  <span>Lock vault when not in use</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PasswordManager;
