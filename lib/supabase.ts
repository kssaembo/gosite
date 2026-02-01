
import { createClient } from '@supabase/supabase-js';

// Supabase credentials
const supabaseUrl = 'https://wbbbwifhdeggukkhfzdw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiYmJ3aWZoZGVnZ3Vra2hmemR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1Mzg0MDcsImV4cCI6MjA4MjExNDQwN30.jePkixx4IWhsO2EcOyCPz_AC5sn-lWBuG2kJiEyIIlA';

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * [필독: QR 코드 커스텀 텍스트 저장을 위한 SQL 설정]
 * 아래 SQL을 Supabase SQL Editor에서 실행해야 저장이 정상 작동합니다.
 * 
 * -- 1. QR 커스텀 텍스트 컬럼 추가 (PATCH 400 에러 해결)
 * ALTER TABLE public.class_sessions ADD COLUMN IF NOT EXISTS qr_custom_text TEXT DEFAULT '';
 * 
 * -- 2. 실시간 전송을 위한 필수 설정
 * ALTER TABLE public.class_sessions REPLICA IDENTITY FULL;
 * 
 * -- 3. 기존 정책 초기화 및 재설정
 * DROP POLICY IF EXISTS "Allow all for anonymous" ON public.class_sessions;
 * DROP POLICY IF EXISTS "Allow public read" ON public.class_sessions;
 * DROP POLICY IF EXISTS "Allow anon insert" ON public.class_sessions;
 * DROP POLICY IF EXISTS "Allow anon update" ON public.class_sessions;
 * 
 * CREATE POLICY "Allow public read" ON public.class_sessions FOR SELECT USING (true);
 * CREATE POLICY "Allow anon insert" ON public.class_sessions FOR INSERT WITH CHECK (teacher_id IS NOT NULL);
 * CREATE POLICY "Allow anon update" ON public.class_sessions FOR UPDATE USING (teacher_id IS NOT NULL) WITH CHECK (teacher_id IS NOT NULL);
 * 
 * BEGIN;
 *   DROP PUBLICATION IF EXISTS supabase_realtime;
 *   CREATE PUBLICATION supabase_realtime FOR TABLE class_sessions;
 * COMMIT;
 * 
 * ALTER TABLE public.class_sessions ENABLE ROW LEVEL SECURITY;
 */
