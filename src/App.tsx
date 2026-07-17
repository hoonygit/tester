import { useState, useEffect } from 'react';
import { Calendar } from './components/Calendar';
import { EventModal } from './components/EventModal';
import type { EventItem, CalendarView } from './types';
import { CATEGORIES } from './types';
import { getKSTDate, formatKSTDateTime } from './utils/dateHelper';
import confetti from 'canvas-confetti';

// ─── SVG Icons ───
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const DBIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
  </svg>
);
const SparkIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const AlertIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
const ClockIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const InfoIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);
const CalendarBig = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

export default function App() {
  const [events, setEvents]           = useState<EventItem[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [view, setView]               = useState<CalendarView>('month');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [eventToEdit, setEventToEdit] = useState<EventItem | null>(null);
  const [isLoading, setIsLoading]     = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [dbStatus, setDbStatus]       = useState<'connected' | 'fallback'>('connected');
  const [toastMsg, setToastMsg]       = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // ─── Fetch ───
  const fetchEvents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/events');
      if (!res.ok) throw new Error('API 연결에 실패했습니다.');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setEvents(data);
      setDbStatus('connected');
    } catch (err: any) {
      console.warn('Neon DB fallback:', err.message);
      const local = localStorage.getItem('hoony_calendar_events');
      if (local) {
        setEvents(JSON.parse(local));
      } else {
        const todayStr = formatKSTDateTime(new Date(), 'yyyy-MM-dd');
        const dummy: EventItem[] = [
          { id:1, title:'📅 캘린더 서비스 오픈', description:'React + Vite + Neon DB 기반 일정관리 서비스입니다.', category:'event', startTime:`${todayStr}T09:00:00+09:00`, endTime:`${todayStr}T10:00:00+09:00`, allDay:false },
          { id:2, title:'💻 DB 연동 확인', description:'Neon DB 실시간 연동 테스트.', category:'meeting', startTime:`${todayStr}T14:00:00+09:00`, endTime:`${todayStr}T15:30:00+09:00`, allDay:false },
        ];
        setEvents(dummy);
        localStorage.setItem('hoony_calendar_events', JSON.stringify(dummy));
      }
      setDbStatus('fallback');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  // ─── Save ───
  const handleSaveEvent = async (data: EventItem) => {
    setIsLoading(true);
    try {
      if (dbStatus === 'connected') {
        const method = data.id ? 'PUT' : 'POST';
        const res = await fetch('/api/events', {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('일정 저장에 실패했습니다.');
        await fetchEvents();
      } else {
        let updated = [...events];
        if (data.id) {
          updated = updated.map(e => e.id === data.id ? data : e);
        } else {
          updated.push({ ...data, id: Date.now() });
        }
        setEvents(updated);
        localStorage.setItem('hoony_calendar_events', JSON.stringify(updated));
      }
      confetti({ particleCount: 90, spread: 65, origin: { y: 0.6 } });
      showToast(data.id ? '일정이 수정되었습니다.' : '새 일정이 등록되었습니다.');
    } catch (err: any) {
      throw new Error(err.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Delete ───
  const handleDeleteEvent = async (eventId: number) => {
    setIsLoading(true);
    try {
      if (dbStatus === 'connected') {
        const res = await fetch('/api/events', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: eventId }),
        });
        if (!res.ok) throw new Error('일정 삭제에 실패했습니다.');
        await fetchEvents();
      } else {
        const updated = events.filter(e => e.id !== eventId);
        setEvents(updated);
        localStorage.setItem('hoony_calendar_events', JSON.stringify(updated));
      }
      showToast('일정이 삭제되었습니다.');
    } catch (err: any) {
      throw new Error(err.message || '삭제 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setEventToEdit(null);
    setIsModalOpen(true);
  };
  const handleEventClick = (event: EventItem) => {
    setEventToEdit(event);
    setSelectedDate(getKSTDate(event.startTime));
    setIsModalOpen(true);
  };

  const upcomingEvents = events
    .filter(e => new Date(e.startTime).getTime() >= Date.now())
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 5);

  return (
    <div className="app-container">
      {/* Toast */}
      {toastMsg && (
        <div className="toast anim-slide-down">
          <CheckIcon />
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <header className="app-header">
        <div className="app-header-left">
          <div className="header-badges">
            <span className="badge" style={{ background:'rgba(99,102,241,0.12)', color:'#a5b4fc', borderColor:'rgba(99,102,241,0.2)' }}>
              <SparkIcon /> KST 한국 표준시
            </span>
            {dbStatus === 'connected' ? (
              <span className="badge" style={{ background:'rgba(16,185,129,0.1)', color:'#6ee7b7', borderColor:'rgba(16,185,129,0.2)' }}>
                <DBIcon /> Neon DB 실시간 연결됨
              </span>
            ) : (
              <span className="badge" style={{ background:'rgba(245,158,11,0.1)', color:'#fbbf24', borderColor:'rgba(245,158,11,0.2)' }}>
                <DBIcon /> 로컬 저장 모드
              </span>
            )}
          </div>
          <h1>
            <span style={{ color:'var(--primary)' }}><CalendarBig /></span>
            <span>Hoony's Calendar</span>
          </h1>
          <p>React · Vite · Neon DB 기반의 스마트한 일정관리 서비스</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleDateClick(new Date())}>
          <PlusIcon />
          새 일정 작성
        </button>
      </header>

      {/* Loading bar */}
      {isLoading && (
        <div className="loading-bar">
          <div className="loading-bar-inner" />
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="error-banner">
          <AlertIcon /> {error}
        </div>
      )}

      {/* Main Grid */}
      <div className="main-grid">
        {/* Calendar */}
        <div>
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

        {/* Sidebar */}
        <aside className="sidebar">
          {/* DB Fallback warning */}
          {dbStatus === 'fallback' && (
            <div className="fallback-banner">
              <div style={{ flexShrink:0, marginTop:2 }}><AlertIcon /></div>
              <div>
                <h4>로컬 저장 모드</h4>
                <p>Netlify 배포 환경에서 <strong>DATABASE_URL</strong> 환경변수가 설정되면 Neon DB와 자동 연동됩니다.</p>
              </div>
            </div>
          )}

          {/* Upcoming Events */}
          <div className="glass-panel sidebar-card">
            <div className="sidebar-card-title">
              <ClockIcon />
              <span>다가오는 일정 ({upcomingEvents.length})</span>
            </div>
            {upcomingEvents.length === 0 ? (
              <div style={{ textAlign:'center', padding:'24px 0', color:'var(--text-muted)', fontSize:'0.8rem' }}>
                <div style={{ marginBottom:8, opacity:0.4 }}><InfoIcon /></div>
                예정된 일정이 없습니다
              </div>
            ) : (
              upcomingEvents.map(ev => {
                const cat = CATEGORIES[ev.category];
                return (
                  <div key={ev.id} className="upcoming-item" onClick={() => handleEventClick(ev)}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span className="upcoming-date">{formatKSTDateTime(ev.startTime, 'M월 d일 (E)')}</span>
                      <span
                        style={{ fontSize:'0.62rem', fontWeight:700, padding:'1px 6px', borderRadius:5, background:cat.darkBg, color:cat.darkText }}
                      >
                        {cat.label}
                      </span>
                    </div>
                    <div className="upcoming-title">{ev.title}</div>
                    <div className="upcoming-time">
                      {ev.allDay ? '하루 종일' : formatKSTDateTime(ev.startTime, 'HH:mm')}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Guide */}
          <div className="glass-panel sidebar-card">
            <div className="sidebar-card-title">
              <InfoIcon />
              <span>사용 방법</span>
            </div>
            <ul className="guide-list">
              <li>달력의 날짜를 클릭하면 새 일정을 빠르게 추가할 수 있습니다.</li>
              <li>일정 칩을 클릭하면 수정 및 삭제가 가능합니다.</li>
              <li>종일 토글을 켜면 시간 선택 없이 하루 전체 일정으로 등록됩니다.</li>
              <li>모든 날짜·시간은 <strong style={{ color:'var(--primary)' }}>한국 표준시 (KST)</strong> 기준으로 처리됩니다.</li>
            </ul>
          </div>
        </aside>
      </div>

      {/* Modal */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDate={selectedDate}
        eventToEdit={eventToEdit}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
      />

      {/* Footer */}
      <footer className="app-footer">
        © 2026 Hoony's Calendar · Powered by React, Vite, TypeScript & Neon DB
      </footer>
    </div>
  );
}
