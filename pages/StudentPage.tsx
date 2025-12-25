
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ExternalLink, Info, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Slot, TeacherData } from '../types';

const StudentPage: React.FC = () => {
  const { teacherId } = useParams<{ teacherId: string }>();
  const [data, setData] = useState<TeacherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teacherId) return;

    // Fetch initial data
    const fetchSession = async () => {
      const { data: session } = await supabase
        .from('class_sessions')
        .select('*')
        .eq('teacher_id', teacherId)
        .single();
      
      if (session) setData(session);
      setLoading(false);
    };

    fetchSession();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`session:${teacherId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'class_sessions',
        filter: `teacher_id=eq.${teacherId}`
      }, (payload) => {
        setData(payload.new as TeacherData);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teacherId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-sky-100 border-t-sky-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const activeSlot = data?.slots.find(s => s.id === data.active_slot_id);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-6 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center text-white font-bold">L</div>
          <span className="text-xl font-bold text-slate-800">ClassLink</span>
        </div>
        <div className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-500">
          {data?.username || teacherId} 선생님
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {activeSlot ? (
          <div className="w-full max-w-sm animate-in zoom-in-95 duration-500">
            <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 text-center border border-slate-100 flex flex-col items-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <ExternalLink size={120} />
              </div>

              <div className="w-24 h-24 bg-sky-100 text-sky-500 rounded-[2rem] flex items-center justify-center mb-8 ring-8 ring-sky-50">
                <ExternalLink size={48} />
              </div>
              
              <h2 className="text-2xl font-black text-slate-800 mb-2 leading-tight">
                {activeSlot.title || '선생님이 보낸 페이지'}
              </h2>
              <p className="text-slate-400 text-sm mb-10 truncate w-full">
                {activeSlot.url}
              </p>

              <a 
                href={activeSlot.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full py-5 bg-sky-500 text-white rounded-[1.5rem] font-black text-xl shadow-lg shadow-sky-200 hover:bg-sky-600 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                페이지로 이동하기 <ExternalLink size={24} />
              </a>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-6 animate-pulse">
            <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <div className="w-12 h-12 bg-slate-200 rounded-lg"></div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">선생님의 안내를 기다려주세요</h2>
              <p className="text-slate-400">준비가 되면 화면에 버튼이 나타납니다.</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info / PWA Prompt */}
      <div className="mt-12 space-y-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-100 text-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Download size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-slate-800">홈 화면에 추가하기</h4>
            <p className="text-xs text-slate-500 truncate">앱처럼 설치하고 빠르게 접속하세요!</p>
          </div>
          <button 
            onClick={() => alert('브라우저 설정 메뉴에서 "홈 화면에 추가"를 선택해주세요.')}
            className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold whitespace-nowrap"
          >
            방법 보기
          </button>
        </div>

        <div className="flex justify-center gap-6 text-[10px] text-slate-400 font-bold uppercase tracking-widest pb-4">
          <span className="flex items-center gap-1"><Info size={10} /> 실시간 동기화 켜짐</span>
          <span>© 2024 ClassLink</span>
        </div>
      </div>
    </div>
  );
};

export default StudentPage;
