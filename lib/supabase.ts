
import { createClient } from '@supabase/supabase-js';

// Supabase credentials
const supabaseUrl = 'https://wbbbwifhdeggukkhfzdw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiYmJ3aWZoZGVnZ3Vra2hmemR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1Mzg0MDcsImV4cCI6MjA4MjExNDQwN30.jePkixx4IWhsO2EcOyCPz_AC5sn-lWBuG2kJiEyIIlA';

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * [필독] 실시간 동기화를 위해 아래 SQL을 반드시 실행해야 합니다.
 * 
 * ALTER TABLE class_sessions REPLICA IDENTITY FULL;
 * BEGIN;
 *   DROP PUBLICATION IF EXISTS supabase_realtime;
 *   CREATE PUBLICATION supabase_realtime FOR TABLE class_sessions;
 * COMMIT;
 */
