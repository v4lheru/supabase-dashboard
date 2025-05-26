"use client"

import { Badge } from "@/components/ui/badge"

interface AllProjectsTypeToggleProps {
  value: "one-time" | "retainer" | "all"
  onChange: (value: "one-time" | "retainer" | "all") => void
}

export function AllProjectsTypeToggle({ value, onChange }: AllProjectsTypeToggleProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      <Badge
        variant={value === "all" ? "default" : "outline"}
        className="cursor-pointer"
        onClick={() => onChange("all")}
      >
        All Projects
      </Badge>
      <Badge
        variant={value === "one-time" ? "default" : "outline"}
        className="cursor-pointer"
        onClick={() => onChange("one-time")}
      >
        One Time Projects
      </Badge>
      <Badge
        variant={value === "retainer" ? "default" : "outline"}
        className="cursor-pointer"
        onClick={() => onChange("retainer")}
      >
        Retainer Projects
      </Badge>
    </div>
  )
}
