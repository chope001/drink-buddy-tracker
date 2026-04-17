import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Copy, Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

const CreateGroupPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [createdGroupId, setCreatedGroupId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    if (!groupName.trim()) return;
    setLoading(true);

    try {
      const { data: group, error } = await supabase
        .from('groups')
        .insert({ name: groupName, created_by: user!.id })
        .select()
        .single();
      if (error) throw error;

      await supabase.from('group_members').insert({
        group_id: group.id,
        user_id: user!.id,
      });

      // Generate a single shareable invite link
      const { data: invite, error: inviteErr } = await supabase
        .from('group_invites')
        .insert({
          group_id: group.id,
          invited_by: user!.id,
          contact: 'shareable-link',
        })
        .select('token')
        .single();

      if (inviteErr) throw inviteErr;

      setCreatedGroupId(group.id);
      setInviteUrl(`${window.location.origin}/invite/${(invite as any).token}`);
      toast({ title: 'Group created!', description: 'Share the invite link with your friends.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader title="Create Group" />
      <div className="flex-1 px-4 py-6 max-w-md mx-auto w-full space-y-6 animate-slide-up">
        <div className="space-y-2">
          <label className="text-sm font-medium">Group Name</label>
          <Input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Friday Night Crew"
            className="h-12 bg-secondary border-border"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Invite Friends</label>
          <p className="text-xs text-muted-foreground">
            After you create the group, you'll get a shareable invite link you can copy and send to friends via text, email, or any messaging app.
          </p>
        </div>

        <Button
          variant="hero"
          className="w-full h-12"
          onClick={handleCreate}
          disabled={loading || !groupName.trim()}
        >
          <Send className="h-4 w-4 mr-2" />
          Create Group & Get Invite Link
        </Button>
      </div>

      <Dialog open={!!inviteUrl} onOpenChange={(open) => {
        if (!open && createdGroupId) {
          navigate(`/groups/${createdGroupId}`);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share your invite link</DialogTitle>
            <DialogDescription>
              Copy this link and send it to anyone you want to add. When they open it they'll be able to sign up or sign in and will be auto-added to your group.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Input readOnly value={inviteUrl ?? ''} className="h-10 text-xs bg-secondary border-border" />
            <Button size="sm" variant="secondary" onClick={copyLink} className="shrink-0">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <DialogFooter>
            <Button variant="hero" onClick={() => createdGroupId && navigate(`/groups/${createdGroupId}`)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateGroupPage;
