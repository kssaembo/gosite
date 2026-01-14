
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { ExternalLink, Download, Zap, Copy, Check, Bell, AlertTriangle, Settings, Info, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Slot, TeacherData } from '../types';

const StudentPage: React.FC = () => {
  const { teacherId } = useParams<{ teacherId: string }>();
  const [data, setData] = useState<TeacherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [isPopupBlocked, setIsPopupBlocked] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  
  const lastActiveSlotId = useRef<string | null>(null);

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

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tryOpenPopup = (url: string) => {
    const win = window.open(url, '_blank');
    if (!win || win.closed || typeof win.closed === 'undefined') {
      setIsPopupBlocked(true);
      return false;
    }
    setIsPopupBlocked(false);
    return true;
  };

  const fetchSession = async () => {
    if (!teacherId) return;
    try {
      const { data: session } = await supabase
        .from('class_sessions')
        .select('*')
        .eq('teacher_id', teacherId)
        .single();
      
      if (session) {
        // 새로운 링크 감지 로직 (2번 모델: 자동 새 탭)
        if (session.active_slot_id && session.active_slot_id !== lastActiveSlotId.current) {
          const slot = session.slots.find((s: Slot) => s.id === session.active_slot_id);
          if (slot?.url) {
            tryOpenPopup(slot.url);
          }
          lastActiveSlotId.current = session.active_slot_id;
        } else if (!session.active_slot_id) {
          lastActiveSlotId.current = null;
          setIsPopupBlocked(false);
        }
        setData(session);
      }
    } catch (err) {
      console.error("데이터 로드 오류:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!teacherId) return;
    localStorage.setItem('last_student_teacher_id', teacherId);
    fetchSession();

    const channel = supabase
      .channel(`student_realtime_${teacherId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'class_sessions',
        filter: `teacher_id=eq.${teacherId}`
      }, () => {
        fetchSession();
      })
      .subscribe();

    const pollInterval = setInterval(fetchSession, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [teacherId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-sky-100 border-t-sky-500 rounded-full animate-spin"></div>
          <p className="text-slate-400 font-bold">선생님 교실에 입장하는 중...</p>
        </div>
      </div>
    );
  }

  const activeSlot = data?.slots.find(s => s.id === data.active_slot_id);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-6 overflow-hidden relative">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center text-white font-bold">G</div>
          <span className="text-xl font-bold text-slate-800 tracking-tight">GoSite</span>
        </div>
        <div className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[11px] font-bold text-slate-500 shadow-sm flex items-center gap-1">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          {data?.username || teacherId} 선생님
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        {activeSlot ? (
          <div className="w-full max-w-sm animate-in zoom-in-95 duration-500">
            {isPopupBlocked && (
              <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-[1.5rem] p-4 flex flex-col items-center text-center animate-shake">
                <AlertTriangle className="text-red-500 mb-2" size={32} />
                <h3 className="font-black text-red-600 mb-1 leading-tight">팝업이 차단되었습니다!</h3>
                <p className="text-red-500 text-[11px] font-bold mb-3">수업 페이지가 자동으로 열리지 않았습니다.</p>
                <button 
                  onClick={() => tryOpenPopup(activeSlot.url)}
                  className="w-full py-3 bg-red-500 text-white rounded-xl font-black text-sm shadow-lg shadow-red-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  수동으로 열기 <ExternalLink size={16} />
                </button>
                <button 
                  onClick={() => setShowGuide(true)}
                  className="mt-2 text-xs text-red-400 font-bold underline underline-offset-2"
                >
                  Chrome 팝업 차단 해제 방법 보기
                </button>
              </div>
            )}

            <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 text-center border border-slate-100 flex flex-col items-center relative overflow-hidden">
              <div className="w-20 h-20 bg-sky-100 text-sky-500 rounded-[1.5rem] flex items-center justify-center mb-6 ring-8 ring-sky-50 animate-bounce-slow">
                <ExternalLink size={40} />
              </div>
              
              <div className="w-full">
                <h2 className="text-xl font-black text-slate-800 mb-2 break-keep">
                  {activeSlot.title || '수업 진행 중'}
                </h2>
                <p className="text-slate-400 text-xs mb-8">수업 페이지가 새로운 탭에서 열렸습니다.<br/>화면이 안 보이면 아래 버튼을 누르세요.</p>

                <a 
                  href={activeSlot.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full py-4 bg-sky-500 text-white rounded-2xl font-black text-lg shadow-lg shadow-sky-200 hover:bg-sky-600 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  수업 페이지 이동 <ExternalLink size={20} />
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-8 w-full max-w-sm">
            <div className="relative mx-auto w-32 h-32">
              <div className="absolute inset-0 bg-sky-100 rounded-full animate-ping opacity-20"></div>
              <div className="relative w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-xl border border-slate-100">
                <Zap size={48} className="text-sky-500 animate-pulse" />
              </div>
            </div>
            
            <div className="space-y-3">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">선생님을 기다리고 있어요</h2>
              <p className="text-slate-400 text-sm leading-relaxed px-4">선생님이 링크를 보내면<br/><span className="text-sky-500 font-black">자동으로 새 창이 열립니다.</span></p>
            </div>

            <div className="grid grid-cols-2 gap-3 px-4">
               <button 
                onClick={() => setShowGuide(true)}
                className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-slate-200 hover:border-sky-300 transition-all shadow-sm group"
              >
                <div className="w-10 h-10 bg-sky-50 text-sky-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><Settings size={20} /></div>
                <span className="text-[10px] font-black text-slate-500">팝업 차단 해제</span>
              </button>
              <button 
                onClick={copyUrl}
                className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all shadow-sm group"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-110 ${copied ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-500'}`}>
                  {copied ? <Check size={20} /> : <Copy size={20} />}
                </div>
                <span className="text-[10px] font-black text-slate-500">{copied ? '복사완료' : '교실 주소 복사'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Chrome 팝업 차단 해제 가이드 모달 */}
      {showGuide && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowGuide(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-all"><X size={24} /></button>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-sky-100 text-sky-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Info size={32} />
              </div>
              <h2 className="text-xl font-black text-slate-800">Chrome 팝업 허용 방법</h2>
              <p className="text-slate-400 text-[11px] mt-1">원활한 수업 진행을 위해 팝업을 허용해주세요.</p>
            </div>

            <div className="space-y-4 text-left">
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                <p className="text-xs text-slate-600 leading-tight pt-1">주소창 오른쪽의 <span className="font-bold text-red-500">[팝업 차단됨]</span> 아이콘을 클릭합니다.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                <p className="text-xs text-slate-600 leading-tight pt-1"><span className="font-bold">[{window.location.host}의 팝업 및 리디렉션을 항상 허용]</span>을 선택합니다.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
                <p className="text-xs text-slate-600 leading-tight pt-1"><span className="font-bold">[완료]</span> 버튼을 누르고 페이지를 기다려주세요.</p>
              </div>
              
              <div className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <p className="text-[10px] text-amber-700 font-bold leading-relaxed">
                  ※ 아이폰(Safari)의 경우: 설정 > Safari > [팝업 차단] 스위치를 꺼주세요.
                </p>
              </div>
            </div>

            <button 
              onClick={() => setShowGuide(false)}
              className="w-full mt-8 py-4 bg-sky-500 text-white rounded-2xl font-black text-lg active:scale-95 transition-all shadow-lg shadow-sky-100"
            >
              알겠습니다!
            </button>
          </div>
        </div>
      )}

      <div className="mt-8 space-y-3 pb-4">
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-4 border border-slate-100 flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-100 text-emerald-500 rounded-xl flex items-center justify-center"><Download size={20} /></div>
          <div className="flex-1">
            <h4 className="text-[11px] font-black text-slate-800">앱으로 설치하기</h4>
            <p className="text-[10px] text-slate-500">홈 화면에 추가하면 팝업이 더 잘 열립니다.</p>
          </div>
          <button onClick={handleInstallClick} className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black active:scale-95 transition-all">설치</button>
        </div>
        <div className="text-center text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em]">
          ⓒ 2025. Kwon's class. All rights reserved.
        </div>
      </div>
      
      <style>{`
        @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        .animate-bounce-slow { animation: bounce-slow 2.5s infinite ease-in-out; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        .animate-shake { animation: shake 0.15s ease-in-out infinite; animation-iteration-count: 3; }
      `}</style>
    </div>
  );
};

export default StudentPage;
