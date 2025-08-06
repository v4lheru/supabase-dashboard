import { supabase } from './supabase'
import { ClickUpTask, ClientMapping, ProjectMetrics, TeamMember, ProjectAnalytics, TimePeriod, ProjectTypeFilter, ProjectStatusFilter, TeamMemberMapping, TeamMemberAnalytics, TeamAnalytics } from './types'

/**
 * 🔄 Fetches all client mappings from Supabase
 * This is the source of truth for client configuration and project types
 */
export async function getClientMappings(): Promise<ClientMapping[]> {
  try {
    const { data, error } = await supabase
      .from('client_mappings')
      .select('*')
      .order('client_name')

    if (error) {
      console.error('❌ Error fetching client mappings:', error)
      throw error
    }

    console.log('✅ Successfully fetched client mappings:', data?.length || 0, 'clients')
    return data || []
  } catch (error) {
    console.error('💥 Failed to fetch client mappings:', error)
    return []
  }
}

/**
 * 📊 Fetches ClickUp tasks for a specific client with optional time filtering
 * Uses clickup_folder_name AND clickup_list_name from client_mappings to get only billable tasks
 */
export async function getClientTasks(clientName: string, timePeriod?: TimePeriod): Promise<ClickUpTask[]> {
  try {
    // First get the client mapping to find the correct ClickUp folder and list names
    const { data: clientMapping, error: mappingError } = await supabase
      .from('client_mappings')
      .select('clickup_folder_name, clickup_list_name')
      .eq('client_name', clientName)
      .single()

    if (mappingError || !clientMapping?.clickup_folder_name || !clientMapping?.clickup_list_name) {
      console.warn('⚠️ No ClickUp folder/list mapping found for client:', clientName)
      return []
    }

    const clickupFolderName = clientMapping.clickup_folder_name
    const clickupListName = clientMapping.clickup_list_name
    console.log('🔍 Using ClickUp folder:', clickupFolderName, 'and list:', clickupListName, 'for client:', clientName)

    let query = supabase
      .from('clickup_supabase_main')
      .select('*')
      .eq('folder_name', clickupFolderName)
      .eq('list_name', clickupListName)

    // Add time filtering based on period
    if (timePeriod && timePeriod !== 'all-time') {
      const now = new Date()
      let startDate: Date
      let endDate: Date | null = null

      switch (timePeriod) {
        case 'this-month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0) // Last day of current month
          break
        case 'last-30-days':
          startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
          break
        case 'this-quarter':
          const currentQuarter = Math.floor(now.getMonth() / 3)
          startDate = new Date(now.getFullYear(), currentQuarter * 3, 1)
          break
        case 'last-quarter':
          const lastQuarter = Math.floor(now.getMonth() / 3) - 1
          if (lastQuarter < 0) {
            // Previous year Q4
            startDate = new Date(now.getFullYear() - 1, 9, 1) // October 1st
            endDate = new Date(now.getFullYear() - 1, 11, 31) // December 31st
          } else {
            startDate = new Date(now.getFullYear(), lastQuarter * 3, 1)
            endDate = new Date(now.getFullYear(), (lastQuarter + 1) * 3, 0) // Last day of quarter
          }
          break
        case 'this-year':
          startDate = new Date(now.getFullYear(), 0, 1)
          break
        case 'last-year':
          startDate = new Date(now.getFullYear() - 1, 0, 1)
          endDate = new Date(now.getFullYear() - 1, 11, 31)
          break
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      }

      // Apply date filtering
      query = query.gte('date_updated', startDate.getTime())
      if (endDate) {
        query = query.lte('date_updated', endDate.getTime())
      }
    }

    const { data, error } = await query.order('date_updated', { ascending: false })

    if (error) {
      console.error('❌ Error fetching tasks for client:', clientName, error)
      throw error
    }

    console.log('✅ Successfully fetched BILLABLE tasks for', clientName, ':', data?.length || 0, 'tasks', timePeriod ? `(${timePeriod})` : '')
    return data || []
  } catch (error) {
    console.error('💥 Failed to fetch tasks for client:', clientName, error)
    return []
  }
}

/**
 * 📈 Calculates project metrics based on client mapping and tasks
 * Handles both on-going and one-time project types with proper calculations
 * ONLY COUNTS TIME FROM TEAM MEMBERS IN THE team_members TABLE
 */
