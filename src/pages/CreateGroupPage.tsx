import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X, Send, Copy, Check } from 'lucide-react';
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

interface GeneratedInvite {
  contact: string;
  url: string;
}

const CreateGroupPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [groupName, setGroupName] = useState('');
  const [invites, setInvites] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<GeneratedInvite[]>([]);
  const [createdGroupId, setCreatedGroupId] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const addInvite = () => {
    if (invites.length < 20) setInvites([...invites, '']);
  };
  const removeInvite = (index: number) => setInvites(invites.filter((_, i) => i !== index));
  const updateInvite = (index: number, value: string) => {
    const updated = [...invites];
    updated[index] = value;
    setInvites(updated);
  };

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

      const validInvites = invites.filter((i) => i.trim());
      const generatedInvites: GeneratedInvite[] = [];

      if (validInvites.length > 0) {
        const { data: insertedInvites, error: inviteErr } = await supabase
          .from('group_invites')
          .insert(
            validInvites.map((contact) => ({
              group_id: group.id,
              invited_by: user!.id,
              contact,
            }))
          )
          .select('contact, token');

        if (inviteErr) throw inviteErr;

        for (const inv of insertedInvites || []) {
          generatedInvites.push({
            contact: (inv as any).contact,
            url: `${window.location.origin}/invite/${(inv as any).token}`,
          });
        }
      }

      setCreatedGroupId(group.id);
      if (generatedInvites.length > 0) {
        setGenerated(generatedInvites);
        toast({ title: 'Group created!', description: 'Share the invite links below with your friends.' });
      } else {
        toast({ title: 'Group created!', description: `${groupName} is ready to go.` });
        navigate(`/groups/${group.id}`);
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async (url: string, idx: number) => {
    await navigator.clipboard.writeText(url);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
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

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Invite Friends</label>
            <span className="text-xs text-muted-foreground">{invites.length}/20</span>
          </div>

          {invites.map((invite, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={invite}
                onChange={(e) => updateInvite(i, e.target.value)}
                placeholder="Email or phone number"
                className="h-10 bg-secondary border-border flex-1"
              />
              {invites.length > 1 && (
                <Button variant="ghost" size="icon" onClick={() => removeInvite(i)}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}

          {invites.length < 20 && (
            <Button variant="glass" size="sm" onClick={addInvite}>
              <Plus className="h-4 w-4 mr-1" />
              Add another
            </Button>
          )}

          <p className="text-xs text-muted-foreground">
            We'll generate a unique invite link for each contact. You can copy and share them via your preferred messaging app.
          </p>
        </div>

        <Button
          variant="hero"
          className="w-full h-12"
          onClick={handleCreate}
          disabled={loading || !groupName.trim()}
        >
          <Send className="h-4 w-4 mr-2" />
          Create Group & Generate Invites
        </Button>
      </div>

      <Dialog open={generated.length > 0} onOpenChange={(open) => {
        if (!open && createdGroupId) {
          navigate(`/groups/${createdGroupId}`);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share these invite links</DialogTitle>
            <DialogDescription>
              Copy each link and send it to the contact via text, email, or messaging app. When they open the link they'll be able to sign up or sign in and will be auto-added to your group.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {generated.map((g, i) => (
              <div key={i} className="space-y-1">
                <p className="text-xs text-muted-foreground">{g.contact}</p>
                <div className="flex gap-2">
                  <Input readOnly value={g.url} className="h-9 text-xs bg-secondary border-border" />
                  <Button size="sm" variant="secondary" onClick={() => copyLink(g.url, i)} className="shrink-0">
                    {copiedIdx === i ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            ))}
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
