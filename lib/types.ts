// Database table interfaces based on the provided schema

export interface ClickUpTask {
  task_id: string
  task_name: string
  space_name: string
  folder_name: string
  list_name: string
  status: string
  date_created: string
  date_updated: string
  priority: string | null
  time_spent: string | null
  time_estimate: string | null
  assignees: string
  created_by: string
  comments: string
  record_created_at: string
  record_updated_at: string
  updated_at: string
  due_date: string | null
  start_date: string | null
}

export interface ClientMapping {
  id: number
  client_name: string
  clickup_project_name: string
  clickup_folder_name: string
  clickup_folder_id: string
  clickup_list_name: string
  clickup_list_id: string
  slack_internal_channel_name: string | null
  slack_internal_channel_id: string | null
  slack_external_channel_name: string | null
  slack_external_channel_id: string | null
  alternatives: string | null
  notes: string | null
  created_at: string
  updated_at: string
  qa_list_name: string | null
  qa_list_id: string | null
  project_type: 'on-going' | 'one-time'
  total_hours_month: string | null
}

// Computed interfaces for dashboard analytics
export interface ProjectMetrics {
  clientName: string
  projectType: 'on-going' | 'one-time'
  totalHours: number
  hoursSpent: number
  hoursRemaining: number
  utilizationPercentage: number
  totalRevenue: number
  deliveryCost: number
  profit: number
  profitMargin: number
  averageHourlyRate: number
  taskCount: number
  completedTasks: number
  inProgressTasks: number
  todoTasks: number
  // Time-based task breakdowns
  taskCountThisMonth: number
  completedTasksThisMonth: number
  inProgressTasksThisMonth: number
  todoTasksThisMonth: number
  hoursSpentThisMonth: number
}

export interface TeamMember {
  name: string
  hoursSpent: number
  taskCount: number
  hoursSpentThisMonth: number
  taskCountThisMonth: number
  utilizationPercentage: number
}

export interface TeamUtilizationData {
  totalTeamHours: number
  totalTeamHoursThisMonth: number
  memberBreakdown: TeamMember[]
  topPerformers: TeamMember[]
}

export interface ProjectAnalytics {
  client: ClientMapping
  tasks: ClickUpTask[]
  metrics: ProjectMetrics
  teamMembers: TeamMember[]
}

// Time period filters
export type TimePeriod = 'all-time' | 'this-month' | 'previous-month' | 'january-2024' | 'december-2023' | 'november-2023'

// Project type filters
export type ProjectTypeFilter = 'all' | 'on-going' | 'one-time'
