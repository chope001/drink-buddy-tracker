import { useState } from 'react';
import { Beer, Wine, Martini, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export type DrinkType = 'beer' | 'wine' | 'shot' | 'empty';

interface DrinkCardProps {
  index: number;
  type: DrinkType;
  multiplier: number;
  onSelect: (type: DrinkType, multiplier: number) => void;
  readonly?: boolean;
}

const drinkIcons = {
  beer: Beer,
  wine: Wine,
  shot: Martini,
  empty: Plus,
};

const drinkColors = {
  beer: 'text-amber-400',
  wine: 'text-rose-400',
  shot: 'text-sky-400',
  empty: 'text-muted-foreground',
};

const drinkLabels = {
  beer: 'Beer',
  wine: 'Wine',
  shot: 'Liquor',
  empty: '',
};

const DrinkCard = ({ index, type, multiplier, onSelect, readonly = false }: DrinkCardProps) => {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedType, setSelectedType] = useState<DrinkType>('beer');
  const [selectedMultiplier, setSelectedMultiplier] = useState(1);
  const Icon = drinkIcons[type];
  const isEmpty = type === 'empty';

  const handleClick = () => {
    if (readonly) return;
    if (isEmpty) {
      setSelectedType('beer');
      setSelectedMultiplier(1);
      setShowDialog(true);
    }
  };

  const handleConfirm = () => {
    onSelect(selectedType, selectedMultiplier);
    setShowDialog(false);
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={readonly && isEmpty}
        className={cn(
          'relative w-full aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all duration-200',
          isEmpty
            ? 'border-border/50 hover:border-primary/50 hover:bg-primary/5 cursor-pointer'
            : 'border-transparent bg-secondary/50 cursor-default',
          !isEmpty && 'animate-punch'
        )}
      >
        <Icon className={cn('h-7 w-7', drinkColors[type])} />
        {!isEmpty && (
          <>
            <span className="text-[10px] text-muted-foreground">{drinkLabels[type]}</span>
            {multiplier > 1 && (
              <span className="absolute bottom-1 right-1 text-[10px] font-bold bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center">
                {multiplier}x
              </span>
            )}
          </>
        )}
        {isEmpty && <span className="text-[10px] text-muted-foreground">Add</span>}
      </button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="font-heading">What are you drinking?</DialogTitle>
          </DialogHeader>
          <div className="flex gap-3 justify-center py-4">
            {(['beer', 'wine', 'shot'] as const).map((dt) => {
              const DIcon = drinkIcons[dt];
              return (
                <button
                  key={dt}
                  onClick={() => setSelectedType(dt)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all',
                    selectedType === dt
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <DIcon className={cn('h-8 w-8', drinkColors[dt])} />
                  <span className="text-xs">{drinkLabels[dt]}</span>
                </button>
              );
            })}
          </div>
          <p className="text-sm text-center text-muted-foreground">Select Drink Strength</p>
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4].map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMultiplier(m)}
                className={cn(
                  'px-3 py-1 rounded-md text-sm font-medium border transition-all',
                  selectedMultiplier === m
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border hover:border-primary/50'
                )}
              >
                {m}x
              </button>
            ))}
          </div>
          <Button variant="hero" className="mt-2" onClick={handleConfirm}>
            Add Drink
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DrinkCard;
