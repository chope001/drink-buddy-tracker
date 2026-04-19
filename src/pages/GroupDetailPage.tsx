import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import SafetyIndicator from '@/components/SafetyIndicator';
import { getSafetyLevel } from '@/components/SafetyIndicator';
import { Button } from '@/components/ui/button';
import { Beer, Wine, Martini, Trophy, RotateCcw, UserPlus, Copy, Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface MemberDrinks {
  user_id: string;
  display_name: string;
  total_drinks: number;
  drinks: { type: string; multiplier: number }[];
}

const drinkIconMap: Record<string, any> = {
  beer: Beer,
  wine: Wine,
  shot: Martini,
};

const drinkColorMap: Record<string, string> = {
  beer: 'text-amber-400',
  wine: 'text-rose-400',
  shot: 'text-sky-400',
};

const GroupDetailPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [groupName, setGroupName] = useState('');
  const [members, setMembers] = useState<MemberDrinks[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user && groupId) loadGroupData();
    const onFocus = () => { if (user && groupId) loadGroupData(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [user, groupId]);

  const loadGroupData = async () => {
    const { data: group } = await supabase
      .from('groups')
      .select('name')
      .eq('id', groupId)
      .single();
    
    if (group) setGroupName(group.name);

    const { data: memberData } = await supabase
      .from('group_members')
      .select('user_id, profiles(display_name)')
      .eq('group_id', groupId!);

    if (memberData) {
      const memberDrinks: MemberDrinks[] = [];
      
      for (const member of memberData) {
        const { data: drinks } = await supabase
          .from('drinks')
          .select('drink_type, multiplier')
          .eq('user_id', member.user_id)
          .eq('group_id', groupId!)
          .eq('session_active', true);

        const totalDrinks = (drinks || []).reduce((sum: number, d: any) => sum + d.multiplier, 0);
        
        memberDrinks.push({
          user_id: member.user_id,
          display_name: (member as any).profiles?.display_name || 'Unknown',
          total_drinks: totalDrinks,
          drinks: (drinks || []).map((d: any) => ({ type: d.drink_type, multiplier: d.multiplier })),
        });
      }

      memberDrinks.sort((a, b) => b.total_drinks - a.total_drinks);
      setMembers(memberDrinks);
    }
    setLoading(false);
  };

  const handleResetAll = async () => {
    await supabase
      .from('drinks')
      .update({ session_active: false })
      .eq('group_id', groupId!)
      .eq('session_active', true);
    loadGroupData();
  };

  const handleGetInviteLink = async () => {
    setInviteOpen(true);
    if (inviteUrl) return;
    setInviteLoading(true);
    try {
      // Reuse most recent invite by this user for this group, otherwise create one
      const { data: existing } = await supabase
        .from('group_invites')
        .select('token')
        .eq('group_id', groupId!)
        .eq('invited_by', user!.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let token = (existing as any)?.token;
      if (!token) {
        const { data: created, error } = await supabase
          .from('group_invites')
          .insert({
            group_id: groupId!,
            invited_by: user!.id,
            contact: 'shareable-link',
          })
          .select('token')
          .single();
        if (error) throw error;
        token = (created as any).token;
      }
      setInviteUrl(`${window.location.origin}/invite/${token}`);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      setInviteOpen(false);
    } finally {
      setInviteLoading(false);
    }
  };

  const copyInvite = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader title={groupName || 'Group'} />
      <div className="flex-1 px-4 py-6 max-w-md mx-auto w-full space-y-4">
        <div className="flex gap-2">
          <Button
            variant="hero"
            className="flex-1 h-12"
            onClick={handleGetInviteLink}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Friends
          </Button>
          <Button
            variant="secondary"
            className="flex-1 h-12"
            onClick={handleResetAll}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset All
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Loading...</div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <Trophy className="h-4 w-4 text-accent" />
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Tracking</p>
            </div>

            {members.map((member, index) => {
              const safetyLevel = getSafetyLevel(member.total_drinks);
              const borderColor = {
                green: 'border-l-safety-green',
                yellow: 'border-l-safety-yellow',
                red: 'border-l-safety-red',
              }[safetyLevel];

              return (
                <button
                  key={member.user_id}
                  onClick={() =>
                    navigate(
                      member.user_id === user?.id
                        ? `/groups/${groupId}/my-drinks`
                        : `/groups/${groupId}/member/${member.user_id}`
                    )
                  }
                  className={cn(
                    'w-full glass rounded-xl p-4 flex items-center gap-3 hover:border-primary/50 transition-all border-l-4',
                    borderColor
                  )}
                >
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-medium text-sm">{member.display_name}</p>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {member.drinks.map((d, i) => {
                        const Icon = drinkIconMap[d.type] || Beer;
                        return <Icon key={i} className={cn('h-3.5 w-3.5', drinkColorMap[d.type])} />;
                      })}
                    </div>
                  </div>
                  <div className="flex flex-col items-center shrink-0">
                    <span className="text-2xl font-heading font-bold">{member.total_drinks}</span>
                    <span className="text-[10px] text-muted-foreground">drinks</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite friends to {groupName}</DialogTitle>
            <DialogDescription>
              Copy this link and send it to anyone you want to add. When they open it they'll be able to sign up or sign in and will be auto-added to the group.
            </DialogDescription>
          </DialogHeader>
          {inviteLoading ? (
            <p className="text-sm text-muted-foreground">Generating link...</p>
          ) : (
            <div className="flex gap-2">
              <Input readOnly value={inviteUrl ?? ''} className="h-10 text-xs bg-secondary border-border" />
              <Button size="sm" variant="secondary" onClick={copyInvite} className="shrink-0">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          )}
          <DialogFooter>
            <Button variant="hero" onClick={() => setInviteOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupDetailPage;
