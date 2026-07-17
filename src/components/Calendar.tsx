import React from 'react';
import { addDays } from 'date-fns';
import { CATEGORIES } from '../types';
import type { EventItem, CalendarView } from '../types';
import {
  getKSTDate,
  formatKSTDate,
  formatKSTTime,
  formatKSTDateTime,
  getKSTStartOfWeek,
  getKSTStartOfMonth
} from '../utils/dateHelper';

interface CalendarProps {
  currentDate: Date;
  view: CalendarView;
  events: EventItem[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: EventItem) => void;
  onChangeDate: (date: Date) => void;
  onChangeView: (view: CalendarView) => void;
}

// 카테고리 아이콘 (SVG inline)
const CatIcon = ({ cat }: { cat: string }) => {
  const icons: Record<string, string> = {
    meeting: 'M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h4l3 3 3-3h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z',
    assignment: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
    event: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
    personal: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  };
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d={icons[cat] || icons.personal} />
    </svg>
  );
};

const CalIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

const ChevronL = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);
const ChevronR = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

export const Calendar: React.FC<CalendarProps> = ({
  currentDate, view, events, onDateClick, onEventClick, onChangeDate, onChangeView,
}) => {
  const kstNow = getKSTDate(currentDate);
  const currentYear  = kstNow.getFullYear();
  const currentMonth = kstNow.getMonth();

  const handlePrev = () => {
    const d = new Date(currentDate);
    if (view === 'month') d.setMonth(d.getMonth() - 1);
    else if (view === 'week') d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    onChangeDate(d);
  };
  const handleNext = () => {
    const d = new Date(currentDate);
    if (view === 'month') d.setMonth(d.getMonth() + 1);
    else if (view === 'week') d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    onChangeDate(d);
  };
  const handleToday = () => onChangeDate(new Date());

  const getEventsForDate = (date: Date): EventItem[] => {
    const target = formatKSTDate(date);
    return events.filter(e => {
      const s = formatKSTDate(e.startTime);
      const en = formatKSTDate(e.endTime);
      return target >= s && target <= en;
    });
  };

  // ─── Month View ───
  const renderMonthView = () => {
    const startOfMonth  = getKSTStartOfMonth(currentDate);
    const startDayOfWeek = startOfMonth.getDay();
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
    const todayStr = formatKSTDate(new Date());

    const days: React.ReactNode[] = [];

    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      days.push(renderDayCell(new Date(currentYear, currentMonth - 1, dayNum), true, todayStr, `prev-${dayNum}`));
    }
    for (let i = 1; i <= totalDays; i++) {
      days.push(renderDayCell(new Date(currentYear, currentMonth, i), false, todayStr, `curr-${i}`));
    }
    const rem = days.length % 7 === 0 ? 0 : 7 - (days.length % 7);
    for (let i = 1; i <= rem; i++) {
      days.push(renderDayCell(new Date(currentYear, currentMonth + 1, i), true, todayStr, `next-${i}`));
    }

    const WEEKDAYS = [
      { label: '일', cls: 'month-weekday sun' },
      { label: '월', cls: 'month-weekday' },
      { label: '화', cls: 'month-weekday' },
      { label: '수', cls: 'month-weekday' },
      { label: '목', cls: 'month-weekday' },
      { label: '금', cls: 'month-weekday' },
      { label: '토', cls: 'month-weekday sat' },
    ];

    return (
      <div>
        <div className="month-grid-header">
          {WEEKDAYS.map(w => <div key={w.label} className={w.cls}>{w.label}</div>)}
        </div>
        <div className="month-grid">{days}</div>
      </div>
    );
  };

  const renderDayCell = (date: Date, isPadding: boolean, todayStr: string, key: string) => {
    const dateStr = formatKSTDate(date);
    const isToday = dateStr === todayStr;
    const isSelected = dateStr === formatKSTDate(currentDate);
    const dayEvents = getEventsForDate(date);
    const dow = date.getDay();
    let numCls = 'day-number';
    if (isToday) numCls += ' today';
    else if (dow === 0) numCls += ' sun';
    else if (dow === 6) numCls += ' sat';

    return (
      <div
        key={key}
        className={`day-cell${isPadding ? ' padding' : ''}${isSelected ? ' selected' : ''}`}
        onClick={() => onDateClick(date)}
      >
        <div className={numCls}>{date.getDate()}</div>
        <div className="day-events-list">
          {dayEvents.slice(0, 3).map(ev => {
            const cat = CATEGORIES[ev.category];
            return (
              <div
                key={ev.id}
                className="day-event-chip"
                style={{ backgroundColor: cat.darkBg, color: cat.darkText }}
                onClick={e => { e.stopPropagation(); onEventClick(ev); }}
              >
                <span className="day-event-dot" style={{ background: cat.color }} />
                <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>
                  {!ev.allDay && formatKSTTime(ev.startTime) + ' '}
                  {ev.title}
                </span>
              </div>
            );
          })}
          {dayEvents.length > 3 && (
            <div className="day-event-more">+{dayEvents.length - 3}개 더</div>
          )}
        </div>
      </div>
    );
  };

  // ─── Week View ───
  const renderWeekView = () => {
    const startOfWeek = getKSTStartOfWeek(currentDate);
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek, i));
    const todayStr  = formatKSTDate(new Date());
    const WNAMES = ['일','월','화','수','목','금','토'];

    return (
      <div>
        <div className="week-header">
          {weekDays.map(date => {
            const ds = formatKSTDate(date);
            const isToday = ds === todayStr;
            return (
              <div
                key={ds}
                className={`week-day-header${isToday ? ' today-col' : ''}`}
                onClick={() => onDateClick(date)}
              >
                <span className="week-day-name">{WNAMES[date.getDay()]}</span>
                <span className={`week-day-num${isToday ? ' today-num' : ''}`}>{date.getDate()}</span>
              </div>
            );
          })}
        </div>
        <div className="week-body" style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)' }}>
          {weekDays.map(date => {
            const dayEvents = getEventsForDate(date);
            return (
              <div
                key={formatKSTDate(date)}
                className="week-col"
                onClick={() => onDateClick(date)}
              >
                {dayEvents.length === 0 ? (
                  <div className="week-col-empty">비어있음</div>
                ) : (
                  dayEvents.map(ev => {
                    const cat = CATEGORIES[ev.category];
                    return (
                      <div
                        key={ev.id}
                        className="week-event-card"
                        style={{ backgroundColor: cat.darkBg }}
                        onClick={e => { e.stopPropagation(); onEventClick(ev); }}
                      >
                        <div className="week-event-cat" style={{ color: cat.color }}>
                          <CatIcon cat={ev.category} />
                          {cat.label}
                        </div>
                        <div className="week-event-title" style={{ color: cat.darkText }}>
                          {ev.title}
                        </div>
                        <div className="week-event-time">
                          <ClockIcon />
                          {ev.allDay ? '하루 종일' : `${formatKSTTime(ev.startTime)} ~ ${formatKSTTime(ev.endTime)}`}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ─── Day View ───
  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate);
    const kstD = getKSTDate(currentDate);
    const WNAMES = ['일','월','화','수','목','금','토'];
    const isToday = formatKSTDate(currentDate) === formatKSTDate(new Date());

    return (
      <div className="day-view-wrap">
        <div className="day-view-header">
          <div className="day-badge-box">
            <span className="day-badge-weekday">{WNAMES[kstD.getDay()]}</span>
            <span className="day-badge-num">{kstD.getDate()}</span>
          </div>
          <div className="day-view-info">
            <h3>{formatKSTDateTime(currentDate, 'yyyy년 M월 d일')}</h3>
            <p>{isToday ? '오늘의 일정' : '일정 목록'} · 총 {dayEvents.length}개</p>
          </div>
          <button
            className="btn btn-secondary"
            style={{ marginLeft:'auto', fontSize:'0.78rem', padding:'7px 14px' }}
            onClick={() => onDateClick(currentDate)}
          >
            + 일정 추가
          </button>
        </div>

        {dayEvents.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <p>등록된 일정이 없습니다</p>
            <span>날짜를 클릭하거나 위 버튼으로 추가해보세요</span>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {dayEvents.map(ev => {
              const cat = CATEGORIES[ev.category];
              return (
                <div
                  key={ev.id}
                  className="day-event-row"
                  onClick={() => onEventClick(ev)}
                  style={{ borderLeft: `4px solid ${cat.color}` }}
                >
                  <div className="day-event-icon" style={{ color: cat.color }}>
                    <CatIcon cat={ev.category} />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div className="day-event-cat-badge" style={{ backgroundColor: cat.darkBg, color: cat.darkText }}>
                      {cat.label}
                    </div>
                    <div className="day-event-title">{ev.title}</div>
                    <div className="day-event-time">
                      <ClockIcon />
                      {ev.allDay ? '하루 종일' : `${formatKSTTime(ev.startTime)} ~ ${formatKSTTime(ev.endTime)}`}
                    </div>
                    {ev.description && <div className="day-event-desc">{ev.description}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const viewLabels: Record<CalendarView, string> = { month:'월간', week:'주간', day:'일간' };

  return (
    <div className="glass-panel calendar-wrap">
      {/* Header */}
      <div className="calendar-header">
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div className="calendar-title">
            <span style={{ color:'var(--primary)' }}><CalIcon /></span>
            <span>{currentYear}년 {currentMonth + 1}월</span>
          </div>
          <div className="cal-nav">
            <button className="cal-nav-btn" onClick={handlePrev}><ChevronL /></button>
            <button className="cal-nav-btn" onClick={handleToday} style={{ padding:'6px 12px' }}>오늘</button>
            <button className="cal-nav-btn" onClick={handleNext}><ChevronR /></button>
          </div>
        </div>

        <div className="view-tabs">
          {(['month','week','day'] as CalendarView[]).map(v => (
            <button
              key={v}
              className={`view-tab${view === v ? ' active' : ''}`}
              onClick={() => onChangeView(v)}
            >
              {viewLabels[v]}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: view === 'day' ? 0 : '0 0 4px' }}>
        {view === 'month' && renderMonthView()}
        {view === 'week' && renderWeekView()}
        {view === 'day' && renderDayView()}
      </div>
    </div>
  );
};
