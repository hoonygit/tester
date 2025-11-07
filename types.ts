export interface WidgetConfig {
  id: number;
  region: string;
  metrics: string[];
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  periodLabel: string; // e.g., "최근 7일", "2023-10-01 ~ 2023-10-31"
}

export interface TimeSeriesDataPoint {
  date: string;
  [metric: string]: number | string;
}

export type WeatherData = TimeSeriesDataPoint[];