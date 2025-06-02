"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AllProjectsOverview } from "@/components/all-projects-overview"
import { ProjectsHistoricalView } from "@/components/projects-historical-view"
import { OneTimeProjectsHistoricalView } from "@/components/one-time-projects-historical-view"
import { ProjectAnalytics, ProjectTypeFilter, ProjectStatusFilter, ClientMapping } from "@/lib/types"

interface ProjectTypeDashboardProps {
  projectType: 'On-going' | 'One-Time'
  allProjectsData: ProjectAnalytics[]
  allClients: ClientMapping[]
  statusFilter: ProjectStatusFilter
  timePeriod: string
  onTimePeriodChange: (period: string) => void
  onStatusFilterChange: (status: ProjectStatusFilter) => void
}

export function ProjectTypeDashboard({
  projectType,
  allProjectsData,
  allClients,
  statusFilter,
  timePeriod,
  onTimePeriodChange,
  onStatusFilterChange
}: ProjectTypeDashboardProps) {
  const [activeTab, setActiveTab] = useState("dashboard")

  const filterType: ProjectTypeFilter = projectType

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{projectType} Projects</h1>
        <p className="text-muted-foreground">
          {projectType === 'On-going' ? 'Monthly retainer-based projects' : 'Fixed scope projects'}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="historical">Historical</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="mt-6">
          <AllProjectsOverview
            projectData={allProjectsData}
            filter={filterType}
            statusFilter={statusFilter}
            timePeriod={timePeriod}
            onTimePeriodChange={onTimePeriodChange}
            onStatusFilterChange={onStatusFilterChange}
          />
        </TabsContent>
        
        <TabsContent value="historical" className="mt-6">
          {projectType === 'On-going' ? (
            <ProjectsHistoricalView
              clients={allClients}
              projectType={projectType}
            />
          ) : (
            <OneTimeProjectsHistoricalView
              clients={allClients}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
