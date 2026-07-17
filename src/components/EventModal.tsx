import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Clock, AlignLeft, Trash2, Check } from 'lucide-react';
import { CATEGORIES } from '../types';
import type { EventItem, CategoryKey } from '../types';
import { 
  formatKSTDate, 
  formatKSTTime, 
  getKSTISOString, 
  getKSTDate 
} from '../utils/dateHelper';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  eventToEdit: EventItem | null;
  onSave: (event: EventItem) => Promise<void>;
  onDelete: (eventId: number) => Promise<void>;
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  eventToEdit,
  onSave,
  onDelete,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CategoryKey>('meeting');
  
  // 날짜 필드 (KST 기준 문자열)
  const [startDateStr, setStartDateStr] = useState('');
  const [endDateStr, setEndDateStr] = useState('');
  
  // 종일 여부 및 시간
  const [allDay, setAllDay] = useState(false);
  const [startTimeStr, setStartTimeStr] = useState('09:00');
  const [endTimeStr, setEndTimeStr] = useState('10:00');
  
  // 유효성 에러 메시지
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 모달이 열리거나 편집 대상 이벤트가 바뀔 때 상태 초기화
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      if (eventToEdit) {
        // 수정 모드
        setTitle(eventToEdit.title);
        setDescription(eventToEdit.description);
        setCategory(eventToEdit.category);
        setAllDay(eventToEdit.allDay);
        
        const startKST = getKSTDate(eventToEdit.startTime);
        const endKST = getKSTDate(eventToEdit.endTime);
        
        setStartDateStr(formatKSTDate(startKST));
        setEndDateStr(formatKSTDate(endKST));
        
        if (eventToEdit.allDay) {
          setStartTimeStr('00:00');
          setEndTimeStr('23:59');
        } else {
          setStartTimeStr(formatKSTTime(startKST));
          setEndTimeStr(formatKSTTime(endKST));
        }
      } else {
        // 신규 추가 모드
        setTitle('');
        setDescription('');
        setCategory('meeting');
        setAllDay(false);
        
        const dateStr = formatKSTDate(selectedDate);
        setStartDateStr(dateStr);
        setEndDateStr(dateStr);
        
        // 현재 시각 근처로 기본 시간 셋팅 (예: 1시간 간격)
        const now = getKSTDate();
        const currentHour = now.getHours();
        const nextHour = (currentHour + 1) % 24;
        
        const pad = (n: number) => String(n).padStart(2, '0');
        setStartTimeStr(`${pad(currentHour)}:00`);
        setEndTimeStr(`${pad(nextHour)}:00`);
      }
    }
  }, [isOpen, eventToEdit, selectedDate]);

  // 시작 시간이 변경될 때 종료 시간이 시작 시간보다 빠르면 1시간 뒤로 보정
  const handleStartTimeChange = (newStartTime: string) => {
    setStartTimeStr(newStartTime);
    
    // 같은 날짜인 경우에만 체크
    if (startDateStr === endDateStr) {
      const [sh, sm] = newStartTime.split(':').map(Number);
      const [eh, em] = endTimeStr.split(':').map(Number);
      
      const startMinutes = sh * 60 + sm;
      const endMinutes = eh * 60 + em;
      
      if (startMinutes >= endMinutes) {
        const nextHour = (sh + 1) % 24;
        const pad = (n: number) => String(n).padStart(2, '0');
        setEndTimeStr(`${pad(nextHour)}:${pad(sm)}`);
      }
    }
  };

  // 시작 날짜가 바뀔 때 종료 날짜 보정
  const handleStartDateChange = (newStartDate: string) => {
    setStartDateStr(newStartDate);
    if (newStartDate > endDateStr) {
      setEndDateStr(newStartDate);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('제목을 입력해주세요.');
      return;
    }

    // 날짜/시간 정합성 체크
    const startISO = getKSTISOString(startDateStr, allDay ? '00:00' : startTimeStr);
    const endISO = getKSTISOString(endDateStr, allDay ? '23:59' : endTimeStr);

    if (startISO >= endISO) {
      setErrorMsg('종료 시각은 시작 시각보다 늦어야 합니다.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const eventData: EventItem = {
        title: title.trim(),
        description: description.trim(),
        category,
        startTime: startISO,
        endTime: endISO,
        allDay,
      };

      if (eventToEdit && eventToEdit.id) {
        eventData.id = eventToEdit.id;
      }

      await onSave(eventData);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || '저장하는 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = async () => {
    if (eventToEdit && eventToEdit.id) {
      if (window.confirm('정말 이 일정을 삭제하시겠습니까?')) {
        setIsSubmitting(true);
        try {
          await onDelete(eventToEdit.id);
          onClose();
        } catch (err: any) {
          setErrorMsg(err.message || '삭제하는 중 오류가 발생했습니다.');
        } finally {
          setIsSubmitting(false);
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="glass-panel w-full max-w-lg overflow-hidden border border-white/10 shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.01]">
          <h3 className="text-lg font-bold text-white">
            {eventToEdit ? '일정 상세 정보' : '새로운 일정 등록'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 모달 본문 폼 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* 일정 제목 */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              일정 제목
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 프로젝트 중간 점검 미팅"
              className="input-field py-3"
              autoFocus
            />
          </div>

          {/* 카테고리 선택 */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
              카테고리
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(CATEGORIES) as CategoryKey[]).map((key) => {
                const cat = CATEGORIES[key];
                const isSelected = category === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategory(key)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      isSelected
                        ? 'border-indigo-500 shadow-md scale-[1.03]'
                        : 'border-white/5 hover:border-white/10'
                    }`}
                    style={{
                      backgroundColor: isSelected ? cat.darkBg : 'rgba(255,255,255,0.02)',
                      color: isSelected ? cat.darkText : '#9ca3af',
                    }}
                  >
                    <span 
                      className="w-3.5 h-3.5 rounded-full mb-1.5 flex items-center justify-center"
                      style={{ backgroundColor: cat.color }}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                    </span>
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 날짜 선택 (시작일 / 종료일) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <CalendarIcon className="w-3.5 h-3.5 text-indigo-400" />
                시작 날짜
              </label>
              <input
                type="date"
                value={startDateStr}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <CalendarIcon className="w-3.5 h-3.5 text-indigo-400" />
                종료 날짜
              </label>
              <input
                type="date"
                value={endDateStr}
                onChange={(e) => setEndDateStr(e.target.value)}
                min={startDateStr}
                className="input-field"
              />
            </div>
          </div>

          {/* 종일(All-day) 토글 및 시간 선택 (Time Picker) */}
          <div className="glass-panel p-4 border border-white/5 bg-white/[0.01] rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-semibold text-gray-200">하루 종일 (All-day)</span>
              </div>
              
              {/* iOS 스타일 토글 스위치 */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={allDay}
                  onChange={(e) => setAllDay(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-300 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white peer-checked:after:border-white"></div>
              </label>
            </div>

            {/* 시간 선택 인풋 */}
            <div className={`grid grid-cols-2 gap-4 transition-opacity duration-200 ${allDay ? 'opacity-40 pointer-events-none' : ''}`}>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">시작 시간</label>
                <input
                  type="time"
                  value={startTimeStr}
                  disabled={allDay}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  className="input-field text-center font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">종료 시간</label>
                <input
                  type="time"
                  value={endTimeStr}
                  disabled={allDay}
                  onChange={(e) => setEndTimeStr(e.target.value)}
                  className="input-field text-center font-medium"
                />
              </div>
            </div>
          </div>

          {/* 일정 설명 */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <AlignLeft className="w-3.5 h-3.5 text-indigo-400" />
              상세 내용 (메모)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="일정에 필요한 메모를 입력하세요..."
              rows={3}
              className="input-field resize-none py-2.5"
            />
          </div>

          {/* 에러 피드백 */}
          {errorMsg && (
            <div className="text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* 모달 하단 버튼 액션 */}
          <div className="flex gap-2 pt-2">
            {eventToEdit && (
              <button
                type="button"
                onClick={handleDeleteClick}
                disabled={isSubmitting}
                className="btn btn-danger px-4 rounded-xl flex items-center justify-center"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn btn-secondary flex-1 rounded-xl"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary flex-[2] rounded-xl font-bold"
            >
              {isSubmitting ? '저장 중...' : eventToEdit ? '수정 완료' : '일정 등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
