# Technical Context

## Technology Stack

### Frontend Framework
- **Next.js 15**: React framework with App Router
- **React 19**: Latest React version with concurrent features
- **TypeScript 5**: Type safety and developer experience

### UI & Styling
- **Tailwind CSS 3.4**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **Recharts**: Data visualization library

### Database & Backend
- **Supabase**: PostgreSQL database with real-time features
- **Supabase Client**: JavaScript client for database operations

### Development Tools
- **pnpm**: Package manager
- **PostCSS**: CSS processing
- **ESLint**: Code linting

## Environment Configuration

### Required Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://naitzbqgkbufxmuoypaz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon_key]
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5haXR6YnFna2J1ZnhtdW95cGF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDgzNDAzMCwiZXhwIjoyMDYwNDEwMDMwfQ.QVgZ_xCQ2ww3j2n_qHkZ_Wu0YUSALpH0hCNvYmwqH78
```

## Database Schema

### clickup_supabase Table
```sql
- task_id (text): Unique ClickUp task identifier
- task_name (text): Task title
- space_name (text): ClickUp space name
- folder_name (text): ClickUp folder name (client name)
- list_name (text): ClickUp list name
- status (text): Task status
- date_created (bigint): Creation timestamp
- date_updated (bigint): Last update timestamp
- priority (text): Task priority
- time_spent (bigint): Time spent in milliseconds
- time_estimate (bigint): Estimated time
- assignees (text): Comma-separated assignee names
- created_by (text): Task creator
- due_date (bigint): Due date timestamp
- start_date (bigint): Start date timestamp
```

### client_mappings Table
```sql
- id (text): Unique identifier
- client_name (text): Client name
- clickup_project_name (text): ClickUp project name
- clickup_folder_name (text): ClickUp folder name
- project_type (text): 'on-going' or 'one-time'
- total_hours_month (text): Monthly hours for on-going projects
- slack_internal_channel_name (text): Internal Slack channel
- slack_external_channel_name (text): External Slack channel
```

## Development Setup
1. Install dependencies: `pnpm install`
2. Set up environment variables
3. Run development server: `pnpm dev`
4. Build for production: `pnpm build`

## Deployment Configuration
- **Platform**: Railway
- **Build Command**: `pnpm build`
- **Start Command**: `pnpm start`
- **Node Version**: 18+
- **No Health Checks**: Explicitly disabled per requirements

## Performance Considerations
- Server-side rendering for initial load
- Client-side data fetching for interactivity
- Optimized bundle size with tree shaking
- Image optimization with Next.js
