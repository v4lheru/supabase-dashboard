"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Server, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { refreshCache, checkBackgroundRefreshHealth } from "@/lib/api-client"

export default function AdminPanel() {
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<string | null>(null)
  const [refreshResult, setRefreshResult] = useState<{ success: boolean; message: string } | null>(null)
  const [healthStatus, setHealthStatus] = useState<{ status: string; timestamp: string; message: string } | null>(null)

  const handleManualRefresh = async () => {
    setRefreshing(true)
    try {
      const result = await refreshCache()
      setRefreshResult(result)
      setLastRefresh(new Date().toLocaleString())
      console.log('✅ Manual cache refresh completed:', result)
    } catch (error) {
      console.error('💥 Manual cache refresh failed:', error)
      setRefreshResult({ success: false, message: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setRefreshing(false)
    }
  }

  const handleHealthCheck = async () => {
    try {
      const health = await checkBackgroundRefreshHealth()
      setHealthStatus(health)
      console.log('✅ Health check completed:', health)
    } catch (error) {
      console.error('💥 Health check failed:', error)
      setHealthStatus({ 
        status: 'error', 
        timestamp: new Date().toISOString(), 
        message: error instanceof Error ? error.message : 'Unknown error' 
      })
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Admin Panel</h1>
          <p className="text-muted-foreground">Manage server-side cache and background refresh</p>
        </div>
      </div>

      {/* Cache Management */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Cache Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Manually refresh all cached dashboard data. This will clear the current cache and pre-warm critical data.
              </p>
              {lastRefresh && (
                <p className="text-xs text-muted-foreground">
                  Last refresh: {lastRefresh}
                </p>
              )}
            </div>
            
            <Button 
              onClick={handleManualRefresh} 
              disabled={refreshing}
              className="w-full"
            >
              {refreshing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Refreshing Cache...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Cache Now
                </>
              )}
            </Button>

            {refreshResult && (
              <div className={`p-3 rounded-lg border ${refreshResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-2">
                  {refreshResult.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm ${refreshResult.success ? 'text-green-800' : 'text-red-800'}`}>
                    {refreshResult.message}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Background Refresh Service
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Check the health status of the background refresh service.
              </p>
              {healthStatus && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={healthStatus.status === 'healthy' ? 'default' : 'destructive'}>
                      {healthStatus.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(healthStatus.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {healthStatus.message}
                  </p>
                </div>
              )}
            </div>
            
            <Button 
              onClick={handleHealthCheck}
              variant="outline"
              className="w-full"
            >
              <Server className="h-4 w-4 mr-2" />
              Check Service Health
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Cache Configuration Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Cache Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <h4 className="font-medium">Project Analytics</h4>
              <p className="text-sm text-muted-foreground">TTL: 5 minutes</p>
              <p className="text-xs text-muted-foreground">Individual project data</p>
            </div>
            <div className="space-y-1">
              <h4 className="font-medium">All Projects</h4>
              <p className="text-sm text-muted-foreground">TTL: 3 minutes</p>
              <p className="text-xs text-muted-foreground">Aggregated project views</p>
            </div>
            <div className="space-y-1">
              <h4 className="font-medium">Team Analytics</h4>
              <p className="text-sm text-muted-foreground">TTL: 2 minutes</p>
              <p className="text-xs text-muted-foreground">Team utilization data</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Improvements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-red-600">~1.4s</div>
              <p className="text-sm text-muted-foreground">Before (Direct DB)</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">~18ms</div>
              <p className="text-sm text-muted-foreground">After (Cached)</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">80x</div>
              <p className="text-sm text-muted-foreground">Faster</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Background Refresh Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Automatic Background Refresh Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Option 1: Cron Job (Local Development)</h4>
            <div className="bg-gray-100 p-3 rounded-lg font-mono text-sm">
              # Add to crontab (runs every 10 minutes)<br/>
              */10 * * * * curl -s "http://localhost:3000/api/background-refresh?secret=dashboard-refresh-2024"
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Option 2: Railway Cron Service (Production - Recommended)</h4>
            <div className="bg-gray-100 p-3 rounded-lg font-mono text-sm">
              # Create new Railway service with cron schedule<br/>
              Service Type: Cron Job<br/>
              Schedule: */10 * * * * (every 10 minutes)<br/>
              Command: node scripts/railway-cron.js<br/>
              Environment: BACKGROUND_REFRESH_SECRET=dashboard-refresh-2024
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Option 3: External Service (Uptime Robot, etc.)</h4>
            <div className="bg-gray-100 p-3 rounded-lg font-mono text-sm">
              URL: https://your-app.railway.app/api/background-refresh?secret=dashboard-refresh-2024<br/>
              Method: GET<br/>
              Interval: Every 10 minutes
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
