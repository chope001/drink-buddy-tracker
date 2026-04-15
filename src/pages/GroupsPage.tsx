import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Plus, Users, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

interface Group {
  id: string;
  name: string;
  member_count: number;
}

const GroupsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadGroups();
  }, [user]);

  const loadGroups = async () => {
    const { data } = await supabase
      .from('group_members')
      .select('group_id, groups(id, name)')
      .eq('user_id', user!.id);
    
    if (data) {
      const groupList = data
        .filter((d: any) => d.groups)
        .map((d: any) => ({
          id: d.groups.id,
          name: d.groups.name,
          member_count: 0,
        }));
      setGroups(groupList);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader title="Shared Tracking" />
      <div className="flex-1 px-4 py-6 max-w-md mx-auto w-full space-y-4">
        <Button
          variant="hero"
          className="w-full h-14 text-base"
          onClick={() => navigate('/groups/create')}
        >
          <Plus className="h-5 w-5 mr-2" />
          Create a New Group
        </Button>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Loading groups...</div>
        ) : groups.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <Users className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground text-sm">No groups yet</p>
            <p className="text-muted-foreground text-xs">Create one or get invited to join!</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider px-1">Your Groups</p>
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => navigate(`/groups/${group.id}`)}
                className="w-full glass rounded-xl p-4 flex items-center justify-between hover:border-primary/50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-accent" />
                  </div>
                  <div className="text-left">
                    <p className="font-heading font-semibold">{group.name}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupsPage;
