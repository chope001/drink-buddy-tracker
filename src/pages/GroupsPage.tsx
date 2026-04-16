import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Plus, Users, ChevronRight, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Group {
  id: string;
  name: string;
  created_by: string;
}

const GroupsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Group | null>(null);

  useEffect(() => {
    if (user) loadGroups();
  }, [user]);

  const loadGroups = async () => {
    const { data } = await supabase
      .from('group_members')
      .select('group_id, groups(id, name, created_by)')
      .eq('user_id', user!.id);

    if (data) {
      const groupList = data
        .filter((d: any) => d.groups)
        .map((d: any) => ({
          id: d.groups.id,
          name: d.groups.name,
          created_by: d.groups.created_by,
        }));
      setGroups(groupList);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', deleteTarget.id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Group deleted', description: `${deleteTarget.name} has been removed.` });
      setGroups(groups.filter((g) => g.id !== deleteTarget.id));
    }
    setDeleteTarget(null);
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
              <div key={group.id} className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/groups/${group.id}`)}
                  className="flex-1 glass rounded-xl p-4 flex items-center justify-between hover:border-primary/50 transition-all"
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
                {group.created_by === user?.id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(group);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the group, all members, invites, and drink history. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GroupsPage;
