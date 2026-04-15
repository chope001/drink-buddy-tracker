import { useState, useEffect } from 'react';
import AppHeader from '@/components/AppHeader';
import DrinkPunchCard from '@/components/DrinkPunchCard';
import { DrinkType } from '@/components/DrinkCard';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

interface Drink {
  type: DrinkType;
  multiplier: number;
}

const TrackDrinksPage = () => {
  const { user } = useAuth();
  const [drinks, setDrinks] = useState<Drink[]>([]);

  useEffect(() => {
    if (user) loadDrinks();
  }, [user]);

  const loadDrinks = async () => {
    const { data } = await supabase
      .from('drinks')
      .select('*')
      .eq('user_id', user!.id)
      .is('group_id', null)
      .eq('session_active', true)
      .order('created_at', { ascending: true });
    
    if (data) {
      setDrinks(data.map((d: any) => ({ type: d.drink_type as DrinkType, multiplier: d.multiplier })));
    }
  };

  const handleAddDrink = async (type: DrinkType, multiplier: number) => {
    const { error } = await supabase.from('drinks').insert({
      user_id: user!.id,
      drink_type: type,
      multiplier,
      session_active: true,
    });
    if (!error) {
      setDrinks([...drinks, { type, multiplier }]);
    }
  };

  const handleReset = async () => {
    await supabase
      .from('drinks')
      .update({ session_active: false })
      .eq('user_id', user!.id)
      .is('group_id', null)
      .eq('session_active', true);
    setDrinks([]);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader title="Track My Drinks" />
      <div className="flex-1 px-4 py-6 max-w-md mx-auto w-full">
        <DrinkPunchCard
          drinks={drinks}
          onAddDrink={handleAddDrink}
          onReset={handleReset}
        />
      </div>
    </div>
  );
};

export default TrackDrinksPage;
