"use client"

import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { TeamMember } from "@/lib/types"

interface TeamUtilizationChartProps {
  teamMembers: TeamMember[]
  totalAllocatedHours: number
  totalSpentHours: number
  projectType: 'On-going' | 'One-Time'
}

export function TeamUtilizationChart({ 
  teamMembers, 
  totalAllocatedHours, 
  totalSpentHours,
  projectType 
}: TeamUtilizationChartProps) {
  // Calculate overall utilization
  const overallUtilization = totalAllocatedHours > 0 ? (totalSpentHours / totalAllocatedHours) * 100 : 0

  // Sort by utilization to show most utilized first
  const sortedTeamMembers = [...teamMembers].sort((a, b) => b.utilizationPercentage - a.utilizationPercentage)

  // Show top 5 team members
  const displayMembers = sortedTeamMembers.slice(0, 5)

  if (teamMembers.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p>No team member data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overall Project Utilization */}
      <div className="p-4 bg-muted rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium">Overall Project Utilization</span>
          <span className="text-lg font-bold">{overallUtilization.toFixed(1)}%</span>
        </div>
        <Progress value={overallUtilization} className="h-3" />
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>{totalSpentHours.toFixed(1)}h spent</span>
          <span>{totalAllocatedHours}h allocated</span>
        </div>
      </div>

      {/* Individual Team Member Utilization */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">
          Team Member Utilization {projectType === 'One-Time' ? '(Total Project)' : '(This Month)'}
        </h4>
        {displayMembers.map((member, index) => {
          // For one-time projects, show total hours; for ongoing, show monthly hours
          const displayHours = projectType === 'One-Time' ? member.hoursSpent : member.hoursSpentThisMonth
          const displayTasks = projectType === 'One-Time' ? member.taskCount : member.taskCountThisMonth
          
          return (
            <div key={member.name} className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {member.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{member.name}</span>
                    {index === 0 && sortedTeamMembers.length > 1 && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                        Most Utilized
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {displayHours.toFixed(1)}h {projectType === 'One-Time' ? 'total' : 'this month'} • {displayTasks} tasks
                  </span>
                </div>
                <Progress value={Math.min(member.utilizationPercentage, 100)} className="h-1.5" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {projectType === 'One-Time' 
                      ? `Total: ${member.hoursSpent.toFixed(1)}h • ${member.taskCount} tasks`
                      : `All time: ${member.hoursSpent.toFixed(1)}h • ${member.taskCount} tasks`
                    }
                  </span>
                  <span className={`font-medium ${
                    member.utilizationPercentage > 100 ? 'text-red-600' : 
                    member.utilizationPercentage > 80 ? 'text-orange-600' : 
                    'text-green-600'
                  }`}>
                    {member.utilizationPercentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          )
        })}
        
        {teamMembers.length > 5 && (
          <div className="text-xs text-muted-foreground text-center pt-2">
            Showing top 5 of {teamMembers.length} team members
          </div>
        )}
        
        {/* Team Summary Stats */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total Team Members:</span>
              <span className="ml-2 font-medium">{teamMembers.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Total Tasks:</span>
              <span className="ml-2 font-medium">
                {teamMembers.reduce((sum, member) => sum + member.taskCount, 0)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Total Hours:</span>
              <span className="ml-2 font-medium">
                {teamMembers.reduce((sum, member) => sum + member.hoursSpent, 0).toFixed(1)}h
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">
                {projectType === 'One-Time' ? 'Project' : 'Monthly'} Tasks:
              </span>
              <span className="ml-2 font-medium">
                {teamMembers.reduce((sum, member) => 
                  sum + (projectType === 'One-Time' ? member.taskCount : member.taskCountThisMonth), 0
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
