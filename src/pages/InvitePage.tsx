import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Shield, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const InvitePage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [groupName, setGroupName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data, error } = await supabase.rpc('get_invite_by_token', { _token: token });
      if (error || !data || data.length === 0) {
        setError('This invite link is invalid or has expired.');
      } else {
        setGroupName(data[0].group_name);
      }
    })();
  }, [token]);

  useEffect(() => {
    // Auto-redeem if already logged in
    if (!authLoading && user && token && groupName && !redeeming) {
      setRedeeming(true);
      supabase.rpc('redeem_invite', { _token: token }).then(({ data, error }) => {
        if (error) {
          toast({ title: 'Error joining group', description: error.message, variant: 'destructive' });
          navigate('/groups');
        } else {
          toast({ title: 'Joined group!', description: `Welcome to ${groupName}.` });
          navigate(`/groups/${data}`);
        }
      });
    }
  }, [authLoading, user, token, groupName, redeeming, navigate, toast, groupName]);

  const handleContinue = () => {
    if (token) localStorage.setItem('pendingInviteToken', token);
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6 text-center animate-slide-up">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mx-auto">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        {error ? (
          <>
            <h1 className="text-2xl font-heading font-bold">Invite Invalid</h1>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="hero" className="w-full" onClick={() => navigate('/login')}>Go to Login</Button>
          </>
        ) : groupName ? (
          <>
            <Users className="h-10 w-10 text-accent mx-auto" />
            <h1 className="text-2xl font-heading font-bold">You're invited!</h1>
            <p className="text-sm text-muted-foreground">
              Join <span className="font-semibold text-foreground">{groupName}</span> on SafeSip to track drinks together.
            </p>
            {user ? (
              <p className="text-sm text-muted-foreground">Joining group...</p>
            ) : (
              <Button variant="hero" className="w-full h-12" onClick={handleContinue}>
                Sign in or create account to join
              </Button>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Loading invite...</p>
        )}
      </div>
    </div>
  );
};

export default InvitePage;
