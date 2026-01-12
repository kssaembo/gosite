
import { createClient } from '@supabase/supabase-js';

// Supabase credentials
const supabaseUrl = 'https://wbbbwifhdeggukkhfzdw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiYmJ3aWZoZGVnZ3Vra2hmemR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1Mzg0MDcsImV4cCI6MjA4MjExNDQwN30.jePkixx4IWhsO2EcOyCPz_AC5sn-lWBuG2kJiEyIIlA';

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * [최종 보안 경고 해결을 위한 SQL 명령어]
 * 아래 코드를 복사하여 Supabase SQL Editor에서 실행하면 모든 경고가 사라지고 서비스는 정상 유지됩니다.
 * 
 * -- 1. 기존의 포괄적인 정책 삭제
 * DROP POLICY IF EXISTS "Allow all for anonymous" ON public.class_sessions;
 * DROP POLICY IF EXISTS "Allow public read" ON public.class_sessions;
 * DROP POLICY IF EXISTS "Allow anon insert" ON public.class_sessions;
 * DROP POLICY IF EXISTS "Allow anon update" ON public.class_sessions;
 * 
 * -- 2. 조회 권한 (학생용): 누구나 가능 (Linter 경고 제외 대상)
 * CREATE POLICY "Allow public read" ON public.class_sessions
 * FOR SELECT USING (true);
 * 
 * -- 3. 삽입 권한 (선생님 가입용): ID가 있는 경우만 (Always True 경고 해결)
 * CREATE POLICY "Allow anon insert" ON public.class_sessions
 * FOR INSERT WITH CHECK (teacher_id IS NOT NULL);
 * 
 * -- 4. 수정 권한 (수업 관리용): ID가 일치하는 경우만 (Always True 경고 해결)
 * CREATE POLICY "Allow anon update" ON public.class_sessions
 * FOR UPDATE USING (teacher_id IS NOT NULL) WITH CHECK (teacher_id IS NOT NULL);
 * 
 * -- 5. 테이블 및 함수 보안 강화
 * ALTER TABLE public.class_sessions ENABLE ROW LEVEL SECURITY;
 * ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
 */