export async function calculateProjectMetrics(client: ClientMapping, tasks: ClickUpTask[], allTasks?: ClickUpTask[]): Promise<ProjectMetrics> {
  // Use allTasks for total calculations if provided, otherwise use tasks
  const totalTasks = allTasks || tasks
  
  // Get team members to filter by billable team members only
  const teamMembers = await getTeamMembers()
  const validTeamMemberNames = new Set(teamMembers.map(member => member.clickup_name))
  
  // Helper function to calculate billable hours from tasks (only from team members)
  const calculateBillableHours = (tasksToProcess: ClickUpTask[]) => {
    return tasksToProcess.reduce((sum, task) => {
      const timeSpent = parseInt(task.time_spent || '0')
      
      // Skip tasks without assignees
      if (!task.assignees) return sum
      
      // Parse assignees and filter to only team members
      const assignees = task.assignees.split(',').map(name => name.trim()).filter(name => name)
      const billableAssignees = assignees.filter(assignee => validTeamMemberNames.has(assignee))
      
      // If no billable assignees, don't count this time
      if (billableAssignees.length === 0) return sum
      
      // Calculate the portion of time attributable to billable team members
      const billableRatio = billableAssignees.length / assignees.length
      const billableTime = timeSpent * billableRatio
      
      return sum + billableTime
    }, 0)
  }
  
  // Convert time_spent from milliseconds to hours (ClickUp stores time in milliseconds)
  // ONLY COUNT TIME FROM TEAM MEMBERS IN team_members TABLE
  const totalTimeSpentMs = calculateBillableHours(totalTasks)
  const hoursSpent = Math.round(totalTimeSpentMs / (1000 * 60 * 60) * 100) / 100

  // Calculate this month's metrics
  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  
  const thisMonthTasks = totalTasks.filter(task => {
    const taskDate = parseInt(task.date_updated)
    return taskDate >= thisMonthStart
  })

  // ONLY COUNT BILLABLE TIME FOR THIS MONTH
  const thisMonthTimeMs = calculateBillableHours(thisMonthTasks)
  const hoursSpentThisMonth = Math.round(thisMonthTimeMs / (1000 * 60 * 60) * 100) / 100

  // Calculate allocated hours based on project type
  const totalHours = client.available_hours || 0
  const hoursRemaining = Math.max(0, totalHours - hoursSpent)
  const utilizationPercentage = totalHours > 0 ? (hoursSpent / totalHours) * 100 : 0

  // Calculate financial metrics using actual client data
  const averageHourlyRate = Math.round((client.average_delivery_hourly || 0) * 100) / 100
  const deliveryCost = Math.round(hoursSpent * averageHourlyRate * 100) / 100
  const totalRevenue = Math.round((client.revenue || 0) * 100) / 100

  const profit = Math.round((totalRevenue - deliveryCost) * 100) / 100
  const profitMargin = totalRevenue > 0 ? Math.round((profit / totalRevenue) * 100 * 100) / 100 : 0

  // Task status counts (all time) - using actual ClickUp status values
  const completedTasks = totalTasks.filter(task => 
    task.status === 'complete' || task.status === 'approved'
  ).length
  
  const inProgressTasks = totalTasks.filter(task => 
    task.status === 'in progress' || task.status === 'review' || task.status === 'client review'
  ).length
  
  const todoTasks = totalTasks.filter(task => 
    task.status === 'to do' || task.status === 'backlog' || task.status === 'planning'
  ).length

  // Task status counts (this month)
  const completedTasksThisMonth = thisMonthTasks.filter(task => 
    task.status === 'complete' || task.status === 'approved'
  ).length
  
  const inProgressTasksThisMonth = thisMonthTasks.filter(task => 
    task.status === 'in progress' || task.status === 'review' || task.status === 'client review'
  ).length
  
  const todoTasksThisMonth = thisMonthTasks.filter(task => 
    task.status === 'to do' || task.status === 'backlog' || task.status === 'planning'
  ).length

  // Normalize project type for metrics (handle database variations)
  const normalizedProjectType: 'On-going' | 'One-Time' = 
    (client.project_type === 'On-Going' || client.project_type === 'On-going') ? 'On-going' : 'One-Time'

  return {
    clientName: client.client_name,
    projectType: normalizedProjectType,
    totalHours,
    hoursSpent,
    hoursRemaining,
    utilizationPercentage: Math.round(utilizationPercentage * 100) / 100,
    totalRevenue,
    deliveryCost,
    profit,
    profitMargin: Math.round(profitMargin * 100) / 100,
    averageHourlyRate,
    taskCount: totalTasks.length,
    completedTasks,
    inProgressTasks,
    todoTasks,
    // Time-based metrics
    taskCountThisMonth: thisMonthTasks.length,
    completedTasksThisMonth,
    inProgressTasksThisMonth,
    todoTasksThisMonth,
    hoursSpentThisMonth
  }
}

/**
 * 👥 Extracts team member data from tasks with time-based breakdowns
 * Parses assignees string and calculates individual contributions
 */
