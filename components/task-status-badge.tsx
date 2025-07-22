"use client"

import { Badge } from "@/components/ui/badge"

type TaskStatus = "todo" | "in-progress" | "waiting-approval" | "completed"

interface TaskStatusBadgeProps {
  status: TaskStatus
}

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  const getStatusConfig = (status: TaskStatus) => {
    switch (status) {
      case "todo":
        return {
          label: "To Do",
          className: "border-gray-300 text-gray-700 bg-gray-50",
        }
      case "in-progress":
        return {
          label: "In Progress",
          className: "bg-blue-100 text-blue-800 border-blue-200",
        }
      case "waiting-approval":
        return {
          label: "Waiting Approval",
          className: "bg-yellow-100 text-yellow-800 border-yellow-200",
        }
      case "completed":
        return {
          label: "Completed",
          className: "bg-green-100 text-green-800 border-green-200",
        }
    }
  }

  const config = getStatusConfig(status)

  return (
    <Badge className={config.className}>
      {config.label}
    </Badge>
  )
}
