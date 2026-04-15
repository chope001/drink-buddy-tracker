import { useNavigate } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Beer, Users, Shield } from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader title="SafeSip" />
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
        <div className="text-center space-y-2 animate-slide-up">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-2">
            <Shield className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-2xl font-heading font-bold">Welcome Back</h2>
          <p className="text-sm text-muted-foreground">Track responsibly. Stay safe.</p>
        </div>

        <div className="w-full max-w-sm space-y-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <button
            onClick={() => navigate('/track')}
            className="w-full glass rounded-xl p-6 flex items-center gap-4 hover:border-primary/50 transition-all group"
          >
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Beer className="h-6 w-6 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-heading font-semibold">Track My Drinks</p>
              <p className="text-xs text-muted-foreground">Personal intake monitoring</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/groups')}
            className="w-full glass rounded-xl p-6 flex items-center gap-4 hover:border-primary/50 transition-all group"
          >
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
              <Users className="h-6 w-6 text-accent" />
            </div>
            <div className="text-left">
              <p className="font-heading font-semibold">Shared Drink Tracking</p>
              <p className="text-xs text-muted-foreground">Monitor with friends</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
