import React, { useState, useEffect } from 'react';
import { CATEGORIES } from '../types';
import type { EventItem, CategoryKey } from '../types';
import { formatKSTDate, formatKSTTime, getKSTISOString, getKSTDate } from '../utils/dateHelper';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  eventToEdit: EventItem | null;
  onSave: (event: EventItem) => Promise<void>;
  onDelete: (eventId: number) => Promise<void>;
}

const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);
const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const CalIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const catIcons: Record<string, string> = {
  meeting: '💬',
  assignment: '📋',
  event: '🎉',
  personal: '👤',
};

export const EventModal: React.FC<EventModalProps> = ({
  isOpen, onClose, selectedDate, eventToEdit, onSave, onDelete,
}) => {
  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory]     = useState<CategoryKey>('meeting');
  const [startDateStr, setStartDateStr] = useState('');
  const [endDateStr, setEndDateStr]   = useState('');
  const [allDay, setAllDay]           = useState(false);
  const [startTimeStr, setStartTimeStr] = useState('09:00');
  const [endTimeStr, setEndTimeStr]   = useState('10:00');
  const [errorMsg, setErrorMsg]       = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg('');
    if (eventToEdit) {
      setTitle(eventToEdit.title);
      setDescription(eventToEdit.description);
      setCategory(eventToEdit.category);
      setAllDay(eventToEdit.allDay);
      const s = getKSTDate(eventToEdit.startTime);
      const e = getKSTDate(eventToEdit.endTime);
      setStartDateStr(formatKSTDate(s));
      setEndDateStr(formatKSTDate(e));
      if (eventToEdit.allDay) {
        setStartTimeStr('00:00');
        setEndTimeStr('23:59');
      } else {
        setStartTimeStr(formatKSTTime(s));
        setEndTimeStr(formatKSTTime(e));
      }
    } else {
      setTitle('');
      setDescription('');
      setCategory('meeting');
      setAllDay(false);
      const dateStr = formatKSTDate(selectedDate);
      setStartDateStr(dateStr);
      setEndDateStr(dateStr);
      const now = getKSTDate();
      const h = now.getHours();
      const pad = (n: number) => String(n).padStart(2, '0');
      setStartTimeStr(`${pad(h)}:00`);
      setEndTimeStr(`${pad((h + 1) % 24)}:00`);
    }
  }, [isOpen, eventToEdit, selectedDate]);

  const handleStartTimeChange = (t: string) => {
    setStartTimeStr(t);
    if (startDateStr === endDateStr) {
      const [sh, sm] = t.split(':').map(Number);
      const [eh, em] = endTimeStr.split(':').map(Number);
      if (sh * 60 + sm >= eh * 60 + em) {
        const pad = (n: number) => String(n).padStart(2, '0');
        setEndTimeStr(`${pad((sh + 1) % 24)}:${pad(sm)}`);
      }
    }
  };

  const handleStartDateChange = (d: string) => {
    setStartDateStr(d);
    if (d > endDateStr) setEndDateStr(d);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setErrorMsg('제목을 입력해주세요.'); return; }

    const startISO = getKSTISOString(startDateStr, allDay ? '00:00' : startTimeStr);
    const endISO   = getKSTISOString(endDateStr,   allDay ? '23:59' : endTimeStr);
    if (startISO >= endISO) { setErrorMsg('종료 시각은 시작 시각보다 늦어야 합니다.'); return; }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const data: EventItem = {
        title: title.trim(),
        description: description.trim(),
        category,
        startTime: startISO,
        endTime: endISO,
        allDay,
      };
      if (eventToEdit?.id) data.id = eventToEdit.id;
      await onSave(data);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = async () => {
    if (eventToEdit?.id && window.confirm('정말 이 일정을 삭제하시겠습니까?')) {
      setIsSubmitting(true);
      try {
        await onDelete(eventToEdit.id);
        onClose();
      } catch (err: any) {
        setErrorMsg(err.message || '삭제 중 오류가 발생했습니다.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="glass-panel modal-panel" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h3>{eventToEdit ? '일정 수정' : '새로운 일정 등록'}</h3>
          <button className="btn-ghost" onClick={onClose}><XIcon /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Title */}
            <div>
              <div className="field-label">일정 제목</div>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="예: 팀 프로젝트 미팅"
                className="input-field"
                autoFocus
              />
            </div>

            {/* Category */}
            <div>
              <div className="field-label">카테고리</div>
              <div className="cat-grid">
                {(Object.keys(CATEGORIES) as CategoryKey[]).map(key => {
                  const cat = CATEGORIES[key];
                  const isSelected = category === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      className={`cat-btn${isSelected ? ' selected' : ''}`}
                      onClick={() => setCategory(key)}
                      style={isSelected ? {
                        backgroundColor: cat.darkBg,
                        color: cat.darkText,
                        borderColor: cat.color,
                      } : {}}
                    >
                      <div className="cat-dot" style={{ background: cat.color }} />
                      <span>{catIcons[key]}</span>
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date row */}
            <div className="date-row">
              <div>
                <div className="field-label"><CalIcon /> 시작 날짜</div>
                <input type="date" value={startDateStr} onChange={e => handleStartDateChange(e.target.value)} className="input-field" />
              </div>
              <div>
                <div className="field-label"><CalIcon /> 종료 날짜</div>
                <input type="date" value={endDateStr} min={startDateStr} onChange={e => setEndDateStr(e.target.value)} className="input-field" />
              </div>
            </div>

            {/* Time section */}
            <div className="time-section">
              <div className="time-toggle-row">
                <div className="time-toggle-label">
                  <ClockIcon />
                  <span>하루 종일 (All-day)</span>
                </div>
                {/* Toggle */}
                <label className="toggle-wrap">
                  <input
                    type="checkbox"
                    className="toggle-input"
                    checked={allDay}
                    onChange={e => setAllDay(e.target.checked)}
                  />
                  <div
                    style={{
                      width: 44, height: 24,
                      background: allDay ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                      borderRadius: 99,
                      position: 'relative',
                      transition: 'background 0.2s',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: 2, left: 2,
                        width: 20, height: 20,
                        borderRadius: '50%',
                        background: allDay ? '#fff' : '#9ca3af',
                        transform: allDay ? 'translateX(20px)' : 'none',
                        transition: 'transform 0.2s, background 0.2s',
                      }}
                    />
                  </div>
                </label>
              </div>
              <div className={`time-fields${allDay ? ' disabled' : ''}`}>
                <div>
                  <div className="time-field-label">시작 시간</div>
                  <input type="time" value={startTimeStr} onChange={e => handleStartTimeChange(e.target.value)} disabled={allDay} className="input-field" style={{ textAlign:'center' }} />
                </div>
                <div>
                  <div className="time-field-label">종료 시간</div>
                  <input type="time" value={endTimeStr} onChange={e => setEndTimeStr(e.target.value)} disabled={allDay} className="input-field" style={{ textAlign:'center' }} />
                </div>
              </div>
            </div>

            {/* Memo */}
            <div>
              <div className="field-label">상세 내용 (메모)</div>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="일정에 필요한 메모를 입력하세요..."
                rows={3}
                className="input-field"
                style={{ resize:'none' }}
              />
            </div>

            {/* Error */}
            {errorMsg && <div className="form-error">{errorMsg}</div>}
          </div>

          {/* Footer buttons */}
          <div className="modal-footer">
            {eventToEdit && (
              <button type="button" className="btn btn-danger" onClick={handleDeleteClick} disabled={isSubmitting} title="삭제">
                <TrashIcon />
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting} style={{ flex:1 }}>
              취소
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ flex:2 }}>
              {isSubmitting ? '저장 중...' : eventToEdit ? '수정 완료' : '일정 등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
