"use client"

import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function TeamUtilizationChart() {
  // Mock data - in real app, this would come from props or context
  const totalRetainerHours = 160 // Total monthly retainer hours for the project
  const totalHoursSpent = 142 // Total hours spent this month
  const overallUtilization = (totalHoursSpent / totalRetainerHours) * 100

  const teamMembers = [
    { name: "Alex Johnson", role: "Developer", hoursSpent: 45, allocation: 50, utilization: 90 },
    { name: "Sarah Chen", role: "Designer", hoursSpent: 38, allocation: 40, utilization: 95 },
    { name: "Mike Rodriguez", role: "PM", hoursSpent: 32, allocation: 35, utilization: 91 },
    { name: "Emma Wilson", role: "QA", hoursSpent: 27, allocation: 35, utilization: 77 },
  ]

  // Sort by utilization to show most utilized first
  const sortedTeamMembers = [...teamMembers].sort((a, b) => b.utilization - a.utilization)

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
          <span>{totalHoursSpent}h spent</span>
          <span>{totalRetainerHours}h allocated</span>
        </div>
      </div>

      {/* Individual Team Member Utilization */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">Team Member Utilization</h4>
        {sortedTeamMembers.map((member, index) => (
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
                  <span className="text-muted-foreground">({member.role})</span>
                  {index === 0 && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Most Utilized</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {member.hoursSpent}h / {member.allocation}h
                </span>
              </div>
              <Progress value={member.utilization} className="h-1.5" />
            </div>
            <div className="text-sm font-medium w-12 text-right">{member.utilization}%</div>
          </div>
        ))}
      </div>
    </div>
  )
}
