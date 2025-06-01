"use client"

import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, Clock, User, Flag } from "lucide-react"
import { ClickUpTask } from "@/lib/types"

interface OverdueTasksTrackerProps {
  tasks: ClickUpTask[]
  projectType: 'On-going' | 'One-Time'
}

export function OverdueTasksTracker({ tasks, projectType }: OverdueTasksTrackerProps) {
  const now = Date.now()
  
  // Filter overdue tasks (due_date < now and not completed)
  const overdueTasks = tasks.filter(task => {
    if (!task.due_date) return false
    const dueDate = parseInt(task.due_date)
    const isOverdue = dueDate < now
    const isIncomplete = !['complete', 'approved'].includes(task.status)
    return isOverdue && isIncomplete
  })

  // Filter upcoming tasks (due in next 7 days)
  const sevenDaysFromNow = now + (7 * 24 * 60 * 60 * 1000)
  const upcomingTasks = tasks.filter(task => {
    if (!task.due_date) return false
    const dueDate = parseInt(task.due_date)
    const isUpcoming = dueDate >= now && dueDate <= sevenDaysFromNow
    const isIncomplete = !['complete', 'approved'].includes(task.status)
    return isUpcoming && isIncomplete
  })

  // Calculate days overdue
  const getDaysOverdue = (dueDateStr: string) => {
    const dueDate = parseInt(dueDateStr)
    const diffMs = now - dueDate
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  }

  // Calculate days until due
  const getDaysUntilDue = (dueDateStr: string) => {
    const dueDate = parseInt(dueDateStr)
    const diffMs = dueDate - now
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  }

  // Format date
  const formatDate = (dueDateStr: string) => {
    const date = new Date(parseInt(dueDateStr))
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  // Get priority badge variant
  const getPriorityVariant = (priority: string | null) => {
    if (!priority) return "secondary"
    const priorityNum = parseInt(priority)
    if (priorityNum === 1) return "destructive" // Urgent
    if (priorityNum === 2) return "default" // High
    if (priorityNum === 3) return "secondary" // Normal
    return "outline" // Low
  }

  // Get priority label
  const getPriorityLabel = (priority: string | null) => {
    if (!priority) return "No Priority"
    const priorityNum = parseInt(priority)
    if (priorityNum === 1) return "Urgent"
    if (priorityNum === 2) return "High"
    if (priorityNum === 3) return "Normal"
    return "Low"
  }

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'on hold': return 'destructive'
      case 'update required': return 'destructive'
      case 'client review': return 'secondary'
      case 'in progress': return 'default'
      case 'review': return 'secondary'
      default: return 'outline'
    }
  }

  // Sort overdue tasks by days overdue (most overdue first)
  const sortedOverdueTasks = overdueTasks
    .sort((a, b) => parseInt(a.due_date!) - parseInt(b.due_date!))
    .slice(0, 5) // Show top 5 most overdue

  // Sort upcoming tasks by due date (soonest first)
  const sortedUpcomingTasks = upcomingTasks
    .sort((a, b) => parseInt(a.due_date!) - parseInt(b.due_date!))
    .slice(0, 3) // Show next 3 upcoming

  if (overdueTasks.length === 0 && upcomingTasks.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No overdue or upcoming tasks with due dates</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-800">Overdue Tasks</span>
          </div>
          <div className="text-2xl font-bold text-red-600">{overdueTasks.length}</div>
          <p className="text-xs text-red-600">
            {overdueTasks.length > 0 && `Oldest: ${getDaysOverdue(overdueTasks[0]?.due_date!)} days`}
          </p>
        </div>

        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-800">Due This Week</span>
          </div>
          <div className="text-2xl font-bold text-orange-600">{upcomingTasks.length}</div>
          <p className="text-xs text-orange-600">
            {upcomingTasks.length > 0 && `Next: ${getDaysUntilDue(upcomingTasks[0]?.due_date!)} days`}
          </p>
        </div>
      </div>

      {/* Overdue Tasks */}
      {overdueTasks.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Most Overdue Tasks
          </h4>
          {sortedOverdueTasks.map((task, index) => (
            <div key={task.task_id} className="p-3 border border-red-200 bg-red-50 rounded-lg">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {task.task_name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={getStatusVariant(task.status)} className="text-xs">
                      {task.status}
                    </Badge>
                    <Badge variant={getPriorityVariant(task.priority)} className="text-xs">
                      <Flag className="h-3 w-3 mr-1" />
                      {getPriorityLabel(task.priority)}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      {task.assignees?.split(',')[0]?.trim() || 'Unassigned'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-red-600">
                    {getDaysOverdue(task.due_date!)} days
                  </div>
                  <div className="text-xs text-red-500">
                    Due: {formatDate(task.due_date!)}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {overdueTasks.length > 5 && (
            <p className="text-xs text-muted-foreground text-center">
              +{overdueTasks.length - 5} more overdue tasks
            </p>
          )}
        </div>
      )}

      {/* Upcoming Tasks */}
      {upcomingTasks.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-orange-600 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Due This Week
          </h4>
          {sortedUpcomingTasks.map((task, index) => (
            <div key={task.task_id} className="p-3 border border-orange-200 bg-orange-50 rounded-lg">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {task.task_name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={getStatusVariant(task.status)} className="text-xs">
                      {task.status}
                    </Badge>
                    <Badge variant={getPriorityVariant(task.priority)} className="text-xs">
                      <Flag className="h-3 w-3 mr-1" />
                      {getPriorityLabel(task.priority)}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      {task.assignees?.split(',')[0]?.trim() || 'Unassigned'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-orange-600">
                    {getDaysUntilDue(task.due_date!)} days
                  </div>
                  <div className="text-xs text-orange-500">
                    Due: {formatDate(task.due_date!)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Timeline Health Indicator */}
      <div className="p-3 bg-muted rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Timeline Health</span>
          <Badge variant={
            overdueTasks.length === 0 ? "default" : 
            overdueTasks.length <= 2 ? "secondary" : "destructive"
          }>
            {overdueTasks.length === 0 ? "On Track" : 
             overdueTasks.length <= 2 ? "At Risk" : "Critical"}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground">
          {overdueTasks.length === 0 
            ? "All tasks are on schedule or completed"
            : `${overdueTasks.length} overdue tasks need immediate attention`
          }
        </div>
      </div>
    </div>
  )
}
