"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Area, AreaChart } from 'recharts'
import { TeamMember, ProjectMetrics } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign } from "lucide-react"

interface FinancialBurnRateChartProps {
  teamMembers: TeamMember[]
  metrics: ProjectMetrics
  projectType: 'On-going' | 'One-Time'
}

export function FinancialBurnRateChart({ teamMembers, metrics, projectType }: FinancialBurnRateChartProps) {
  // Calculate actual burn rate based on real data
  const calculateActualBurnRate = () => {
    // Total cost spent so far
    const totalSpent = metrics.deliveryCost
    
    // Calculate average monthly burn (total spent / estimated months of work)
    // Estimate project duration based on hours
    const estimatedMonths = Math.max(1, Math.ceil(metrics.hoursSpent / 160)) // 160 hours per month
    const averageMonthlyBurn = totalSpent / estimatedMonths
    
    return {
      totalSpent,
      averageMonthlyBurn,
      estimatedMonths
    }
  }

  const { totalSpent, averageMonthlyBurn, estimatedMonths } = calculateActualBurnRate()
  
  // Generate realistic burn rate data based on actual spending
  const generateBurnRateData = () => {
    const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']
    
    return months.map((month, index) => {
      // Distribute spending across months
      const monthlySpend = index < estimatedMonths ? averageMonthlyBurn : 0
      
      return {
        month,
        burnRate: Math.round(monthlySpend),
        budget: projectType === 'One-Time' ? metrics.totalRevenue : metrics.totalRevenue,
        cumulative: Math.round(monthlySpend * (index + 1)),
        projected: Math.round(averageMonthlyBurn * (index + 1))
      }
    })
  }

  const burnData = generateBurnRateData()
  
  // Calculate key metrics with clear definitions
  const totalBudget = metrics.totalRevenue // Total project revenue
  const remainingBudget = totalBudget - totalSpent // Revenue - Cost Spent
  const burnRate = Math.round(averageMonthlyBurn) // Average monthly spending
  const projectedCompletion = burnRate > 0 ? Math.ceil(remainingBudget / burnRate) : 0
  
  // Budget health status
  const budgetUtilization = (totalSpent / totalBudget) * 100
  const getBudgetStatus = (): { status: string; color: 'destructive' | 'secondary' | 'default'; icon: any } => {
    if (budgetUtilization > 90) return { status: 'critical', color: 'destructive', icon: AlertTriangle }
    if (budgetUtilization > 75) return { status: 'warning', color: 'secondary', icon: TrendingUp }
    return { status: 'healthy', color: 'default', icon: TrendingDown }
  }

  const budgetStatus = getBudgetStatus()
  const StatusIcon = budgetStatus.icon

  return (
    <div className="space-y-6">
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Monthly Burn Rate</p>
              <p className="text-2xl font-bold text-blue-900">${burnRate.toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-600" />
          </div>
          <p className="text-xs text-blue-600 mt-1">
            {projectType === 'One-Time' ? 'Average monthly' : 'Current month'}
          </p>
        </div>

        <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Budget Remaining</p>
              <p className="text-2xl font-bold text-green-900">${remainingBudget.toLocaleString()}</p>
            </div>
            <StatusIcon className="h-8 w-8 text-green-600" />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={budgetStatus.color} className="text-xs">
              {budgetUtilization.toFixed(1)}% used
            </Badge>
          </div>
        </div>
      </div>

      {/* Burn Rate Trend Chart */}
      <div className="space-y-2">
        <h4 className="text-lg font-semibold">Monthly Spending Trend</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={burnData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  `$${value.toLocaleString()}`, 
                  name === 'burnRate' ? 'Monthly Spend' : 'Budget'
                ]}
              />
              <Area 
                type="monotone" 
                dataKey="budget" 
                stackId="1"
                stroke="#e5e7eb" 
                fill="#f3f4f6" 
                name="Budget"
              />
              <Area 
                type="monotone" 
                dataKey="burnRate" 
                stackId="2"
                stroke="#3b82f6" 
                fill="#3b82f6" 
                fillOpacity={0.6}
                name="Actual Spend"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Calculation Explanation */}
      <div className="p-4 bg-gray-50 rounded-lg border">
        <h5 className="font-medium mb-3">📊 How These Numbers Are Calculated</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-blue-700">Monthly Burn Rate: ${burnRate.toLocaleString()}</p>
            <p className="text-gray-600">= Total Cost Spent (${totalSpent.toLocaleString()}) ÷ Estimated Months ({estimatedMonths})</p>
            <p className="text-xs text-gray-500 mt-1">*Estimated months = Hours Spent ÷ 160 hours/month</p>
          </div>
          <div>
            <p className="font-medium text-green-700">Budget Remaining: ${remainingBudget.toLocaleString()}</p>
            <p className="text-gray-600">= Total Revenue (${metrics.totalRevenue.toLocaleString()}) - Cost Spent (${totalSpent.toLocaleString()})</p>
            <p className="text-xs text-gray-500 mt-1">*Cost Spent = Hours × Average Hourly Rate</p>
          </div>
        </div>
      </div>

      {/* Financial Projections */}
      <div className="grid grid-cols-1 gap-4">
        <div className="p-4 border rounded-lg">
          <h5 className="font-medium mb-3">Financial Projections</h5>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Projected Completion</p>
              <p className="font-semibold">
                {projectedCompletion > 0 ? `${projectedCompletion} months` : 'Over budget'}
              </p>
              <p className="text-xs text-gray-500">At current burn rate</p>
            </div>
            <div>
              <p className="text-muted-foreground">Cost Efficiency</p>
              <p className="font-semibold">
                ${(metrics.deliveryCost / metrics.hoursSpent || 0).toFixed(0)}/hour
              </p>
              <p className="text-xs text-gray-500">Actual cost per hour</p>
            </div>
            <div>
              <p className="text-muted-foreground">Profit Margin</p>
              <p className={`font-semibold ${
                metrics.profitMargin > 25 ? 'text-green-600' : 
                metrics.profitMargin > 10 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {metrics.profitMargin.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500">(Revenue - Cost) ÷ Revenue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Budget Alerts */}
      {budgetUtilization > 75 && (
        <div className={`p-3 rounded-lg border ${
          budgetUtilization > 90 ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center gap-2">
            <AlertTriangle className={`h-4 w-4 ${
              budgetUtilization > 90 ? 'text-red-600' : 'text-yellow-600'
            }`} />
            <p className={`text-sm font-medium ${
              budgetUtilization > 90 ? 'text-red-800' : 'text-yellow-800'
            }`}>
              {budgetUtilization > 90 ? 'Critical: ' : 'Warning: '}
              Budget {budgetUtilization.toFixed(1)}% utilized
            </p>
          </div>
          <p className={`text-xs mt-1 ${
            budgetUtilization > 90 ? 'text-red-700' : 'text-yellow-700'
          }`}>
            {budgetUtilization > 90 
              ? 'Immediate budget review recommended'
              : 'Monitor spending closely to avoid overrun'
            }
          </p>
        </div>
      )}
    </div>
  )
}
