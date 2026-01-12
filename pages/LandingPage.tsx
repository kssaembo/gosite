
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Link as LinkIcon, Users, Zap, Layout, Mail, X, FileText, ShieldCheck } from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

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
          
          <div className="flex justify-center gap-6 mb-8 mt-4 text-xs font-bold text-slate-400">
            <button onClick={() => setShowTerms(true)} className="hover:text-slate-600 transition-colors">이용약관</button>
            <button onClick={() => setShowPrivacy(true)} className="hover:text-slate-600 transition-colors">개인정보처리방침</button>
          </div>

          <div className="text-slate-400 text-sm font-bold">
            ⓒ 2025. Kwon's class. All rights reserved.
          </div>
        </div>
      </footer>

      {/* 이용약관 모달 */}
      {showTerms && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-2xl w-full max-h-[80vh] flex flex-col relative animate-in zoom-in-95 duration-200 shadow-2xl">
            <button 
              onClick={() => setShowTerms(false)}
              className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X size={24} className="text-slate-400" />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center">
                <FileText size={20} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">이용약관</h2>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 text-slate-600 text-sm leading-relaxed space-y-6">
              <div>
                <h3 className="font-bold text-slate-800 mb-2">제1조 (목적)</h3>
                <p>본 약관은 GoSite에서 제공하는 모든 제반 서비스의 이용 조건 및 절차, 회원과 서비스 간의 권리, 의무 및 책임 사항을 규정함을 목적으로 합니다.</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 mb-2">제2조 (회원가입 및 계정 생성)</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>본 서비스는 이용자의 익명성을 보장하기 위해 이메일, 전화번호, 실명 등 개인 식별 정보를 수집하지 않습니다.</li>
                  <li>회원은 본인이 설정한 아이디(ID)와 비밀번호를 통해 가입하며, 가입 시 시스템에서 자동 생성된 '복구코드'를 부여받습니다.</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 mb-2">제3조 (복구코드 및 계정 관리에 대한 회원의 의무)</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>복구코드의 역할: '복구코드'는 비밀번호 분실 시 본인임을 증명하고 비밀번호를 재설정할 수 있는 기본 수단입니다.</li>
                  <li>분실 시 조치: 회원이 복구코드를 분실한 경우, 하단에 명시된 관리자 이메일을 통해 조치를 요청할 수 있습니다.</li>
                  <li>본인 확인의 한계: 관리자는 이메일 등 식별 정보를 보유하고 있지 않으므로, 복구 요청 시 아이디 및 서비스 이용 내역 등 추가 정보를 요구할 수 있습니다. 본인 확인이 불가능할 경우 계정 복구가 거부될 수 있습니다.</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 mb-2">제4조 (서비스 이용의 제한 및 중지)</h3>
                <p>본 서비스는 회원이 본 약관을 위반하거나 서비스의 정상적인 운영을 방해하는 경우, 별도의 사전 통보 없이 서비스 이용을 제한하거나 계정을 삭제할 수 있습니다.</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 mb-2">제5조 (면책 조항)</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>본 서비스는 천재지변, 서버 점검, 통신 장애 등 불가항력적인 사유로 서비스를 제공할 수 없는 경우 책임이 면제됩니다.</li>
                  <li>본 서비스는 회원이 복구코드를 분실하여 발생한 계정 상실 및 데이터 손실에 대해 일체의 책임을 지지 않습니다.</li>
                </ul>
              </div>
            </div>
            <button 
              onClick={() => setShowTerms(false)}
              className="mt-8 w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors"
            >
              확인하였습니다
            </button>
          </div>
        </div>
      )}

      {/* 개인정보처리방침 모달 */}
      {showPrivacy && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-2xl w-full max-h-[80vh] flex flex-col relative animate-in zoom-in-95 duration-200 shadow-2xl">
            <button 
              onClick={() => setShowPrivacy(false)}
              className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X size={24} className="text-slate-400" />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
                <ShieldCheck size={20} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">개인정보처리방침</h2>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 text-slate-600 text-sm leading-relaxed space-y-6">
              <p className="font-medium text-slate-500">GoSite는 이용자의 최소한의 정보만을 처리하며, 다음 지침을 준수합니다.</p>
              
              <div>
                <h3 className="font-bold text-slate-800 mb-2">1. 처리하는 항목</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>필수 항목: 아이디, 비밀번호, 복구코드</li>
                  <li>자동 수집 항목: 접속 로그, IP 주소 (서비스 보안 및 오류 수정 목적)</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold text-slate-800 mb-2">2. 처리 목적</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>회원 가입 및 계정 관리</li>
                  <li>비밀번호 분실 시 복구코드 확인 및 관리자 대응</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold text-slate-800 mb-2">3. 보유 및 파기</h3>
                <p>이용자의 정보는 회원 탈퇴 시 즉시 파기하는 것을 원칙으로 합니다.</p>
              </div>
              
              <div>
                <h3 className="font-bold text-slate-800 mb-2">4. 운영자 안내</h3>
                <p>본 서비스는 개인 개발자에 의해 운영되며, 개인정보와 관련된 문의는 하단의 이메일을 통해 연락 주시기 바랍니다.</p>
                <p className="mt-2 font-bold text-sky-500">sinjoppo@naver.com</p>
              </div>
            </div>
            <button 
              onClick={() => setShowPrivacy(false)}
              className="mt-8 w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-100"
            >
              확인하였습니다
            </button>
          </div>
        </div>
      )}
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
