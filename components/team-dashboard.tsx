"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { TaskStatusBadge } from "@/components/task-status-badge"
import { CapacityMetricsCard } from "@/components/capacity-metrics-card"
import { TeamMemberCapacityCard } from "@/components/team-member-capacity-card"
import { Users, Clock, CheckCircle, AlertCircle, BarChart3 } from "lucide-react"
import { getTeamAnalytics } from "@/lib/api-client"
import { TeamAnalytics } from "@/lib/types"

interface TeamDashboardProps {
  teamId: string
}

export function TeamDashboard({ teamId }: TeamDashboardProps) {
  const [teamData, setTeamData] = useState<TeamAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTeamData() {
      setLoading(true)
      try {
        console.log('🔍 Fetching team data for:', teamId)
        const analytics = await getTeamAnalytics(teamId)
        setTeamData(analytics)
        console.log('✅ Team data fetched successfully')
      } catch (error) {
        console.error('💥 Failed to fetch team data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTeamData()
  }, [teamId])

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Loading...</h1>
            <p className="text-muted-foreground">Fetching team analytics</p>
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

  if (!teamData) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Team not found</h1>
            <p className="text-muted-foreground">No data available for {teamId}</p>
          </div>
        </div>
      </div>
    )
  }

  // Map task status from ClickUp to our badge format
  const mapTaskStatus = (status: string): "todo" | "in-progress" | "waiting-approval" | "completed" => {
    if (status === 'complete' || status === 'approved') return 'completed'
    if (status === 'in progress' || status === 'review') return 'in-progress'
    if (status === 'client review' || status === 'approval') return 'waiting-approval'
    return 'todo'
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{teamData.teamName} Team</h1>
          <p className="text-muted-foreground">
            {teamData.totalMembers} team member{teamData.totalMembers !== 1 ? "s" : ""} • {teamData.totalActiveTasks} active
            tasks • {teamData.totalWeeklyCapacity}h weekly capacity
          </p>
        </div>
      </div>

      {/* Team Capacity Overview */}
      <CapacityMetricsCard
        totalCapacity={teamData.totalWeeklyCapacity}
        previousWeekUtilization={teamData.teamUtilizationLastWeek}
        previousMonthUtilization={teamData.teamUtilization3MonthAvg}
        upcomingWeekCapacity={teamData.upcomingWeekCapacity}
        upcomingTwoWeeksCapacity={teamData.upcomingTwoWeeksCapacity}
        upcomingMonthCapacity={teamData.upcomingMonthCapacity}
        teamSize={teamData.totalMembers}
      />

      {/* Team Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamData.totalMembers}</div>
            <p className="text-xs text-muted-foreground">Active team members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Active Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamData.totalActiveTasks}</div>
            <p className="text-xs text-muted-foreground">Tasks in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Completed This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamData.totalCompletedTasksThisWeek}</div>
            <p className="text-xs text-muted-foreground">Tasks completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Team Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{teamData.teamProgress.toFixed(1)}%</div>
              <Progress value={teamData.teamProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {teamData.totalCompletedTasksThisWeek} of {teamData.totalTasksThisWeek} tasks
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Task Status Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{teamData.tasksByStatus.todo}</div>
              <TaskStatusBadge status="todo" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{teamData.tasksByStatus.inProgress}</div>
              <TaskStatusBadge status="in-progress" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{teamData.tasksByStatus.waitingApproval}</div>
              <TaskStatusBadge status="waiting-approval" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{teamData.tasksByStatus.completed}</div>
              <TaskStatusBadge status="completed" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Member Capacity Cards */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Team Member Capacity & Projects
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {teamData.members.map((member) => (
            <TeamMemberCapacityCard key={member.id} member={member} />
          ))}
        </div>
      </div>

      {/* Team Members and Their Tasks */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Active Tasks by Team Member</h2>
        {teamData.members.map((member) => (
          <Card key={member.id}>
            <CardHeader>
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
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{member.display_name}</h3>
                      <p className="text-sm text-muted-foreground">{member.role}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {member.completedTasksThisWeek}/{member.totalTasksThisWeek} tasks
                      </div>
                      <div className="text-xs text-muted-foreground">This week</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {member.activeTasks.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No active tasks</p>
                ) : (
                  member.activeTasks.slice(0, 5).map((task) => (
                    <div key={task.task_id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm">{task.task_name}</h4>
                          <TaskStatusBadge status={mapTaskStatus(task.status)} />
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Project: {task.project}</span>
                          {task.due_date && (
                            <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                          )}
                          {task.priority && (
                            <span
                              className={`capitalize ${
                                task.priority === "high"
                                  ? "text-red-600"
                                  : task.priority === "medium"
                                    ? "text-yellow-600"
                                    : "text-green-600"
                              }`}
                            >
                              {task.priority} priority
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {member.activeTasks.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{member.activeTasks.length - 5} more tasks
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
