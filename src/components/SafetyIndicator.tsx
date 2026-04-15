import { Shield, AlertTriangle, AlertOctagon } from 'lucide-react';

export const getSafetyLevel = (drinkCount: number) => {
  if (drinkCount <= 2) return 'green';
  if (drinkCount <= 4) return 'yellow';
  return 'red';
};

export const getSafetyLabel = (level: string) => {
  switch (level) {
    case 'green': return 'Safe Zone';
    case 'yellow': return 'Moderate';
    case 'red': return 'High Intake';
    default: return 'Safe Zone';
  }
};

const SafetyIndicator = ({ drinkCount }: { drinkCount: number }) => {
  const level = getSafetyLevel(drinkCount);

  const config = {
    green: { icon: Shield, color: 'text-safety-green', bg: 'bg-safety-green/10', border: 'border-safety-green/30' },
    yellow: { icon: AlertTriangle, color: 'text-safety-yellow', bg: 'bg-safety-yellow/10', border: 'border-safety-yellow/30' },
    red: { icon: AlertOctagon, color: 'text-safety-red', bg: 'bg-safety-red/10', border: 'border-safety-red/30' },
  }[level];

  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.bg} ${config.border}`}>
      <Icon className={`h-4 w-4 ${config.color}`} />
      <span className={`text-xs font-medium ${config.color}`}>{getSafetyLabel(level)}</span>
      <span className={`text-xs font-bold ${config.color}`}>{drinkCount} drinks</span>
    </div>
  );
};

export default SafetyIndicator;
