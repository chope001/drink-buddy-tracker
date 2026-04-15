import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import DrinkPunchCard from '@/components/DrinkPunchCard';
import { DrinkType } from '@/components/DrinkCard';
import { supabase } from '@/lib/supabase';

interface Drink {
  type: DrinkType;
  multiplier: number;
}

const MemberDrinksPage = () => {
  const { groupId, memberId } = useParams();
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [memberName, setMemberName] = useState('');

  useEffect(() => {
    if (memberId && groupId) {
      loadMemberDrinks();
      loadMemberName();
    }
  }, [memberId, groupId]);

  const loadMemberName = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', memberId!)
      .single();
    if (data) setMemberName(data.display_name || 'Member');
  };

  const loadMemberDrinks = async () => {
    const { data } = await supabase
      .from('drinks')
      .select('*')
      .eq('user_id', memberId!)
      .eq('group_id', groupId!)
      .eq('session_active', true)
      .order('created_at', { ascending: true });
    
    if (data) {
      setDrinks(data.map((d: any) => ({ type: d.drink_type as DrinkType, multiplier: d.multiplier })));
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader title={`${memberName}'s Drinks`} />
      <div className="flex-1 px-4 py-6 max-w-md mx-auto w-full">
        <DrinkPunchCard
          drinks={drinks}
          onAddDrink={() => {}}
          onReset={() => {}}
          readonly
        />
      </div>
    </div>
  );
};

export default MemberDrinksPage;
