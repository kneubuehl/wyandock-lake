export type UserRole = 'admin' | 'member' | 'caretaker'
export type ParentName = 'cheryl' | 'stephen_sr'
export type TaskStatus = 'pending' | 'completed' | 'overdue'
export type Recurrence = 'one-time' | 'monthly' | 'quarterly' | 'annual' | 'custom'
export type NoteStatus = 'open' | 'resolved'

export interface Profile {
  id: string
  email: string
  display_name: string
  role: UserRole
  created_at: string
}

export interface ParentSchedule {
  id: string
  year: number
  first_parent: ParentName
  created_by: string
  created_at: string
}

export interface Reservation {
  id: string
  user_id: string
  start_date: string
  end_date: string
  notes: string | null
  created_at: string
  profiles?: Profile
}

export interface Procedure {
  id: string
  title: string
  content: string
  category: string
  created_by: string
  updated_by: string
  created_at: string
  updated_at: string
}

export interface MaintenanceTask {
  id: string
  title: string
  description: string | null
  recurrence: Recurrence
  recurrence_details: Record<string, unknown> | null
  next_due_date: string | null
  assigned_to: string | null
  status: TaskStatus
  created_by: string
  created_at: string
  profiles?: Profile
}

export interface MaintenanceLog {
  id: string
  task_id: string
  completed_by: string
  completed_at: string
  notes: string | null
  profiles?: Profile
}

export interface HandoffNote {
  id: string
  content: string
  author_id: string
  status: NoteStatus
  resolved_by: string | null
  resolved_at: string | null
  resolution_note: string | null
  created_at: string
  profiles?: Profile
}

export interface SecurityCode {
  id: string
  label: string
  code: string
  notes: string | null
  updated_by: string
  updated_at: string
}

export interface VendorContact {
  id: string
  name: string
  phone: string
  category: string
  notes: string | null
  created_by: string
  updated_by: string
  created_at: string
  updated_at: string
}
