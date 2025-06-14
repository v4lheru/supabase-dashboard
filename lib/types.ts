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
  project_type: 'On-going' | 'On-Going' | 'One-Time' | null
  total_hours_month: string | null
  // New fields for comprehensive project tracking
  available_hours: number | null // Total hours for one-time projects or monthly hours for retainers
  revenue: number | null // Total revenue for one-time or monthly revenue for retainers
  average_delivery_hourly: number | null // Average hourly rate of delivery team
  status: 'Active' | 'Not Active' | 'Paused' | 'Completed' | null // Project status
}

// Computed interfaces for dashboard analytics
export interface ProjectMetrics {
  clientName: string
  projectType: 'On-going' | 'One-Time'
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
export type TimePeriod = 'all-time' | 'this-month' | 'last-30-days' | 'this-quarter' | 'last-quarter' | 'this-year' | 'last-year'

// Project type filters
export type ProjectTypeFilter = 'all' | 'On-going' | 'One-Time'

// Project status filters
export type ProjectStatusFilter = 'all' | 'Active' | 'Not Active' | 'Paused' | 'Completed'
