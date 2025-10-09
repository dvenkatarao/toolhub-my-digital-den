'use client';

import React, { useState, useEffect, useRef } from 'react';
import { LockClosedIcon } from '@heroicons/react/24/outline';

interface PasswordEntry {
  id: string;
  website: string;
  username: string;
  password: string;
  strength: 'weak' | 'medium' | 'strong';
}

const PasswordManager = () => {
  // State for form inputs
  const [website, setWebsite] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // State for password generator
  const [passwordLength, setPasswordLength] = useState(12);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  
  // State for password entries (encrypted)
  const [encryptedEntries, setEncryptedEntries] = useState<any[]>([]);
  
  // State for decrypted entries (visible to user)
  const [decryptedEntries, setDecryptedEntries] = useState<PasswordEntry[]>([]);
  
  // State for search
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for import functionality
  const [importSource, setImportSource] = useState('chrome');
  const [importData, setImportData] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Encryption state
  const [masterPassword, setMasterPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showMasterPassword, setShowMasterPassword] = useState(false);
  
  // Filter entries based on search term
  const filteredEntries = decryptedEntries.filter(entry => 
    entry.website.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.username.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
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
      alert('Please select at least one character type');
      return;
    }
    
    let result = '';
    for (let i = 0; i < passwordLength; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    setPassword(result);
  };
  
  // Calculate password strength
  const calculateStrength = (pwd: string): 'weak' | 'medium' | 'strong' => {
    if (pwd.length < 6) return 'weak';
    if (pwd.length < 10) return 'medium';
    return 'strong';
  };
  
  // Encryption helper functions
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
      throw new Error('Decryption failed. Invalid master password.');
    }
  };
  
  // Unlock vault with master password
  const unlockVault = async () => {
    if (!masterPassword) {
      alert('Please enter your master password');
      return;
    }
    
    try {
      const decryptedList = await Promise.all(
        encryptedEntries.map(async (entry) => {
          return {
            id: entry.id,
            website: await decryptData(entry.website, masterPassword),
            username: await decryptData(entry.username, masterPassword),
            password: await decryptData(entry.password, masterPassword),
            strength: entry.strength
          };
        })
      );
      
      setDecryptedEntries(decryptedList);
      setIsUnlocked(true);
    } catch (error) {
      alert('Incorrect master password. Please try again.');
    }
  };
  
  // Lock vault
  const lockVault = () => {
    setIsUnlocked(false);
    setDecryptedEntries([]);
    setMasterPassword('');
  };
  
  // Add new password entry
  const addPasswordEntry = async () => {
    if (!website || !username || !password) {
      alert('Please fill in all fields');
      return;
    }
    
    if (!isUnlocked) {
      alert('Please unlock the vault first');
      return;
    }
    
    try {
      const newEntry = {
        id: Date.now().toString(),
        website: await encryptData(website, masterPassword),
        username: await encryptData(username, masterPassword),
        password: await encryptData(password, masterPassword),
        strength: calculateStrength(password),
      };
      
      setEncryptedEntries([newEntry, ...encryptedEntries]);
      setDecryptedEntries([{ ...newEntry, website, username, password }, ...decryptedEntries]);
      
      // Reset form
      setWebsite('');
      setUsername('');
      setPassword('');
    } catch (error) {
      alert('Failed to encrypt password. Please try again.');
    }
  };
  
  // Delete password entry
  const deleteEntry = (id: string) => {
    setEncryptedEntries(encryptedEntries.filter(entry => entry.id !== id));
    setDecryptedEntries(decryptedEntries.filter(entry => entry.id !== id));
  };
  
  // Copy password to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Password copied to clipboard!');
  };
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImportData(e.target.files[0]);
    }
  };
  
  // Handle import process
  const handleImport = async () => {
    if (!importData) {
      alert('Please select a file to import');
      return;
    }
    
    if (!isUnlocked) {
      alert('Please unlock the vault first');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        let importedEntries: any[] = [];
        
        // Parse based on selected source
        if (importSource === 'chrome') {
          // Chrome CSV format
          const lines = content.split('\n').slice(1); // Skip header
          for (const line of lines) {
            const [name, url, username, password] = line.split(',');
            if (url && username && password) {
              const cleanUrl = url.replace(/"/g, '');
              const cleanUsername = username.replace(/"/g, '');
              const cleanPassword = password.replace(/"/g, '');
              
              importedEntries.push({
                id: Date.now().toString() + Math.random(),
                website: await encryptData(cleanUrl, masterPassword),
                username: await encryptData(cleanUsername, masterPassword),
                password: await encryptData(cleanPassword, masterPassword),
                strength: calculateStrength(cleanPassword),
              });
            }
          }
        } else if (importSource === 'firefox') {
          // Firefox CSV format
          const lines = content.split('\n').slice(1);
          for (const line of lines) {
            const [url, username, password] = line.split(',');
            if (url && username && password) {
              const cleanUrl = url.replace(/"/g, '');
              const cleanUsername = username.replace(/"/g, '');
              const cleanPassword = password.replace(/"/g, '');
              
              importedEntries.push({
                id: Date.now().toString() + Math.random(),
                website: await encryptData(cleanUrl, masterPassword),
                username: await encryptData(cleanUsername, masterPassword),
                password: await encryptData(cleanPassword, masterPassword),
                strength: calculateStrength(cleanPassword),
              });
            }
          }
        } else if (importSource === 'lastpass') {
          // LastPass CSV format
          const lines = content.split('\n').slice(1);
          for (const line of lines) {
            const [name, url, username, password] = line.split(',');
            if (url && username && password) {
              const cleanUrl = url.replace(/"/g, '');
              const cleanUsername = username.replace(/"/g, '');
              const cleanPassword = password.replace(/"/g, '');
              
              importedEntries.push({
                id: Date.now().toString() + Math.random(),
                website: await encryptData(cleanUrl, masterPassword),
                username: await encryptData(cleanUsername, masterPassword),
                password: await encryptData(cleanPassword, masterPassword),
                strength: calculateStrength(cleanPassword),
              });
            }
          }
        } else {
          alert('Unsupported import format');
          return;
        }
        
        // Add imported entries to existing entries
        setEncryptedEntries([...importedEntries, ...encryptedEntries]);
        alert(`Successfully imported ${importedEntries.length} passwords!`);
        
        // Reset import state
        setImportData(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        console.error('Import error:', error);
        alert('Failed to import passwords. Please check the file format.');
      }
    };
    
    reader.readAsText(importData);
  };
  
  // Initialize with a generated password
  useEffect(() => {
    generatePassword();
  }, []);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Secure Password Manager</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Your passwords are encrypted with a master password before storage. Never stored in plain text.
          </p>
        </header>
        
        {/* Master Password Unlock */}
        {!isUnlocked ? (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6 max-w-md mx-auto">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">Unlock Password Vault</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Master Password</label>
                <div className="relative">
                  <input
                    type={showMasterPassword ? "text" : "password"}
                    value={masterPassword}
                    onChange={(e) => setMasterPassword(e.target.value)}
                    placeholder="Enter your master password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={() => setShowMasterPassword(!showMasterPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showMasterPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              
              <button 
                onClick={unlockVault}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
              >
                Unlock Vault
              </button>
              
              <div className="text-sm text-gray-600 mt-4">
                <p className="font-medium">Security Information:</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>Passwords are encrypted with AES-256-GCM</li>
                  <li>Master password is never stored or transmitted</li>
                  <li>Each entry uses a unique salt and IV</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <div className="text-lg font-medium text-gray-700">
                Vault Status: <span className="text-green-600 font-semibold">Unlocked</span>
              </div>
              <button 
                onClick={lockVault}
                className="flex items-center text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-1.5 px-3 rounded-lg transition duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Lock Vault
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Form, Generator, and Import */}
              <div className="lg:col-span-2 space-y-6">
                {/* Add Password Form */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Add New Password</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                      <input
                        type="text"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="example.com"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Username/Email</label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="user@example.com"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                      <div className="flex">
                        <input
                          type="text"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter or generate password"
                          className="flex-grow px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button 
                          onClick={() => copyToClipboard(password)}
                          className="bg-gray-200 hover:bg-gray-300 px-4 py-2 border border-l-0 border-gray-300 rounded-r-lg text-gray-700"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    
                    <button 
                      onClick={addPasswordEntry}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                    >
                      Save Password
                    </button>
                  </div>
                </div>
                
                {/* Password Generator */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Password Generator</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Length: {passwordLength}
                      </label>
                      <input
                        type="range"
                        min="6"
                        max="30"
                        value={passwordLength}
                        onChange={(e) => setPasswordLength(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="uppercase"
                          checked={includeUppercase}
                          onChange={(e) => setIncludeUppercase(e.target.checked)}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <label htmlFor="uppercase" className="ml-2 text-sm text-gray-700">Uppercase</label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="lowercase"
                          checked={includeLowercase}
                          onChange={(e) => setIncludeLowercase(e.target.checked)}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <label htmlFor="lowercase" className="ml-2 text-sm text-gray-700">Lowercase</label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="numbers"
                          checked={includeNumbers}
                          onChange={(e) => setIncludeNumbers(e.target.checked)}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <label htmlFor="numbers" className="ml-2 text-sm text-gray-700">Numbers</label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="symbols"
                          checked={includeSymbols}
                          onChange={(e) => setIncludeSymbols(e.target.checked)}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <label htmlFor="symbols" className="ml-2 text-sm text-gray-700">Symbols</label>
                      </div>
                    </div>
                    
                    <div className="flex space-x-3">
                      <button 
                        onClick={generatePassword}
                        className="flex-grow bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                      >
                        Generate Password
                      </button>
                      <button 
                        onClick={() => copyToClipboard(password)}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition duration-200"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Import Passwords */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Import Passwords</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Import From</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setImportSource('chrome')}
                          className={`py-3 px-4 rounded-lg border ${
                            importSource === 'chrome'
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-center">
                            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-8 h-8 mr-2" />
                            <span>Chrome</span>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => setImportSource('firefox')}
                          className={`py-3 px-4 rounded-lg border ${
                            importSource === 'firefox'
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-center">
                            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-8 h-8 mr-2" />
                            <span>Firefox</span>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => setImportSource('lastpass')}
                          className={`py-3 px-4 rounded-lg border ${
                            importSource === 'lastpass'
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-center">
                            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-8 h-8 mr-2" />
                            <span>LastPass</span>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => setImportSource('other')}
                          className={`py-3 px-4 rounded-lg border ${
                            importSource === 'other'
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-center">
                            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-8 h-8 mr-2" />
                            <span>Other</span>
                          </div>
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Select CSV File</label>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".csv"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        {importSource === 'chrome' && 'Export passwords from Chrome: Settings > Passwords > Export passwords'}
                        {importSource === 'firefox' && 'Export passwords from Firefox: Logins & Passwords > Options > Export Logins'}
                        {importSource === 'lastpass' && 'Export from LastPass: Advanced > Export > LastPass CSV File'}
                        {importSource === 'other' && 'Import CSV with columns: name,url,username,password'}
                      </p>
                    </div>
                    
                    <button 
                      onClick={handleImport}
                      disabled={!importData}
                      className={`w-full font-medium py-2 px-4 rounded-lg transition duration-200 ${
                        importData 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Import Passwords
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Right Column - Password List */}
              <div className="space-y-6">
                {/* Search */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Saved Passwords</h2>
                    <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">
                      {decryptedEntries.length} entries
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search passwords..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  {/* Password Entries */}
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                    {filteredEntries.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No passwords found. Add your first password!
                      </div>
                    ) : (
                      filteredEntries.map((entry) => (
                        <div key={entry.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition duration-150">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-gray-800">{entry.website}</h3>
                              <p className="text-sm text-gray-600">{entry.username}</p>
                            </div>
                            <span className={`text-xs font-medium px-2 py-1 rounded ${
                              entry.strength === 'weak' 
                                ? 'bg-red-100 text-red-800' 
                                : entry.strength === 'medium' 
                                  ? 'bg-yellow-100 text-yellow-800' 
                                  : 'bg-green-100 text-green-800'
                            }`}>
                              {entry.strength}
                            </span>
                          </div>
                          
                          <div className="flex items-center mt-3">
                            <div className="flex-grow bg-gray-100 rounded px-3 py-2 text-sm font-mono truncate">
                              {entry.password.replace(/./g, '•')}
                            </div>
                            <div className="flex space-x-2 ml-2">
                              <button 
                                onClick={() => copyToClipboard(entry.password)}
                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="Copy password"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                              <button 
                                onClick={() => deleteEntry(entry.id)}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                title="Delete password"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                
                {/* Security Tips */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Security Tips</h2>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Use a strong master password with at least 12 characters</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Enable two-factor authentication when available</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Update passwords regularly</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Never share your master password</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PasswordManager;

/*
Additional Integration Instructions:

1. Place this file at: src/app/password-manager/page.tsx

2. Update your sidebar navigation (src/components/Sidebar.tsx) to include a link to the password manager:

import { LockClosedIcon } from '@heroicons/react/24/outline';

// Inside your Sidebar component's nav section, add:
<Link
  href="/password-manager"
  className="flex items-center px-4 py-2 mt-5 text-gray-600 hover:bg-gray-200 hover:text-gray-900 rounded-lg"
>
  <LockClosedIcon className="w-5 h-5" />
  <span className="mx-4 font-medium">Password Manager</span>
</Link>

3. Install Heroicons if not already installed:

npm install @heroicons/react

4. Backend API Implementation:

Create a new API route at src/app/api/passwords/route.ts with POST, GET, DELETE handlers to store, retrieve, and delete encrypted password entries. Use your existing authentication setup (e.g., next-auth) to secure these endpoints.

5. Update your Prisma schema (prisma/schema.prisma) to add a Password model:

model Password {
  id         String   @id @default(cuid())
  userId     String
  website    String
  username   String
  password   String
  strength   String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

6. Run Prisma migration:

npx prisma migrate dev --name add_password_model

7. Modify the frontend component to fetch and save passwords via the API endpoints instead of local state.

This approach ensures your password manager is fully integrated, secure, and consistent with your ToolHub app's design and architecture.
*/
