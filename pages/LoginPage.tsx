
import React, { useState } from 'react';
import { LogIn } from 'lucide-react';

interface LoginPageProps {
  onLogin: (teacherId: string, username: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [teacherId, setTeacherId] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (teacherId && password) {
      // For this prototype, we accept any valid-looking input
      onLogin(teacherId, teacherId);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-sky-500 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg">
            <LogIn size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">선생님 로그인</h2>
          <p className="text-slate-500 mt-2">수업 관리 대시보드로 접속하세요.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">교사 고유 ID (영문/숫자)</label>
            <input 
              type="text" 
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all outline-none"
              placeholder="예: teacher01"
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">비밀번호</label>
            <input 
              type="password" 
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all outline-none"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-sky-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-sky-600 shadow-lg shadow-sky-200 transition-all active:scale-[0.98]"
          >
            대시보드 입장하기
          </button>
        </form>
        
        <p className="mt-8 text-center text-xs text-slate-400">
          초등 교육 현장을 위해 비밀번호 분실 시 재설정이 <br/>간편하도록 설계되었습니다.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
