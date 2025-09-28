"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calendar, TrendingUp, Clock, DollarSign, Target, CheckCircle } from "lucide-react"
import { getProjectAnalytics } from "@/lib/api-client"
import { ClientMapping, ProjectAnalytics } from "@/lib/types"
import { calculateProjectHealth, ProjectHealthStatus, getNoDataHealth } from "@/lib/project-health"

interface ProjectLifecycleStage {
  stage: string
  percentage: number
  status: 'completed' | 'current' | 'upcoming'
  description: string
}

interface OneTimeProjectCardProps {
  client: ClientMapping
}

function OneTimeProjectCard({ client }: OneTimeProjectCardProps) {
  const [projectData, setProjectData] = useState<ProjectAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProjectData() {
      try {
        const analytics = await getProjectAnalytics(client.client_name, 'all-time')
        setProjectData(analytics)
      } catch (error) {
        console.error('Error fetching project data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProjectData()
  }, [client.client_name])

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{client.client_name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-8 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!projectData) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{client.client_name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No project data available</p>
        </CardContent>
      </Card>
    )
  }

  const { metrics } = projectData
  const health = calculateProjectHealth(metrics.profitMargin)

  // Calculate project lifecycle stages based on completion percentage
  const completionPercentage = metrics.utilizationPercentage
  const stages: ProjectLifecycleStage[] = [
    {
      stage: "Planning",
      percentage: 10,
      status: completionPercentage > 10 ? 'completed' : completionPercentage > 0 ? 'current' : 'upcoming',
      description: "Project setup and planning"
    },
    {
      stage: "Development",
      percentage: 70,
      status: completionPercentage > 70 ? 'completed' : completionPercentage > 10 ? 'current' : 'upcoming',
      description: "Main development work"
    },
    {
      stage: "Review",
      percentage: 90,
      status: completionPercentage > 90 ? 'completed' : completionPercentage > 70 ? 'current' : 'upcoming',
      description: "Testing and review phase"
    },
    {
      stage: "Delivery",
      percentage: 100,
      status: completionPercentage >= 100 ? 'completed' : completionPercentage > 90 ? 'current' : 'upcoming',
      description: "Final delivery and handover"
    }
  ]

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{client.client_name}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">One-Time</Badge>
            <Badge variant={
              client.status === 'Active' ? 'default' :
              client.status === 'Not Active' ? 'destructive' :
              client.status === 'Paused' ? 'secondary' :
              client.status === 'Completed' ? 'outline' :
              'outline'
            }>
              {client.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Project Progress Overview */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="text-sm font-medium">Project Progress</span>
            </div>
            <span className="text-sm font-semibold">{completionPercentage.toFixed(1)}%</span>
          </div>
          <Progress value={completionPercentage} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{metrics.hoursSpent}h spent</span>
            <span>{metrics.hoursRemaining}h remaining</span>
          </div>
        </div>

        {/* Project Lifecycle Stages */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">Project Stages</span>
          </div>
          <div className="space-y-2">
            {stages.map((stage, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  stage.status === 'completed' ? 'bg-green-100 text-green-700 border-2 border-green-500' :
                  stage.status === 'current' ? 'bg-blue-100 text-blue-700 border-2 border-blue-500' :
                  'bg-gray-100 text-gray-500 border-2 border-gray-300'
                }`}>
                  {stage.status === 'completed' ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${
                      stage.status === 'current' ? 'text-blue-700' : 
                      stage.status === 'completed' ? 'text-green-700' : 
                      'text-gray-500'
                    }`}>
                      {stage.stage}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {stage.percentage}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{stage.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div>
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp className="h-3 w-3" />
              <span className="text-xs text-muted-foreground">Profit Margin</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">
                {metrics.profitMargin.toFixed(1)}%
              </span>
              <span className="text-lg">{health.emoji}</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1 mb-1">
              <DollarSign className="h-3 w-3" />
              <span className="text-xs text-muted-foreground">Total Value</span>
            </div>
            <div className="text-lg font-semibold">
              ${metrics.totalRevenue.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Project Stats */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Hours:</span>
            <span className="font-medium">{metrics.totalHours}h allocated</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Delivery Cost:</span>
            <span className="font-medium">${metrics.deliveryCost.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tasks:</span>
            <span className="font-medium">{metrics.completedTasks}/{metrics.taskCount} completed</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface OneTimeProjectsHistoricalViewProps {
  clients: ClientMapping[]
}

export function OneTimeProjectsHistoricalView({ clients }: OneTimeProjectsHistoricalViewProps) {
  const filteredClients = clients.filter(client => client.project_type === 'One-Time')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">One-Time Projects - Project Overview</h2>
          <p className="text-muted-foreground">
            Project lifecycle and completion status for {filteredClients.length} projects
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <OneTimeProjectCard key={client.id} client={client} />
        ))}
      </div>

      {filteredClients.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              No one-time projects found
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
