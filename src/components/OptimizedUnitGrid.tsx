import React, { memo } from 'react';
import { Guest } from './DailyData';
import { BedDouble, Building } from 'lucide-react';

interface OptimizedUnitGridProps {
  title: string;
  icon: React.ReactNode;
  units: Array<{
    number: string;
    type: 'room' | 'apartment';
    guest?: Guest;
    isOccupied: boolean;
    isCheckout: boolean;
  }>;
  renderUnit: (unitNumber: string, type: 'room' | 'apartment') => React.ReactNode;
}

const OptimizedUnitGrid = memo(({ title, icon, units, renderUnit }: OptimizedUnitGridProps) => {
  if (units.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="font-semibold text-lg">{title}</h3>
      </div>
      <div className="grid grid-cols-5 sm:grid-cols-7 lg:grid-cols-10 gap-2 sm:gap-4">
        {units.map(unit => renderUnit(unit.number, unit.type))}
      </div>
    </div>
  );
});

OptimizedUnitGrid.displayName = 'OptimizedUnitGrid';

export default OptimizedUnitGrid;