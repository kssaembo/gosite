
import { createClient } from '@supabase/supabase-js';

// Supabase credentials provided by the user
const supabaseUrl = 'https://wbbbwifhdeggukkhfzdw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiYmJ3aWZoZGVnZ3Vra2hmemR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1Mzg0MDcsImV4cCI6MjA4MjExNDQwN30.jePkixx4IWhsO2EcOyCPz_AC5sn-lWBuG2kJiEyIIlA';

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * DB SCHEMA RECOMMENDATION (Public Table):
 * table name: class_sessions
 * columns:
 * - id: uuid (primary key)
 * - teacher_id: text (unique)
 * - username: text
 * - active_slot_id: text (nullable)
 * - slots: jsonb (Array of {id, title, url})
 * - updated_at: timestamp with time zone
 */
