
import React, { useState, useEffect } from 'react';
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
  // Fix: Added Zap icon to imports
  Zap
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
  const [slots, setSlots] = useState<Slot[]>([{ id: '1', title: '', url: '' }]);
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Initial Data Load
  useEffect(() => {
    const loadData = async () => {
      // Mocking DB load or fetch from Supabase
      const { data, error } = await supabase
        .from('class_sessions')
        .select('*')
        .eq('teacher_id', teacherId)
        .single();
      
      if (data) {
        setSlots(data.slots || []);
        setActiveSlotId(data.active_slot_id);
      }
    };
    loadData();
  }, [teacherId]);

  const saveToSupabase = async (newSlots: Slot[], activeId: string | null) => {
    setIsSaving(true);
    const { error } = await supabase
      .from('class_sessions')
      .upsert({
        teacher_id: teacherId,
        username,
        slots: newSlots,
        active_slot_id: activeId,
        updated_at: new Date().toISOString()
      }, { onConflict: 'teacher_id' });

    if (error) console.error("Save error:", error);
    setIsSaving(false);
  };

  const addSlot = () => {
    if (slots.length >= 10) return;
    const newSlot: Slot = { id: Date.now().toString(), title: '', url: '' };
    const updated = [...slots, newSlot];
    setSlots(updated);
    saveToSupabase(updated, activeSlotId);
  };

  const removeSlot = (id: string) => {
    const updated = slots.filter(s => s.id !== id);
    let newActiveId = activeSlotId;
    if (activeSlotId === id) newActiveId = null;
    setSlots(updated);
    setActiveSlotId(newActiveId);
    saveToSupabase(updated, newActiveId);
  };

  const updateSlot = (id: string, key: 'title' | 'url', value: string) => {
    const updated = slots.map(s => s.id === id ? { ...s, [key]: value } : s);
    setSlots(updated);
  };

  const toggleActive = (id: string) => {
    const newActiveId = activeSlotId === id ? null : id;
    setActiveSlotId(newActiveId);
    saveToSupabase(slots, newActiveId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSlots((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const updated = arrayMove(items, oldIndex, newIndex);
        saveToSupabase(updated, activeSlotId);
        return updated;
      });
    }
  };

  const copyStudentLink = () => {
    const url = `${window.location.origin}/#/s/${teacherId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeSlot = slots.find(s => s.id === activeSlotId);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Main Panel */}
      <div className="flex-1 p-6 lg:p-10 max-w-4xl mx-auto w-full">
        <header className="flex justify-between items-start mb-10">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">{username} 선생님의 교실</h1>
            <p className="text-slate-500 mt-1 flex items-center gap-2">
              수업 도구 관리 및 실시간 전송
              {isSaving && <span className="text-xs bg-sky-100 text-sky-600 px-2 py-0.5 rounded animate-pulse">저장 중...</span>}
            </p>
          </div>
          <button onClick={onLogout} className="text-slate-400 hover:text-red-500 transition-colors">
            <LogOut size={24} />
          </button>
        </header>

        {/* Info & Link */}
        <div className="bg-sky-500 rounded-3xl p-6 text-white mb-8 shadow-xl shadow-sky-200 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-lg font-bold mb-2">학생들에게 이 주소를 알려주세요</h3>
            <div className="flex items-center gap-3 bg-white/20 p-3 rounded-xl backdrop-blur-sm border border-white/20">
              <span className="flex-1 font-mono text-sm overflow-hidden truncate">
                {window.location.origin}/#/s/{teacherId}
              </span>
              <button 
                onClick={copyStudentLink}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-1 text-sm font-bold"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? '복사됨' : '복사'}
              </button>
            </div>
          </div>
          <div className="absolute -right-8 -bottom-8 opacity-20 transform rotate-12">
            <Zap size={160} />
          </div>
        </div>

        {/* Slot List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-slate-800">수업 링크 슬롯 ({slots.length}/10)</h2>
            <button 
              onClick={addSlot}
              disabled={slots.length >= 10}
              className="flex items-center gap-2 px-4 py-2 bg-white text-sky-500 border border-sky-100 rounded-xl font-bold shadow-sm hover:bg-sky-50 transition-all disabled:opacity-50"
            >
              <Plus size={18} /> 추가
            </button>
          </div>

          <DndContext 
            sensors={sensors} 
            collisionDetection={closestCenter} 
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={slots} strategy={verticalListSortingStrategy}>
              {slots.map((slot) => (
                <SortableSlotItem 
                  key={slot.id} 
                  slot={slot} 
                  isActive={activeSlotId === slot.id}
                  onRemove={() => removeSlot(slot.id)}
                  onUpdate={updateSlot}
                  onToggleActive={() => toggleActive(slot.id)}
                  onBlur={() => saveToSupabase(slots, activeSlotId)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </div>

      {/* Right Sidebar: Mobile Preview */}
      <aside className="w-full lg:w-96 bg-slate-100 border-l border-slate-200 p-8 flex flex-col items-center">
        <div className="flex items-center gap-2 mb-6 text-slate-500 font-bold uppercase tracking-wider text-sm">
          <Monitor size={16} /> 학생 화면 미리보기
        </div>
        
        {/* Mobile Frame */}
        <div className="relative w-full max-w-[280px] aspect-[9/18.5] bg-slate-900 rounded-[3rem] p-3 shadow-2xl border-[6px] border-slate-800">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-6 bg-slate-800 rounded-b-xl z-20"></div>
          <div className="w-full h-full bg-white rounded-[2.2rem] overflow-hidden relative">
            {/* Student Preview Content */}
            <div className="h-full flex flex-col">
              <div className="p-4 bg-white border-b border-slate-100 flex justify-between items-center">
                <div className="w-6 h-6 bg-sky-500 rounded-lg"></div>
                <div className="text-[10px] font-bold text-slate-400">ClassLink</div>
                <div className="w-6 h-6"></div>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                {activeSlot ? (
                  <>
                    <div className="w-16 h-16 bg-sky-100 text-sky-500 rounded-2xl flex items-center justify-center mb-4">
                      <ExternalLink size={32} />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 mb-2">{activeSlot.title || '제목 없음'}</h4>
                    <p className="text-[10px] text-slate-400 mb-6 truncate w-full">{activeSlot.url}</p>
                    <div className="w-full py-3 bg-sky-500 text-white rounded-xl text-[10px] font-bold shadow-lg shadow-sky-100">
                      수업 입장하기
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-slate-100 text-slate-300 rounded-full flex items-center justify-center mb-4 animate-pulse">
                      <Zap size={32} />
                    </div>
                    <p className="text-[10px] text-slate-400">선생님의 안내를 <br/>기다리고 있어요</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <p className="mt-6 text-xs text-slate-400 text-center">
          * 실제 학생 기기에서는 위와 같이 표시됩니다.
        </p>
      </aside>
    </div>
  );
};

const SortableSlotItem: React.FC<{ 
  slot: Slot; 
  isActive: boolean;
  onRemove: () => void;
  onUpdate: (id: string, key: 'title' | 'url', value: string) => void;
  onToggleActive: () => void;
  onBlur: () => void;
}> = ({ slot, isActive, onRemove, onUpdate, onToggleActive, onBlur }) => {
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
      <div {...attributes} {...listeners} className="drag-handle text-slate-300 hover:text-slate-400">
        <GripVertical size={20} />
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
        <input 
          type="text" 
          placeholder="사이트 제목 (예: 캔바 학습지)" 
          className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm outline-none focus:border-sky-300 transition-colors"
          value={slot.title}
          onChange={(e) => onUpdate(slot.id, 'title', e.target.value)}
          onBlur={onBlur}
        />
        <input 
          type="url" 
          placeholder="https://..." 
          className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm outline-none focus:border-sky-300 transition-colors"
          value={slot.url}
          onChange={(e) => onUpdate(slot.id, 'url', e.target.value)}
          onBlur={onBlur}
        />
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={onToggleActive}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
            isActive 
              ? 'bg-sky-500 text-white shadow-lg shadow-sky-200' 
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
