"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Clock, DollarSign, TrendingUp, Users, Target, BarChart3 } from "lucide-react"
import { AllProjectsTypeToggle } from "@/components/all-projects-type-toggle"
import { ProjectHealthCard } from "@/components/project-health-card"
import { AllProjectsList } from "@/components/all-projects-list"

interface AllProjectsOverviewProps {
  projectData: any
  filter: "one-time" | "retainer" | "all"
  onFilterChange: (filter: "one-time" | "retainer" | "all") => void
  timePeriod: string
  onTimePeriodChange: (period: string) => void
}

export function AllProjectsOverview({
  projectData,
  filter,
  onFilterChange,
  timePeriod,
  onTimePeriodChange,
}: AllProjectsOverviewProps) {
  // Calculate aggregated metrics based on filter
  const calculateAggregatedMetrics = () => {
    const projects = Object.values(projectData)

    let filteredProjects = projects
    if (filter === "one-time") {
      filteredProjects = projects.filter((p: any) => p.type === "one-time")
    } else if (filter === "retainer") {
      filteredProjects = projects.filter((p: any) => p.type === "retainer")
    }
    // If filter === "all", we keep all projects

    let totalRevenue = 0
    let totalDeliveryCost = 0
    let totalAllocatedHours = 0
    let totalSpentHours = 0
    const projectCount = filteredProjects.length

    filteredProjects.forEach((project: any) => {
      if (project.type === "one-time") {
        totalRevenue += project.sowPrice
        totalDeliveryCost += project.hoursSpent * project.averageHourlyRate
        totalAllocatedHours += project.sowHours
        totalSpentHours += project.hoursSpent
      } else {
        // For retainer projects, we'll use monthly values
        totalRevenue += project.monthlyRetainer
        totalDeliveryCost += project.hoursSpentThisMonth * project.averageHourlyRate
        totalAllocatedHours += project.monthlyHours
        totalSpentHours += project.hoursSpentThisMonth
      }
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
      filteredProjects,
    }
  }

  const metrics = calculateAggregatedMetrics()

  const getFilterTitle = () => {
    switch (filter) {
      case "one-time":
        return "One-Time Projects Overview"
      case "retainer":
        return "Retainer Projects Overview"
      default:
        return "All Projects Overview"
    }
  }

  const getHoursLabel = () => {
    switch (filter) {
      case "one-time":
        return "Total SOW Hours"
      case "retainer":
        return "Monthly Hours"
      default:
        return "Total Hours"
    }
  }

  const getRevenueLabel = () => {
    switch (filter) {
      case "one-time":
        return "Total SOW Revenue"
      case "retainer":
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
        <Select value={timePeriod} onValueChange={onTimePeriodChange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-time">All Time</SelectItem>
            <SelectItem value="this-month">This Month</SelectItem>
            <SelectItem value="previous-month">Previous Month</SelectItem>
            <SelectItem value="january-2024">January 2024</SelectItem>
            <SelectItem value="december-2023">December 2023</SelectItem>
            <SelectItem value="november-2023">November 2023</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Project Type Filter and Core Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Project Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <AllProjectsTypeToggle value={filter} onChange={onFilterChange} />
          </CardContent>
        </Card>

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
                : filter === "one-time"
                  ? "Total SOW hours"
                  : "Monthly hours across retainers"}
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
                <span className="text-2xl font-bold">{metrics.totalSpentHours}</span>
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
                {metrics.totalAllocatedHours - metrics.totalSpentHours} hours remaining
              </p>
            </div>
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
                : filter === "one-time"
                  ? "Total SOW value"
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
            <AllProjectsList projects={metrics.filteredProjects} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
