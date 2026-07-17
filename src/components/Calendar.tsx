import React from 'react';
import { addDays } from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Briefcase, 
  BookOpen, 
  Trophy 
} from 'lucide-react';
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

export const Calendar: React.FC<CalendarProps> = ({
  currentDate,
  view,
  events,
  onDateClick,
  onEventClick,
  onChangeDate,
  onChangeView,
}) => {
  
  // KST 기준 연도와 월 추출
  const kstDate = getKSTDate(currentDate);
  const currentYear = kstDate.getFullYear();
  const currentMonth = kstDate.getMonth(); // 0-indexed

  // 이전달/다음달 이동
  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    onChangeDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    onChangeDate(newDate);
  };

  const handleToday = () => {
    onChangeDate(new Date());
  };

  // 일정 카테고리별 아이콘 가져오기
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'meeting': return <Briefcase className="w-3.5 h-3.5" />;
      case 'assignment': return <BookOpen className="w-3.5 h-3.5" />;
      case 'event': return <Trophy className="w-3.5 h-3.5" />;
      case 'personal': default: return <User className="w-3.5 h-3.5" />;
    }
  };

  // 특정 일자의 일정 필터링 (KST 기준 날짜가 겹치거나 같은 경우)
  const getEventsForDate = (date: Date): EventItem[] => {
    const targetStr = formatKSTDate(date);
    return events.filter(event => {
      const startStr = formatKSTDate(event.startTime);
      const endStr = formatKSTDate(event.endTime);
      
      // 당일 일정이거나, 시작일과 종료일 범위 내에 있는 경우
      return targetStr >= startStr && targetStr <= endStr;
    });
  };

  // 1. 월간 뷰(Month View) 렌더러
  const renderMonthView = () => {
    const startOfMonth = getKSTStartOfMonth(currentDate);
    const startDayOfWeek = startOfMonth.getDay(); // 0 (일) ~ 6 (토)
    
    // 월의 총 일수
    const tempDate = new Date(currentYear, currentMonth + 1, 0);
    const totalDays = tempDate.getDate();

    // 이전 달의 일수 가져오기
    const prevMonthTemp = new Date(currentYear, currentMonth, 0);
    const prevMonthDays = prevMonthTemp.getDate();

    const days: React.ReactNode[] = [];

    // 이전 달 패딩 날짜 추가
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const dateVal = new Date(currentYear, currentMonth - 1, dayNum);
      days.push(renderDayCell(dateVal, true, `prev-${dayNum}`));
    }

    // 현재 달 날짜 추가
    for (let i = 1; i <= totalDays; i++) {
      const dateVal = new Date(currentYear, currentMonth, i);
      days.push(renderDayCell(dateVal, false, `curr-${i}`));
    }

    // 다음 달 패딩 날짜 추가
    const totalCells = days.length;
    const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 1; i <= remainingCells; i++) {
      const dateVal = new Date(currentYear, currentMonth + 1, i);
      days.push(renderDayCell(dateVal, true, `next-${i}`));
    }

    return (
      <div className="flex flex-col h-full">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 text-center py-2 border-b border-white/5 font-semibold text-sm text-gray-400">
          {['일', '월', '화', '수', '목', '금', '토'].map((d, index) => (
            <div key={d} className={index === 0 ? 'text-red-400' : index === 6 ? 'text-blue-400' : ''}>
              {d}
            </div>
          ))}
        </div>
        {/* 날짜 격자 */}
        <div className="grid grid-cols-7 grid-rows-5 flex-1 min-h-[500px]">
          {days}
        </div>
      </div>
    );
  };

  const renderDayCell = (date: Date, isPadding: boolean, key: string) => {
    const dateStr = formatKSTDate(date);
    const todayStr = formatKSTDate(new Date());
    const isToday = dateStr === todayStr;
    const isSelected = dateStr === formatKSTDate(currentDate);
    const dayEvents = getEventsForDate(date);
    const isSunday = date.getDay() === 0;
    const isSaturday = date.getDay() === 6;

    return (
      <div
        key={key}
        className={`min-h-[100px] border-b border-r border-white/5 p-1.5 flex flex-col group cursor-pointer hover:bg-white/[0.02] transition-colors relative ${
          isPadding ? 'opacity-30' : ''
        } ${isSelected ? 'bg-indigo-500/5' : ''}`}
        onClick={() => onDateClick(date)}
      >
        <div className="flex justify-between items-center mb-1">
          <span
            className={`w-6 h-6 flex items-center justify-center text-xs font-semibold rounded-full ${
              isToday 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                : isSelected
                ? 'bg-white/10 text-white'
                : isSunday
                ? 'text-red-400'
                : isSaturday
                ? 'text-blue-400'
                : 'text-gray-300'
            }`}
          >
            {date.getDate()}
          </span>
          {dayEvents.length > 0 && !isPadding && (
            <span className="text-[10px] text-gray-500 font-medium px-1.5 py-0.5 rounded bg-white/5">
              {dayEvents.length}개
            </span>
          )}
        </div>

        {/* 일정 리스트 (최대 3개 표시, 나머지는 +N) */}
        <div className="flex-1 overflow-y-auto space-y-1 scrollbar-none max-h-[85px]">
          {dayEvents.slice(0, 3).map((event) => {
            const catInfo = CATEGORIES[event.category];
            return (
              <div
                key={event.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onEventClick(event);
                }}
                className="text-[11px] px-1.5 py-1 rounded border transition-all flex items-center gap-1 overflow-hidden whitespace-nowrap text-ellipsis hover:scale-[1.02]"
                style={{
                  backgroundColor: catInfo.darkBg,
                  color: catInfo.darkText,
                  borderColor: 'rgba(255,255,255,0.05)',
                }}
              >
                <span className="flex-shrink-0" style={{ color: catInfo.color }}>
                  {getCategoryIcon(event.category)}
                </span>
                <span className="font-medium truncate flex-1">
                  {event.allDay ? '' : `[${formatKSTTime(event.startTime)}] `}
                  {event.title}
                </span>
              </div>
            );
          })}
          {dayEvents.length > 3 && (
            <div className="text-[9px] text-gray-400 font-semibold text-center py-0.5">
              외 {dayEvents.length - 3}개 더보기
            </div>
          )}
        </div>
      </div>
    );
  };

  // 2. 주간 뷰(Week View) 렌더러
  const renderWeekView = () => {
    const startOfWeek = getKSTStartOfWeek(currentDate);
    const weekDays: Date[] = [];
    for (let i = 0; i < 7; i++) {
      weekDays.push(addDays(startOfWeek, i));
    }

    return (
      <div className="flex flex-col h-full min-h-[500px]">
        {/* 주간 요일 헤더 */}
        <div className="grid grid-cols-7 border-b border-white/5 py-4 text-center">
          {weekDays.map((date) => {
            const dateStr = formatKSTDate(date);
            const todayStr = formatKSTDate(new Date());
            const isToday = dateStr === todayStr;
            const dayName = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
            
            return (
              <div
                key={dateStr}
                onClick={() => onDateClick(date)}
                className={`cursor-pointer p-1 rounded-lg transition-colors hover:bg-white/5 ${
                  isToday ? 'bg-indigo-600/10' : ''
                }`}
              >
                <div className="text-xs text-gray-400 font-medium mb-1">{dayName}</div>
                <div
                  className={`mx-auto w-8 h-8 flex items-center justify-center font-bold rounded-full text-sm ${
                    isToday
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'text-gray-200'
                  }`}
                >
                  {date.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* 주간 일정 내용 배치 */}
        <div className="grid grid-cols-7 divide-x divide-white/5 flex-1 min-h-[400px]">
          {weekDays.map((date) => {
            const dayEvents = getEventsForDate(date);
            return (
              <div
                key={formatKSTDate(date)}
                className="p-2 space-y-2 min-h-[400px] hover:bg-white/[0.01] transition-colors"
                onClick={() => onDateClick(date)}
              >
                {dayEvents.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <span className="text-[10px] text-gray-600">일정 없음</span>
                  </div>
                ) : (
                  dayEvents.map((event) => {
                    const catInfo = CATEGORIES[event.category];
                    return (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(event);
                        }}
                        className="p-2 rounded-lg border transition-all cursor-pointer hover:scale-[1.02] flex flex-col gap-1 shadow-sm"
                        style={{
                          backgroundColor: catInfo.darkBg,
                          color: catInfo.darkText,
                          borderColor: 'rgba(255,255,255,0.06)',
                        }}
                      >
                        <div className="flex items-center gap-1.5">
                          <span style={{ color: catInfo.color }}>
                            {getCategoryIcon(event.category)}
                          </span>
                          <span className="text-[10px] font-bold tracking-wide uppercase">
                            {catInfo.label}
                          </span>
                        </div>
                        <div className="text-[12px] font-semibold truncate leading-tight">
                          {event.title}
                        </div>
                        <div className="text-[10px] text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-500" />
                          <span>
                            {event.allDay 
                              ? '하루 종일' 
                              : `${formatKSTTime(event.startTime)} - ${formatKSTTime(event.endTime)}`}
                          </span>
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

  // 3. 일간 뷰(Day View) 렌더러
  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate);
    const formattedDate = formatKSTDate(currentDate);
    const todayStr = formatKSTDate(new Date());
    const isToday = formattedDate === todayStr;

    return (
      <div className="flex flex-col h-full min-h-[450px] p-4">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/10 flex flex-col items-center justify-center border border-indigo-500/10">
            <span className="text-[10px] font-bold text-indigo-400 leading-none mb-0.5">
              {['일', '월', '화', '수', '목', '금', '토'][getKSTDate(currentDate).getDay()]}
            </span>
            <span className="text-lg font-extrabold text-white leading-none">
              {getKSTDate(currentDate).getDate()}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              {formatKSTDateTime(currentDate, 'yyyy년 M월 d일')}
            </h3>
            <p className="text-xs text-gray-400">
              {isToday ? '오늘의 일정' : '지정된 일자의 일정'} • 총 {dayEvents.length}개
            </p>
          </div>
          <button
            onClick={() => onDateClick(currentDate)}
            className="ml-auto btn btn-secondary text-xs py-1.5 px-3 rounded-lg flex items-center gap-1"
          >
            + 새 일정 추가
          </button>
        </div>

        {dayEvents.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
            <CalendarIcon className="w-12 h-12 text-gray-600 mb-3" />
            <p className="text-sm text-gray-400 font-medium">등록된 일정이 없습니다.</p>
            <p className="text-xs text-gray-600 mt-1">상단의 버튼 또는 일정을 더블클릭하여 추가해보세요.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dayEvents.map((event) => {
              const catInfo = CATEGORIES[event.category];
              return (
                <div
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className="glass-panel p-4 border transition-all cursor-pointer hover:translate-x-1 flex items-start gap-4"
                  style={{
                    borderLeft: `4px solid ${catInfo.color}`,
                    borderColor: 'rgba(255,255,255,0.05)',
                  }}
                >
                  <div className="p-2 rounded-lg bg-white/5" style={{ color: catInfo.color }}>
                    {getCategoryIcon(event.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider"
                        style={{
                          backgroundColor: catInfo.darkBg,
                          color: catInfo.darkText,
                        }}
                      >
                        {catInfo.label}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {event.allDay 
                          ? '하루 종일' 
                          : `${formatKSTTime(event.startTime)} ~ ${formatKSTTime(event.endTime)}`}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-white truncate mb-1">
                      {event.title}
                    </h4>
                    {event.description && (
                      <p className="text-sm text-gray-400 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="glass-panel overflow-hidden border border-white/5 shadow-2xl flex flex-col h-full">
      {/* 캘린더 컨트롤 헤더 */}
      <div className="flex flex-col sm:flex-row justify-between items-center p-4 gap-3 border-b border-white/5 bg-white/[0.01]">
        {/* 좌측: 연월 표시 및 네비게이션 */}
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2 min-w-[160px]">
            <CalendarIcon className="w-5 h-5 text-indigo-400" />
            <span>
              {currentYear}년 {currentMonth + 1}월
            </span>
          </h2>
          <div className="flex items-center bg-white/5 p-1 rounded-lg border border-white/5">
            <button
              onClick={handlePrev}
              className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-0.5 rounded-md text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              오늘
            </button>
            <button
              onClick={handleNext}
              className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 우측: 뷰 선택 탭 */}
        <div className="flex bg-white/5 p-1 rounded-lg border border-white/5">
          {(['month', 'week', 'day'] as CalendarView[]).map((v) => (
            <button
              key={v}
              onClick={() => onChangeView(v)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                view === v
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {v === 'month' ? '월간' : v === 'week' ? '주간' : '일간'}
            </button>
          ))}
        </div>
      </div>

      {/* 캘린더 본문 */}
      <div className="p-4 flex-1">
        {view === 'month' && renderMonthView()}
        {view === 'week' && renderWeekView()}
        {view === 'day' && renderDayView()}
      </div>
    </div>
  );
};