export function extractTeamMembers(tasks: ClickUpTask[], projectType?: 'On-going' | 'One-Time'): TeamMember[] {
  const memberMap = new Map<string, { 
    hoursSpent: number; 
    taskCount: number; 
    hoursSpentThisMonth: number; 
    taskCountThisMonth: number; 
  }>()

  // Calculate this month's start timestamp
  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()

  tasks.forEach(task => {
    const timeSpentMs = parseInt(task.time_spent || '0')
    const hoursSpent = timeSpentMs / (1000 * 60 * 60)
    const taskDate = parseInt(task.date_updated)
    const isThisMonth = taskDate >= thisMonthStart
    
    // Parse assignees (comma-separated string) - handle null/undefined assignees
    if (!task.assignees) {
      return // Skip tasks without assignees
    }
    
    const assignees = task.assignees.split(',').map(name => name.trim()).filter(name => name)
    
    if (assignees.length === 0) {
      return // Skip if no valid assignees
    }
    
    assignees.forEach(assignee => {
      const current = memberMap.get(assignee) || { 
        hoursSpent: 0, 
        taskCount: 0, 
        hoursSpentThisMonth: 0, 
        taskCountThisMonth: 0 
      }
      
      const splitHours = hoursSpent / assignees.length // Split hours among assignees
      
      memberMap.set(assignee, {
        hoursSpent: current.hoursSpent + splitHours,
        taskCount: current.taskCount + 1,
        hoursSpentThisMonth: current.hoursSpentThisMonth + (isThisMonth ? splitHours : 0),
        taskCountThisMonth: current.taskCountThisMonth + (isThisMonth ? 1 : 0)
      })
    })
  })

  // Calculate total project hours for percentage calculations
  const totalProjectHours = Array.from(memberMap.values()).reduce((sum, data) => sum + data.hoursSpent, 0)

  return Array.from(memberMap.entries()).map(([name, data]) => {
    let utilizationPercentage: number
    
    if (projectType === 'One-Time') {
      // For one-time projects, show percentage of contribution to total project
      utilizationPercentage = totalProjectHours > 0 ? (data.hoursSpent / totalProjectHours) * 100 : 0
    } else {
      // For ongoing projects, show monthly capacity utilization
      const expectedMonthlyHours = 160 // Assume 40 hours/week * 4 weeks
      utilizationPercentage = (data.hoursSpentThisMonth / expectedMonthlyHours) * 100
    }

    return {
      name,
      hoursSpent: Math.round(data.hoursSpent * 100) / 100,
      taskCount: data.taskCount,
      hoursSpentThisMonth: Math.round(data.hoursSpentThisMonth * 100) / 100,
      taskCountThisMonth: data.taskCountThisMonth,
      utilizationPercentage: Math.round(utilizationPercentage * 100) / 100
    }
  }).sort((a, b) => b.hoursSpent - a.hoursSpent)
}

/**
 * 🎯 Gets complete project analytics for a specific client
 * Combines client mapping, tasks, and calculated metrics
 */
export async function getProjectAnalytics(clientName: string, timePeriod?: string): Promise<ProjectAnalytics | null> {
  try {
    console.log('🔍 Fetching analytics for client:', clientName)
    
    const [clients, tasks] = await Promise.all([
      getClientMappings(),
      getClientTasks(clientName, timePeriod as TimePeriod)
    ])

    const client = clients.find(c => c.client_name === clientName)
    if (!client) {
      console.warn('⚠️ Client not found in mappings:', clientName)
      return null
    }

    const metrics = await calculateProjectMetrics(client, tasks)
    // Normalize project type for team member extraction
    const normalizedProjectType: 'On-going' | 'One-Time' | undefined = 
      (client.project_type === 'On-Going' || client.project_type === 'On-going') ? 'On-going' : 
      client.project_type === 'One-Time' ? 'One-Time' : undefined
    
    const teamMembers = extractTeamMembers(tasks, normalizedProjectType)

    console.log('✅ Analytics calculated for', clientName, '- Tasks:', tasks.length, 'Hours:', metrics.hoursSpent)

    return {
      client,
      tasks,
      metrics,
      teamMembers
    }
  } catch (error) {
    console.error('💥 Failed to get project analytics for:', clientName, error)
    return null
  }
}

/**
 * 📊 Gets aggregated analytics for all projects with filtering options
 * Used for the "All Projects" overview with comprehensive filtering
 */
export async function getAllProjectsAnalytics(
  typeFilter: ProjectTypeFilter = 'all',
  statusFilter: ProjectStatusFilter = 'all',
  timePeriod?: string
): Promise<ProjectAnalytics[]> {
  try {
    console.log('🔍 Fetching all projects analytics with filters:', { typeFilter, statusFilter })
    
    const clients = await getClientMappings()
    
    // Apply filters
    let filteredClients = clients
    
    // Filter by project type
    if (typeFilter !== 'all') {
      filteredClients = filteredClients.filter(client => client.project_type === typeFilter)
    }
    
    // Filter by status
    if (statusFilter !== 'all') {
      filteredClients = filteredClients.filter(client => client.status === statusFilter)
    }

    const analyticsPromises = filteredClients.map(client => 
      getProjectAnalytics(client.client_name, timePeriod)
    )

    const results = await Promise.all(analyticsPromises)
    const validResults = results.filter((result): result is ProjectAnalytics => result !== null)

    console.log('✅ Aggregated analytics for', validResults.length, 'projects')
    return validResults
  } catch (error) {
    console.error('💥 Failed to get all projects analytics:', error)
    return []
  }
}

