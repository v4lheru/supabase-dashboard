"use client"

import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Clock, Calendar } from "lucide-react"
import { ClickUpTask } from "@/lib/types"

interface OverdueTasksCompactProps {
  tasks: ClickUpTask[]
  projectType: 'On-going' | 'One-Time'
}

export function OverdueTasksCompact({ tasks, projectType }: OverdueTasksCompactProps) {
  const now = Date.now()
  
  // Filter overdue tasks (due_date < now and not completed)
  const overdueTasks = tasks.filter(task => {
    if (!task.due_date) return false
    const dueDate = parseInt(task.due_date)
    const isOverdue = dueDate < now
    const isIncomplete = !['complete', 'approved'].includes(task.status)
    return isOverdue && isIncomplete
  })

  // Filter overdue tasks from this week (last 7 days)
  const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000)
  const overdueThisWeek = overdueTasks.filter(task => {
    const dueDate = parseInt(task.due_date!)
    return dueDate >= sevenDaysAgo // Due date was within last 7 days
  })

  // Total tasks count
  const totalTasks = tasks.length

  // Calculate days overdue for the oldest task
  const getOldestOverdueDays = () => {
    if (overdueTasks.length === 0) return 0
    const oldestTask = overdueTasks.reduce((oldest, task) => {
      return parseInt(task.due_date!) < parseInt(oldest.due_date!) ? task : oldest
    })
    const dueDate = parseInt(oldestTask.due_date!)
    const diffMs = now - dueDate
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  }

  const oldestOverdueDays = getOldestOverdueDays()

  return (
    <div className="space-y-4">
      {/* Compact Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* Total Tasks */}
        <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Calendar className="h-3 w-3 text-blue-600" />
            <span className="text-xs font-medium text-blue-800">Total Tasks</span>
          </div>
          <div className="text-xl font-bold text-blue-600">{totalTasks}</div>
          <div className="text-xs text-blue-500">
            All tasks
          </div>
        </div>

        {/* Overdue Tasks */}
        <div className="text-center p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <AlertTriangle className="h-3 w-3 text-red-600" />
            <span className="text-xs font-medium text-red-800">Overdue</span>
          </div>
          <div className="text-xl font-bold text-red-600">{overdueTasks.length}</div>
          {overdueTasks.length > 0 && (
            <div className="text-xs text-red-500">
              {oldestOverdueDays}d old
            </div>
          )}
        </div>

        {/* Overdue This Week */}
        <div className="text-center p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Clock className="h-3 w-3 text-orange-600" />
            <span className="text-xs font-medium text-orange-800">This Week</span>
          </div>
          <div className="text-xl font-bold text-orange-600">{overdueThisWeek.length}</div>
          <div className="text-xs text-orange-500">
            Became overdue
          </div>
        </div>
      </div>

      {/* Critical Tasks Alert (only if overdue) */}
      {overdueTasks.length > 0 && (
        <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-3 w-3 text-red-600" />
            <span className="text-xs font-medium text-red-800">
              {overdueTasks.length} overdue task{overdueTasks.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="text-xs text-red-600">
            Oldest: {oldestOverdueDays} days overdue
            {overdueTasks.length > 1 && ` • ${overdueTasks.length - 1} more`}
          </div>
        </div>
      )}

      {/* Quick Action Summary */}
      <div className="text-xs text-muted-foreground text-center">
        {overdueTasks.length === 0 
          ? "All tasks on schedule"
          : `${overdueTasks.length} task${overdueTasks.length !== 1 ? 's' : ''} need${overdueTasks.length === 1 ? 's' : ''} attention`
        }
      </div>
    </div>
  )
}
