# Active Context

## Current Task
🔄 **IN PROGRESS**: Adding Teams functionality to existing Supabase dashboard

## Current Dashboard Architecture Understanding

### Main Structure
- **Entry Point**: `app/page.tsx` - Simple layout with sidebar and main content
- **Navigation**: `components/project-sidebar.tsx` - Hierarchical navigation with:
  - All Projects views (On-going/One-time)
  - Company sections (Veza Digital/Shadow Digital)
  - Individual client projects with health indicators
- **Main Dashboard**: `components/project-dashboard.tsx` - Handles different view types:
  - Individual project analytics
  - Project type overviews (with tabbed interface)
  - Company-specific project views

### Data Layer
- **Data Services**: `lib/data-services.ts` - Comprehensive data fetching:
  - `getClientMappings()` - Client configuration
  - `getProjectAnalytics()` - Individual project data
  - `getAllProjectsAnalytics()` - Aggregated project data
  - `getCompanyProjectsAnalytics()` - Company-filtered data
  - `extractTeamMembers()` - Team member extraction from tasks
- **Types**: `lib/types.ts` - Well-defined interfaces for all data structures
- **Database Tables**:
  - `clickup_supabase_main` - Task data with assignees, time tracking
  - `client_mappings` - Project configuration and financial data
  - `team_members` - NEW table for team member data (provided by user)

### Key Features
1. **Time-based filtering** with smart defaults (this-month for ongoing, all-time for one-time)
2. **Project health indicators** with emoji status in sidebar
3. **Tabbed interface** for dashboard vs historical views
4. **Company-specific views** (Veza/Shadow) with project type filtering
5. **Real-time data integration** from Supabase

## Teams Integration Plan

### Phase 1: 📋 PREPARE - Data Layer Integration
1. **Add team member types** to `lib/types.ts`
2. **Create team data services** in `lib/data-services.ts`:
   - `getTeamMembers()` - Fetch from team_members table
   - `getTeamAnalytics()` - Calculate team metrics
   - `getTeamMemberTasks()` - Get individual member tasks
3. **Map team data** to existing ClickUp assignees for cross-referencing

### Phase 2: 🏗️ ARCHITECT - Navigation & Components
1. **Extend sidebar navigation** to include Teams section
2. **Create team dashboard components**:
   - `components/team-dashboard.tsx` - Main team view
   - `components/capacity-metrics-card.tsx` - Team capacity overview
   - `components/team-member-capacity-card.tsx` - Individual member cards
3. **Integrate with existing routing** in `components/project-dashboard.tsx`

### Phase 3: 💻 CODE - Implementation
1. **Team data integration** with real Supabase data
2. **Utilization calculations** based on weekly hours and tracked time
3. **Task status mapping** from ClickUp to team dashboard
4. **Project allocation** showing member distribution across projects

### Phase 4: 🧪 TEST - Validation
1. **Data accuracy** - Verify team metrics match ClickUp data
2. **Navigation flow** - Ensure seamless integration with existing UI
3. **Performance** - Optimize data fetching for team views
4. **Responsive design** - Test across different screen sizes

## Database Schema Understanding

### team_members table (Configuration/Mapping)
```sql
team_members (
  id, clickup_name, display_name, team, role, 
  weekly_hours, status, created_at, updated_at,
  team_total_weekly_hours, team_members_count
)
```
- **Purpose**: Static configuration for team member details and capacity
- **Key Fields**: 
  - `clickup_name`: Maps to `assignees` field in clickup_supabase_main
  - `weekly_hours`: Individual capacity (e.g., 40h/week)
  - `team`: Team grouping (Design, Development, SEO, QA)

### Data Flow for Team Utilization
1. **team_members** → Provides capacity and team structure
2. **clickup_supabase_main** → Provides actual time tracking via `assignees` and `time_spent`
3. **Utilization Calculation**: `time_spent` from tasks / `weekly_hours` from team_members

## Teams Structure (from user requirements)
- **Design Team**: 6 members, 160h/week total
- **Development Team**: 5 members, 185h/week total  
- **SEO Team**: 1 member, 40h/week total
- **QA Team**: 1 member, 40h/week total

## Key Metrics to Implement
1. **Team Capacity**: Weekly availability vs utilization
2. **Individual Utilization**: Previous week/month performance
3. **Upcoming Capacity**: Next week/2 weeks/month forecasting
4. **Project Distribution**: Member allocation across active projects
5. **Task Status Overview**: Active/completed task breakdowns
6. **Color-coded utilization**: 70-90% green, >90% yellow, >100% red, <70% red

## Next Steps
1. ✅ **COMPLETED**: Understand existing codebase structure
2. ✅ **COMPLETED**: Add team member types and data services
3. ✅ **COMPLETED**: Create team dashboard components
4. ✅ **COMPLETED**: Integrate with sidebar navigation
5. ✅ **COMPLETED**: Test and validate implementation
6. ✅ **COMPLETED**: Implement server-side refresh with caching (80x performance improvement)

## Implementation Summary

### ✅ Completed Components
1. **Data Layer** (`lib/types.ts`, `lib/data-services.ts`):
   - Added `TeamMemberMapping`, `TeamMemberAnalytics`, `TeamAnalytics` interfaces
   - Implemented `getTeamMembers()`, `getAllClickUpTasks()`, `calculateTeamMemberAnalytics()`
   - Added `getTeamAnalytics()` and `getAllTeamsAnalytics()` functions
   - Proper mapping between `team_members.clickup_name` and `clickup_supabase_main.assignees`

2. **UI Components**:
   - `components/capacity-metrics-card.tsx` - Team capacity overview with utilization color coding
   - `components/team-member-capacity-card.tsx` - Individual member capacity and project allocation
   - `components/team-dashboard.tsx` - Main team dashboard with all metrics and task views

3. **Navigation Integration** (`components/project-sidebar.tsx`):
   - Added Teams section with Design (6), Development (5), SEO (1), QA (1) teams
   - Proper team member counts displayed
   - Integrated with existing navigation structure

4. **Routing Integration** (`components/project-dashboard.tsx`):
   - Added team view detection and routing
   - Maps team IDs to team names (design-team → Design, etc.)
   - Seamless integration with existing project views

### 🎯 Key Features Implemented
- **Team Capacity Overview**: Weekly capacity, utilization rates, upcoming availability
- **Individual Member Analytics**: Previous week/month performance, 3-month averages
- **Project Allocation**: Shows which projects team members are working on
- **Task Status Breakdown**: Active, completed, in-progress task counts
- **Color-coded Utilization**: 70-90% green, >90% yellow, >100% red, <70% red
- **Real-time Data**: Pulls from actual Supabase team_members and clickup_supabase_main tables

### 📊 Data Flow
1. `team_members` table provides team structure and weekly capacity
2. `clickup_supabase_main` provides actual time tracking via assignees field
3. Analytics calculated by matching `clickup_name` to `assignees`
4. Utilization = `time_spent` / `weekly_hours` with proper time period filtering

## Integration Approach
- **Extend existing patterns** rather than replace
- **Reuse existing UI components** (Cards, Progress, Badges)
- **Follow established data flow** (services → components → UI)
- **Maintain consistent styling** with current dashboard theme
- **Preserve existing functionality** while adding teams
