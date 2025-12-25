
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { ExternalLink, Info, Download, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Slot, TeacherData } from '../types';

const StudentPage: React.FC = () => {
  const { teacherId } = useParams<{ teacherId: string }>();
  const [data, setData] = useState<TeacherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const lastRedirectedSlotId = useRef<string | null>(null);

  // 1. PWA 설치 프롬프트 캡처
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

  // 2. 실시간 데이터 및 자동 리다이렉트
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
        // 초기 로드 시에도 활성화된 슬롯이 있다면 기록 (자동 이동은 사용자 경험상 첫 로드엔 버튼으로 제공)
        if (session.active_slot_id) {
          lastRedirectedSlotId.current = session.active_slot_id;
        }
      }
      setLoading(false);
    };

    fetchSession();

    const channel = supabase
      .channel(`session:${teacherId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'class_sessions',
        filter: `teacher_id=eq.${teacherId}`
      }, (payload) => {
        const newData = payload.new as TeacherData;
        setData(newData);

        // 자동 리다이렉트 로직: 새로운 활성 슬롯이 감지되면 즉시 이동
        if (newData.active_slot_id && newData.active_slot_id !== lastRedirectedSlotId.current) {
          const activeSlot = newData.slots.find(s => s.id === newData.active_slot_id);
          if (activeSlot && activeSlot.url) {
            lastRedirectedSlotId.current = newData.active_slot_id;
            // 약간의 딜레이를 주어 UI 변화를 인지시킨 후 이동
            setTimeout(() => {
              window.location.href = activeSlot.url;
            }, 800);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teacherId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-sky-100 border-t-sky-500 rounded-full animate-spin"></div>
          <p className="text-slate-400 font-bold animate-pulse">선생님 교실을 찾는 중...</p>
        </div>
      </div>
    );
  }

  const activeSlot = data?.slots.find(s => s.id === data.active_slot_id);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-6 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center text-white font-bold">G</div>
          <span className="text-xl font-bold text-slate-800">GoSite</span>
        </div>
        <div className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-500 shadow-sm">
          {data?.username || teacherId} 선생님
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {activeSlot ? (
          <div className="w-full max-w-sm animate-in zoom-in-95 duration-500">
            <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 text-center border border-slate-100 flex flex-col items-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 text-sky-500 opacity-10 group-hover:opacity-20 transition-opacity">
                <Zap size={120} />
              </div>

              <div className="w-24 h-24 bg-sky-100 text-sky-500 rounded-[2rem] flex items-center justify-center mb-8 ring-8 ring-sky-50 relative z-10">
                <ExternalLink size={48} />
              </div>
              
              <div className="relative z-10 w-full">
                <h2 className="text-2xl font-black text-slate-800 mb-2 leading-tight break-keep">
                  {activeSlot.title || '선생님이 보낸 페이지'}
                </h2>
                <p className="text-slate-400 text-sm mb-10 truncate w-full px-4">
                  잠시 후 자동으로 이동합니다...
                </p>

                <a 
                  href={activeSlot.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full py-5 bg-sky-500 text-white rounded-[1.5rem] font-black text-xl shadow-lg shadow-sky-200 hover:bg-sky-600 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  지금 이동하기 <ExternalLink size={24} />
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
              <p className="text-slate-400">준비가 되면 화면이 즉시 바뀝니다.</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info / PWA Prompt */}
      <div className="mt-12 space-y-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 bg-emerald-100 text-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Download size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-slate-800 uppercase">GoSite 앱 설치</h4>
            <p className="text-xs text-slate-500 truncate">홈 화면에 추가하여 더 빠르게 접속하세요.</p>
          </div>
          <button 
            onClick={handleInstallClick}
            className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold whitespace-nowrap hover:bg-emerald-600 transition-colors"
          >
            앱 설치하기
          </button>
        </div>

        <div className="flex justify-center gap-6 text-[10px] text-slate-400 font-bold uppercase tracking-widest pb-4">
          <span className="flex items-center gap-1"><Zap size={10} className="text-sky-500" /> 실시간 동기화 중</span>
          <span>© 2024 GoSite</span>
        </div>
      </div>
    </div>
  );
};

export default StudentPage;
