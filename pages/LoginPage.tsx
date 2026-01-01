
import React, { useState } from 'react';
import { LogIn, Link as LinkIcon, AlertCircle, Key, RefreshCcw, CheckCircle2, Copy, X, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface LoginPageProps {
  onLogin: (teacherId: string, username: string) => void;
}

type AuthMode = 'login' | 'register' | 'reset';

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [teacherId, setTeacherId] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // SHA-256 해시 생성 함수
  const hashPassword = async (pwd: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(pwd);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // 복구 코드 생성 함수 (10자리)
  const generateRecoveryCode = () => {
    return Math.random().toString(36).substring(2, 12).toUpperCase();
  };

  const resetForm = () => {
    setError(null);
    setSuccess(null);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data: existingUser } = await supabase
        .from('class_sessions')
        .select('teacher_id, password, username, recovery_code')
        .eq('teacher_id', teacherId)
        .single();

      if (mode === 'login') {
        if (!existingUser) {
          setError('등록되지 않은 ID입니다. "처음 시작하기"를 이용해 주세요.');
        } else {
          const hashedPassword = await hashPassword(password);
          // 해시값 비교 (하위 호환성 없음: 신규 등록이나 재설정 권장)
          if (existingUser.password !== hashedPassword) {
            setError('비밀번호가 일치하지 않습니다.');
          } else {
            onLogin(existingUser.teacher_id, existingUser.username || existingUser.teacher_id);
          }
        }
      } else if (mode === 'register') {
        if (existingUser) {
          setError('ID가 중복됩니다. 다른 ID를 입력해 주세요.');
        } else {
          const newRecoveryCode = generateRecoveryCode();
          const hashedPassword = await hashPassword(password);
          const { error: insertError } = await supabase
            .from('class_sessions')
            .insert({
              teacher_id: teacherId,
              password: hashedPassword,
              username: teacherId,
              recovery_code: newRecoveryCode,
              slots: [],
              active_slot_id: null
            });

          if (insertError) throw insertError;
          setGeneratedCode(newRecoveryCode);
        }
      } else if (mode === 'reset') {
        if (!existingUser) {
          setError('ID를 확인해 주세요.');
        } else if (existingUser.recovery_code !== recoveryCode) {
          setError('복구 코드가 일치하지 않습니다.');
        } else {
          const hashedNewPassword = await hashPassword(newPassword);
          const { error: updateError } = await supabase
            .from('class_sessions')
            .update({ password: hashedNewPassword })
            .eq('teacher_id', teacherId);

          if (updateError) throw updateError;
          setSuccess('비밀번호가 성공적으로 재설정되었습니다. 로그인 해주세요.');
          setMode('login');
          setRecoveryCode('');
          setNewPassword('');
        }
      }
    } catch (err: any) {
      console.error(err);
      setError('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Navigation / Logo */}
      <div className="p-6">
        <Link to="/" className="inline-flex items-center gap-2 group">
          <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center text-white group-hover:bg-sky-600 transition-colors">
            <LinkIcon size={18} />
          </div>
          <span className="text-xl font-bold text-slate-800 tracking-tight">GoSite</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8 border border-slate-100">
          <div className="text-center mb-8">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg transition-colors ${mode === 'reset' ? 'bg-amber-500' : 'bg-sky-500'}`}>
              {mode === 'reset' ? <RefreshCcw size={32} /> : <LogIn size={32} />}
            </div>
            <h2 className="text-2xl font-bold text-slate-800">
              {mode === 'login' && '선생님 로그인'}
              {mode === 'register' && '처음 시작하기'}
              {mode === 'reset' && '비밀번호 재설정'}
            </h2>
            <p className="text-slate-500 mt-2 text-sm">
              {mode === 'login' && '수업 관리 대시보드로 접속하세요.'}
              {mode === 'register' && '고유 ID를 만들고 수업을 시작하세요.'}
              {mode === 'reset' && '복구 코드를 사용하여 비밀번호를 변경합니다.'}
            </p>
          </div>

          {/* Tab Switcher */}
          {mode !== 'reset' && (
            <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
              <button 
                onClick={() => { setMode('login'); resetForm(); }}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'login' ? 'bg-white text-sky-500 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                로그인
              </button>
              <button 
                onClick={() => { setMode('register'); resetForm(); }}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'register' ? 'bg-white text-sky-500 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                처음 시작하기
              </button>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 text-xs animate-shake">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <p className="break-keep">{error}</p>
              </div>
            )}
            {success && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-3 text-emerald-600 text-xs">
                <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
                <p>{success}</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">교사 고유 ID</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all outline-none text-sm"
                placeholder="영문/숫자 예: teacher01"
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value.toLowerCase())}
              />
            </div>

            {mode === 'reset' ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">복구 코드</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none text-sm font-mono"
                    placeholder="예: A1B2C3D4E5"
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">새 비밀번호</label>
                  <input 
                    type="password" 
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none text-sm"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">비밀번호</label>
                <input 
                  type="password" 
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all outline-none text-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className={`w-full text-white py-4 rounded-xl font-bold text-lg shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 ${mode === 'reset' ? 'bg-amber-500 shadow-amber-200 hover:bg-amber-600' : 'bg-sky-500 shadow-sky-200 hover:bg-sky-600'}`}
            >
              {isLoading ? '처리 중...' : (
                mode === 'login' ? '로그인' : (mode === 'register' ? '등록 및 시작' : '비밀번호 변경')
              )}
            </button>
          </form>
          
          <div className="mt-6 flex flex-col items-center gap-3">
            {mode === 'login' && (
              <button 
                onClick={() => { setMode('reset'); resetForm(); }}
                className="text-sm text-slate-400 hover:text-sky-500 font-medium transition-colors"
              >
                비밀번호를 잊으셨나요?
              </button>
            )}
            {mode === 'reset' && (
              <div className="flex flex-col items-center gap-4">
                <button 
                  onClick={() => { setMode('login'); resetForm(); }}
                  className="text-sm text-slate-400 hover:text-sky-500 font-medium transition-colors flex items-center gap-1"
                >
                  로그인으로 돌아가기
                </button>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-400 font-bold leading-relaxed text-center">
                  복구 코드를 분실하셨을 경우 하단의 이메일로<br/>
                  비밀번호 재설정 요청을 해주세요.
                  <a href="mailto:sinjoppo@naver.com" className="flex items-center justify-center gap-1 text-sky-500 mt-1 hover:underline">
                    <Mail size={12} /> sinjoppo@naver.com
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recovery Code Modal */}
      {generatedCode && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full relative animate-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Key size={32} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">복구 코드 발급</h2>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                비밀번호 분실 시 꼭 필요한 코드입니다.<br/>
                <span className="font-bold text-red-500">캡쳐하거나 메모하여 따로 보관하세요!</span>
              </p>
              
              <div className="bg-slate-50 p-4 rounded-2xl border-2 border-dashed border-slate-200 mb-6 group relative">
                <span className="text-2xl font-mono font-black text-slate-800 tracking-wider">
                  {generatedCode}
                </span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(generatedCode);
                    alert('복구 코드가 복사되었습니다.');
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-sky-500 transition-colors"
                >
                  <Copy size={18} />
                </button>
              </div>
              
              <button 
                onClick={() => onLogin(teacherId, teacherId)}
                className="w-full py-4 bg-sky-500 text-white rounded-2xl font-bold text-lg hover:bg-sky-600 transition-colors"
              >
                코드를 저장했습니다
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
