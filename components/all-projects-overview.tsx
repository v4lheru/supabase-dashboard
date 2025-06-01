"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Clock, DollarSign, TrendingUp, Users, Target, BarChart3 } from "lucide-react"
import { AllProjectsTypeToggle } from "@/components/all-projects-type-toggle"
import { ProjectHealthCard } from "@/components/project-health-card"
import { AllProjectsList } from "@/components/all-projects-list"
import { ProjectAnalytics, ProjectTypeFilter, ProjectStatusFilter } from "@/lib/types"

interface AllProjectsOverviewProps {
  projectData: ProjectAnalytics[]
  filter: ProjectTypeFilter
  statusFilter: ProjectStatusFilter
  timePeriod: string
  onTimePeriodChange: (period: string) => void
  onStatusFilterChange: (status: ProjectStatusFilter) => void
}

export function AllProjectsOverview({
  projectData,
  filter,
  statusFilter,
  timePeriod,
  onTimePeriodChange,
  onStatusFilterChange,
}: AllProjectsOverviewProps) {
  // 📊 Calculate aggregated metrics from ProjectAnalytics array
  const calculateAggregatedMetrics = () => {
    let totalRevenue = 0
    let totalDeliveryCost = 0
    let totalAllocatedHours = 0
    let totalSpentHours = 0
    let totalTasks = 0
    let totalCompletedTasks = 0
    let totalInProgressTasks = 0
    let totalTodoTasks = 0
    const projectCount = projectData.length

    projectData.forEach((analytics) => {
      const { metrics } = analytics
      totalRevenue += metrics.totalRevenue
      totalDeliveryCost += metrics.deliveryCost
      totalAllocatedHours += metrics.totalHours
      totalSpentHours += metrics.hoursSpent
      totalTasks += metrics.taskCount
      totalCompletedTasks += metrics.completedTasks
      totalInProgressTasks += metrics.inProgressTasks
      totalTodoTasks += metrics.todoTasks
    })

    const totalProfit = totalRevenue - totalDeliveryCost
    const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
    const hoursUtilization = totalAllocatedHours > 0 ? (totalSpentHours / totalAllocatedHours) * 100 : 0

    return {
      totalRevenue,
      totalDeliveryCost,
      totalProfit,
      overallMargin,
      totalAllocatedHours,
      totalSpentHours,
      hoursUtilization,
      projectCount,
      totalTasks,
      totalCompletedTasks,
      totalInProgressTasks,
      totalTodoTasks,
    }
  }

  const metrics = calculateAggregatedMetrics()

  const getFilterTitle = () => {
    switch (filter) {
      case "One-Time":
        return "One-Time Projects Overview"
      case "On-going":
        return "On-going Projects Overview"
      default:
        return "All Projects Overview"
    }
  }

  const getHoursLabel = () => {
    switch (filter) {
      case "One-Time":
        return "Total Project Hours"
      case "On-going":
        return "Monthly Hours"
      default:
        return "Total Hours"
    }
  }

  const getRevenueLabel = () => {
    switch (filter) {
      case "One-Time":
        return "Total Project Revenue"
      case "On-going":
        return "Monthly Recurring Revenue"
      default:
        return "Total Revenue"
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{getFilterTitle()}</h1>
          <p className="text-muted-foreground">
            {metrics.projectCount} project{metrics.projectCount !== 1 ? "s" : ""} • Aggregated Analytics
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Not Active">Not Active</SelectItem>
              <SelectItem value="Paused">Paused</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timePeriod} onValueChange={onTimePeriodChange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-time">All Time</SelectItem>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="last-30-days">Last 30 Days</SelectItem>
              <SelectItem value="this-quarter">This Quarter</SelectItem>
              <SelectItem value="last-quarter">Last Quarter</SelectItem>
              <SelectItem value="this-year">This Year</SelectItem>
              <SelectItem value="last-year">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Core Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {getHoursLabel()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalAllocatedHours}</div>
            <p className="text-xs text-muted-foreground">
              {filter === "all"
                ? "Combined allocated hours"
                : filter === "One-Time"
                  ? "Total project hours"
                  : "Monthly hours across projects"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Hours Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{Math.round(metrics.totalSpentHours)}</span>
                <Badge
                  variant={
                    metrics.hoursUtilization > 90
                      ? "destructive"
                      : metrics.hoursUtilization > 75
                        ? "secondary"
                        : "default"
                  }
                >
                  {metrics.hoursUtilization.toFixed(1)}%
                </Badge>
              </div>
              <Progress value={metrics.hoursUtilization} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {Math.round(metrics.totalAllocatedHours - metrics.totalSpentHours)} hours remaining
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Total Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalTasks}</div>
            <p className="text-xs text-muted-foreground">Across all projects</p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              {getRevenueLabel()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {filter === "all"
                ? "Combined revenue from all projects"
                : filter === "One-Time"
                  ? "Total project value"
                  : "Monthly recurring revenue"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Delivery Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.totalDeliveryCost.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Combined hours × average rates</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Overall Margin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-2xl font-bold flex items-center gap-2">
                {metrics.overallMargin.toFixed(1)}%
                <Badge
                  variant={
                    metrics.overallMargin > 50 ? "default" : metrics.overallMargin > 25 ? "secondary" : "destructive"
                  }
                >
                  ${metrics.totalProfit.toLocaleString()}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">Total Revenue - Total Delivery Cost</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalTasks}</div>
            <p className="text-xs text-muted-foreground">All tasks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.totalCompletedTasks}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalTasks > 0 ? ((metrics.totalCompletedTasks / metrics.totalTasks) * 100).toFixed(1) : 0}% complete
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics.totalInProgressTasks}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalTasks > 0 ? ((metrics.totalInProgressTasks / metrics.totalTasks) * 100).toFixed(1) : 0}% active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">To Do</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{metrics.totalTodoTasks}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalTasks > 0 ? ((metrics.totalTodoTasks / metrics.totalTasks) * 100).toFixed(1) : 0}% pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Project Health and Projects List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ProjectHealthCard
          profitMargin={metrics.overallMargin}
          revenue={metrics.totalRevenue}
          deliveryCost={metrics.totalDeliveryCost}
        />

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Projects Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projectData.map((analytics, index) => {
                const getStatusBadgeVariant = (status: string | null) => {
                  switch (status) {
                    case 'Active': return 'default'
                    case 'Paused': return 'secondary'
                    case 'Completed': return 'outline'
                    case 'Not Active': return 'destructive'
                    default: return 'secondary'
                  }
                }
                
                return (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{analytics.client.client_name}</p>
                        <Badge variant={getStatusBadgeVariant(analytics.client.status)}>
                          {analytics.client.status || 'Unknown'}
                        </Badge>
                        <Badge variant="outline">
                          {analytics.client.project_type === 'On-going' ? 'Ongoing' : 'One-time'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {analytics.metrics.taskCount} tasks • {analytics.metrics.hoursSpent}h spent • {analytics.client.available_hours || 0}h allocated
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${analytics.metrics.totalRevenue.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">
                        {analytics.metrics.profitMargin.toFixed(1)}% margin • ${analytics.metrics.averageHourlyRate}/h
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
