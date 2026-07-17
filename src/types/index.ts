export interface EventItem {
  id?: number;
  title: string;
  description: string;
  category: 'meeting' | 'assignment' | 'event' | 'personal';
  startTime: string; // ISO 8601 string in KST (e.g., 2026-07-17T09:00:00+09:00)
  endTime: string;   // ISO 8601 string in KST
  allDay: boolean;
}

export type CalendarView = 'month' | 'week' | 'day';

export const CATEGORIES = {
  meeting: {
    label: '미팅',
    color: '#3b82f6',     // blue
    bg: '#eff6ff',
    text: '#1d4ed8',
    border: '#bfdbfe',
    darkBg: 'rgba(59, 130, 246, 0.15)',
    darkText: '#93c5fd'
  },
  assignment: {
    label: '과제',
    color: '#10b981',     // emerald
    bg: '#ecfdf5',
    text: '#047857',
    border: '#a7f3d0',
    darkBg: 'rgba(16, 185, 129, 0.15)',
    darkText: '#6ee7b7'
  },
  event: {
    label: '행사',
    color: '#8b5cf6',     // violet
    bg: '#f5f3ff',
    text: '#6d28d9',
    border: '#ddd6fe',
    darkBg: 'rgba(139, 92, 246, 0.15)',
    darkText: '#c4b5fd'
  },
  personal: {
    label: '개인',
    color: '#f97316',     // orange
    bg: '#fff7ed',
    text: '#c2410c',
    border: '#ffedd5',
    darkBg: 'rgba(249, 115, 22, 0.15)',
    darkText: '#fdba74'
  },
} as const;

export type CategoryKey = keyof typeof CATEGORIES;
