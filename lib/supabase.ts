
import { createClient } from '@supabase/supabase-js';

// Supabase credentials
const supabaseUrl = 'https://wbbbwifhdeggukkhfzdw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiYmJ3aWZoZGVnZ3Vra2hmemR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1Mzg0MDcsImV4cCI6MjA4MjExNDQwN30.jePkixx4IWhsO2EcOyCPz_AC5sn-lWBuG2kJiEyIIlA';

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * [실시간 전송 및 보안 경고 해결을 위한 최종 SQL]
 * 학생 화면이 바뀌지 않는 이유는 'REPLICA IDENTITY' 설정이 누락되어 실시간 필터가 작동하지 않기 때문입니다.
 * 아래 내용을 SQL Editor에서 한 번 더 실행해 주세요.
 * 
 * -- 1. 실시간 전송을 위한 필수 설정 (이것이 누락되면 필터링된 실시간 업데이트가 작동하지 않습니다)
 * ALTER TABLE public.class_sessions REPLICA IDENTITY FULL;
 * 
 * -- 2. 기존 정책 초기화 및 재설정
 * DROP POLICY IF EXISTS "Allow all for anonymous" ON public.class_sessions;
 * DROP POLICY IF EXISTS "Allow public read" ON public.class_sessions;
 * DROP POLICY IF EXISTS "Allow anon insert" ON public.class_sessions;
 * DROP POLICY IF EXISTS "Allow anon update" ON public.class_sessions;
 * 
 * -- 조회 권한 (학생용)
 * CREATE POLICY "Allow public read" ON public.class_sessions
 * FOR SELECT USING (true);
 * 
 * -- 삽입 및 수정 권한 (선생님용)
 * CREATE POLICY "Allow anon insert" ON public.class_sessions
 * FOR INSERT WITH CHECK (teacher_id IS NOT NULL);
 * 
 * CREATE POLICY "Allow anon update" ON public.class_sessions
 * FOR UPDATE USING (teacher_id IS NOT NULL) WITH CHECK (teacher_id IS NOT NULL);
 * 
 * -- 3. 실시간 발행 설정 확인
 * BEGIN;
 *   DROP PUBLICATION IF EXISTS supabase_realtime;
 *   CREATE PUBLICATION supabase_realtime FOR TABLE class_sessions;
 * COMMIT;
 * 
 * -- 4. 보안 설정 강화
 * ALTER TABLE public.class_sessions ENABLE ROW LEVEL SECURITY;
 * ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
 */
