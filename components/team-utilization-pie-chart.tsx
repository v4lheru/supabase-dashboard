"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { TeamMember } from "@/lib/types"

interface TeamUtilizationPieChartProps {
  teamMembers: TeamMember[]
  projectType: 'On-going' | 'One-Time'
}

// Colors for the pie chart
const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
  '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0'
]

export function TeamUtilizationPieChart({ teamMembers, projectType }: TeamUtilizationPieChartProps) {
  if (teamMembers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>No team data available</p>
      </div>
    )
  }

  // Prepare data for pie chart - show hours distribution
  const pieData = teamMembers.map((member, index) => ({
    name: member.name,
    value: projectType === 'One-Time' ? member.hoursSpent : member.hoursSpentThisMonth,
    totalHours: member.hoursSpent,
    tasks: projectType === 'One-Time' ? member.taskCount : member.taskCountThisMonth,
    totalTasks: member.taskCount,
    color: COLORS[index % COLORS.length]
  })).filter(item => item.value > 0) // Only show members with hours

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-blue-600">
            {projectType === 'One-Time' ? 'Total Hours' : 'This Month'}: {data.value.toFixed(1)}h
          </p>
          <p className="text-sm text-gray-600">
            {projectType === 'One-Time' ? 'Total Tasks' : 'Monthly Tasks'}: {data.tasks}
          </p>
          {projectType === 'On-going' && (
            <p className="text-xs text-muted-foreground">
              All time: {data.totalHours.toFixed(1)}h • {data.totalTasks} tasks
            </p>
          )}
        </div>
      )
    }
    return null
  }

  // Calculate total hours for percentage display
  const totalHours = pieData.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h4 className="text-lg font-semibold">
          {projectType === 'One-Time' ? 'Total Hours' : 'Monthly Hours'} Distribution
        </h4>
        <p className="text-sm text-muted-foreground">
          {totalHours.toFixed(1)}h across {pieData.length} team members
        </p>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value, percent }) => 
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend with detailed info */}
      <div className="space-y-2">
        <h5 className="text-sm font-medium text-muted-foreground">Team Breakdown</h5>
        <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
          {pieData.map((member, index) => (
            <div key={member.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: member.color }}
                />
                <span className="font-medium">{member.name}</span>
              </div>
              <div className="text-right">
                <span className="text-muted-foreground">
                  {member.value.toFixed(1)}h • {member.tasks} tasks
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 pt-2 border-t">
        <div className="text-center">
          <div className="text-lg font-bold">{teamMembers.length}</div>
          <div className="text-xs text-muted-foreground">Team Members</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold">
            {teamMembers.reduce((sum, member) => 
              sum + (projectType === 'One-Time' ? member.taskCount : member.taskCountThisMonth), 0
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {projectType === 'One-Time' ? 'Total' : 'Monthly'} Tasks
          </div>
        </div>
      </div>
    </div>
  )
}