/**
 * 🏢 Gets aggregated analytics for projects filtered by company (Veza/Shadow) and project type
 * Used for the new separated navigation (Veza/Shadow + Ongoing/One-time)
 */
export async function getCompanyProjectsAnalytics(
  company: 'veza' | 'shadow',
  projectType: 'On-going' | 'One-Time',
  statusFilter: ProjectStatusFilter = 'all',
  timePeriod?: string
): Promise<ProjectAnalytics[]> {
  try {
    console.log('🔍 Fetching company projects analytics:', { company, projectType, statusFilter })
    
    const clients = await getClientMappings()
    
    // Filter by company based on clickup_project_name
    const companyFilter = company === 'veza' ? 'Projects' : 'Shadow Digital Projects'
    
    let filteredClients = clients.filter(client => {
      const matchesCompany = client.clickup_project_name === companyFilter
      
      // Handle both "On-going" and "On-Going" variations in the database
      let matchesProjectType = false
      if (projectType === 'On-going') {
        matchesProjectType = client.project_type === 'On-going' || client.project_type === 'On-Going'
      } else {
        matchesProjectType = client.project_type === projectType
      }
      
      return matchesCompany && matchesProjectType
    })
    
    // Filter by status
    if (statusFilter !== 'all') {
      filteredClients = filteredClients.filter(client => client.status === statusFilter)
    }

    const analyticsPromises = filteredClients.map(client => 
      getProjectAnalytics(client.client_name, timePeriod)
    )

    const results = await Promise.all(analyticsPromises)
    const validResults = results.filter((result): result is ProjectAnalytics => result !== null)

    console.log('✅ Company analytics for', company, projectType, ':', validResults.length, 'projects')
    return validResults
  } catch (error) {
    console.error('💥 Failed to get company projects analytics:', error)
    return []
  }
}

/**
 * ➕ Creates a new client mapping
 * Used for dynamic client onboarding
 */
export async function createClientMapping(clientData: Omit<ClientMapping, 'id' | 'created_at' | 'updated_at'>): Promise<ClientMapping | null> {
  try {
    const { data, error } = await supabase
      .from('client_mappings')
      .insert([clientData])
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating client mapping:', error)
      throw error
    }

    console.log('✅ Successfully created client mapping for:', clientData.client_name)
    return data
  } catch (error) {
    console.error('💥 Failed to create client mapping:', error)
    return null
  }
}

/**
 * ✏️ Updates an existing client mapping
 * Used for modifying client configuration
 */
export async function updateClientMapping(id: number, updates: Partial<ClientMapping>): Promise<ClientMapping | null> {
  try {
    const { data, error } = await supabase
      .from('client_mappings')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('❌ Error updating client mapping:', error)
      throw error
    }

    console.log('✅ Successfully updated client mapping:', id)
    return data
  } catch (error) {
    console.error('💥 Failed to update client mapping:', error)
    return null
  }
}

/**
 * 📅 Fetches ClickUp tasks for a specific month
 * Used for historical analysis - ALSO FILTERS BY BILLABLE LIST
 */
export async function getClientTasksForMonth(clientName: string, year: number, month: number): Promise<ClickUpTask[]> {
  try {
    // First get the client mapping to find the correct ClickUp folder and list names
    const { data: clientMapping, error: mappingError } = await supabase
      .from('client_mappings')
      .select('clickup_folder_name, clickup_list_name')
      .eq('client_name', clientName)
      .single()

    if (mappingError || !clientMapping?.clickup_folder_name || !clientMapping?.clickup_list_name) {
      console.warn('⚠️ No ClickUp folder/list mapping found for client:', clientName)
      return []
    }

    const clickupFolderName = clientMapping.clickup_folder_name
    const clickupListName = clientMapping.clickup_list_name
    
    // Calculate month boundaries
    const startDate = new Date(year, month, 1)
    const endDate = new Date(year, month + 1, 0) // Last day of month
    const startTimestamp = startDate.getTime()
    const endTimestamp = endDate.getTime()

    console.log(`🔍 Fetching BILLABLE tasks for ${clientName} in ${year}-${month + 1}:`, {
      folder: clickupFolderName,
      list: clickupListName,
      start: startDate.toISOString(),
      end: endDate.toISOString()
    })

    const { data, error } = await supabase
      .from('clickup_supabase_main')
      .select('*')
      .eq('folder_name', clickupFolderName)
      .eq('list_name', clickupListName)
      .gte('date_updated', startTimestamp)
      .lte('date_updated', endTimestamp)
      .order('date_updated', { ascending: false })

    if (error) {
      console.error('❌ Error fetching monthly tasks for client:', clientName, error)
      throw error
    }

    console.log('✅ Successfully fetched monthly BILLABLE tasks for', clientName, ':', data?.length || 0, 'tasks')
    return data || []
  } catch (error) {
    console.error('💥 Failed to fetch monthly tasks for client:', clientName, error)
    return []
  }
}

