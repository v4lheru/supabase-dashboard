"use client"

import { Badge } from "@/components/ui/badge"

interface ProjectTypeToggleProps {
  value: "one-time" | "retainer"
  onChange: (value: "one-time" | "retainer") => void
  disabled?: boolean
}

export function ProjectTypeToggle({ value, onChange, disabled = false }: ProjectTypeToggleProps) {
  return (
    <div className="flex gap-2">
      <Badge
        variant={value === "one-time" ? "default" : "outline"}
        className={`cursor-pointer ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
        onClick={() => !disabled && onChange("one-time")}
      >
        One Time Project
      </Badge>
      <Badge
        variant={value === "retainer" ? "default" : "outline"}
        className={`cursor-pointer ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
        onClick={() => !disabled && onChange("retainer")}
      >
        Retainer Project
      </Badge>
    </div>
  )
}
