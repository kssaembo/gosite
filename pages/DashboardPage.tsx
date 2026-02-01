
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
  CheckCircle2,
  Printer
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
  const [qrCustomText, setQrCustomText] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingQrText, setIsSavingQrText] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showQr, setShowQr] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [showToast, setShowToast] = useState(false);

  // 학급 주소를 배포된 Vercel 도메인으로 고정
  const BASE_URL = 'https://gosite-theta.vercel.app';
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
          // @ts-ignore
          setQrCustomText(data.qr_custom_text || '');
        } else {
          setSlots([{ id: Date.now().toString(), title: '', url: '' }]);
        }
      } catch (err) {
        console.error("데이터 로드 실패:", err);
      } finally {
        setIsInitialLoading(false);
      }
    };
    loadData();
  }, [teacherId]);

  const performSave = async (currentSlots: Slot[], currentActiveId: string | null, customText: string) => {
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

    try {
      const { error } = await supabase
        .from('class_sessions')
        .update({
          slots: formattedSlots,
          active_slot_id: currentActiveId,
          qr_custom_text: customText,
          updated_at: new Date().toISOString()
        })
        .eq('teacher_id', teacherId);

      if (error) {
        setSaveError(error.message);
        console.error("저장 에러 상세:", error);
      } else {
        setLastSavedAt(new Date());
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
      }
    } catch (err) {
      setSaveError("네트워크 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualSave = () => performSave(slots, activeSlotId, qrCustomText);

  const handleSaveQrText = async () => {
    setIsSavingQrText(true);
    await performSave(slots, activeSlotId, qrCustomText);
    setIsSavingQrText(false);
  };

  const handlePrint = () => {
    // Sandbox Iframe 내에서 window.print()가 막힐 경우를 대비해 새 창(Popup) 방식 사용
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("팝업창이 차단되어 인쇄를 시작할 수 없습니다. 팝업 허용을 해주세요.");
      return;
    }

    const gridItems = Array.from({ length: 30 }).map(() => `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; border: 1px solid #e2e8f0; padding: 10px; box-sizing: border-box;">
        <img src="${QR_API}" style="width: 100%; height: auto; aspect-ratio: 1/1;" />
        <p style="font-size: 10px; font-weight: bold; font-family: sans-serif; margin-top: 5px; text-align: center; color: #1e293b; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.2;">
          ${qrCustomText || `${username} 선생님`}
        </p>
      </div>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>GoSite QR 인쇄 - ${username} 선생님</title>
          <style>
            @page { size: A4; margin: 10mm; }
            body { margin: 0; padding: 0; background: white; }
            .grid {
              display: grid;
              grid-template-columns: repeat(5, 1fr);
              grid-template-rows: repeat(6, 1fr);
              gap: 10px;
              width: 100%;
              height: calc(297mm - 20mm);
            }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="grid">
            ${gridItems}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

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
    await performSave(slots, nextActiveId, qrCustomText);
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
    <>
      <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row print:hidden">
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
              <CheckCircle2 size={18} /> 수업 설정이 저장되었습니다.
            </div>
          </div>
        )}

        {showQr && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-[3rem] p-8 max-w-sm w-full relative">
              <button onClick={() => setShowQr(false)} className="absolute top-6 right-6 p-2 text-slate-400"><X size={24} /></button>
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-6">수업 QR 코드</h2>
                <img src={QR_API} alt="QR Code" className="w-full h-auto rounded-lg mb-4 shadow-md" />
                
                <div className="mb-6 flex gap-2">
                  <input 
                    type="text" 
                    placeholder="QR 하단 텍스트 입력"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-sky-500"
                    value={qrCustomText}
                    onChange={(e) => setQrCustomText(e.target.value)}
                  />
                  <button 
                    onClick={handleSaveQrText}
                    disabled={isSavingQrText}
                    className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-1 active:scale-95 transition-all"
                  >
                    {isSavingQrText ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />} 저장
                  </button>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setShowQr(false)} className="flex-1 py-4 bg-slate-200 text-slate-600 rounded-2xl font-bold">닫기</button>
                  <button onClick={handlePrint} className="flex-1 py-4 bg-sky-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
                    <Printer size={20} /> 출력하기
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 인쇄 전용 영역 - 새 탭 방식 사용으로 보조적인 용도로 남겨둠 */}
      <div className="hidden print:block bg-white">
        <div className="grid grid-cols-5 gap-4 p-4 w-full h-full border-none">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center justify-center border border-slate-200 p-2 break-inside-avoid">
              <img src={QR_API} alt="QR" className="w-full aspect-square" />
              <p className="text-[10px] font-bold text-slate-900 mt-1 text-center line-clamp-2">
                {qrCustomText || `${username} 선생님`}
              </p>
            </div>
          ))}
        </div>
        <style>{`
          @media print {
            @page {
              size: A4;
              margin: 10mm;
            }
            body {
              background: white !important;
            }
            .print-hidden {
              display: none !important;
            }
          }
        `}</style>
      </div>
    </>
  );
};

const RefreshCw = ({ size, className }: { size?: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M16 21v-5h5" />
  </svg>
);

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