/**
 * 👥 Fetches all team member mappings from Supabase
 * This provides the team structure and individual capacity information
 */
export async function getTeamMembers(): Promise<TeamMemberMapping[]> {
  try {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .order('team', { ascending: true })
      .order('display_name', { ascending: true })

    if (error) {
      console.error('❌ Error fetching team members:', error)
      throw error
    }

    console.log('✅ Successfully fetched team members:', data?.length || 0, 'members')
    return data || []
  } catch (error) {
    console.error('💥 Failed to fetch team members:', error)
    return []
  }
}

/**
 * 📊 Fetches all ClickUp tasks for team utilization analysis
 * Gets tasks across all projects to calculate team member utilization
 */
export async function getAllClickUpTasks(timePeriod?: TimePeriod): Promise<ClickUpTask[]> {
  try {
    let query = supabase
      .from('clickup_supabase_main')
      .select('*')

    // Add time filtering based on period
    if (timePeriod && timePeriod !== 'all-time') {
      const now = new Date()
      let startDate: Date
      let endDate: Date | null = null

      switch (timePeriod) {
        case 'this-month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          break
        case 'last-30-days':
          startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
          break
        case 'this-quarter':
          const currentQuarter = Math.floor(now.getMonth() / 3)
          startDate = new Date(now.getFullYear(), currentQuarter * 3, 1)
          break
        case 'last-quarter':
          const lastQuarter = Math.floor(now.getMonth() / 3) - 1
          if (lastQuarter < 0) {
            startDate = new Date(now.getFullYear() - 1, 9, 1)
            endDate = new Date(now.getFullYear() - 1, 11, 31)
          } else {
            startDate = new Date(now.getFullYear(), lastQuarter * 3, 1)
            endDate = new Date(now.getFullYear(), (lastQuarter + 1) * 3, 0)
          }
          break
        case 'this-year':
          startDate = new Date(now.getFullYear(), 0, 1)
          break
        case 'last-year':
          startDate = new Date(now.getFullYear() - 1, 0, 1)
          endDate = new Date(now.getFullYear() - 1, 11, 31)
          break
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      }

      query = query.gte('date_updated', startDate.getTime())
      if (endDate) {
        query = query.lte('date_updated', endDate.getTime())
      }
    }

    const { data, error } = await query.order('date_updated', { ascending: false })

    if (error) {
      console.error('❌ Error fetching all ClickUp tasks:', error)
      throw error
    }

    console.log('✅ Successfully fetched all ClickUp tasks:', data?.length || 0, 'tasks', timePeriod ? `(${timePeriod})` : '')
    return data || []
  } catch (error) {
    console.error('💥 Failed to fetch all ClickUp tasks:', error)
    return []
  }
}

/**
 * 🧮 Calculates team member analytics based on team mapping and ClickUp tasks
 * Maps clickup_name from team_members to assignees in clickup_supabase_main
 * Includes both historical (time_spent) and capacity planning (time_estimate) metrics
 */
