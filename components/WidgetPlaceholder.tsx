import React, { useState } from 'react';
import { REGIONS, METRICS, PERIODS } from '../constants';
import { getDatesForPeriod, formatDate } from '../utils/dateUtils';

interface WidgetPlaceholderProps {
  onAddWidget: (region: string, metrics: string[], startDate: string, endDate: string, periodLabel: string) => void;
}

const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

export const WidgetPlaceholder: React.FC<WidgetPlaceholderProps> = ({ onAddWidget }) => {
  const [region, setRegion] = useState(REGIONS[0]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([METRICS[0]]);
  
  const [periodType, setPeriodType] = useState<'predefined' | 'custom'>('predefined');
  const [predefinedPeriod, setPredefinedPeriod] = useState(PERIODS[0]);
  
  const today = formatDate(new Date());
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);


  const handleMetricChange = (metric: string) => {
    setSelectedMetrics(prev =>
      prev.includes(metric)
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  const handleAdd = () => {
    if (selectedMetrics.length === 0) return;

    let start: string, end: string, label: string;

    if (periodType === 'predefined') {
      const dates = getDatesForPeriod(predefinedPeriod);
      start = dates.start;
      end = dates.end;
      label = predefinedPeriod;
    } else {
      if (new Date(startDate) > new Date(endDate)) {
        alert('시작일은 종료일보다 이전이거나 같아야 합니다.');
        return;
      }
      start = startDate;
      end = endDate;
      label = startDate === endDate ? startDate : `${startDate} ~ ${endDate}`;
    }

    onAddWidget(region, selectedMetrics, start, end, label);
  };

  return (
    <div className="min-h-[350px] bg-slate-800/50 border-2 border-dashed border-slate-600 rounded-lg flex flex-col items-center justify-center p-6 space-y-4 transition-all hover:border-cyan-400 hover:bg-slate-800">
      <h3 className="text-lg font-semibold text-slate-300 mb-2">새 위젯 추가</h3>
      <div className="w-full max-w-xs space-y-4">
        <div>
          <label htmlFor="region-select" className="block text-sm font-medium text-slate-400 mb-1">지역</label>
          <select
            id="region-select"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">기간</label>
          <div className="flex items-center space-x-4">
            <label className="flex items-center text-sm text-slate-300">
              <input type="radio" name="periodType" value="predefined" checked={periodType === 'predefined'} onChange={() => setPeriodType('predefined')} className="h-4 w-4 bg-slate-600 border-slate-500 text-cyan-500 focus:ring-cyan-600"/>
              <span className="ml-2">사전 설정</span>
            </label>
            <label className="flex items-center text-sm text-slate-300">
              <input type="radio" name="periodType" value="custom" checked={periodType === 'custom'} onChange={() => setPeriodType('custom')} className="h-4 w-4 bg-slate-600 border-slate-500 text-cyan-500 focus:ring-cyan-600"/>
              <span className="ml-2">사용자 지정</span>
            </label>
          </div>
          {periodType === 'predefined' ? (
            <select
              value={predefinedPeriod}
              onChange={(e) => setPredefinedPeriod(e.target.value)}
              className="mt-2 w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          ) : (
            <div className="mt-2 space-y-2">
              <input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">항목 (다중 선택)</label>
          <div className="grid grid-cols-2 gap-2">
            {METRICS.map(m => (
              <label key={m} className="flex items-center space-x-2 bg-slate-700/50 p-2 rounded-md cursor-pointer hover:bg-slate-700">
                <input
                  type="checkbox"
                  checked={selectedMetrics.includes(m)}
                  onChange={() => handleMetricChange(m)}
                  className="h-4 w-4 rounded bg-slate-600 border-slate-500 text-cyan-500 focus:ring-cyan-600"
                />
                <span className="text-sm text-slate-300">{m}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
      <button
        onClick={handleAdd}
        disabled={selectedMetrics.length === 0}
        className="mt-4 flex items-center justify-center w-full max-w-xs bg-cyan-600 text-white font-bold py-2 px-4 rounded-md hover:bg-cyan-500 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed"
      >
        <PlusIcon className="w-5 h-5 mr-2" />
        추가
      </button>
    </div>
  );
};