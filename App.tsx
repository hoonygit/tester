import React, { useState, useCallback } from 'react';
import type { WidgetConfig } from './types';
import { Dashboard } from './components/Dashboard';
import { Header } from './components/Header';
import { WidgetModal } from './components/WidgetModal';

const App: React.FC = () => {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [selectedWidget, setSelectedWidget] = useState<WidgetConfig | null>(null);

  const addWidget = useCallback((region: string, metrics: string[], startDate: string, endDate: string, periodLabel: string) => {
    const newWidget: WidgetConfig = {
      id: Date.now(),
      region,
      metrics,
      startDate,
      endDate,
      periodLabel,
    };
    setWidgets(prevWidgets => [...prevWidgets, newWidget]);
  }, []);

  const removeWidget = useCallback((id: number) => {
    setWidgets(prevWidgets => prevWidgets.filter(widget => widget.id !== id));
  }, []);
  
  const handleSelectWidget = useCallback((widget: WidgetConfig) => {
    setSelectedWidget(widget);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedWidget(null);
  }, []);


  return (
    <div className="min-h-screen bg-slate-900 font-sans">
      <Header />
      <main className="p-4 sm:p-6 lg:p-8">
        <Dashboard 
          widgets={widgets} 
          onAddWidget={addWidget} 
          onRemoveWidget={removeWidget}
          onWidgetSelect={handleSelectWidget}
        />
      </main>
      {selectedWidget && (
        <WidgetModal 
          widgetConfig={selectedWidget}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default App;