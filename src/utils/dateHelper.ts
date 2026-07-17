import { parseISO } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

export const KST_TZ = 'Asia/Seoul';

// 1. 현재 시각 또는 지정한 시각을 KST Date 객체로 변환
export function getKSTDate(date: Date | string | number = new Date()): Date {
  const d = typeof date === 'string' ? parseISO(date) : new Date(date);
  return toZonedTime(d, KST_TZ);
}

// 2. Date 객체를 KST 기준 날짜 문자열(YYYY-MM-DD)로 포맷팅
export function formatKSTDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatInTimeZone(d, KST_TZ, 'yyyy-MM-dd');
}

// 3. Date 객체를 KST 기준 시간 문자열(HH:mm)로 포맷팅
export function formatKSTTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatInTimeZone(d, KST_TZ, 'HH:mm');
}

// 4. Date 객체를 KST 기준 풀 날짜/시간 문자열로 포맷팅
export function formatKSTDateTime(date: Date | string, formatStr: string = 'yyyy-MM-dd HH:mm'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatInTimeZone(d, KST_TZ, formatStr);
}

// 5. 날짜와 시간 문자열을 결합하여 KST 시간의 Date 객체 생성
export function parseKSTDateTime(dateStr: string, timeStr: string): Date {
  const cleanTime = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  const isoString = `${dateStr}T${cleanTime}+09:00`;
  return parseISO(isoString);
}

// 6. 날짜와 시간 문자열을 결합하여 UTC ISO 문자열로 변환 (DB 저장용)
export function getKSTISOString(dateStr: string, timeStr: string): string {
  const cleanTime = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  return `${dateStr}T${cleanTime}+09:00`;
}

// 7. KST 기준으로 특정 날짜의 시작 시각(00:00:00) 구하기
export function getKSTStartOfDay(date: Date | string): Date {
  const d = getKSTDate(date);
  const dateStr = formatKSTDate(d);
  return parseKSTDateTime(dateStr, '00:00:00');
}

// 8. KST 기준으로 특정 날짜의 끝 시각(23:59:59) 구하기
export function getKSTEndOfDay(date: Date | string): Date {
  const d = getKSTDate(date);
  const dateStr = formatKSTDate(d);
  return parseKSTDateTime(dateStr, '23:59:59');
}

// 9. 특정 날짜가 속한 주의 일요일 KST 구하기
export function getKSTStartOfWeek(date: Date): Date {
  const kst = getKSTDate(date);
  const day = kst.getDay(); // 0 (일요일) ~ 6 (토요일)
  const diff = kst.getDate() - day;
  const startOfWeek = new Date(kst);
  startOfWeek.setDate(diff);
  return getKSTStartOfDay(startOfWeek);
}

// 10. 특정 날짜가 속한 월의 1일 구하기 (KST 기준)
export function getKSTStartOfMonth(date: Date): Date {
  const kst = getKSTDate(date);
  const startOfMonth = new Date(kst.getFullYear(), kst.getMonth(), 1);
  return getKSTStartOfDay(startOfMonth);
}
