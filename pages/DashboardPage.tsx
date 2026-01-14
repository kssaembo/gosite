
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Send, 
  ExternalLink, 
  LogOut, 
  Copy, 
  Check,
  Monitor,
  Zap,
  QrCode,
  X,
  Mail,
  AlertCircle,
  Save,
  CheckCircle2
} from 'lucide-react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Slot } from '../types';
import { supabase } from '../lib/supabase';

interface DashboardPageProps {
  teacherId: string;
  username: string;
  onLogout: () => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ teacherId, username, onLogout }) => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showQr, setShowQr] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [showToast, setShowToast] = useState(false);

  const BASE_URL = 'https://gosite-theta.vercel.app';
  const STUDENT_LINK = `${BASE_URL}/#/s/${teacherId}`;
  const QR_API = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(STUDENT_LINK)}`;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      setIsInitialLoading(true);
      try {
        const { data, error } = await supabase
          .from('class_sessions')
          .select('*')
          .eq('teacher_id', teacherId)
          .maybeSingle();
        
        if (error) throw error;

        if (data) {
          setSlots(data.slots || []);
          setActiveSlotId(data.active_slot_id);
        } else {
          const initialSlots = [{ id: Date.now().toString(), title: '', url: '' }];
          setSlots(initialSlots);
        }
      } catch (err) {
        console.error("데이터 로드 실패:", err);
      } finally {
        setIsInitialLoading(false);
      }
    };
    loadData();
  }, [teacherId]);

  // 공통 저장 로직
  const performSave = async (currentSlots: Slot[], currentActiveId: string | null) => {
    if (!teacherId) return;

    setIsSaving(true);
    setSaveError(null);

    const formattedSlots = currentSlots.map(slot => {
      let url = slot.url.trim();
      if (url && !/^https?:\/\//i.test(url)) {
        url = `https://${url}`;
      }
      return { ...slot, url };
    });

    const updateData = {
      slots: formattedSlots,
      active_slot_id: currentActiveId,
      updated_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase
        .from('class_sessions')
        .update(updateData)
        .eq('teacher_id', teacherId);

      if (error) {
        setSaveError(error.message);
      } else {
        setLastSavedAt(new Date());
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
      }
    } catch (err) {
      setSaveError("인터넷 연결을 확인하세요.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualSave = () => performSave(slots, activeSlotId);

  const addSlot = () => {
    if (slots.length >= 10) return;
    const newSlot: Slot = { id: Date.now().toString(), title: '', url: '' };
    setSlots(prev => [...prev, newSlot]);
  };

  const removeSlot = (id: string) => {
    const newSlots = slots.filter(s => s.id !== id);
    setSlots(newSlots);
    if (activeSlotId === id) setActiveSlotId(null);
  };

  const updateSlot = (id: string, key: 'title' | 'url', value: string) => {
    setSlots(prev => prev.map(s => s.id === id ? { ...s, [key]: value } : s));
  };

  const toggleActive = async (id: string) => {
    const nextActiveId = activeSlotId === id ? null : id;
    setActiveSlotId(nextActiveId);
    // 보내기 버튼 클릭 시 즉시 서버에 저장하여 학생들에게 전송
    await performSave(slots, nextActiveId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = slots.findIndex((i) => i.id === active.id);
      const newIndex = slots.findIndex((i) => i.id === over.id);
      setSlots((items) => arrayMove(items, oldIndex, newIndex));
    }
  };

  const copyStudentLink = () => {
    navigator.clipboard.writeText(STUDENT_LINK);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-sky-100 border-t-sky-500 rounded-full animate-spin"></div>
          <p className="text-slate-400 font-bold">수업 데이터를 동기화하고 있습니다...</p>
        </div>
      </div>
    );
  }

  const activeSlot = slots.find(s => s.id === activeSlotId);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      <div className="flex-1 p-6 lg:p-10 max-w-4xl mx-auto w-full flex flex-col">
        <header className="flex justify-between items-start mb-10">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">{username} 선생님의 교실</h1>
            <div className="text-slate-500 mt-1 flex items-center gap-3">
              실시간 URL 전송
              {isSaving ? (
                <span className="text-[10px] bg-sky-100 text-sky-600 px-2 py-0.5 rounded animate-pulse font-bold flex items-center gap-1">
                  <Save size={10} /> 서버 저장 중...
                </span>
              ) : lastSavedAt ? (
                <span className="text-[10px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded font-bold">
                  최근 저장: {lastSavedAt.toLocaleTimeString()}
                </span>
              ) : null}
              {saveError && (
                <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold flex items-center gap-1 animate-shake">
                  <AlertCircle size={10}/> 저장 실패: {saveError}
                </span>
              )}
            </div>
          </div>
          <button onClick={onLogout} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
            <LogOut size={24} />
          </button>
        </header>

        <div className="bg-sky-500 rounded-3xl p-6 text-white mb-8 shadow-xl shadow-sky-200 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-lg font-bold mb-2">학생들에게 이 주소를 알려주세요</h3>
            <div className="flex flex-col sm:flex-row items-center gap-3 bg-white/20 p-3 rounded-xl backdrop-blur-sm border border-white/20">
              <span className="flex-1 font-mono text-sm break-all leading-tight">
                {STUDENT_LINK}
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={copyStudentLink}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-1 text-sm font-bold"
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                  {copied ? '복사됨' : '복사'}
                </button>
                <button 
                  onClick={() => setShowQr(true)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-1 text-sm font-bold"
                >
                  <QrCode size={18} />
                  QR
                </button>
              </div>
            </div>
          </div>
          <div className="absolute -right-8 -bottom-8 opacity-20 transform rotate-12 pointer-events-none">
            <Zap size={160} />
          </div>
        </div>

        <div className="space-y-4 flex-1">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-slate-800">수업 링크 슬롯 ({slots.length}/10)</h2>
            <div className="flex gap-2">
              <button 
                onClick={handleManualSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-xl font-bold shadow-lg shadow-sky-100 hover:bg-sky-600 transition-all disabled:opacity-50"
              >
                <Save size={18} /> <span className="hidden sm:inline">저장하기</span>
              </button>
              <button 
                onClick={addSlot}
                disabled={slots.length >= 10}
                className="flex items-center gap-2 px-4 py-2 bg-white text-sky-500 border border-sky-100 rounded-xl font-bold shadow-sm hover:bg-sky-50 transition-all disabled:opacity-50"
              >
                <Plus size={18} /> <span className="hidden sm:inline">추가</span>
              </button>
            </div>
          </div>

          {slots.length === 0 ? (
            <div className="text-center py-20 bg-white border-2 border-dashed border-slate-200 rounded-[2rem]">
              <p className="text-slate-400 font-medium">'추가'를 눌러 링크를 만드세요.</p>
            </div>
          ) : (
            <DndContext 
              sensors={sensors} 
              collisionDetection={closestCenter} 
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={slots.map(s => s.id)} strategy={verticalListSortingStrategy}>
                {slots.map((slot) => (
                  <SortableSlotItem 
                    key={slot.id} 
                    slot={slot} 
                    isActive={activeSlotId === slot.id}
                    onRemove={() => removeSlot(slot.id)}
                    onUpdate={updateSlot}
                    onToggleActive={() => toggleActive(slot.id)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>

        <footer className="mt-12 py-8 border-t border-slate-200 text-center">
          <div className="mb-8 p-4 bg-red-50 rounded-2xl border border-red-100">
            <p className="text-red-600 text-[11px] font-bold leading-relaxed break-keep">
              ※ 주의: '보내기' 버튼 클릭 시 학생 기기에 즉시 반영됩니다. 잘못된 링크 전송으로 인한 책임은 사용자에게 있으므로 주소를 반드시 확인하시기 바랍니다.
            </p>
          </div>
          <div className="flex flex-col items-center gap-2 mb-4">
            <p className="text-slate-600 text-[11px] font-medium leading-relaxed">
              입력한 내용은 '저장하기' 버튼을 누르거나 '보내기'를 누를 때 서버에 기록됩니다.<br/>
              네트워크가 불안정할 경우 저장이 되지 않을 수 있으니 완료 메시지를 꼭 확인하세요.
            </p>
            <a href="mailto:sinjoppo@naver.com" className="text-sky-500 text-sm font-bold flex items-center gap-1 hover:underline mt-2">
              <Mail size={14} /> Contact: sinjoppo@naver.com
            </a>
          </div>
          <p className="text-slate-400 text-[10px] font-bold">
            ⓒ 2025. Kwon's class. All rights reserved.
          </p>
        </footer>
      </div>

      <aside className="hidden lg:flex w-full lg:w-96 bg-slate-100 border-l border-slate-200 p-8 flex-col items-center">
        <div className="flex items-center gap-2 mb-6 text-slate-500 font-bold uppercase tracking-wider text-sm">
          <Monitor size={16} /> 학생 화면 미리보기
        </div>
        
        <div className="relative w-full max-w-[280px] aspect-[9/18.5] bg-slate-900 rounded-[3rem] p-3 shadow-2xl border-[6px] border-slate-800">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-6 bg-slate-800 rounded-b-xl z-20"></div>
          <div className="w-full h-full bg-white rounded-[2.2rem] overflow-hidden relative">
            <div className="h-full flex flex-col">
              <div className="p-4 bg-white border-b border-slate-100 flex justify-between items-center">
                <div className="w-6 h-6 bg-sky-500 rounded-lg"></div>
                <div className="text-[10px] font-bold text-slate-400">GoSite</div>
                <div className="w-6 h-6"></div>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                {activeSlot ? (
                  <>
                    <div className="w-16 h-16 bg-sky-100 text-sky-500 rounded-2xl flex items-center justify-center mb-4">
                      <ExternalLink size={32} />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 mb-2 truncate w-full">{activeSlot.title || '제목 없음'}</h4>
                    <p className="text-[10px] text-slate-400 mb-6 truncate w-full px-2">{activeSlot.url}</p>
                    <div className="w-full py-3 bg-sky-500 text-white rounded-xl text-[10px] font-bold shadow-lg shadow-sky-100">
                      수업 입장하기
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-slate-100 text-slate-300 rounded-full flex items-center justify-center mb-4">
                      <Zap size={32} />
                    </div>
                    <p className="text-[10px] text-slate-400">선생님의 안내를 <br/>기다리고 있어요</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {showToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-toast">
          <div className="bg-sky-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 font-bold">
            <CheckCircle2 size={18} />
            수업 링크가 저장되었습니다.
          </div>
        </div>
      )}

      {showQr && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-[3rem] p-8 max-w-sm w-full relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowQr(false)}
              className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X size={24} className="text-slate-400" />
            </button>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-800 mb-1">수업 QR 코드</h2>
              <p className="text-slate-500 text-sm mb-6">학생들이 카메라로 스캔하여 접속합니다.</p>
              
              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 mb-6 flex items-center justify-center">
                <img src={QR_API} alt="QR Code" className="w-full h-auto rounded-lg shadow-sm" />
              </div>
              
              <button 
                onClick={() => setShowQr(false)}
                className="w-full py-4 bg-sky-500 text-white rounded-2xl font-bold text-lg"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SortableSlotItem: React.FC<{ 
  slot: Slot; 
  isActive: boolean;
  onRemove: () => void;
  onUpdate: (id: string, key: 'title' | 'url', value: string) => void;
  onToggleActive: () => void;
}> = ({ slot, isActive, onRemove, onUpdate, onToggleActive }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: slot.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`bg-white border p-4 rounded-2xl flex items-center gap-4 transition-all shadow-sm ${isActive ? 'border-sky-500 ring-2 ring-sky-100' : 'border-slate-200'}`}
    >
      <div {...attributes} {...listeners} className="drag-handle text-slate-300 hover:text-slate-400 p-1">
        <GripVertical size={20} />
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
        <input 
          type="text" 
          placeholder="사이트 제목 (예: 캔바 학습지)" 
          className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm outline-none focus:border-sky-300 transition-colors"
          value={slot.title}
          onChange={(e) => onUpdate(slot.id, 'title', e.target.value)}
        />
        <input 
          type="url" 
          placeholder="https://..." 
          className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm outline-none focus:border-sky-300 transition-colors"
          value={slot.url}
          onChange={(e) => onUpdate(slot.id, 'url', e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={onToggleActive}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
            isActive 
              ? 'bg-sky-500 text-white shadow-lg shadow-sky-200 scale-105' 
              : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
          }`}
        >
          <Send size={16} /> {isActive ? '방송중' : '보내기'}
        </button>
        <button 
          onClick={onRemove}
          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
        >
          <Trash2 size={20} />
        </button>
      </div>
    </div>
  );
};

export default DashboardPage;
