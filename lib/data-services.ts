import { supabase } from './supabase'
import { ClickUpTask, ClientMapping, ProjectMetrics, TeamMember, ProjectAnalytics, TimePeriod, ProjectTypeFilter } from './types'

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
 * Uses folder_name to match with client_name from client_mappings
 */
export async function getClientTasks(clientName: string, timePeriod?: TimePeriod): Promise<ClickUpTask[]> {
  try {
    let query = supabase
      .from('clickup_supabase')
      .select('*')
      .eq('folder_name', clientName)

    // Add time filtering based on period
    if (timePeriod && timePeriod !== 'all-time') {
      const now = new Date()
      let startDate: Date

      switch (timePeriod) {
        case 'this-month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case 'previous-month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          const endDate = new Date(now.getFullYear(), now.getMonth(), 0)
          query = query
            .gte('date_updated', startDate.getTime())
            .lte('date_updated', endDate.getTime())
          break
        case 'january-2024':
          startDate = new Date(2024, 0, 1)
          const janEnd = new Date(2024, 0, 31)
          query = query
            .gte('date_updated', startDate.getTime())
            .lte('date_updated', janEnd.getTime())
          break
        case 'december-2023':
          startDate = new Date(2023, 11, 1)
          const decEnd = new Date(2023, 11, 31)
          query = query
            .gte('date_updated', startDate.getTime())
            .lte('date_updated', decEnd.getTime())
          break
        case 'november-2023':
          startDate = new Date(2023, 10, 1)
          const novEnd = new Date(2023, 10, 30)
          query = query
            .gte('date_updated', startDate.getTime())
            .lte('date_updated', novEnd.getTime())
          break
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      }

      if (timePeriod === 'this-month') {
        query = query.gte('date_updated', startDate.getTime())
      }
    }

    const { data, error } = await query.order('date_updated', { ascending: false })

    if (error) {
      console.error('❌ Error fetching tasks for client:', clientName, error)
      throw error
    }

    console.log('✅ Successfully fetched tasks for', clientName, ':', data?.length || 0, 'tasks', timePeriod ? `(${timePeriod})` : '')
    return data || []
  } catch (error) {
    console.error('💥 Failed to fetch tasks for client:', clientName, error)
    return []
  }
}

/**
 * 📈 Calculates project metrics based on client mapping and tasks
 * Handles both on-going and one-time project types with time-based breakdowns
 */
export function calculateProjectMetrics(client: ClientMapping, tasks: ClickUpTask[], allTasks?: ClickUpTask[]): ProjectMetrics {
  // Use allTasks for total calculations if provided, otherwise use tasks
  const totalTasks = allTasks || tasks
  
  // Convert time_spent from milliseconds to hours
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

  // Calculate total allocated hours based on project type
  let totalHours = 0
  if (client.project_type === 'on-going' && client.total_hours_month) {
    totalHours = parseInt(client.total_hours_month)
  } else if (client.project_type === 'one-time') {
    // For one-time projects, we'll estimate based on time estimates or use a default
    const totalEstimateMs = totalTasks.reduce((sum, task) => {
      const estimate = parseInt(task.time_estimate || '0')
      return sum + estimate
    }, 0)
    totalHours = totalEstimateMs > 0 ? Math.round(totalEstimateMs / (1000 * 60 * 60)) : hoursSpent * 1.5 // Fallback estimation
  }

  const hoursRemaining = Math.max(0, totalHours - hoursSpent)
  const utilizationPercentage = totalHours > 0 ? (hoursSpent / totalHours) * 100 : 0

  // Calculate financial metrics (using estimated rates)
  const averageHourlyRate = 125 // Default rate, could be made configurable per client
  const deliveryCost = hoursSpent * averageHourlyRate
  
  let totalRevenue = 0
  if (client.project_type === 'on-going' && client.total_hours_month) {
    totalRevenue = parseInt(client.total_hours_month) * averageHourlyRate
  } else {
    totalRevenue = totalHours * averageHourlyRate
  }

  const profit = totalRevenue - deliveryCost
  const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0

  // Task status counts (all time)
  const completedTasks = totalTasks.filter(task => task.status === 'complete').length
  const inProgressTasks = totalTasks.filter(task => task.status === 'in progress').length
  const todoTasks = totalTasks.filter(task => task.status === 'to do').length

  // Task status counts (this month)
  const completedTasksThisMonth = thisMonthTasks.filter(task => task.status === 'complete').length
  const inProgressTasksThisMonth = thisMonthTasks.filter(task => task.status === 'in progress').length
  const todoTasksThisMonth = thisMonthTasks.filter(task => task.status === 'to do').length

  return {
    clientName: client.client_name,
    projectType: client.project_type,
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
export function extractTeamMembers(tasks: ClickUpTask[]): TeamMember[] {
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
    
    // Parse assignees (comma-separated string)
    const assignees = task.assignees.split(',').map(name => name.trim()).filter(name => name)
    
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

  return Array.from(memberMap.entries()).map(([name, data]) => {
    // Calculate utilization percentage (this month hours vs expected monthly capacity)
    const expectedMonthlyHours = 160 // Assume 40 hours/week * 4 weeks
    const utilizationPercentage = (data.hoursSpentThisMonth / expectedMonthlyHours) * 100

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
export async function getProjectAnalytics(clientName: string): Promise<ProjectAnalytics | null> {
  try {
    console.log('🔍 Fetching analytics for client:', clientName)
    
    const [clients, tasks] = await Promise.all([
      getClientMappings(),
      getClientTasks(clientName)
    ])

    const client = clients.find(c => c.client_name === clientName)
    if (!client) {
      console.warn('⚠️ Client not found in mappings:', clientName)
      return null
    }

    const metrics = calculateProjectMetrics(client, tasks)
    const teamMembers = extractTeamMembers(tasks)

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
 * 📊 Gets aggregated analytics for all projects or filtered by type
 * Used for the "All Projects" overview
 */
export async function getAllProjectsAnalytics(filter: ProjectTypeFilter = 'all'): Promise<ProjectAnalytics[]> {
  try {
    console.log('🔍 Fetching all projects analytics with filter:', filter)
    
    const clients = await getClientMappings()
    const filteredClients = filter === 'all' 
      ? clients 
      : clients.filter(client => client.project_type === filter)

    const analyticsPromises = filteredClients.map(client => 
      getProjectAnalytics(client.client_name)
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
