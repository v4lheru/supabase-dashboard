"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react"

interface ProjectHealthCardProps {
  profitMargin: number
  revenue: number
  deliveryCost: number
}

export function ProjectHealthCard({ profitMargin, revenue, deliveryCost }: ProjectHealthCardProps) {
  const getHealthStatus = (margin: number) => {
    if (margin >= 50) {
      return {
        status: "Excellent",
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        icon: CheckCircle,
        description: "Project is highly profitable",
      }
    } else if (margin >= 25) {
      return {
        status: "Good",
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
        icon: AlertTriangle,
        description: "Project is moderately profitable",
      }
    } else {
      return {
        status: "At Risk",
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        icon: XCircle,
        description: "Project profitability is concerning",
      }
    }
  }

  const health = getHealthStatus(profitMargin)
  const IconComponent = health.icon
  const profit = revenue - deliveryCost

  return (
    <Card className={`${health.bgColor} ${health.borderColor} border-2`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <IconComponent className={`h-4 w-4 ${health.color}`} />
          Project Health
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Health Status */}
        <div className="flex items-center justify-between">
          <div>
            <div className={`text-2xl font-bold ${health.color}`}>{health.status}</div>
            <p className="text-xs text-muted-foreground">{health.description}</p>
          </div>
          <Badge variant="outline" className={`${health.color} ${health.bgColor} border-current`}>
            {profitMargin.toFixed(1)}% Margin
          </Badge>
        </div>

        {/* Financial Breakdown */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Revenue</span>
            <span className="font-medium">${revenue.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Delivery Cost</span>
            <span className="font-medium">-${deliveryCost.toLocaleString()}</span>
          </div>
          <div className="border-t pt-2">
            <div className="flex justify-between text-sm font-medium">
              <span>Net Profit</span>
              <span className={profit >= 0 ? "text-green-600" : "text-red-600"}>${profit.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Health Indicators */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="space-y-1">
            <div
              className={`w-3 h-3 rounded-full mx-auto ${profitMargin >= 50 ? "bg-green-500" : "bg-gray-200"}`}
            ></div>
            <div className="text-xs text-muted-foreground">{"≥50%"}</div>
          </div>
          <div className="space-y-1">
            <div
              className={`w-3 h-3 rounded-full mx-auto ${profitMargin >= 25 && profitMargin < 50 ? "bg-yellow-500" : "bg-gray-200"}`}
            ></div>
            <div className="text-xs text-muted-foreground">25-50%</div>
          </div>
          <div className="space-y-1">
            <div className={`w-3 h-3 rounded-full mx-auto ${profitMargin < 25 ? "bg-red-500" : "bg-gray-200"}`}></div>
            <div className="text-xs text-muted-foreground">{"<25%"}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
