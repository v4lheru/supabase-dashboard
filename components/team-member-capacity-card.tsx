"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Clock, Briefcase, TrendingUp, TrendingDown } from "lucide-react"
import { TeamMemberAnalytics } from "@/lib/types"

interface TeamMemberCapacityCardProps {
  member: TeamMemberAnalytics
}

export function TeamMemberCapacityCard({ member }: TeamMemberCapacityCardProps) {
  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 100) return "text-red-600"
    if (utilization >= 90) return "text-yellow-600"
    if (utilization >= 70) return "text-green-600"
    return "text-red-600" // Below 70% is also red
  }

  const getLoadColor = (load: number) => {
    if (load >= 100) return "text-red-600"
    if (load >= 90) return "text-yellow-600"
    if (load >= 70) return "text-green-600"
    return "text-red-600"
  }

  const getAvailabilityColor = (availability: number) => {
    if (availability >= 70) return "text-green-600"
    if (availability >= 30) return "text-yellow-600"
    return "text-red-600"
  }

  const upcomingWeekAvailability = Math.max(0, 100 - member.utilizationThisWeek)
  const upcomingMonthAvailability = Math.max(0, 100 - member.utilizationThisMonth)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src="/placeholder-user.jpg" />
            <AvatarFallback>
              {member.display_name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-base">{member.display_name}</CardTitle>
            <p className="text-sm text-muted-foreground">{member.role}</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">{member.weekly_hours}h/week</div>
            <div className="text-xs text-muted-foreground">Capacity</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Utilization Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Previous Week</div>
            <div className={`text-lg font-bold ${getUtilizationColor(member.utilizationLastWeek)}`}>
              {member.utilizationLastWeek}%
            </div>
            <div className="flex items-center gap-1">
              {member.utilizationLastWeek > member.utilization3MonthAvg ? (
                <TrendingUp className="h-3 w-3 text-red-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-green-500" />
              )}
              <span className="text-xs text-muted-foreground">vs 3mo avg</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">3-Month Average</div>
            <div className={`text-lg font-bold ${getUtilizationColor(member.utilization3MonthAvg)}`}>
              {member.utilization3MonthAvg}%
            </div>
            <div className="text-xs text-muted-foreground">Utilization</div>
          </div>
        </div>

        {/* Upcoming Capacity - Estimate Based */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Planned Capacity
          </h4>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Next Week</span>
              <span className={getAvailabilityColor(Math.max(0, 100 - member.plannedUtilizationNextWeek))}>
                {Math.max(0, 100 - member.plannedUtilizationNextWeek)}% available
              </span>
            </div>
            <Progress value={member.plannedUtilizationNextWeek} className="h-1.5" />
            <div className="text-xs text-muted-foreground">
              {member.estimatedHoursNextWeek}h estimated
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Next Month</span>
              <span className={getAvailabilityColor(Math.max(0, 100 - member.plannedUtilizationNextMonth))}>
                {Math.max(0, 100 - member.plannedUtilizationNextMonth)}% available
              </span>
            </div>
            <Progress value={member.plannedUtilizationNextMonth} className="h-1.5" />
            <div className="text-xs text-muted-foreground">
              {member.estimatedHoursNextMonth}h estimated
            </div>
          </div>

          {/* Efficiency Metrics */}
          <div className="pt-2 border-t">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Estimate Coverage:</span>
                <span className="ml-1 font-medium">{member.estimateCoverage}%</span>
              </div>
              <div>
                <span className="text-muted-foreground">Efficiency:</span>
                <span className="ml-1 font-medium">{member.efficiencyRatio}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Current Projects */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Current Projects
          </h4>
          <div className="space-y-2">
            {member.currentProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active projects</p>
            ) : (
              member.currentProjects.slice(0, 3).map((project, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-sm truncate">{project.projectName}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {project.averageWeeklyHours}h/week
                  </Badge>
                </div>
              ))
            )}
            {member.currentProjects.length > 3 && (
              <p className="text-xs text-muted-foreground">
                +{member.currentProjects.length - 3} more projects
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
