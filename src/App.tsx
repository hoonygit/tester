import { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Database, 
  AlertCircle, 
  Sparkles, 
  Clock, 
  Info,
  CheckCircle2
} from 'lucide-react';
import { Calendar } from './components/Calendar';
import { EventModal } from './components/EventModal';
import type { EventItem, CalendarView } from './types';
import { getKSTDate, formatKSTDateTime } from './utils/dateHelper';
import confetti from 'canvas-confetti';

export default function App() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [view, setView] = useState<CalendarView>('month');
  
  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [eventToEdit, setEventToEdit] = useState<EventItem | null>(null);

  // 로딩, 에러 및 DB 상태
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<'connected' | 'fallback'>('connected');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 간단한 토스트 메시지 시스템
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // API 서버에서 일정 데이터 페칭
  const fetchEvents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/events');
      if (!response.ok) {
        throw new Error('API 연결에 실패했습니다.');
      }
      const data = await response.json();
      
      // 만약 데이터에 에러 필드가 들어있다면 (예: DB 미설정)
      if (data.error) {
        throw new Error(data.error);
      }
      
      setEvents(data);
      setDbStatus('connected');
    } catch (err: any) {
      console.warn('Neon DB API Fetch Error, falling back to LocalStorage:', err);
      // 로컬스토리지 Fallback 처리
      const localData = localStorage.getItem('hoony_calendar_events');
      if (localData) {
        setEvents(JSON.parse(localData));
      } else {
        // 기본 더미 데이터 셋팅
        const todayStr = formatKSTDateTime(new Date(), 'yyyy-MM-dd');
        const dummy: EventItem[] = [
          {
            id: 1,
            title: '📅 캘린더 서비스 오픈',
            description: 'React + Vite + TypeScript 기반의 일정관리 서비스가 배포되었습니다.',
            category: 'event',
            startTime: `${todayStr}T09:00:00+09:00`,
            endTime: `${todayStr}T10:00:00+09:00`,
            allDay: false
          },
          {
            id: 2,
            title: '💻 Neon DB 마이그레이션 확인',
            description: 'Neon DB 실시간 연동 테스트를 진행합니다.',
            category: 'meeting',
            startTime: `${todayStr}T14:00:00+09:00`,
            endTime: `${todayStr}T15:30:00+09:00`,
            allDay: false
          }
        ];
        setEvents(dummy);
        localStorage.setItem('hoony_calendar_events', JSON.stringify(dummy));
      }
      setDbStatus('fallback');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // 일정 저장/수정 처리
  const handleSaveEvent = async (eventData: EventItem) => {
    setIsLoading(true);
    try {
      if (dbStatus === 'connected') {
        const method = eventData.id ? 'PUT' : 'POST';
        const response = await fetch('/api/events', {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData),
        });

        if (!response.ok) {
          throw new Error('일정 저장에 실패했습니다.');
        }
        
        await fetchEvents();
      } else {
        // Fallback: 로컬 스토리지에 저장
        let updatedEvents = [...events];
        if (eventData.id) {
          // 수정
          updatedEvents = updatedEvents.map(e => e.id === eventData.id ? eventData : e);
          showToast('일정이 수정되었습니다 (로컬 저장됨).');
        } else {
          // 생성
          const newEvent = {
            ...eventData,
            id: Date.now() // 고유 임시 ID
          };
          updatedEvents.push(newEvent);
          showToast('새 일정이 등록되었습니다 (로컬 저장됨).');
        }
        setEvents(updatedEvents);
        localStorage.setItem('hoony_calendar_events', JSON.stringify(updatedEvents));
      }
      
      // 성공 피드백 콘페티 효과
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      showToast(eventData.id ? '일정이 성공적으로 수정되었습니다.' : '새 일정이 성공적으로 등록되었습니다.');
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || '저장하는 중 에러가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 일정 삭제 처리
  const handleDeleteEvent = async (eventId: number) => {
    setIsLoading(true);
    try {
      if (dbStatus === 'connected') {
        const response = await fetch('/api/events', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: eventId }),
        });

        if (!response.ok) {
          throw new Error('일정 삭제에 실패했습니다.');
        }

        await fetchEvents();
      } else {
        // Fallback: 로컬 스토리지에서 삭제
        const updatedEvents = events.filter(e => e.id !== eventId);
        setEvents(updatedEvents);
        localStorage.setItem('hoony_calendar_events', JSON.stringify(updatedEvents));
      }
      showToast('일정이 삭제되었습니다.');
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || '삭제하는 중 에러가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 날짜 클릭 시 (새 일정 추가)
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setEventToEdit(null);
    setIsModalOpen(true);
  };

  // 일정 클릭 시 (일정 수정/상세)
  const handleEventClick = (event: EventItem) => {
    setEventToEdit(event);
    setSelectedDate(getKSTDate(event.startTime));
    setIsModalOpen(true);
  };

  // 다가오는 일정 필터링 (현재 시간 이후 일정 최대 4개)
  const upcomingEvents = events
    .filter(e => {
      const now = new Date().getTime();
      const startTime = new Date(e.startTime).getTime();
      return startTime >= now;
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* 토스트 메시지 팝업 */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-indigo-600 border border-indigo-400 text-white px-4 py-3 rounded-xl shadow-2xl animate-fade-in font-medium text-sm">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 헤더 섹션 */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-indigo-600/20 text-indigo-400 text-xs px-2.5 py-1 rounded-full font-bold border border-indigo-500/20 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              KST 한국 표준시 모드
            </span>
            {dbStatus === 'connected' ? (
              <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-bold border border-emerald-500/20 flex items-center gap-1.5">
                <Database className="w-3 h-3" />
                Neon DB 실시간 연결됨
              </span>
            ) : (
              <span className="bg-amber-500/20 text-amber-400 text-xs px-2.5 py-1 rounded-full font-bold border border-amber-500/20 flex items-center gap-1.5" title="Netlify 배포 후 환경 변수를 주입하면 자동으로 Neon DB에 실시간 동기화됩니다.">
                <Database className="w-3 h-3" />
                로컬 저장소 모드 (Fallback)
              </span>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <CalendarIcon className="w-8 h-8 text-indigo-500" />
            <span>Hoony's Calendar</span>
          </h1>
          <p className="text-gray-400 text-xs mt-1 md:text-sm">
            React + Vite + Neon DB 기반의 스마트한 메모 및 일정관리 스페이스
          </p>
        </div>

        <button
          onClick={() => handleDateClick(new Date())}
          className="btn btn-primary font-bold shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span>새 일정 작성</span>
        </button>
      </header>

      {/* 로딩 바 표시 */}
      {isLoading && (
        <div className="w-full h-1 bg-indigo-950 rounded-full overflow-hidden relative">
          <div className="absolute top-0 bottom-0 left-0 w-1/2 bg-indigo-500 rounded-full animate-pulse"></div>
        </div>
      )}

      {/* 글로벌 에러 배너 */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-2.5 text-sm">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* 메인 레이아웃 (달력 & 사이드바) */}
      <main className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* 달력 컨테이너 (3열 차지) */}
        <div className="lg:col-span-3 h-full">
          <Calendar
            currentDate={currentDate}
            view={view}
            events={events}
            onDateClick={handleDateClick}
            onEventClick={handleEventClick}
            onChangeDate={setCurrentDate}
            onChangeView={setView}
          />
        </div>

        {/* 대시보드 정보 사이드바 (1열 차지) */}
        <div className="space-y-6">
          {/* Neon DB 상태 알림 카드 */}
          {dbStatus === 'fallback' && (
            <div className="glass-panel p-4 border border-amber-500/20 bg-amber-500/5 rounded-2xl flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <h4 className="font-bold text-amber-300">로컬 브라우저 저장 모드 안내</h4>
                <p className="text-gray-400 leading-relaxed">
                  현재 로컬 개발 서버 또는 환경변수(`DATABASE_URL`)가 잡히지 않아 로컬 스토리지에 자료가 임시 저장되고 있습니다.
                </p>
                <p className="text-gray-400 leading-relaxed font-semibold">
                  Netlify에 배포된 환경에서는 설정한 Neon DB와 자동으로 연동되어 안전하게 관리됩니다.
                </p>
              </div>
            </div>
          )}

          {/* 다가오는 일정 목록 (Upcoming Events) */}
          <div className="glass-panel p-5 border border-white/5 space-y-4">
            <h3 className="text-sm font-extrabold text-gray-200 tracking-wider uppercase flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              다가오는 일정 ({upcomingEvents.length})
            </h3>
            
            <div className="space-y-3">
              {upcomingEvents.length === 0 ? (
                <div className="text-center py-6">
                  <Info className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">예정된 일정이 없습니다.</p>
                </div>
              ) : (
                upcomingEvents.map(event => (
                  <div
                    key={event.id}
                    onClick={() => handleEventClick(event)}
                    className="p-3 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/10 cursor-pointer transition-all flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-indigo-400">
                        {formatKSTDateTime(event.startTime, 'M월 d일')}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {event.allDay ? '하루 종일' : formatKSTDateTime(event.startTime, 'HH:mm')}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white truncate">
                      {event.title}
                    </h4>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 사용 방법 안내 카드 */}
          <div className="glass-panel p-5 border border-white/5 text-xs text-gray-400 space-y-3">
            <h3 className="font-bold text-gray-200 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-indigo-400" />
              스마트 캘린더 안내
            </h3>
            <ul className="list-disc list-inside space-y-1.5 leading-relaxed">
              <li>달력의 날짜 칸을 클릭하여 원하는 날짜에 새 일정을 손쉽게 작성할 수 있습니다.</li>
              <li>일정을 클릭하면 상세 메모 확인, 수정 및 삭제가 가능합니다.</li>
              <li>종일(All-day) 토글을 켜면 복잡한 시간 설정 없이 하루 전체 일정으로 저장됩니다.</li>
              <li>모든 날짜 및 시간은 <strong>한국 표준시(KST)</strong>를 기준으로 오차 없이 동기화됩니다.</li>
            </ul>
          </div>
        </div>
      </main>

      {/* 일정 입력/수정 모달 */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDate={selectedDate}
        eventToEdit={eventToEdit}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
      />

      {/* 푸터 */}
      <footer className="text-center text-xs text-gray-600 pt-8 pb-4 border-t border-white/5">
        <p>© 2026 Hoony's Calendar Space. Powered by React, Vite, Tailwind-alternative Custom CSS, and Neon DB.</p>
      </footer>
    </div>
  );
}
