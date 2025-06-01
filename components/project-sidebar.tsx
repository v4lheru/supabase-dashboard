"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronRight, Folder, FolderOpen, BarChart3 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { getClientMappings, getProjectAnalytics } from "@/lib/data-services"
import { ClientMapping, ProjectAnalytics } from "@/lib/types"
import { calculateProjectHealth, getNoDataHealth } from "@/lib/project-health"

interface ProjectSidebarProps {
  selectedProject: string
  onProjectSelect: (projectId: string) => void
}

export function ProjectSidebar({ selectedProject, onProjectSelect }: ProjectSidebarProps) {
  const [clientsExpanded, setClientsExpanded] = useState(true)
  const [clients, setClients] = useState<ClientMapping[]>([])
  const [projectHealth, setProjectHealth] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [hideBlanks, setHideBlanks] = useState(false)

  // Calculate project health status using shared logic
  const getProjectHealthStatus = async (clientName: string): Promise<string> => {
    try {
      const analytics = await getProjectAnalytics(clientName)
      if (!analytics || !analytics.tasks || analytics.tasks.length === 0) {
        console.log(`⚪ ${clientName}: No tasks data`)
        const noDataHealth = getNoDataHealth()
        return noDataHealth.emoji
      }
      
      const { metrics } = analytics
      
      // Check if we have valid financial data - only revenue is required
      if (!metrics.totalRevenue || metrics.totalRevenue === 0) {
        console.log(`⚪ ${clientName}: No revenue data (${metrics.totalRevenue})`)
        const noDataHealth = getNoDataHealth()
        return noDataHealth.emoji
      }
      
      // Use the same health calculation as the dashboard
      const health = calculateProjectHealth(metrics.profitMargin)
      
      console.log(`${health.emoji} ${clientName}:`, {
        profitMargin: metrics.profitMargin.toFixed(1) + '%',
        healthStatus: health.label,
        revenue: metrics.totalRevenue,
        deliveryCost: metrics.deliveryCost,
        profit: metrics.profit
      })
      
      return health.emoji
    } catch (error) {
      console.error(`⚪ Error calculating health for ${clientName}:`, error)
      const noDataHealth = getNoDataHealth()
      return noDataHealth.emoji
    }
  }

  // 🔄 Fetch client mappings and health status on component mount
  useEffect(() => {
    async function fetchClientsAndHealth() {
      try {
        console.log('🔍 Fetching clients for sidebar...')
        const clientData = await getClientMappings()
        setClients(clientData)
        
        // Fetch health status for each client
        const healthPromises = clientData.map(async (client) => {
          const health = await getProjectHealthStatus(client.client_name)
          return { [client.client_name]: health }
        })
        
        const healthResults = await Promise.all(healthPromises)
        const healthMap = healthResults.reduce((acc, curr) => ({ ...acc, ...curr }), {})
        setProjectHealth(healthMap)
        
        console.log('✅ Loaded', clientData.length, 'clients with health status')
      } catch (error) {
        console.error('💥 Failed to fetch clients for sidebar:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchClientsAndHealth()
  }, [])

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          <span className="font-semibold text-lg">Project Analytics</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={selectedProject === "all-projects"}
              onClick={() => onProjectSelect("all-projects")}
              className="w-full justify-start"
            >
              <BarChart3 className="h-4 w-4" />
              <span>All Projects</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={selectedProject === "on-going"}
              onClick={() => onProjectSelect("on-going")}
              className="w-full justify-start"
            >
              <BarChart3 className="h-4 w-4" />
              <span>On-going Projects</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={selectedProject === "one-time"}
              onClick={() => onProjectSelect("one-time")}
              className="w-full justify-start"
            >
              <BarChart3 className="h-4 w-4" />
              <span>One-time Projects</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="mt-4 space-y-2">
          <Collapsible open={clientsExpanded} onOpenChange={setClientsExpanded}>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton className="w-full justify-start">
                {clientsExpanded ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
                <span>All Clients</span>
                {clientsExpanded ? (
                  <ChevronDown className="h-4 w-4 ml-auto" />
                ) : (
                  <ChevronRight className="h-4 w-4 ml-auto" />
                )}
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {/* Hide Blanks Filter */}
              <div className="px-2 py-2 border-b">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hide-blanks"
                    checked={hideBlanks}
                    onCheckedChange={(checked) => setHideBlanks(checked as boolean)}
                  />
                  <label
                    htmlFor="hide-blanks"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Hide blanks
                  </label>
                </div>
              </div>
              
              <SidebarMenuSub>
                {loading ? (
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton>
                      Loading clients...
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ) : clients.length === 0 ? (
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton>
                      No clients found
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ) : (
                  clients
                    .filter((client) => {
                      if (!hideBlanks) return true
                      const health = projectHealth[client.client_name]
                      // Hide projects with no data (⚪) or loading (⏳)
                      return health && health !== '⚪' && health !== '⏳'
                    })
                    .map((client) => (
                      <SidebarMenuSubItem key={client.id}>
                        <SidebarMenuSubButton
                          isActive={selectedProject === client.client_name}
                          onClick={() => onProjectSelect(client.client_name)}
                          className="flex items-center justify-between w-full"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              {projectHealth[client.client_name] || '⏳'}
                            </span>
                            <span>{client.client_name}</span>
                          </div>
                          {client.project_type && (
                            <span className="text-xs text-muted-foreground">
                              {client.project_type === 'On-going' ? '🔄' : '📋'}
                            </span>
                          )}
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))
                )}
              </SidebarMenuSub>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </SidebarContent>
    </Sidebar>
  )
}