export function calculateTeamMemberAnalytics(
  teamMember: TeamMemberMapping, 
  allTasks: ClickUpTask[]
): TeamMemberAnalytics {
  const now = new Date()
  
  // Calculate time boundaries
  const thisWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).getTime()
  const lastWeekStart = new Date(thisWeekStart - (7 * 24 * 60 * 60 * 1000)).getTime()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  const last3MonthsStart = new Date(now.getFullYear(), now.getMonth() - 3, 1).getTime()
  
  // Future time boundaries for capacity planning
  const nextWeekStart = new Date(thisWeekStart + (7 * 24 * 60 * 60 * 1000)).getTime()
  const next2WeeksStart = new Date(thisWeekStart + (14 * 24 * 60 * 60 * 1000)).getTime()
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime()
  const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0).getTime()

  // Filter tasks assigned to this team member
  const memberTasks = allTasks.filter(task => {
    if (!task.assignees) return false
    const assignees = task.assignees.split(',').map(name => name.trim())
    return assignees.includes(teamMember.clickup_name)
  })

  // Calculate HISTORICAL time spent in different periods
  const calculateHoursForPeriod = (tasks: ClickUpTask[], startTime: number, endTime?: number) => {
    const filteredTasks = tasks.filter(task => {
      const taskTime = parseInt(task.date_updated)
      return taskTime >= startTime && (!endTime || taskTime <= endTime)
    })
    
    const totalMs = filteredTasks.reduce((sum, task) => {
      const timeSpent = parseInt(task.time_spent || '0')
      const assignees = task.assignees?.split(',').map(name => name.trim()) || []
      const assigneeCount = assignees.length
      return sum + (timeSpent / assigneeCount) // Split time among assignees
    }, 0)
    
    return Math.round(totalMs / (1000 * 60 * 60) * 100) / 100 // Convert to hours
  }

  // Calculate ESTIMATED time for future periods (active tasks only)
  const calculateEstimatedHoursForPeriod = (tasks: ClickUpTask[], startTime: number, endTime?: number) => {
    const activeTasks = tasks.filter(task => 
      task.status !== 'complete' && task.status !== 'approved'
    )
    
    const filteredTasks = activeTasks.filter(task => {
      const dueDate = task.due_date ? parseInt(task.due_date) : null
      if (!dueDate) return false // Only include tasks with due dates for planning
      return dueDate >= startTime && (!endTime || dueDate <= endTime)
    })
    
    const totalMs = filteredTasks.reduce((sum, task) => {
      const timeEstimate = parseInt(task.time_estimate || '0')
      const assignees = task.assignees?.split(',').map(name => name.trim()) || []
      const assigneeCount = assignees.length
      return sum + (timeEstimate / assigneeCount) // Split estimate among assignees
    }, 0)
    
    return Math.round(totalMs / (1000 * 60 * 60) * 100) / 100 // Convert to hours
  }

  // Historical metrics
  const hoursSpentThisWeek = calculateHoursForPeriod(memberTasks, thisWeekStart)
  const hoursSpentLastWeek = calculateHoursForPeriod(memberTasks, lastWeekStart, thisWeekStart)
  const hoursSpentThisMonth = calculateHoursForPeriod(memberTasks, thisMonthStart)
  const hoursSpentLast3Months = calculateHoursForPeriod(memberTasks, last3MonthsStart)

  // Capacity planning metrics
  const estimatedHoursNextWeek = calculateEstimatedHoursForPeriod(memberTasks, nextWeekStart, next2WeeksStart)
  const estimatedHoursNext2Weeks = calculateEstimatedHoursForPeriod(memberTasks, nextWeekStart, next2WeeksStart + (7 * 24 * 60 * 60 * 1000))
  const estimatedHoursNextMonth = calculateEstimatedHoursForPeriod(memberTasks, nextMonthStart, nextMonthEnd)

  // Calculate utilization percentages
  const utilizationThisWeek = (hoursSpentThisWeek / teamMember.weekly_hours) * 100
  const utilizationLastWeek = (hoursSpentLastWeek / teamMember.weekly_hours) * 100
  const utilizationThisMonth = (hoursSpentThisMonth / (teamMember.weekly_hours * 4)) * 100 // Assume 4 weeks per month
  const utilization3MonthAvg = (hoursSpentLast3Months / (teamMember.weekly_hours * 12)) * 100 // 3 months * 4 weeks

  // Calculate planned utilization percentages
  const plannedUtilizationNextWeek = (estimatedHoursNextWeek / teamMember.weekly_hours) * 100
  const plannedUtilizationNext2Weeks = (estimatedHoursNext2Weeks / (teamMember.weekly_hours * 2)) * 100
  const plannedUtilizationNextMonth = (estimatedHoursNextMonth / (teamMember.weekly_hours * 4)) * 100

  // Calculate efficiency metrics
  const tasksWithBothEstimateAndActual = memberTasks.filter(task => 
    parseInt(task.time_estimate || '0') > 0 && parseInt(task.time_spent || '0') > 0
  )
  
  const totalEstimatedHours = tasksWithBothEstimateAndActual.reduce((sum, task) => {
    const timeEstimate = parseInt(task.time_estimate || '0')
    const assignees = task.assignees?.split(',').map(name => name.trim()) || []
    return sum + (timeEstimate / assignees.length) / (1000 * 60 * 60)
  }, 0)
  
  const totalActualHours = tasksWithBothEstimateAndActual.reduce((sum, task) => {
    const timeSpent = parseInt(task.time_spent || '0')
    const assignees = task.assignees?.split(',').map(name => name.trim()) || []
    return sum + (timeSpent / assignees.length) / (1000 * 60 * 60)
  }, 0)
  
  const efficiencyRatio = totalEstimatedHours > 0 ? (totalActualHours / totalEstimatedHours) * 100 : 0
  const estimateCoverage = memberTasks.length > 0 ? (memberTasks.filter(task => parseInt(task.time_estimate || '0') > 0).length / memberTasks.length) * 100 : 0

  // Calculate task metrics
  const activeTasks = memberTasks.filter(task => 
    task.status !== 'complete' && task.status !== 'approved'
  )
  
  const thisWeekTasks = memberTasks.filter(task => {
    const taskTime = parseInt(task.date_updated)
    return taskTime >= thisWeekStart
  })
  
  const completedTasksThisWeek = thisWeekTasks.filter(task => 
    task.status === 'complete' || task.status === 'approved'
  ).length

  const tasksWithEstimates = memberTasks.filter(task => 
    parseInt(task.time_estimate || '0') > 0
  ).length

  // Calculate project allocation with estimates
  const projectMap = new Map<string, { hours: number; count: number; estimatedHours: number }>()
  
  memberTasks.forEach(task => {
    const projectName = task.folder_name || 'Unknown Project'
    const timeSpent = parseInt(task.time_spent || '0')
    const timeEstimate = parseInt(task.time_estimate || '0')
    const assignees = task.assignees?.split(',').map(name => name.trim()) || []
    const assigneeCount = assignees.length
    const memberHours = (timeSpent / assigneeCount) / (1000 * 60 * 60) // Convert to hours and split
    const memberEstimatedHours = (timeEstimate / assigneeCount) / (1000 * 60 * 60)
    
    const current = projectMap.get(projectName) || { hours: 0, count: 0, estimatedHours: 0 }
    projectMap.set(projectName, {
      hours: current.hours + memberHours,
      count: current.count + 1,
      estimatedHours: current.estimatedHours + memberEstimatedHours
    })
  })

  const currentProjects = Array.from(projectMap.entries()).map(([projectName, data]) => ({
    projectName,
    hoursAllocated: Math.round(data.hours * 100) / 100,
    averageWeeklyHours: Math.round((data.hours / 12) * 100) / 100, // Rough weekly average over 3 months
    estimatedHours: Math.round(data.estimatedHours * 100) / 100
  })).sort((a, b) => b.hoursAllocated - a.hoursAllocated)

  // Format active tasks with estimates
  const activeTasksFormatted = activeTasks.slice(0, 10).map(task => {
    const assignees = task.assignees?.split(',').map(name => name.trim()) || []
    const assigneeCount = assignees.length
    const estimatedHours = parseInt(task.time_estimate || '0') > 0 ? 
      Math.round((parseInt(task.time_estimate || '0') / assigneeCount) / (1000 * 60 * 60) * 100) / 100 : undefined
    const actualHours = parseInt(task.time_spent || '0') > 0 ? 
      Math.round((parseInt(task.time_spent || '0') / assigneeCount) / (1000 * 60 * 60) * 100) / 100 : undefined

    return {
      task_id: task.task_id,
      task_name: task.task_name,
      status: task.status,
      project: task.folder_name || 'Unknown Project',
      due_date: task.due_date || undefined,
      priority: task.priority || undefined,
      estimated_hours: estimatedHours,
      actual_hours: actualHours
    }
  })

  return {
    id: teamMember.id.toString(),
    clickup_name: teamMember.clickup_name,
    display_name: teamMember.display_name,
    team: teamMember.team,
    role: teamMember.role,
    weekly_hours: teamMember.weekly_hours,
    status: teamMember.status,
    // Historical metrics - round to 1 decimal place
    hoursSpentThisWeek: Math.round(hoursSpentThisWeek * 10) / 10,
    hoursSpentLastWeek: Math.round(hoursSpentLastWeek * 10) / 10,
    hoursSpentThisMonth: Math.round(hoursSpentThisMonth * 10) / 10,
    hoursSpentLast3Months: Math.round(hoursSpentLast3Months * 10) / 10,
    utilizationThisWeek: Math.round(utilizationThisWeek),
    utilizationLastWeek: Math.round(utilizationLastWeek),
    utilizationThisMonth: Math.round(utilizationThisMonth),
    utilization3MonthAvg: Math.round(utilization3MonthAvg),
    // Capacity planning metrics
    estimatedHoursNextWeek: Math.round(estimatedHoursNextWeek * 10) / 10,
    estimatedHoursNext2Weeks: Math.round(estimatedHoursNext2Weeks * 10) / 10,
    estimatedHoursNextMonth: Math.round(estimatedHoursNextMonth * 10) / 10,
    plannedUtilizationNextWeek: Math.round(plannedUtilizationNextWeek),
    plannedUtilizationNext2Weeks: Math.round(plannedUtilizationNext2Weeks),
    plannedUtilizationNextMonth: Math.round(plannedUtilizationNextMonth),
    // Efficiency metrics
    efficiencyRatio: Math.round(efficiencyRatio),
    estimateCoverage: Math.round(estimateCoverage),
    // Task metrics
    activeTasksCount: activeTasks.length,
    completedTasksThisWeek,
    totalTasksThisWeek: thisWeekTasks.length,
    tasksWithEstimates,
    // Project allocation
    currentProjects,
    // Active tasks
    activeTasks: activeTasksFormatted
  }
}

