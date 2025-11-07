export const REGIONS: string[] = ['제주시', '서귀포시', '한라산', '우도', '성산'];
export const METRICS: string[] = ['평균 기온', '습도', '풍속', '강수량'];
export const PERIODS: string[] = ['오늘', '최근 7일', '최근 30일'];

export const METRIC_UNITS: Record<string, string> = {
  '평균 기온': '°C',
  '습도': '%',
  '풍속': 'm/s',
  '강수량': 'mm',
};

export const METRIC_ENGLISH: Record<string, string> = {
  '평균 기온': 'Average Temperature',
  '습도': 'Humidity',
  '풍속': 'Wind Speed',
  '강수량': 'Precipitation',
};

export const METRIC_COLORS: Record<string, string> = {
  '평균 기온': '#38bdf8',
  '습도': '#34d399',
  '풍속': '#facc15',
  '강수량': '#a78bfa',
};