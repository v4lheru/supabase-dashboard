"use client"

export function ProjectDurationChart() {
  // Mock data - in real app, this would come from props or context
  const projectStart = new Date("2024-01-15")
  const projectEnd = new Date("2024-03-30")
  const currentDate = new Date()

  const totalDuration = projectEnd.getTime() - projectStart.getTime()
  const elapsed = currentDate.getTime() - projectStart.getTime()
  const progress = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100)

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="space-y-4">
      {/* Timeline Header */}
      <div className="flex justify-between text-sm">
        <div>
          <span className="font-medium">Start:</span>
          <span className="ml-2 text-muted-foreground">{formatDate(projectStart)}</span>
        </div>
        <div>
          <span className="font-medium">End:</span>
          <span className="ml-2 text-muted-foreground">{formatDate(projectEnd)}</span>
        </div>
      </div>

      {/* Progress Timeline */}
      <div className="relative">
        {/* Background bar */}
        <div className="w-full h-6 bg-muted rounded-lg relative overflow-hidden">
          {/* Progress bar */}
          <div
            className="h-full bg-blue-500 rounded-lg transition-all duration-300"
            style={{ width: `${progress}%` }}
          />

          {/* Current date indicator */}
          <div className="absolute top-0 w-0.5 h-full bg-red-500 z-10" style={{ left: `${progress}%` }}>
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-red-500 rounded-full"></div>
          </div>
        </div>

        {/* Current date label */}
        <div
          className="absolute -bottom-6 transform -translate-x-1/2 text-xs text-red-600 font-medium"
          style={{ left: `${progress}%` }}
        >
          Today
        </div>
      </div>

      {/* Progress Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 text-center">
        <div>
          <div className="text-lg font-bold text-blue-600">{progress.toFixed(1)}%</div>
          <div className="text-xs text-muted-foreground">Complete</div>
        </div>
        <div>
          <div className="text-lg font-bold">
            {Math.ceil((projectEnd.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))}
          </div>
          <div className="text-xs text-muted-foreground">Days Left</div>
        </div>
        <div>
          <div className="text-lg font-bold">{Math.ceil(totalDuration / (1000 * 60 * 60 * 24))}</div>
          <div className="text-xs text-muted-foreground">Total Days</div>
        </div>
      </div>
    </div>
  )
}
