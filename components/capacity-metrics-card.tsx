"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, Clock, Users, AlertTriangle, CheckCircle } from "lucide-react"

interface CapacityMetricsCardProps {
  totalCapacity: number
  previousWeekUtilization: number
  previousMonthUtilization: number
  upcomingWeekCapacity: number
  upcomingTwoWeeksCapacity: number
  upcomingMonthCapacity: number
  teamSize: number
}

export function CapacityMetricsCard({
  totalCapacity,
  previousWeekUtilization,
  previousMonthUtilization,
  upcomingWeekCapacity,
  upcomingTwoWeeksCapacity,
  upcomingMonthCapacity,
}: CapacityMetricsCardProps) {
  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 100) return "text-red-600"
    if (utilization >= 90) return "text-yellow-600"
    if (utilization >= 70) return "text-green-600"
    return "text-red-600" // Below 70% is also red
  }

  const getCapacityStatus = (capacity: number) => {
    if (capacity <= 10) return { color: "text-red-600", status: "Overloaded", icon: AlertTriangle }
    if (capacity <= 30) return { color: "text-yellow-600", status: "High Load", icon: Clock }
    return { color: "text-green-600", status: "Available", icon: CheckCircle }
  }

  const weekStatus = getCapacityStatus(upcomingWeekCapacity)
  const twoWeekStatus = getCapacityStatus(upcomingTwoWeeksCapacity)
  const monthStatus = getCapacityStatus(upcomingMonthCapacity)

  const WeekStatusIcon = weekStatus.icon
  const TwoWeekStatusIcon = twoWeekStatus.icon
  const MonthStatusIcon = monthStatus.icon

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Capacity Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {/* Total Weekly Capacity */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Weekly Capacity</div>
            <div className="text-2xl font-bold">{totalCapacity}h</div>
            <p className="text-xs text-muted-foreground">Total team capacity</p>
          </div>

          {/* Previous Week Utilization */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Previous Week</div>
            <div className={`text-2xl font-bold ${getUtilizationColor(previousWeekUtilization)}`}>
              {previousWeekUtilization}%
            </div>
            <div className="flex items-center gap-1">
              {previousWeekUtilization > previousMonthUtilization ? (
                <TrendingUp className="h-3 w-3 text-red-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-green-500" />
              )}
              <p className="text-xs text-muted-foreground">Utilization rate</p>
            </div>
          </div>

          {/* Previous Month Utilization */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Previous Month</div>
            <div className={`text-2xl font-bold ${getUtilizationColor(previousMonthUtilization)}`}>
              {previousMonthUtilization}%
            </div>
            <p className="text-xs text-muted-foreground">Average utilization</p>
          </div>

          {/* Upcoming Week Capacity */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Next Week</div>
            <div className={`text-2xl font-bold ${weekStatus.color}`}>{upcomingWeekCapacity}%</div>
            <div className="flex items-center gap-1">
              <WeekStatusIcon className={`h-3 w-3 ${weekStatus.color}`} />
              <p className={`text-xs ${weekStatus.color}`}>{weekStatus.status}</p>
            </div>
          </div>

          {/* Upcoming Month Capacity */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Next Month</div>
            <div className={`text-2xl font-bold ${monthStatus.color}`}>{upcomingMonthCapacity}%</div>
            <div className="flex items-center gap-1">
              <MonthStatusIcon className={`h-3 w-3 ${monthStatus.color}`} />
              <p className={`text-xs ${monthStatus.color}`}>{monthStatus.status}</p>
            </div>
          </div>
        </div>

        {/* Capacity Timeline */}
        <div className="mt-6 space-y-3">
          <h4 className="text-sm font-medium">Capacity Timeline</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Next Week</span>
              <span className={weekStatus.color}>{upcomingWeekCapacity}% available</span>
            </div>
            <Progress value={100 - upcomingWeekCapacity} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Next 2 Weeks</span>
              <span className={twoWeekStatus.color}>{upcomingTwoWeeksCapacity}% available</span>
            </div>
            <Progress value={100 - upcomingTwoWeeksCapacity} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Next Month</span>
              <span className={monthStatus.color}>{upcomingMonthCapacity}% available</span>
            </div>
            <Progress value={100 - upcomingMonthCapacity} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
