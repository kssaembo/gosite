
export interface Slot {
  id: string;
  title: string;
  url: string;
}

export interface TeacherData {
  id: string;
  username: string;
  active_slot_id: string | null;
  slots: Slot[];
  updated_at: string;
}

export interface AuthState {
  isLoggedIn: boolean;
  teacherId: string | null;
  username: string | null;
}
