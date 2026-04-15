import { useState } from 'react';
import DrinkCard, { DrinkType } from './DrinkCard';
import SafetyIndicator from './SafetyIndicator';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

interface Drink {
  type: DrinkType;
  multiplier: number;
}

interface DrinkPunchCardProps {
  drinks: Drink[];
  onAddDrink: (type: DrinkType, multiplier: number) => void;
  onReset: () => void;
  readonly?: boolean;
}

const TOTAL_SLOTS = 12;

const DrinkPunchCard = ({ drinks, onAddDrink, onReset, readonly = false }: DrinkPunchCardProps) => {
  const totalDrinks = drinks.reduce((sum, d) => sum + d.multiplier, 0);

  const slots: Drink[] = [
    ...drinks,
    ...Array(Math.max(0, TOTAL_SLOTS - drinks.length)).fill({ type: 'empty' as DrinkType, multiplier: 0 }),
  ];

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <SafetyIndicator drinkCount={totalDrinks} />
      </div>

      <div className="glass rounded-xl p-4">
        <div className="text-center mb-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Drink Card</p>
          <p className="text-3xl font-heading font-bold">{totalDrinks}</p>
          <p className="text-xs text-muted-foreground">total drinks</p>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {slots.slice(0, TOTAL_SLOTS).map((drink, i) => (
            <DrinkCard
              key={i}
              index={i}
              type={drink.type}
              multiplier={drink.multiplier}
              onSelect={(type, mult) => {
                if (drinks.length <= i) {
                  onAddDrink(type, mult);
                }
              }}
              readonly={readonly || i < drinks.length}
            />
          ))}
        </div>

        {drinks.length >= TOTAL_SLOTS && (
          <p className="text-center text-xs text-muted-foreground mt-3">
            Card full! Reset to start a new card.
          </p>
        )}
      </div>

      {!readonly && (
        <div className="flex items-center gap-3 glass rounded-lg p-3">
          <RotateCcw className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="range"
            min="0"
            max="1"
            step="1"
            defaultValue="0"
            className="w-full accent-destructive"
            onChange={(e) => {
              if (e.target.value === '1') {
                onReset();
                e.target.value = '0';
              }
            }}
          />
          <span className="text-xs text-muted-foreground whitespace-nowrap">Slide to reset</span>
        </div>
      )}
    </div>
  );
};

export default DrinkPunchCard;
