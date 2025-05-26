"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronRight, Folder, FolderOpen, BarChart3 } from "lucide-react"
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
import { getClientMappings } from "@/lib/data-services"
import { ClientMapping } from "@/lib/types"

interface ProjectSidebarProps {
  selectedProject: string
  onProjectSelect: (projectId: string) => void
}

export function ProjectSidebar({ selectedProject, onProjectSelect }: ProjectSidebarProps) {
  const [clientsExpanded, setClientsExpanded] = useState(true)
  const [clients, setClients] = useState<ClientMapping[]>([])
  const [loading, setLoading] = useState(true)

  // 🔄 Fetch client mappings on component mount
  useEffect(() => {
    async function fetchClients() {
      try {
        console.log('🔍 Fetching clients for sidebar...')
        const clientData = await getClientMappings()
        setClients(clientData)
        console.log('✅ Loaded', clientData.length, 'clients for sidebar')
      } catch (error) {
        console.error('💥 Failed to fetch clients for sidebar:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchClients()
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
                  clients.map((client) => (
                    <SidebarMenuSubItem key={client.id}>
                      <SidebarMenuSubButton
                        isActive={selectedProject === client.client_name}
                        onClick={() => onProjectSelect(client.client_name)}
                      >
                        <span>{client.client_name}</span>
                        {client.project_type && (
                          <span className="ml-auto text-xs text-muted-foreground">
                            {client.project_type === 'on-going' ? '🔄' : '📋'}
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
