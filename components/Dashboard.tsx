import React from 'react';
import type { WidgetConfig } from '../types';
import { Widget } from './Widget';
import { WidgetPlaceholder } from './WidgetPlaceholder';

interface DashboardProps {
  widgets: WidgetConfig[];
  onAddWidget: (region: string, metrics: string[], startDate: string, endDate: string, periodLabel: string) => void;
  onRemoveWidget: (id: number) => void;
  onWidgetSelect: (widget: WidgetConfig) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ widgets, onAddWidget, onRemoveWidget, onWidgetSelect }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {widgets.map(widget => (
        <Widget 
          key={widget.id} 
          config={widget} 
          onRemove={() => onRemoveWidget(widget.id)}
          onSelect={() => onWidgetSelect(widget)}
        />
      ))}
      <WidgetPlaceholder onAddWidget={onAddWidget} />
    </div>
  );
};