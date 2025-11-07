import type { WeatherData, TimeSeriesDataPoint } from '../types';

const formatHeader = (header: string): string => {
  return header.replace('_5yr_avg', ' (5년 평균)');
};

export const exportToCsv = (data: WeatherData, filename: string): void => {
  if (!data || data.length === 0) {
    console.warn("No data available to export.");
    return;
  }

  const headers = Object.keys(data[0]);
  const formattedHeaders = headers.map(formatHeader);

  const csvRows = [
    formattedHeaders.join(','), // Header row
    ...data.map(row => {
      return headers.map(header => {
        const cell = (row as TimeSeriesDataPoint)[header];
        // Wrap each cell in quotes to handle potential commas
        return `"${cell}"`;
      }).join(',');
    })
  ];

  const csvString = csvRows.join('\n');
  
  // Add BOM for UTF-8 compatibility in Excel, especially for Korean characters.
  const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });

  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
