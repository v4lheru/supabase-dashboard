/**
 * Shared project health calculation logic
 * Used by both dashboard and sidebar to ensure consistency
 */

export interface ProjectHealthStatus {
  status: 'excellent' | 'good' | 'at-risk' | 'no-data'
  label: string
  emoji: string
  description: string
}

/**
 * Calculate project health based on profit margin
 * This matches the logic used in ProjectHealthCard component
 */
export function calculateProjectHealth(profitMargin: number): ProjectHealthStatus {
  if (profitMargin >= 50) {
    return {
      status: 'excellent',
      label: 'Excellent',
      emoji: '🟢',
      description: 'Project is highly profitable'
    }
  } else if (profitMargin >= 25) {
    return {
      status: 'good', 
      label: 'Good',
      emoji: '🟡',
      description: 'Project is moderately profitable'
    }
  } else {
    return {
      status: 'at-risk',
      label: 'At Risk', 
      emoji: '🔴',
      description: 'Project profitability is concerning'
    }
  }
}

/**
 * Get health status for projects with no data
 */
export function getNoDataHealth(): ProjectHealthStatus {
  return {
    status: 'no-data',
    label: 'No Data',
    emoji: '⚪',
    description: 'No project data available'
  }
}
