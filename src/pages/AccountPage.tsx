import { useState, useEffect } from 'react';
import AppHeader from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

// Format a string of digits as a US phone number: (555) 123-4567
const formatUSPhone = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length === 0) return '';
  if (digits.length < 4) return `(${digits}`;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};

const isValidUSPhone = (value: string) => {
  const digits = value.replace(/\D/g, '');
  // Allow empty (optional field) or exactly 10 digits, or 11 starting with 1
  if (digits.length === 0) return true;
  if (digits.length === 10) return true;
  if (digits.length === 11 && digits.startsWith('1')) return true;
  return false;
};

const AccountPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    if (user) loadProfile();
  }, [user]);

  const loadProfile = async () => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user!.id)
      .single();

    if (profile) {
      setUsername(profile.username || '');
      setDisplayName(profile.display_name || '');
    }

    const { data: priv } = await supabase
      .from('private_profiles')
      .select('phone')
      .eq('id', user!.id)
      .maybeSingle();

    if (priv) {
      setPhone(formatUSPhone(priv.phone || ''));
    }
  };

  const handleUsernameChange = (value: string) => {
    // Cap at 20 characters
    const trimmed = value.slice(0, 20);
    setUsername(trimmed);
    if (usernameError) setUsernameError('');
  };

  const handlePhoneChange = (value: string) => {
    setPhone(formatUSPhone(value));
    if (phoneError) setPhoneError('');
  };

  const handleSave = async () => {
    setUsernameError('');
    setPhoneError('');

    // Validate phone
    if (!isValidUSPhone(phone)) {
      setPhoneError('Please enter a valid US phone number, e.g. (555) 123-4567');
      return;
    }

    // Validate username length
    if (username.length > 20) {
      setUsernameError('Username must be 20 characters or fewer');
      return;
    }

    setLoading(true);

    // Check username uniqueness (case-insensitive), excluding current user
    if (username.trim().length > 0) {
      const { data: existing, error: lookupError } = await supabase
        .from('profiles')
        .select('id')
        .ilike('username', username.trim())
        .neq('id', user!.id)
        .maybeSingle();

      if (lookupError) {
        toast({ title: 'Error', description: lookupError.message, variant: 'destructive' });
        setLoading(false);
        return;
      }

      if (existing) {
        setUsernameError('That username already exists, please choose another');
        setLoading(false);
        return;
      }
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        username: username.trim() || null,
        display_name: displayName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user!.id);

    // Handle race-condition unique violation from the DB
    if (profileError) {
      if ((profileError as any).code === '23505') {
        setUsernameError('That username already exists, please choose another');
      } else {
        toast({ title: 'Error', description: profileError.message, variant: 'destructive' });
      }
      setLoading(false);
      return;
    }

    // Store digits-only for phone (or null when empty)
    const phoneDigits = phone.replace(/\D/g, '');
    const { error: phoneSaveError } = await supabase
      .from('private_profiles')
      .upsert({
        id: user!.id,
        phone: phoneDigits.length ? phoneDigits : null,
        updated_at: new Date().toISOString(),
      });

    if (phoneSaveError) {
      toast({ title: 'Error', description: phoneSaveError.message, variant: 'destructive' });
    } else {
      toast({ title: 'Saved!', description: 'Your profile has been updated.' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader title="Account" />
      <div className="flex-1 px-4 py-6 max-w-md mx-auto w-full space-y-6 animate-slide-up">
        <div className="glass rounded-xl p-6 space-y-4">
          <div className="text-center mb-2">
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Username</label>
            <Input
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              placeholder="@username"
              maxLength={20}
              className={`h-11 bg-secondary border-border ${usernameError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
            />
            {usernameError && (
              <p className="text-sm text-destructive">{usernameError}</p>
            )}
            <p className="text-xs text-muted-foreground">{username.length}/20</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Display Name</label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="h-11 bg-secondary border-border"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Phone</label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="(555) 123-4567"
              className={`h-11 bg-secondary border-border ${phoneError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
            />
            {phoneError && (
              <p className="text-sm text-destructive">{phoneError}</p>
            )}
          </div>

          <Button
            variant="hero"
            className="w-full h-11"
            onClick={handleSave}
            disabled={loading}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
