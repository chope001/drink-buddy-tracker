import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X, Send } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

const CreateGroupPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [groupName, setGroupName] = useState('');
  const [invites, setInvites] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);

  const addInvite = () => {
    if (invites.length < 20) {
      setInvites([...invites, '']);
    }
  };

  const removeInvite = (index: number) => {
    setInvites(invites.filter((_, i) => i !== index));
  };

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
      if (validInvites.length > 0) {
        await supabase.from('group_invites').insert(
          validInvites.map((contact) => ({
            group_id: group.id,
            invited_by: user!.id,
            contact,
          }))
        );
      }

      toast({ title: 'Group created!', description: `${groupName} is ready to go.` });
      navigate(`/groups/${group.id}`);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
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
        </div>

        <Button
          variant="hero"
          className="w-full h-12"
          onClick={handleCreate}
          disabled={loading || !groupName.trim()}
        >
          <Send className="h-4 w-4 mr-2" />
          Create Group & Send Invites
        </Button>
      </div>
    </div>
  );
};

export default CreateGroupPage;
