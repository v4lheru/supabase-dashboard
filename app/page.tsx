"use client"

import { useState } from "react"
import { ProjectSidebar } from "@/components/project-sidebar"
import { ProjectDashboard } from "@/components/project-dashboard"
import { SidebarProvider } from "@/components/ui/sidebar"

export default function Dashboard() {
  const [selectedProject, setSelectedProject] = useState("on-going")

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full">
        <ProjectSidebar selectedProject={selectedProject} onProjectSelect={setSelectedProject} />
        <main className="flex-1 overflow-auto">
          <ProjectDashboard selectedProject={selectedProject} />
        </main>
      </div>
    </SidebarProvider>
  )
}
