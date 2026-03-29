export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done'
export type Priority = 'low' | 'normal' | 'high'

export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: Priority
  due_date: string | null
  user_id: string
  created_at: string
  updated_at: string
}

export interface TeamMember {
  id: string
  name: string
  avatar_color: string
  user_id: string
  created_at: string
}

export interface Label {
  id: string
  name: string
  color: string
  user_id: string
  created_at: string
}

export interface Comment {
  id: string
  content: string
  task_id: string
  user_id: string
  created_at: string
}

export interface Activity {
  id: string
  action: string
  details: any
  task_id: string
  user_id: string
  created_at: string
}

export interface TaskWithRelations extends Task {
  assignees: TeamMember[]
  labels: Label[]
  comments?: Comment[]
  activities?: Activity[]
}