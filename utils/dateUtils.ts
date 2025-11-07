// Returns date in YYYY-MM-DD format
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const getDatesForPeriod = (period: string): { start: string; end: string } => {
  const today = new Date();
  // Set time to 0 to avoid timezone issues when comparing dates
  today.setHours(0, 0, 0, 0); 
  
  const end = formatDate(today);
  let start: string;

  switch (period) {
    case '오늘':
      start = end;
      break;
    case '최근 7일': {
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 6);
      start = formatDate(startDate);
      break;
    }
    case '최근 30일': {
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 29);
      start = formatDate(startDate);
      break;
    }
    default:
      start = end;
      break;
  }

  return { start, end };
};
