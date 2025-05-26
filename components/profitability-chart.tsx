"use client"

export function ProfitabilityChart() {
  const months = [
    { month: "Oct", revenue: 45000, cost: 28000, profit: 17000 },
    { month: "Nov", revenue: 52000, cost: 31000, profit: 21000 },
    { month: "Dec", revenue: 48000, cost: 29000, profit: 19000 },
    { month: "Jan", revenue: 55000, cost: 33000, profit: 22000 },
    { month: "Feb", revenue: 51000, cost: 30000, profit: 21000 },
    { month: "Mar", revenue: 58000, cost: 34000, profit: 24000 },
  ]

  const maxValue = Math.max(...months.map((m) => m.revenue))

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center text-sm">
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Revenue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Costs</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Profit</span>
          </div>
        </div>
      </div>

      <div className="flex items-end justify-between h-40 gap-2">
        {months.map((month) => (
          <div key={month.month} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex flex-col gap-1 items-end">
              <div
                className="w-full bg-blue-500 rounded-t"
                style={{ height: `${(month.revenue / maxValue) * 120}px` }}
              ></div>
              <div className="w-full bg-red-500" style={{ height: `${(month.cost / maxValue) * 120}px` }}></div>
              <div
                className="w-full bg-green-500 rounded-b"
                style={{ height: `${(month.profit / maxValue) * 120}px` }}
              ></div>
            </div>
            <span className="text-xs text-muted-foreground">{month.month}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
