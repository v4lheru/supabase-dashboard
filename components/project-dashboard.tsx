"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Clock, DollarSign, TrendingUp, Calendar, Users, Target } from "lucide-react"
import { ProjectTypeToggle } from "@/components/project-type-toggle"
import { ProjectDurationChart } from "@/components/project-duration-chart"
import { TeamUtilizationChart } from "@/components/team-utilization-chart"
import { ProfitabilityChart } from "@/components/profitability-chart"
import { ProjectHealthCard } from "@/components/project-health-card"
import { AllProjectsOverview } from "@/components/all-projects-overview"

interface ProjectDashboardProps {
  selectedProject: string
}

export function ProjectDashboard({ selectedProject }: ProjectDashboardProps) {
  const [projectType, setProjectType] = useState<"one-time" | "retainer">("one-time")
  const [allProjectsFilter, setAllProjectsFilter] = useState<"one-time" | "retainer" | "all">("all")
  const [timePeriod, setTimePeriod] = useState("all-time")

  // Mock data - in real app, this would come from Supabase
  const allProjectsData = {
    "veza-dagster": {
      name: "Dagster",
      type: "one-time" as const,
      sowHours: 320,
      hoursSpent: 245,
      sowPrice: 45000,
      averageHourlyRate: 125,
    },
    "veza-webconnex": {
      name: "Webconnex",
      type: "retainer" as const,
      monthlyHours: 50,
      hoursSpentThisMonth: 40,
      monthlyRetainer: 7500,
      averageHourlyRate: 30,
    },
    "shadow-social-media": {
      name: "Social Media Management",
      type: "retainer" as const,
      monthlyHours: 40,
      hoursSpentThisMonth: 32,
      monthlyRetainer: 5000,
      averageHourlyRate: 100,
    },
  }

  // If viewing all projects, show the aggregated view
  if (selectedProject === "all-projects") {
    return (
      <AllProjectsOverview
        projectData={allProjectsData}
        filter={allProjectsFilter}
        onFilterChange={setAllProjectsFilter}
        timePeriod={timePeriod}
        onTimePeriodChange={setTimePeriod}
      />
    )
  }

  const currentProject =
    allProjectsData[selectedProject as keyof typeof allProjectsData] || allProjectsData["veza-dagster"]
  const isOneTime = currentProject.type === "one-time"

  const deliveryCost = isOneTime
    ? currentProject.hoursSpent * currentProject.averageHourlyRate
    : (currentProject as any).hoursSpentThisMonth * currentProject.averageHourlyRate

  const revenue = isOneTime ? currentProject.sowPrice : (currentProject as any).monthlyRetainer
  const profit = revenue - deliveryCost
  const profitMargin = (profit / revenue) * 100

  const hoursProgress = isOneTime
    ? (currentProject.hoursSpent / currentProject.sowHours) * 100
    : ((currentProject as any).hoursSpentThisMonth / (currentProject as any).monthlyHours) * 100

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{currentProject.name}</h1>
          <p className="text-muted-foreground">Project Analytics Dashboard</p>
        </div>
        <Select value={timePeriod} onValueChange={setTimePeriod}>
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

      {/* Project Type and Core Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Project Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectTypeToggle value={currentProject.type} onChange={setProjectType} disabled={true} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {isOneTime ? "Total SOW Hours" : "Monthly Hours"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isOneTime ? currentProject.sowHours : (currentProject as any).monthlyHours}
            </div>
            <p className="text-xs text-muted-foreground">{isOneTime ? "Total allocated hours" : "Hours per month"}</p>
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
                <span className="text-2xl font-bold">
                  {isOneTime ? currentProject.hoursSpent : (currentProject as any).hoursSpentThisMonth}
                </span>
                <Badge variant={hoursProgress > 90 ? "destructive" : hoursProgress > 75 ? "secondary" : "default"}>
                  {hoursProgress.toFixed(1)}%
                </Badge>
              </div>
              <Progress value={hoursProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {isOneTime
                  ? `${currentProject.sowHours - currentProject.hoursSpent} hours remaining`
                  : `${(currentProject as any).monthlyHours - (currentProject as any).hoursSpentThisMonth} hours remaining this month`}
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
              {isOneTime ? "SOW Price" : "Monthly Retainer"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${revenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {isOneTime ? "Total project value" : "Monthly recurring revenue"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Delivery Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${deliveryCost.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Hours × ${currentProject.averageHourlyRate}/hr avg rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Profit Margin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-2xl font-bold flex items-center gap-2">
                {profitMargin.toFixed(1)}%
                <Badge variant={profitMargin > 50 ? "default" : profitMargin > 25 ? "secondary" : "destructive"}>
                  ${profit.toLocaleString()}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">Revenue - Delivery Cost</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Duration and Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Project Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectDurationChart />
          </CardContent>
        </Card>

        <ProjectHealthCard profitMargin={profitMargin} revenue={revenue} deliveryCost={deliveryCost} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TeamUtilizationChart />
          </CardContent>
        </Card>
      </div>

      {/* Profitability Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Profitability Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProfitabilityChart />
        </CardContent>
      </Card>
    </div>
  )
}
