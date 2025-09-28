import { ProjectAnalytics, TeamAnalytics, ProjectTypeFilter, ProjectStatusFilter } from './types'

// Client-side API service that fetches from our cached API routes
class DashboardApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
  }

  private async fetchApi<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}/api/dashboard`)
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value)
    })

    console.log('🔍 Fetching from API:', url.toString())

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add cache control for better performance
      cache: 'no-store', // Always get fresh data from our cached API
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(`API Error: ${response.status} - ${errorData.error || response.statusText}`)
    }

    const result = await response.json()
    return result.data
  }

  // Get individual project analytics
  async getProjectAnalytics(projectName: string, timePeriod: string = 'all-time'): Promise<ProjectAnalytics | null> {
    try {
      return await this.fetchApi<ProjectAnalytics>('', {
        type: 'project-analytics',
        project: projectName,
        timePeriod
      })
    } catch (error) {
      console.error('Failed to fetch project analytics:', error)
      return null
    }
  }

  // Get all projects analytics with filters
  async getAllProjectsAnalytics(
    typeFilter: ProjectTypeFilter = 'all',
    statusFilter: ProjectStatusFilter = 'all',
    timePeriod: string = 'all-time'
  ): Promise<ProjectAnalytics[]> {
    try {
      return await this.fetchApi<ProjectAnalytics[]>('', {
        type: 'all-projects',
        typeFilter,
        statusFilter,
        timePeriod
      })
    } catch (error) {
      console.error('Failed to fetch all projects analytics:', error)
      return []
    }
  }

  // Get company-specific projects analytics
  async getCompanyProjectsAnalytics(
    company: 'veza' | 'shadow',
    projectType: 'On-going' | 'One-Time',
    statusFilter: ProjectStatusFilter = 'all',
    timePeriod: string = 'all-time'
  ): Promise<ProjectAnalytics[]> {
    try {
      return await this.fetchApi<ProjectAnalytics[]>('', {
        type: 'company-projects',
        company,
        projectType,
        statusFilter,
        timePeriod
      })
    } catch (error) {
      console.error('Failed to fetch company projects analytics:', error)
      return []
    }
  }

  // Get team analytics
  async getTeamAnalytics(teamId: string): Promise<TeamAnalytics | null> {
    try {
      return await this.fetchApi<TeamAnalytics>('', {
        type: 'team-analytics',
        teamId
      })
    } catch (error) {
      console.error('Failed to fetch team analytics:', error)
      return null
    }
  }

  // Get all teams analytics
  async getAllTeamsAnalytics(): Promise<TeamAnalytics[]> {
    try {
      return await this.fetchApi<TeamAnalytics[]>('', {
        type: 'all-teams'
      })
    } catch (error) {
      console.error('Failed to fetch all teams analytics:', error)
      return []
    }
  }

  // Manual cache refresh (for admin use)
  async refreshCache(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/dashboard?action=refresh-cache`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Cache refresh failed: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to refresh cache:', error)
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Background refresh health check
  async checkBackgroundRefreshHealth(): Promise<{ status: string; timestamp: string; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/background-refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      return await response.json()
    } catch (error) {
      console.error('Failed to check background refresh health:', error)
      return { 
        status: 'error', 
        timestamp: new Date().toISOString(), 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
}

// Export singleton instance
export const dashboardApi = new DashboardApiClient()

// Export individual functions for backward compatibility
export const getProjectAnalytics = dashboardApi.getProjectAnalytics.bind(dashboardApi)
export const getAllProjectsAnalytics = dashboardApi.getAllProjectsAnalytics.bind(dashboardApi)
export const getCompanyProjectsAnalytics = dashboardApi.getCompanyProjectsAnalytics.bind(dashboardApi)
export const getTeamAnalytics = dashboardApi.getTeamAnalytics.bind(dashboardApi)
export const getAllTeamsAnalytics = dashboardApi.getAllTeamsAnalytics.bind(dashboardApi)
export const refreshCache = dashboardApi.refreshCache.bind(dashboardApi)
export const checkBackgroundRefreshHealth = dashboardApi.checkBackgroundRefreshHealth.bind(dashboardApi)
