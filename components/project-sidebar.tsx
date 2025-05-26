"use client"

import { useState } from "react"
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

interface ProjectSidebarProps {
  selectedProject: string
  onProjectSelect: (projectId: string) => void
}

const vezaProjects = [
  { id: "veza-dagster", name: "Dagster" },
  { id: "veza-webconnex", name: "Webconnex" },
  { id: "veza-mobile-app", name: "Mobile App Development" },
  { id: "veza-website-redesign", name: "Website Redesign" },
  { id: "veza-crm-integration", name: "CRM Integration" },
]

const shadowProjects = [
  { id: "shadow-brand-identity", name: "Brand Identity Package" },
  { id: "shadow-marketing-campaign", name: "Marketing Campaign" },
  { id: "shadow-social-media", name: "Social Media Management" },
  { id: "shadow-content-strategy", name: "Content Strategy" },
]

export function ProjectSidebar({ selectedProject, onProjectSelect }: ProjectSidebarProps) {
  const [vezaExpanded, setVezaExpanded] = useState(true)
  const [shadowExpanded, setShadowExpanded] = useState(true)

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
              isActive={selectedProject === "veza-digital"}
              onClick={() => onProjectSelect("veza-digital")}
              className="w-full justify-start"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Veza Digital Projects</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={selectedProject === "shadow-digital"}
              onClick={() => onProjectSelect("shadow-digital")}
              className="w-full justify-start"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Shadow Digital Projects</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="mt-4 space-y-2">
          <Collapsible open={vezaExpanded} onOpenChange={setVezaExpanded}>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton className="w-full justify-start">
                {vezaExpanded ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
                <span>Veza Digital</span>
                {vezaExpanded ? (
                  <ChevronDown className="h-4 w-4 ml-auto" />
                ) : (
                  <ChevronRight className="h-4 w-4 ml-auto" />
                )}
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {vezaProjects.map((project) => (
                  <SidebarMenuSubItem key={project.id}>
                    <SidebarMenuSubButton
                      isActive={selectedProject === project.id}
                      onClick={() => onProjectSelect(project.id)}
                    >
                      {project.name}
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible open={shadowExpanded} onOpenChange={setShadowExpanded}>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton className="w-full justify-start">
                {shadowExpanded ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
                <span>Shadow Digital</span>
                {shadowExpanded ? (
                  <ChevronDown className="h-4 w-4 ml-auto" />
                ) : (
                  <ChevronRight className="h-4 w-4 ml-auto" />
                )}
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {shadowProjects.map((project) => (
                  <SidebarMenuSubItem key={project.id}>
                    <SidebarMenuSubButton
                      isActive={selectedProject === project.id}
                      onClick={() => onProjectSelect(project.id)}
                    >
                      {project.name}
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </SidebarContent>
    </Sidebar>
  )
}
