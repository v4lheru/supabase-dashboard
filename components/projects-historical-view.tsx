"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calendar, TrendingUp, Clock, DollarSign } from "lucide-react"
import { getProjectAnalytics, getClientTasksForMonth, calculateProjectMetrics } from "@/lib/data-services"
import { ClientMapping, ProjectAnalytics } from "@/lib/types"
import { calculateProjectHealth, ProjectHealthStatus, getNoDataHealth } from "@/lib/project-health"

interface MonthlyHealth {
  month: string
  year: number
  profitMargin: number
  revenue: number
  hoursSpent: number
  health: ProjectHealthStatus
}

interface ProjectHistoricalCardProps {
  client: ClientMapping
}

function ProjectHistoricalCard({ client }: ProjectHistoricalCardProps) {
  const [monthlyData, setMonthlyData] = useState<MonthlyHealth[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchHistoricalData() {
      try {
        const last6Months: MonthlyHealth[] = []
        const now = new Date()
        
        // Generate last 6 months
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const year = date.getFullYear()
          const monthIndex = date.getMonth()
          const month = date.toLocaleString('default', { month: 'short' })
          
          try {
            // Fetch tasks for this specific month
            const monthlyTasks = await getClientTasksForMonth(client.client_name, year, monthIndex)
            
            if (monthlyTasks.length > 0) {
              // Calculate metrics for this month
              const metrics = calculateProjectMetrics(client, monthlyTasks)
              const health = calculateProjectHealth(metrics.profitMargin)
              
              last6Months.push({
                month,
                year,
                profitMargin: metrics.profitMargin,
                revenue: client.project_type === 'On-going' ? client.revenue || 0 : metrics.totalRevenue,
                hoursSpent: metrics.hoursSpent,
                health
              })
            } else {
              // No data for this month
              const noDataHealth = getNoDataHealth()
              last6Months.push({
                month,
                year,
                profitMargin: 0,
                revenue: 0,
                hoursSpent: 0,
                health: noDataHealth
              })
            }
          } catch (error) {
            console.error(`Error fetching data for ${client.client_name} ${year}-${monthIndex + 1}:`, error)
            // Fallback to no data
            const noDataHealth = getNoDataHealth()
            last6Months.push({
              month,
              year,
              profitMargin: 0,
              revenue: 0,
              hoursSpent: 0,
              health: noDataHealth
            })
          }
        }
        
        setMonthlyData(last6Months)
      } catch (error) {
        console.error('Error fetching historical data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchHistoricalData()
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

  const currentMonth = monthlyData[monthlyData.length - 1]
  const totalRevenue = monthlyData.reduce((sum, month) => sum + month.revenue, 0)
  const totalHours = monthlyData.reduce((sum, month) => sum + month.hoursSpent, 0)

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{client.client_name}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={
              client.project_type === 'On-going' ? 'default' : 'secondary'
            }>
              {client.project_type}
            </Badge>
            <Badge variant={
              client.status === 'Active' ? 'default' :
              client.status === 'Not Active' ? 'destructive' :
              client.status === 'Paused' ? 'secondary' :
              'outline'
            }>
              {client.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 6-Month Health Timeline */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">Last 6 Months</span>
          </div>
          <div className="grid grid-cols-6 gap-1">
            {monthlyData.map((month, index) => (
              <div key={index} className="text-center">
                <div className="text-xs text-muted-foreground mb-1">
                  {month.month}
                </div>
                <div 
                  className="h-8 rounded flex items-center justify-center text-lg border"
                  style={{
                    backgroundColor: month.health.emoji === '🟢' ? '#dcfce7' :
                                   month.health.emoji === '🟡' ? '#fef3c7' :
                                   month.health.emoji === '🔴' ? '#fee2e2' : '#f3f4f6',
                    borderColor: month.health.emoji === '🟢' ? '#16a34a' :
                               month.health.emoji === '🟡' ? '#d97706' :
                               month.health.emoji === '🔴' ? '#dc2626' : '#d1d5db'
                  }}
                  title={`${month.month} ${month.year}: ${month.health.label} (${month.profitMargin.toFixed(1)}%)`}
                >
                  {month.health.emoji}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Current Month Summary */}
        {currentMonth && (
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div>
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp className="h-3 w-3" />
                <span className="text-xs text-muted-foreground">Current Margin</span>
              </div>
              <div className="text-lg font-semibold">
                {currentMonth.profitMargin.toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1 mb-1">
                <DollarSign className="h-3 w-3" />
                <span className="text-xs text-muted-foreground">6M Revenue</span>
              </div>
              <div className="text-lg font-semibold">
                ${totalRevenue.toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">6M Hours:</span>
            <span className="font-medium">{totalHours.toFixed(1)}h</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Avg Monthly:</span>
            <span className="font-medium">{(totalHours / 6).toFixed(1)}h</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface ProjectsHistoricalViewProps {
  clients: ClientMapping[]
  projectType: 'On-going' | 'One-Time'
}

export function ProjectsHistoricalView({ clients, projectType }: ProjectsHistoricalViewProps) {
  const filteredClients = clients.filter(client => client.project_type === projectType)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{projectType} Projects - Historical View</h2>
          <p className="text-muted-foreground">
            Last 6 months performance overview for {filteredClients.length} projects
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <ProjectHistoricalCard key={client.id} client={client} />
        ))}
      </div>

      {filteredClients.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              No {projectType.toLowerCase()} projects found
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
