
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

  const BASE_URL = window.location.origin;
  const STUDENT_LINK = `${BASE_URL}/#/s/${teacherId}`;
  const QR_API = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(STUDENT_LINK)}`;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      <div className="flex-1 p-6 lg:p-10 max-w-4xl mx-auto w-full flex flex-col">
        <header className="flex justify-between items-start mb-10">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">{username} 선생님</h1>
            <div className="text-slate-500 mt-1 flex items-center gap-3 text-sm">
              실시간 URL 전송
              {isSaving && <span className="text-[10px] bg-sky-100 text-sky-600 px-2 py-0.5 rounded animate-pulse font-bold">서버 저장 중...</span>}
              {lastSavedAt && !isSaving && <span className="text-[10px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded font-bold">저장 완료</span>}
            </div>
          </div>
          <button onClick={onLogout} className="p-2 text-slate-400 hover:text-red-500 transition-all"><LogOut size={24} /></button>
        </header>

        <div className="bg-sky-500 rounded-3xl p-6 text-white mb-8 shadow-xl relative overflow-hidden">
          <h3 className="text-lg font-bold mb-2">학생들에게 이 주소를 알려주세요</h3>
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-white/20 p-3 rounded-xl backdrop-blur-sm border border-white/20">
            <span className="flex-1 font-mono text-xs break-all leading-tight opacity-90">{STUDENT_LINK}</span>
            <div className="flex gap-2 w-full sm:w-auto">
              <button onClick={copyStudentLink} className="flex-1 sm:flex-none p-2 hover:bg-white/20 rounded-lg flex items-center justify-center gap-1 text-sm font-bold">
                {copied ? <Check size={18} /> : <Copy size={18} />} {copied ? '복사됨' : '복사'}
              </button>
              <button onClick={() => setShowQr(true)} className="flex-1 sm:flex-none p-2 hover:bg-white/20 rounded-lg flex items-center justify-center gap-1 text-sm font-bold">
                <QrCode size={18} /> QR
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4 flex-1">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-slate-800">수업 링크 슬롯 ({slots.length}/10)</h2>
            <div className="flex gap-2">
              <button onClick={handleManualSave} disabled={isSaving} className="flex items-center gap-2 px-3 py-2 bg-sky-500 text-white rounded-xl font-bold hover:bg-sky-600 transition-all shadow-lg shadow-sky-100">
                <Save size={18} /> <span className="hidden sm:inline">저장하기</span>
              </button>
              <button onClick={addSlot} disabled={slots.length >= 10} className="flex items-center gap-2 px-3 py-2 bg-white text-sky-500 border border-sky-100 rounded-xl font-bold hover:bg-sky-50 transition-all shadow-sm">
                <Plus size={18} /> <span className="hidden sm:inline">추가</span>
              </button>
            </div>
          </div>

          {slots.length === 0 ? (
            <div className="text-center py-20 bg-white border-2 border-dashed border-slate-200 rounded-[2rem]">
              <p className="text-slate-400 font-medium">'추가'를 눌러 링크를 만드세요.</p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
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
            <p className="text-red-600 text-[10px] font-bold break-keep">※ 주의: '보내기' 버튼 클릭 시 학생 화면에 즉시 팝업이 전송됩니다.</p>
          </div>
          <p className="text-slate-400 text-[10px] font-bold tracking-widest uppercase">ⓒ 2025. Kwon's class. All rights reserved.</p>
        </footer>
      </div>

      {showToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-toast">
          <div className="bg-sky-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 font-bold">
            <CheckCircle2 size={18} /> 수업 링크가 저장되었습니다.
          </div>
        </div>
      )}

      {showQr && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-[3rem] p-8 max-w-sm w-full relative">
            <button onClick={() => setShowQr(false)} className="absolute top-6 right-6 p-2 text-slate-400"><X size={24} /></button>
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-6">수업 QR 코드</h2>
              <img src={QR_API} alt="QR Code" className="w-full h-auto rounded-lg mb-6 shadow-md" />
              <button onClick={() => setShowQr(false)} className="w-full py-4 bg-sky-500 text-white rounded-2xl font-bold active:scale-95 transition-all">닫기</button>
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
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className={`bg-white border p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center gap-4 shadow-sm transition-all ${isActive ? 'border-sky-500 ring-4 ring-sky-50' : 'border-slate-200'}`}>
      <div className="flex items-center gap-2">
        <div {...attributes} {...listeners} className="drag-handle text-slate-300 p-2"><GripVertical size={20} /></div>
        <div className="flex-1 md:hidden">
          <input type="text" placeholder="제목" className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm" value={slot.title} onChange={(e) => onUpdate(slot.id, 'title', e.target.value)} />
        </div>
      </div>
      <div className="hidden md:block flex-[0.5]">
        <input type="text" placeholder="제목" className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm" value={slot.title} onChange={(e) => onUpdate(slot.id, 'title', e.target.value)} />
      </div>
      <div className="flex-1">
        <input type="url" placeholder="주소" className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm" value={slot.url} onChange={(e) => onUpdate(slot.id, 'url', e.target.value)} />
      </div>
      <div className="flex items-center justify-between gap-2 mt-2 md:mt-0">
        <button onClick={onToggleActive} className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm active:scale-95 ${isActive ? 'bg-sky-500 text-white shadow-sky-100' : 'bg-slate-100 text-slate-500'}`}>
          <Send size={16} /> {isActive ? '방송중' : '보내기'}
        </button>
        <button onClick={onRemove} className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={20} /></button>
      </div>
    </div>
  );
};

export default DashboardPage;
