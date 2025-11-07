import React, { useState, useEffect, useRef } from 'react';
import { fetchWeatherData } from '../services/weatherService';
import type { WidgetConfig, WeatherData } from '../types';
import { METRIC_UNITS } from '../constants';
import { ComparisonChart } from './ComparisonChart';
import { exportToCsv } from '../utils/csvExporter';
import { exportToPdf } from '../utils/pdfExporter';


interface WidgetProps {
  config: WidgetConfig;
  onRemove: () => void;
  onSelect: () => void;
}

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const PdfIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);


const MiniSpinner: React.FC = () => (
    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-slate-400"></div>
);

const LoadingSpinner: React.FC = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-800/80 rounded-lg z-10">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400"></div>
    </div>
);

export const Widget: React.FC<WidgetProps> = ({ config, onRemove, onSelect }) => {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const widgetContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchWeatherData(config.region, config.metrics, config.startDate, config.endDate);
        setData(result);
      } catch (err: any) {
        setError(err.message || '데이터를 불러오는 데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [config]);

  const latestData = data?.[data.length - 1];
  const shortMetrics = config.metrics.length > 2 
    ? config.metrics.slice(0, 2).join(', ') + `...`
    : config.metrics.join(', ');

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation(); // Stop click from bubbling up to the onSelect handler
    onRemove();
  };

  const handleDownloadCsv = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data) {
        const filename = `제주날씨_${config.region}_${config.periodLabel.replace(/ /g, '_').replace(/~/g, 'to')}.csv`;
        exportToCsv(data, filename);
    }
  };
  
  const handleDownloadPdf = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (widgetContentRef.current && !isDownloadingPdf) {
      setIsDownloadingPdf(true);
      try {
        const filename = `제주날씨_리포트_${config.region}_${config.periodLabel.replace(/ /g, '_').replace(/~/g, 'to')}.pdf`;
        await exportToPdf(widgetContentRef.current, filename);
      } catch (err) {
        console.error("Failed to generate PDF:", err);
        setError('PDF 생성에 실패했습니다.');
      } finally {
        setIsDownloadingPdf(false);
      }
    }
  };


  return (
    <div 
        ref={widgetContentRef}
        onClick={onSelect}
        className="relative bg-slate-800 rounded-lg shadow-lg p-4 flex flex-col min-h-[350px] transition-all duration-300 hover:shadow-cyan-500/20 hover:ring-1 hover:ring-slate-700 cursor-pointer"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect() }}
    >
      {loading && <LoadingSpinner />}
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-lg font-bold text-white">{config.region}</h3>
          <p className="text-sm text-slate-400" title={config.metrics.join(', ')}>
            {config.periodLabel} / {shortMetrics}
          </p>
        </div>
        <div className="flex items-center space-x-1 z-20">
            <button 
              onClick={handleDownloadCsv} 
              className="text-slate-500 hover:text-cyan-400 transition-colors p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:cursor-not-allowed disabled:text-slate-600" 
              title="엑셀 다운로드"
              disabled={!data || loading}
            >
                <DownloadIcon className="w-5 h-5"/>
            </button>
            <button 
              onClick={handleDownloadPdf} 
              className="text-slate-500 hover:text-cyan-400 transition-colors p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:cursor-not-allowed disabled:text-slate-600" 
              title="PDF 리포트"
              disabled={!data || loading || isDownloadingPdf}
            >
                {isDownloadingPdf ? <MiniSpinner /> : <PdfIcon className="w-5 h-5"/>}
            </button>
            <button 
              onClick={handleRemove} 
              className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500"
              title="위젯 삭제"
            >
              <CloseIcon className="w-5 h-5"/>
            </button>
        </div>
      </div>

      {!loading && error && (
        <div className="flex-grow flex flex-col items-center justify-center text-center text-red-400">
            <p className="font-semibold">오류 발생</p>
            <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {!loading && data && latestData && (
        <div className="flex-grow flex flex-col">
          <div className="grid gap-x-4 gap-y-2 my-2" style={{ gridTemplateColumns: `repeat(${Math.min(config.metrics.length, 2)}, 1fr)`}}>
            {config.metrics.map(metric => (
              <div key={metric}>
                <p className="text-slate-300 text-xs truncate">{metric}</p>
                <p className="text-2xl font-semibold text-cyan-400">
                  {(latestData[metric] as number)?.toLocaleString() ?? 'N/A'}
                  <span className="text-lg text-cyan-300 ml-1">{METRIC_UNITS[metric] || ''}</span>
                </p>
              </div>
            ))}
          </div>
          <div className="flex-grow min-h-[150px] mt-2">
            <ComparisonChart data={data} metrics={config.metrics} />
          </div>
        </div>
      )}
    </div>
  );
};