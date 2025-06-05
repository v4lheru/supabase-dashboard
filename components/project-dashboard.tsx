"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Clock, DollarSign, TrendingUp, Calendar, Users, Target } from "lucide-react"
import { ProjectTypeToggle } from "@/components/project-type-toggle"
import { OverdueTasksCompact } from "@/components/overdue-tasks-compact"
import { TeamUtilizationChart } from "@/components/team-utilization-chart"
import { FinancialBurnRateChart } from "@/components/financial-burn-rate-chart"
import { ProfitabilityChart } from "@/components/profitability-chart"
import { ProjectHealthCard } from "@/components/project-health-card"
import { AllProjectsOverview } from "@/components/all-projects-overview"
import { ProjectsHistoricalView } from "@/components/projects-historical-view"
import { ProjectTypeDashboard } from "@/components/project-type-dashboard"
import { getProjectAnalytics, getAllProjectsAnalytics, getClientMappings, getCompanyProjectsAnalytics } from "@/lib/data-services"
import { ProjectAnalytics, ProjectTypeFilter, ProjectStatusFilter, ClientMapping } from "@/lib/types"

interface ProjectDashboardProps {
  selectedProject: string
}

export function ProjectDashboard({ selectedProject }: ProjectDashboardProps) {
  // Set default time period based on project type
  const getDefaultTimePeriod = (projectType: string, clientData?: ClientMapping) => {
    // For individual projects, check the client's project type (handle database variations)
    if (clientData?.project_type === "On-going" || clientData?.project_type === "On-Going") return "this-month"
    if (clientData?.project_type === "One-Time") return "all-time"
    
    // For project type views (including new Veza/Shadow options)
    if (projectType === "on-going" || projectType === "veza-ongoing" || projectType === "shadow-ongoing") return "this-month"
    if (projectType === "one-time" || projectType === "veza-onetime" || projectType === "shadow-onetime") return "all-time"
    
    return "all-time"
  }

  // Initialize with the correct default period immediately
  const getInitialTimePeriod = () => {
    return getDefaultTimePeriod(selectedProject)
  }

  const [timePeriod, setTimePeriod] = useState(getInitialTimePeriod())
  const [statusFilter, setStatusFilter] = useState<ProjectStatusFilter>("all")
  const [projectAnalytics, setProjectAnalytics] = useState<ProjectAnalytics | null>(null)
  const [allProjectsData, setAllProjectsData] = useState<ProjectAnalytics[]>([])
  const [allClients, setAllClients] = useState<ClientMapping[]>([])
  const [loading, setLoading] = useState(true)
  const [hasSetInitialPeriod, setHasSetInitialPeriod] = useState(false)

  // 🔄 Set correct time period when project changes
  useEffect(() => {
    const isProjectTypeView = ["on-going", "one-time", "veza-ongoing", "veza-onetime", "shadow-ongoing", "shadow-onetime"].includes(selectedProject)
    
    // Always set the correct default period when switching projects
    const defaultPeriod = getDefaultTimePeriod(selectedProject)
    setTimePeriod(defaultPeriod)
    
    if (isProjectTypeView) {
      setHasSetInitialPeriod(true)
    } else {
      // Reset flag for individual projects so they can set their own period based on client data
      setHasSetInitialPeriod(false)
    }
  }, [selectedProject])

  // 🔄 Set initial time period for individual projects only once when analytics load
  useEffect(() => {
    const isProjectTypeView = ["on-going", "one-time", "veza-ongoing", "veza-onetime", "shadow-ongoing", "shadow-onetime"].includes(selectedProject)
    if (projectAnalytics?.client && !isProjectTypeView && !hasSetInitialPeriod) {
      const defaultPeriod = getDefaultTimePeriod(selectedProject, projectAnalytics.client)
      setTimePeriod(defaultPeriod)
      setHasSetInitialPeriod(true)
    }
  }, [projectAnalytics, selectedProject, hasSetInitialPeriod])

  // 🔄 Fetch project data when selectedProject, timePeriod, or statusFilter changes
  useEffect(() => {
    async function fetchProjectData() {
      setLoading(true)
      try {
        console.log('🔍 Fetching data for project:', selectedProject, 'period:', timePeriod, 'status:', statusFilter)

        // Always fetch client mappings for historical view
        const clients = await getClientMappings()
        setAllClients(clients)

        // Handle new company-specific project types
        if (selectedProject === "veza-ongoing") {
          const vezaOngoingData = await getCompanyProjectsAnalytics('veza', 'On-going', statusFilter, timePeriod)
          setAllProjectsData(vezaOngoingData)
          setProjectAnalytics(null)
        } else if (selectedProject === "veza-onetime") {
          const vezaOneTimeData = await getCompanyProjectsAnalytics('veza', 'One-Time', statusFilter, timePeriod)
          setAllProjectsData(vezaOneTimeData)
          setProjectAnalytics(null)
        } else if (selectedProject === "shadow-ongoing") {
          const shadowOngoingData = await getCompanyProjectsAnalytics('shadow', 'On-going', statusFilter, timePeriod)
          setAllProjectsData(shadowOngoingData)
          setProjectAnalytics(null)
        } else if (selectedProject === "shadow-onetime") {
          const shadowOneTimeData = await getCompanyProjectsAnalytics('shadow', 'One-Time', statusFilter, timePeriod)
          setAllProjectsData(shadowOneTimeData)
          setProjectAnalytics(null)
        } else if (selectedProject === "on-going") {
          const ongoingData = await getAllProjectsAnalytics('On-going', statusFilter, timePeriod)
          setAllProjectsData(ongoingData)
          setProjectAnalytics(null)
        } else if (selectedProject === "one-time") {
          const oneTimeData = await getAllProjectsAnalytics('One-Time', statusFilter, timePeriod)
          setAllProjectsData(oneTimeData)
          setProjectAnalytics(null)
        } else {
          // Individual client project
          const analytics = await getProjectAnalytics(selectedProject, timePeriod)
          setProjectAnalytics(analytics)
          setAllProjectsData([])
        }

        console.log('✅ Data fetched successfully for:', selectedProject)
      } catch (error) {
        console.error('💥 Failed to fetch project data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProjectData()
  }, [selectedProject, timePeriod, statusFilter])

  // 📊 Show loading state
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Loading...</h1>
            <p className="text-muted-foreground">Fetching project analytics</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // 📈 Show tabbed dashboard for project types (including company-specific views)
  const isProjectTypeView = ["on-going", "one-time", "veza-ongoing", "veza-onetime", "shadow-ongoing", "shadow-onetime"].includes(selectedProject)
  
  if (isProjectTypeView) {
    // Determine project type and company for display
    let projectType: "On-going" | "One-Time"
    let companyName = ""
    
    if (selectedProject === "veza-ongoing") {
      projectType = "On-going"
      companyName = " Veza"
    } else if (selectedProject === "veza-onetime") {
      projectType = "One-Time"
      companyName = " Veza"
    } else if (selectedProject === "shadow-ongoing") {
      projectType = "On-going"
      companyName = " Shadow"
    } else if (selectedProject === "shadow-onetime") {
      projectType = "One-Time"
      companyName = " Shadow"
    } else {
      projectType = selectedProject === "on-going" ? "On-going" : "One-Time"
    }
    
    return (
      <ProjectTypeDashboard
        projectType={projectType}
        companyName={companyName}
        allProjectsData={allProjectsData}
        allClients={allClients}
        statusFilter={statusFilter}
        timePeriod={timePeriod}
        onTimePeriodChange={setTimePeriod}
        onStatusFilterChange={setStatusFilter}
      />
    )
  }

  // 🎯 Show individual project view
  if (!projectAnalytics) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Project Not Found</h1>
            <p className="text-muted-foreground">No data available for {selectedProject}</p>
          </div>
        </div>
      </div>
    )
  }

  const { client, metrics, teamMembers } = projectAnalytics
  const isOneTime = client.project_type === "One-Time"
  const normalizedProjectType: 'On-going' | 'One-Time' = 
    (client.project_type === 'On-Going' || client.project_type === 'On-going') ? 'On-going' : 'One-Time'

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{client.client_name}</h1>
          <p className="text-muted-foreground">Project Analytics Dashboard</p>
        </div>
        <Select value={timePeriod} onValueChange={setTimePeriod}>
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

      {/* Project Type and Core Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Project Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {client.project_type === 'On-going' ? 'Ongoing Project' : 'One-Time Project'}
            </div>
            <div className="mt-2">
              <Badge 
                variant={
                  client.status === 'Active' ? 'default' :
                  client.status === 'Not Active' ? 'destructive' :
                  client.status === 'Paused' ? 'secondary' :
                  client.status === 'Completed' ? 'outline' :
                  'secondary'
                }
                className="text-sm px-3 py-1"
              >
                {client.status || 'Status not set'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {isOneTime ? "Total Allocated Hours" : "Monthly Hours"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalHours}</div>
            <p className="text-xs text-muted-foreground">
              {isOneTime ? "Total allocated hours" : "Hours per month"}
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
                <span className="text-2xl font-bold">{metrics.hoursSpent}</span>
                <Badge variant={
                  metrics.utilizationPercentage > 90 ? "destructive" : 
                  metrics.utilizationPercentage > 75 ? "secondary" : "default"
                }>
                  {metrics.utilizationPercentage.toFixed(1)}%
                </Badge>
              </div>
              <Progress value={metrics.utilizationPercentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {metrics.hoursRemaining} hours remaining
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
              {isOneTime ? "Total Revenue" : "Monthly Revenue"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.totalRevenue.toLocaleString()}</div>
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
            <div className="text-2xl font-bold">${metrics.deliveryCost.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.hoursSpent}h × ${metrics.averageHourlyRate}/hr avg rate
            </p>
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
                {metrics.profitMargin.toFixed(1)}%
                <Badge variant={
                  metrics.profitMargin > 50 ? "default" : 
                  metrics.profitMargin > 25 ? "secondary" : "destructive"
                }>
                  ${metrics.profit.toLocaleString()}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">Revenue - Delivery Cost</p>
            </div>
          </CardContent>
        </Card>
      </div>





      {/* Additional Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Overdue Tasks & Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OverdueTasksCompact 
              tasks={projectAnalytics.tasks}
              projectType={normalizedProjectType}
            />
          </CardContent>
        </Card>

        <ProjectHealthCard 
          profitMargin={metrics.profitMargin} 
          revenue={metrics.totalRevenue} 
          deliveryCost={metrics.deliveryCost} 
        />
      </div>

      {/* Team Utilization - Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Detailed Team Utilization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Utilization Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TeamUtilizationChart 
              teamMembers={teamMembers}
              totalAllocatedHours={metrics.totalHours}
              totalSpentHours={metrics.hoursSpent}
              projectType={normalizedProjectType}
            />
          </CardContent>
        </Card>

        {/* Financial Burn Rate & Forecasting */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Financial Burn Rate & Forecasting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FinancialBurnRateChart 
              teamMembers={teamMembers}
              metrics={metrics}
              projectType={normalizedProjectType}
            />
          </CardContent>
        </Card>
      </div>


    </div>
  )
}
