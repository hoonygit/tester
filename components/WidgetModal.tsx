import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchWeatherData } from '../services/weatherService';
import type { WidgetConfig, WeatherData } from '../types';
import { METRIC_UNITS } from '../constants';
import { ComparisonChart } from './ComparisonChart';
import { exportToCsv } from '../utils/csvExporter';
import { exportToPdf } from '../utils/pdfExporter';

interface WidgetModalProps {
  widgetConfig: WidgetConfig;
  onClose: () => void;
}

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const LoadingSpinner: React.FC = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-800/80 rounded-lg z-10">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-cyan-400"></div>
    </div>
);

export const WidgetModal: React.FC<WidgetModalProps> = ({ widgetConfig, onClose }) => {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const modalContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchWeatherData(widgetConfig.region, widgetConfig.metrics, widgetConfig.startDate, widgetConfig.endDate);
        setData(result);
      } catch (err: any) {
        setError(err.message || '데이터를 불러오는 데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [widgetConfig]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  
  const handleDownloadCsv = () => {
    if (data) {
        const filename = `제주날씨_${widgetConfig.region}_${widgetConfig.periodLabel.replace(/ /g, '_').replace(/~/g, 'to')}.csv`;
        exportToCsv(data, filename);
    }
  };

  const handleDownloadPdf = async () => {
    if (modalContentRef.current && !isDownloadingPdf) {
      setIsDownloadingPdf(true);
      try {
        const filename = `제주날씨_리포트_${widgetConfig.region}_${widgetConfig.periodLabel.replace(/ /g, '_').replace(/~/g, 'to')}.pdf`;
        await exportToPdf(modalContentRef.current, filename);
      } catch (err) {
        console.error("Failed to generate PDF:", err);
        setError('PDF 생성에 실패했습니다.');
      } finally {
        setIsDownloadingPdf(false);
      }
    }
  };


  const latestData = data?.[data.length - 1];

  return (
    <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 flex items-center justify-center p-4"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="widget-modal-title"
    >
      <div 
        ref={modalContentRef}
        className="relative bg-slate-800 rounded-lg shadow-2xl w-full max-w-4xl h-full max-h-[90vh] flex flex-col p-6"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
         {loading && <LoadingSpinner />}
        <div className="flex-shrink-0 flex justify-between items-start mb-4">
            <div>
                <h2 id="widget-modal-title" className="text-2xl font-bold text-white">{widgetConfig.region}</h2>
                <p className="text-md text-slate-400">
                    {widgetConfig.periodLabel} / {widgetConfig.metrics.join(', ')}
                </p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                  onClick={handleDownloadCsv}
                  disabled={!data || loading}
                  className="bg-green-600 text-white font-bold py-2 px-4 rounded-md text-sm hover:bg-green-500 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-green-500 disabled:bg-slate-600 disabled:cursor-not-allowed"
              >
                  Excel 다운로드
              </button>
              <button 
                  onClick={handleDownloadPdf}
                  disabled={!data || loading || isDownloadingPdf}
                  className="bg-red-600 text-white font-bold py-2 px-4 rounded-md text-sm hover:bg-red-500 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-red-500 disabled:bg-slate-600 disabled:cursor-not-allowed"
              >
                  {isDownloadingPdf ? '리포트 생성 중...' : 'PDF 리포트'}
              </button>
              <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors z-20 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-500">
                  <CloseIcon className="w-6 h-6"/>
              </button>
            </div>
        </div>
        
        {!loading && error && (
            <div className="flex-grow flex flex-col items-center justify-center text-center text-red-400">
                <p className="text-lg font-semibold">오류 발생</p>
                <p className="mt-2">{error}</p>
            </div>
        )}

        {!loading && data && latestData && (
            <div className="flex-grow flex flex-col overflow-hidden">
                <div className="flex-shrink-0 grid gap-x-6 gap-y-2 mb-4" style={{ gridTemplateColumns: `repeat(${Math.min(widgetConfig.metrics.length, 4)}, 1fr)`}}>
                    {widgetConfig.metrics.map(metric => (
                        <div key={metric} className="bg-slate-900/50 p-3 rounded-md">
                            <p className="text-slate-300 text-sm truncate">{metric}</p>
                            <p className="text-3xl font-semibold text-cyan-400">
                            {(latestData[metric] as number)?.toLocaleString() ?? 'N/A'}
                            <span className="text-xl text-cyan-300 ml-1.5">{METRIC_UNITS[metric] || ''}</span>
                            </p>
                        </div>
                    ))}
                </div>
                <div className="flex-grow min-h-[300px]">
                    <ComparisonChart data={data} metrics={widgetConfig.metrics} />
                </div>
            </div>
        )}
      </div>
    </div>
  );
};