export interface PasswordEntry {
  id: string;
  website: string;
  username: string;
  password: string;
  strength: 'weak' | 'medium' | 'strong';
  created_at?: string;
}

export interface EncryptedEntry {
  id: string;
  user_id: string;
  website: string;
  username: string;
  password: string;
  strength: 'weak' | 'medium' | 'strong';
  created_at: string;
  updated_at: string;
}
