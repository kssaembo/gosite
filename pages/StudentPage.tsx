
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { ExternalLink, Download, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Slot, TeacherData } from '../types';

const StudentPage: React.FC = () => {
  const { teacherId } = useParams<{ teacherId: string }>();
  const [data, setData] = useState<TeacherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const lastRedirectedSlotId = useRef<string | null>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert('이미 설치되어 있거나, 브라우저 메뉴에서 "홈 화면에 추가"를 눌러주세요.');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  useEffect(() => {
    if (!teacherId) return;

    const fetchSession = async () => {
      const { data: session } = await supabase
        .from('class_sessions')
        .select('*')
        .eq('teacher_id', teacherId)
        .single();
      
      if (session) {
        setData(session);
        if (session.active_slot_id) {
          lastRedirectedSlotId.current = session.active_slot_id;
        }
      }
      setLoading(false);
    };

    fetchSession();

    // 실시간 채널 구독 (안정성 강화)
    const channel = supabase
      .channel(`realtime:class_sessions:${teacherId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'class_sessions',
        filter: `teacher_id=eq.${teacherId}`
      }, (payload) => {
        const newData = payload.new as TeacherData;
        
        // payload.new에 전체 정보가 없을 경우를 대비해 기존 데이터와 병합
        setData(prev => prev ? { ...prev, ...newData } : newData);

        if (newData.active_slot_id && newData.active_slot_id !== lastRedirectedSlotId.current) {
          // 최신 슬롯 리스트 확보 (가끔 payload에 slots가 누락될 수 있음)
          const slotsToSearch = newData.slots || data?.slots || [];
          const activeSlot = slotsToSearch.find(s => s.id === newData.active_slot_id);
          
          if (activeSlot && activeSlot.url) {
            lastRedirectedSlotId.current = newData.active_slot_id;
            setTimeout(() => {
              window.location.href = activeSlot.url;
            }, 500);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teacherId, data?.slots]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-sky-100 border-t-sky-500 rounded-full animate-spin"></div>
          <p className="text-slate-400 font-bold animate-pulse">선생님 교실에 입장하는 중...</p>
        </div>
      </div>
    );
  }

  const activeSlot = data?.slots.find(s => s.id === data.active_slot_id);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-6 overflow-hidden">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center text-white font-bold">G</div>
          <span className="text-xl font-bold text-slate-800 tracking-tight">GoSite</span>
        </div>
        <div className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[11px] font-bold text-slate-500 shadow-sm">
          {data?.username || teacherId} 선생님
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        {activeSlot ? (
          <div className="w-full max-w-sm animate-in zoom-in-95 duration-500">
            <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 text-center border border-slate-100 flex flex-col items-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 text-sky-500 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                <Zap size={120} />
              </div>

              <div className="w-24 h-24 bg-sky-100 text-sky-500 rounded-[2rem] flex items-center justify-center mb-8 ring-8 ring-sky-50 relative z-10 animate-bounce-slow">
                <ExternalLink size={48} />
              </div>
              
              <div className="relative z-10 w-full">
                <h2 className="text-2xl font-black text-slate-800 mb-2 leading-tight break-keep">
                  {activeSlot.title || '새로운 학습 페이지'}
                </h2>
                <p className="text-slate-400 text-sm mb-10">
                  잠시 후 자동으로 이동합니다...
                </p>

                <a 
                  href={activeSlot.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full py-5 bg-sky-500 text-white rounded-[1.5rem] font-black text-xl shadow-lg shadow-sky-200 hover:bg-sky-600 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  지금 입장하기 <ExternalLink size={24} />
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-6">
            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mx-auto shadow-xl border border-slate-100 relative">
              <Zap size={48} className="text-slate-200 animate-pulse" />
              <div className="absolute inset-0 border-4 border-sky-100 border-t-sky-500 rounded-full animate-spin opacity-20"></div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">선생님의 안내를 기다려주세요</h2>
              <p className="text-slate-400 text-sm">준비가 되면 화면이 즉시 바뀝니다.</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-12 space-y-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 bg-emerald-100 text-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Download size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-slate-800">앱으로 설치하기</h4>
            <p className="text-[11px] text-slate-500 truncate">더 빠르게 수업에 참여할 수 있습니다.</p>
          </div>
          <button 
            onClick={handleInstallClick}
            className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold whitespace-nowrap hover:bg-emerald-600 transition-colors shadow-sm"
          >
            설치
          </button>
        </div>

        <div className="flex flex-col items-center gap-1 text-[10px] text-slate-300 font-bold uppercase tracking-widest pb-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse"></span> 실시간 연결됨</span>
          </div>
          <span>ⓒ 2025. Kwon's class. All rights reserved.</span>
        </div>
      </div>
      
      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default StudentPage;
