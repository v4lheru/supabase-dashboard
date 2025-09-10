"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronRight, Folder, FolderOpen, BarChart3, Building2, Users } from "lucide-react"
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
  const [vezaExpanded, setVezaExpanded] = useState(true)
  const [shadowExpanded, setShadowExpanded] = useState(true)
  const [teamsExpanded, setTeamsExpanded] = useState(true)
  const [vezaHideBlanks, setVezaHideBlanks] = useState(false)
  const [shadowHideBlanks, setShadowHideBlanks] = useState(false)
  const [clients, setClients] = useState<ClientMapping[]>([])
  const [projectHealth, setProjectHealth] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  // Calculate project health status using appropriate time period based on project type
  const getProjectHealthStatus = async (clientName: string, projectType: string): Promise<string> => {
    try {
      // Use appropriate time period based on project type
      const timePeriod = projectType === 'On-going' ? 'this-month' : 'all-time'
      const analytics = await getProjectAnalytics(clientName, timePeriod)
      
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
      
      console.log(`${health.emoji} ${clientName} (${timePeriod}):`, {
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
        
        // Fetch health status for each client with appropriate time period
        const healthPromises = clientData.map(async (client) => {
          const health = await getProjectHealthStatus(client.client_name, client.project_type || 'On-going')
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

  // Filter clients by company
  const vezaClients = clients.filter(client => client.clickup_project_name === 'Veza Digital Projects')
  const shadowClients = clients.filter(client => client.clickup_project_name === 'Shadow Digital Projects')

  // Filter function for hide blanks
  const filterBlanks = (clientList: ClientMapping[], hideBlanks: boolean) => {
    if (!hideBlanks) return clientList
    return clientList.filter(client => {
      const health = projectHealth[client.client_name]
      return health && health !== '⚪' && health !== '⏳'
    })
  }

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
          {/* All Projects Overview */}
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={selectedProject === "on-going"}
              onClick={() => onProjectSelect("on-going")}
              className="w-full justify-start"
            >
              <BarChart3 className="h-4 w-4" />
              <span>All On-Going Projects</span>
              <span className="ml-auto text-xs text-muted-foreground">This Month</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={selectedProject === "one-time"}
              onClick={() => onProjectSelect("one-time")}
              className="w-full justify-start"
            >
              <BarChart3 className="h-4 w-4" />
              <span>All One-Time Projects</span>
              <span className="ml-auto text-xs text-muted-foreground">All Time</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Teams Section */}
        <div className="mt-2">
          <Collapsible open={teamsExpanded} onOpenChange={setTeamsExpanded}>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton className="w-full justify-start">
                <Users className="h-4 w-4" />
                <span>Teams</span>
                {teamsExpanded ? (
                  <ChevronDown className="h-4 w-4 ml-auto" />
                ) : (
                  <ChevronRight className="h-4 w-4 ml-auto" />
                )}
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                <SidebarMenuSubItem>
                  <SidebarMenuSubButton
                    isActive={selectedProject === "design-team"}
                    onClick={() => onProjectSelect("design-team")}
                    className="w-full justify-start"
                  >
                    <Users className="h-4 w-4" />
                    <span>Design Team</span>
                    <span className="ml-auto text-xs text-muted-foreground">6 members</span>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>

                <SidebarMenuSubItem>
                  <SidebarMenuSubButton
                    isActive={selectedProject === "development-team"}
                    onClick={() => onProjectSelect("development-team")}
                    className="w-full justify-start"
                  >
                    <Users className="h-4 w-4" />
                    <span>Development Team</span>
                    <span className="ml-auto text-xs text-muted-foreground">5 members</span>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>

                <SidebarMenuSubItem>
                  <SidebarMenuSubButton
                    isActive={selectedProject === "seo-team"}
                    onClick={() => onProjectSelect("seo-team")}
                    className="w-full justify-start"
                  >
                    <Users className="h-4 w-4" />
                    <span>SEO Team</span>
                    <span className="ml-auto text-xs text-muted-foreground">1 member</span>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>

                <SidebarMenuSubItem>
                  <SidebarMenuSubButton
                    isActive={selectedProject === "qa-team"}
                    onClick={() => onProjectSelect("qa-team")}
                    className="w-full justify-start"
                  >
                    <Users className="h-4 w-4" />
                    <span>QA Team</span>
                    <span className="ml-auto text-xs text-muted-foreground">1 member</span>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              </SidebarMenuSub>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className="mt-4 space-y-2">
          {/* Veza Digital Section */}
          <Collapsible open={vezaExpanded} onOpenChange={setVezaExpanded}>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton className="w-full justify-start">
                <Building2 className="h-4 w-4" />
                <span>Veza Digital</span>
                {vezaExpanded ? (
                  <ChevronDown className="h-4 w-4 ml-auto" />
                ) : (
                  <ChevronRight className="h-4 w-4 ml-auto" />
                )}
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {/* Veza Project Type Views */}
              <SidebarMenuSub>
                <SidebarMenuSubItem>
                  <SidebarMenuSubButton
                    isActive={selectedProject === "veza-ongoing"}
                    onClick={() => onProjectSelect("veza-ongoing")}
                    className="w-full justify-start"
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>Veza Digital Ongoing Projects</span>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>

                <SidebarMenuSubItem>
                  <SidebarMenuSubButton
                    isActive={selectedProject === "veza-onetime"}
                    onClick={() => onProjectSelect("veza-onetime")}
                    className="w-full justify-start"
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>Veza Digital One-time Projects</span>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              </SidebarMenuSub>

              {/* Veza Hide Blanks Filter */}
              <div className="px-2 py-2 border-b">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="veza-hide-blanks"
                    checked={vezaHideBlanks}
                    onCheckedChange={(checked) => setVezaHideBlanks(checked as boolean)}
                  />
                  <label
                    htmlFor="veza-hide-blanks"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Hide blanks
                  </label>
                </div>
              </div>
              
              {/* Veza Individual Clients */}
              <SidebarMenuSub>
                {loading ? (
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton>
                      Loading Veza clients...
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ) : filterBlanks(vezaClients, vezaHideBlanks).length === 0 ? (
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton>
                      No Veza clients found
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ) : (
                  filterBlanks(vezaClients, vezaHideBlanks).map((client) => (
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
                            {client.project_type === 'On-going' || client.project_type === 'On-Going' ? '🔄' : '📋'}
                          </span>
                        )}
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))
                )}
              </SidebarMenuSub>
            </CollapsibleContent>
          </Collapsible>

          {/* Shadow Digital Section */}
          <Collapsible open={shadowExpanded} onOpenChange={setShadowExpanded}>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton className="w-full justify-start">
                <Building2 className="h-4 w-4" />
                <span>Shadow Digital</span>
                {shadowExpanded ? (
                  <ChevronDown className="h-4 w-4 ml-auto" />
                ) : (
                  <ChevronRight className="h-4 w-4 ml-auto" />
                )}
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {/* Shadow Project Type Views */}
              <SidebarMenuSub>
                <SidebarMenuSubItem>
                  <SidebarMenuSubButton
                    isActive={selectedProject === "shadow-ongoing"}
                    onClick={() => onProjectSelect("shadow-ongoing")}
                    className="w-full justify-start"
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>Shadow Digital Ongoing Projects</span>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>

                <SidebarMenuSubItem>
                  <SidebarMenuSubButton
                    isActive={selectedProject === "shadow-onetime"}
                    onClick={() => onProjectSelect("shadow-onetime")}
                    className="w-full justify-start"
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>Shadow Digital One-time Projects</span>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              </SidebarMenuSub>

              {/* Shadow Hide Blanks Filter */}
              <div className="px-2 py-2 border-b">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="shadow-hide-blanks"
                    checked={shadowHideBlanks}
                    onCheckedChange={(checked) => setShadowHideBlanks(checked as boolean)}
                  />
                  <label
                    htmlFor="shadow-hide-blanks"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Hide blanks
                  </label>
                </div>
              </div>
              
              {/* Shadow Individual Clients */}
              <SidebarMenuSub>
                {loading ? (
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton>
                      Loading Shadow clients...
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ) : filterBlanks(shadowClients, shadowHideBlanks).length === 0 ? (
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton>
                      No Shadow clients found
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ) : (
                  filterBlanks(shadowClients, shadowHideBlanks).map((client) => (
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
                            {client.project_type === 'On-going' || client.project_type === 'On-Going' ? '🔄' : '📋'}
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
