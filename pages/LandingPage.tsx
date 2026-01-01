
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Link as LinkIcon, Users, Zap, Layout, Mail } from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // 1. 교사 로그인 여부 확인
    const authSaved = localStorage.getItem('classlink_auth');
    if (authSaved) {
      const auth = JSON.parse(authSaved);
      if (auth.isLoggedIn) {
        navigate('/dashboard');
        return;
      }
    }

    // 2. PWA 모드 및 학생 접속 기록 확인
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    const lastStudentId = localStorage.getItem('last_student_teacher_id');
    
    // 설치된 앱으로 실행되었고, 마지막으로 접속한 학생 페이지 기록이 있다면 해당 페이지로 이동
    if (isPWA && lastStudentId) {
      navigate(`/s/${lastStudentId}`);
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-white">
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center text-white">
            <LinkIcon size={24} />
          </div>
          <span className="text-2xl font-bold text-slate-800 tracking-tight">GoSite</span>
        </div>
        <Link to="/login" className="px-6 py-2 bg-sky-500 text-white rounded-full font-semibold hover:bg-sky-600 transition-colors">
          선생님 로그인
        </Link>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-20 pb-32 text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-6 leading-tight">
          수업 시간, <br/>
          <span className="text-sky-500">주소 하나로</span> 학생들을 연결하세요.
        </h1>
        <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto">
          칠판에 긴 주소를 적지 마세요. 선생님이 클릭 한 번만 하면 모든 학생의 화면이 즉시 바뀝니다.
        </p>

        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <FeatureCard 
            icon={<Zap className="text-amber-500" size={32} />}
            title="실시간 반응형"
            description="선생님이 주소를 바꾸는 즉시 학생들의 화면이 새로고침 없이 바뀝니다."
          />
          <FeatureCard 
            icon={<Layout className="text-sky-500" size={32} />}
            title="간편한 슬롯 관리"
            description="자주 사용하는 사이트를 미리 등록하고 드래그 앤 드롭으로 순서를 바꾸세요."
          />
          <FeatureCard 
            icon={<Users className="text-emerald-500" size={32} />}
            title="학생 접근성"
            description="별도의 설치 없이 링크 하나로 접속! PWA 지원으로 앱처럼 사용 가능합니다."
          />
        </div>
      </main>

      <footer className="bg-slate-50 py-16 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="mb-6 flex flex-col items-center gap-2">
            <p className="text-slate-600 font-medium">제안이나 문의사항이 있으시면 언제든 메일 주세요.</p>
            <a 
              href="mailto:sinjoppo@naver.com" 
              className="inline-flex items-center gap-2 text-sky-500 hover:text-sky-600 font-bold transition-colors group"
            >
              <Mail size={18} className="group-hover:scale-110 transition-transform" />
              Contact: sinjoppo@naver.com
            </a>
          </div>
          <div className="text-slate-400 text-sm font-bold">
            ⓒ 2025. Kwon's class. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 hover:shadow-xl transition-shadow text-left">
    <div className="mb-4">{icon}</div>
    <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
    <p className="text-slate-600 leading-relaxed">{description}</p>
  </div>
);

export default LandingPage;
