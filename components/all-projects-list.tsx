"use client"

import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface AllProjectsListProps {
  projects: any[]
}

export function AllProjectsList({ projects }: AllProjectsListProps) {
  return (
    <div className="space-y-4">
      {projects.map((project, index) => {
        const isOneTime = project.type === "one-time"
        const revenue = isOneTime ? project.sowPrice : project.monthlyRetainer
        const hoursSpent = isOneTime ? project.hoursSpent : project.hoursSpentThisMonth
        const hoursAllocated = isOneTime ? project.sowHours : project.monthlyHours
        const deliveryCost = hoursSpent * project.averageHourlyRate
        const profit = revenue - deliveryCost
        const margin = (profit / revenue) * 100
        const hoursProgress = (hoursSpent / hoursAllocated) * 100

        return (
          <div key={index} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h4 className="font-medium">{project.name}</h4>
                <Badge variant="outline" className="text-xs">
                  {project.type === "one-time" ? "One-time" : "Retainer"}
                </Badge>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">${revenue.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">{margin.toFixed(1)}% margin</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Hours Progress</div>
                <div className="flex items-center gap-2">
                  <Progress value={hoursProgress} className="h-1.5 flex-1" />
                  <span className="text-xs">
                    {hoursSpent}/{hoursAllocated}h
                  </span>
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Profit</div>
                <div className={`font-medium ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                  ${profit.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
