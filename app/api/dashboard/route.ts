import { NextRequest, NextResponse } from 'next/server'
import { getProjectAnalytics, getAllProjectsAnalytics, getCompanyProjectsAnalytics, getTeamAnalytics, getAllTeamsAnalytics } from '@/lib/data-services'
import { ProjectTypeFilter, ProjectStatusFilter } from '@/lib/types'

// In-memory cache for dashboard data
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

// Cache TTL in milliseconds
const CACHE_TTL = {
  PROJECT_ANALYTICS: 5 * 60 * 1000, // 5 minutes
  ALL_PROJECTS: 3 * 60 * 1000,      // 3 minutes
  TEAM_ANALYTICS: 2 * 60 * 1000,    // 2 minutes
}

function getCacheKey(type: string, params: Record<string, any>): string {
  return `${type}:${JSON.stringify(params)}`
}

function getFromCache<T>(key: string): T | null {
  const cached = cache.get(key)
  if (!cached) return null
  
  const now = Date.now()
  if (now > cached.timestamp + cached.ttl) {
    cache.delete(key)
    return null
  }
  
  return cached.data as T
}

function setCache<T>(key: string, data: T, ttl: number): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const project = searchParams.get('project')
    const timePeriod = searchParams.get('timePeriod') || 'all-time'
    const statusFilter = (searchParams.get('statusFilter') || 'all') as ProjectStatusFilter
    const company = searchParams.get('company') as 'veza' | 'shadow'
    const projectType = searchParams.get('projectType') as 'On-going' | 'One-Time'
    const teamId = searchParams.get('teamId')

    console.log('🔍 API Request:', { type, project, timePeriod, statusFilter, company, projectType, teamId })

    switch (type) {
      case 'project-analytics': {
        if (!project) {
          return NextResponse.json({ error: 'Project name required' }, { status: 400 })
        }

        const cacheKey = getCacheKey('project-analytics', { project, timePeriod })
        let data = getFromCache(cacheKey)

        if (!data) {
          console.log('🔄 Cache miss - fetching project analytics for:', project)
          data = await getProjectAnalytics(project, timePeriod)
          if (data) {
            setCache(cacheKey, data, CACHE_TTL.PROJECT_ANALYTICS)
          }
        } else {
          console.log('✅ Cache hit - serving cached project analytics for:', project)
        }

        return NextResponse.json({ data })
      }

      case 'all-projects': {
        const typeFilter = (searchParams.get('typeFilter') || 'all') as ProjectTypeFilter
        const cacheKey = getCacheKey('all-projects', { typeFilter, statusFilter, timePeriod })
        let data = getFromCache(cacheKey)

        if (!data) {
          console.log('🔄 Cache miss - fetching all projects analytics')
          data = await getAllProjectsAnalytics(typeFilter, statusFilter, timePeriod)
          setCache(cacheKey, data, CACHE_TTL.ALL_PROJECTS)
        } else {
          console.log('✅ Cache hit - serving cached all projects analytics')
        }

        return NextResponse.json({ data })
      }

      case 'company-projects': {
        if (!company || !projectType) {
          return NextResponse.json({ error: 'Company and project type required' }, { status: 400 })
        }

        const cacheKey = getCacheKey('company-projects', { company, projectType, statusFilter, timePeriod })
        let data = getFromCache(cacheKey)

        if (!data) {
          console.log('🔄 Cache miss - fetching company projects analytics for:', company, projectType)
          data = await getCompanyProjectsAnalytics(company, projectType, statusFilter, timePeriod)
          setCache(cacheKey, data, CACHE_TTL.ALL_PROJECTS)
        } else {
          console.log('✅ Cache hit - serving cached company projects analytics')
        }

        return NextResponse.json({ data })
      }

      case 'team-analytics': {
        if (!teamId) {
          return NextResponse.json({ error: 'Team ID required' }, { status: 400 })
        }

        const cacheKey = getCacheKey('team-analytics', { teamId })
        let data = getFromCache(cacheKey)

        if (!data) {
          console.log('🔄 Cache miss - fetching team analytics for:', teamId)
          data = await getTeamAnalytics(teamId)
          if (data) {
            setCache(cacheKey, data, CACHE_TTL.TEAM_ANALYTICS)
          }
        } else {
          console.log('✅ Cache hit - serving cached team analytics for:', teamId)
        }

        return NextResponse.json({ data })
      }

      case 'all-teams': {
        const cacheKey = getCacheKey('all-teams', {})
        let data = getFromCache(cacheKey)

        if (!data) {
          console.log('🔄 Cache miss - fetching all teams analytics')
          data = await getAllTeamsAnalytics()
          setCache(cacheKey, data, CACHE_TTL.TEAM_ANALYTICS)
        } else {
          console.log('✅ Cache hit - serving cached all teams analytics')
        }

        return NextResponse.json({ data })
      }

      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
    }
  } catch (error) {
    console.error('💥 Dashboard API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Background refresh endpoint
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'refresh-cache') {
      console.log('🔄 Manual cache refresh triggered')
      
      // Clear all cache
      cache.clear()
      
      // Pre-warm critical data
      const criticalProjects = ['on-going', 'one-time', 'veza-ongoing', 'veza-onetime', 'shadow-ongoing', 'shadow-onetime']
      const teams = ['Design', 'Development', 'SEO', 'QA']
      
      // Pre-warm project data
      for (const project of criticalProjects) {
        try {
          if (project === 'on-going') {
            const data = await getAllProjectsAnalytics('On-going', 'all', 'this-month')
            setCache(getCacheKey('all-projects', { typeFilter: 'On-going', statusFilter: 'all', timePeriod: 'this-month' }), data, CACHE_TTL.ALL_PROJECTS)
          } else if (project === 'one-time') {
            const data = await getAllProjectsAnalytics('One-Time', 'all', 'all-time')
            setCache(getCacheKey('all-projects', { typeFilter: 'One-Time', statusFilter: 'all', timePeriod: 'all-time' }), data, CACHE_TTL.ALL_PROJECTS)
          } else if (project.includes('veza') || project.includes('shadow')) {
            const company = project.includes('veza') ? 'veza' : 'shadow'
            const projectType = project.includes('ongoing') ? 'On-going' : 'One-Time'
            const timePeriod = projectType === 'On-going' ? 'this-month' : 'all-time'
            
            const data = await getCompanyProjectsAnalytics(company, projectType, 'all', timePeriod)
            setCache(getCacheKey('company-projects', { company, projectType, statusFilter: 'all', timePeriod }), data, CACHE_TTL.ALL_PROJECTS)
          }
        } catch (error) {
          console.error(`Failed to pre-warm ${project}:`, error)
        }
      }
      
      // Pre-warm team data
      for (const teamId of teams) {
        try {
          const data = await getTeamAnalytics(teamId)
          if (data) {
            setCache(getCacheKey('team-analytics', { teamId }), data, CACHE_TTL.TEAM_ANALYTICS)
          }
        } catch (error) {
          console.error(`Failed to pre-warm team ${teamId}:`, error)
        }
      }
      
      console.log('✅ Cache refresh completed')
      return NextResponse.json({ success: true, message: 'Cache refreshed successfully' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('💥 Cache refresh error:', error)
    return NextResponse.json(
      { error: 'Cache refresh failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
