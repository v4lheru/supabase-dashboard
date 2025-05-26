# System Patterns

## Architecture Overview
- **Frontend**: Next.js 15 with React 19 and TypeScript
- **UI Framework**: Radix UI components with Tailwind CSS
- **Database**: Supabase PostgreSQL
- **Deployment**: Railway
- **Data Visualization**: Recharts

## Key Technical Patterns

### Data Flow Architecture
1. **Supabase Tables** → **Data Services** → **React Components** → **UI Display**
2. Real-time updates from ClickUp sync to `clickup_supabase` table
3. Client configuration managed in `client_mappings` table
4. Dashboard aggregates data from both tables for analytics

### Component Structure
```
app/
├── page.tsx (Main dashboard with project selection)
├── layout.tsx (Root layout with theme provider)
components/
├── project-sidebar.tsx (Navigation and project selection)
├── project-dashboard.tsx (Individual project analytics)
├── all-projects-overview.tsx (Aggregated analytics)
├── ui/ (Reusable UI components)
```

### Data Management Patterns
- **Single Source of Truth**: Database tables are authoritative
- **Computed Metrics**: Financial calculations done in real-time
- **Type Safety**: TypeScript interfaces for all data structures
- **Error Handling**: Graceful fallbacks for missing data

### State Management
- React hooks for local state
- Supabase client for data fetching
- Real-time subscriptions for live updates

## Database Design Patterns

### Table Relationships
- `client_mappings` defines project structure and billing
- `clickup_supabase` contains actual work data
- Join operations for comprehensive analytics

### Data Aggregation
- Time-based calculations (hours spent vs allocated)
- Financial metrics (revenue, costs, profit margins)
- Team utilization across projects

## Security Patterns
- Environment variables for sensitive credentials
- Service role key for server-side operations
- Row-level security (if implemented)

## Deployment Patterns
- Railway for hosting
- Environment-based configuration
- No health checks (per requirement)