/**
 * 🏢 Gets complete team analytics for a specific team
 * Combines team member mappings with ClickUp task data
 */
export async function getTeamAnalytics(teamName: string): Promise<TeamAnalytics | null> {
  try {
    console.log('🔍 Fetching team analytics for:', teamName)
    
    const [teamMembers, allTasks] = await Promise.all([
      getTeamMembers(),
      getAllClickUpTasks('last-30-days') // Get recent tasks for analysis
    ])

    const teamMemberMappings = teamMembers.filter(member => member.team === teamName)
    
    if (teamMemberMappings.length === 0) {
      console.warn('⚠️ No team members found for team:', teamName)
      return null
    }

    // Calculate analytics for each team member
    const memberAnalytics = teamMemberMappings.map(member => 
      calculateTeamMemberAnalytics(member, allTasks)
    )

    // Calculate team-level metrics
    const totalMembers = memberAnalytics.length
    const totalWeeklyCapacity = memberAnalytics.reduce((sum, member) => sum + member.weekly_hours, 0)
    
    const teamUtilizationThisWeek = memberAnalytics.reduce((sum, member) => sum + member.utilizationThisWeek, 0) / totalMembers
    const teamUtilizationLastWeek = memberAnalytics.reduce((sum, member) => sum + member.utilizationLastWeek, 0) / totalMembers
    const teamUtilizationThisMonth = memberAnalytics.reduce((sum, member) => sum + member.utilizationThisMonth, 0) / totalMembers
    const teamUtilization3MonthAvg = memberAnalytics.reduce((sum, member) => sum + member.utilization3MonthAvg, 0) / totalMembers

    // Calculate capacity forecasting based on estimates
    const teamPlannedUtilizationNextWeek = memberAnalytics.reduce((sum, member) => sum + member.plannedUtilizationNextWeek, 0) / totalMembers
    const teamPlannedUtilizationNext2Weeks = memberAnalytics.reduce((sum, member) => sum + member.plannedUtilizationNext2Weeks, 0) / totalMembers
    const teamPlannedUtilizationNextMonth = memberAnalytics.reduce((sum, member) => sum + member.plannedUtilizationNextMonth, 0) / totalMembers
    
    const upcomingWeekCapacity = Math.max(0, 100 - teamPlannedUtilizationNextWeek)
    const upcomingTwoWeeksCapacity = Math.max(0, 100 - teamPlannedUtilizationNext2Weeks)
    const upcomingMonthCapacity = Math.max(0, 100 - teamPlannedUtilizationNextMonth)

    // Calculate task metrics
    const totalActiveTasks = memberAnalytics.reduce((sum, member) => sum + member.activeTasksCount, 0)
    const totalCompletedTasksThisWeek = memberAnalytics.reduce((sum, member) => sum + member.completedTasksThisWeek, 0)
    const totalTasksThisWeek = memberAnalytics.reduce((sum, member) => sum + member.totalTasksThisWeek, 0)
    const teamProgress = totalTasksThisWeek > 0 ? (totalCompletedTasksThisWeek / totalTasksThisWeek) * 100 : 0

    // Calculate task status breakdown (simplified mapping from ClickUp statuses)
    const allActiveTasks = memberAnalytics.flatMap(member => member.activeTasks)
    const tasksByStatus = {
      todo: allActiveTasks.filter(task => task.status === 'to do' || task.status === 'backlog').length,
      inProgress: allActiveTasks.filter(task => task.status === 'in progress' || task.status === 'review').length,
      waitingApproval: allActiveTasks.filter(task => task.status === 'client review' || task.status === 'approval').length,
      completed: allActiveTasks.filter(task => task.status === 'complete' || task.status === 'approved').length
    }

    console.log('✅ Team analytics calculated for', teamName, '- Members:', totalMembers, 'Active Tasks:', totalActiveTasks)

    return {
      teamName,
      totalMembers,
      totalWeeklyCapacity,
      // Team utilization metrics
      teamUtilizationThisWeek: Math.round(teamUtilizationThisWeek * 100) / 100,
      teamUtilizationLastWeek: Math.round(teamUtilizationLastWeek * 100) / 100,
      teamUtilizationThisMonth: Math.round(teamUtilizationThisMonth * 100) / 100,
      teamUtilization3MonthAvg: Math.round(teamUtilization3MonthAvg * 100) / 100,
      // Capacity forecasting
      upcomingWeekCapacity: Math.round(upcomingWeekCapacity * 100) / 100,
      upcomingTwoWeeksCapacity: Math.round(upcomingTwoWeeksCapacity * 100) / 100,
      upcomingMonthCapacity: Math.round(upcomingMonthCapacity * 100) / 100,
      // Task metrics
      totalActiveTasks,
      totalCompletedTasksThisWeek,
      totalTasksThisWeek,
      teamProgress: Math.round(teamProgress * 100) / 100,
      // Task status breakdown
      tasksByStatus,
      // Team members
      members: memberAnalytics
    }
  } catch (error) {
    console.error('💥 Failed to get team analytics for:', teamName, error)
    return null
  }
}

/**
 * 📋 Gets analytics for all teams
 * Returns analytics for Design, Development, SEO, and QA teams
 */
export async function getAllTeamsAnalytics(): Promise<TeamAnalytics[]> {
  try {
    console.log('🔍 Fetching analytics for all teams')
    
    const teamNames = ['Design', 'Development', 'SEO', 'QA']
    const analyticsPromises = teamNames.map(teamName => getTeamAnalytics(teamName))
    
    const results = await Promise.all(analyticsPromises)
    const validResults = results.filter((result): result is TeamAnalytics => result !== null)
    
    console.log('✅ All teams analytics fetched:', validResults.length, 'teams')
    return validResults
  } catch (error) {
    console.error('💥 Failed to get all teams analytics:', error)
    return []
  }
}
