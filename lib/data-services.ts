import { supabase } from './supabase'
import { ClickUpTask, ClientMapping, ProjectMetrics, TeamMember, ProjectAnalytics, TimePeriod, ProjectTypeFilter, ProjectStatusFilter } from './types'

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
 */
export function calculateProjectMetrics(client: ClientMapping, tasks: ClickUpTask[], allTasks?: ClickUpTask[]): ProjectMetrics {
  // Use allTasks for total calculations if provided, otherwise use tasks
  const totalTasks = allTasks || tasks
  
  // Convert time_spent from milliseconds to hours (ClickUp stores time in milliseconds)
  const totalTimeSpentMs = totalTasks.reduce((sum, task) => {
    const timeSpent = parseInt(task.time_spent || '0')
    return sum + timeSpent
  }, 0)
  
  const hoursSpent = Math.round(totalTimeSpentMs / (1000 * 60 * 60) * 100) / 100

  // Calculate this month's metrics
  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  
  const thisMonthTasks = totalTasks.filter(task => {
    const taskDate = parseInt(task.date_updated)
    return taskDate >= thisMonthStart
  })

  const thisMonthTimeMs = thisMonthTasks.reduce((sum, task) => {
    const timeSpent = parseInt(task.time_spent || '0')
    return sum + timeSpent
  }, 0)
  
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

    const metrics = calculateProjectMetrics(client, tasks)
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
