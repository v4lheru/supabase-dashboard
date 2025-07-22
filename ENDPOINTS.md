# API Endpoints Documentation

This document outlines all the API endpoints and external services used across our dashboard applications.

## Current Project: Supabase Dashboard

### Supabase Database API

**Base URL:** `https://naitzbqgkbufxmuoypaz.supabase.co`

#### Authentication
- **Anonymous Key:** Used for client-side operations
- **Service Role Key:** Used for server-side operations with elevated permissions

#### Database Tables & Endpoints

##### 1. Client Mappings Table
**Table:** `client_mappings`

**Purpose:** Stores client configuration and project type mappings

**Fields:**
- `id` - Primary key
- `client_name` - Client identifier
- `project_type` - "On-going" or "One-Time"
- `status` - Project status
- `clickup_project_name` - ClickUp project reference
- `clickup_folder_name` - ClickUp folder reference
- `clickup_folder_id` - ClickUp folder ID
- `clickup_list_name` - ClickUp list reference
- `clickup_list_id` - ClickUp list ID
- `available_hours` - Total allocated hours
- `revenue` - Project revenue
- `average_delivery_hourly` - Hourly rate
- `slack_internal_channel_name` - Slack channel reference
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

**Operations:**
```typescript
// Get all client mappings
supabase.from('client_mappings').select('*').order('client_name')

// Get specific client mapping
supabase.from('client_mappings')
  .select('clickup_folder_name, clickup_list_name')
  .eq('client_name', clientName)
  .single()

// Create new client mapping
supabase.from('client_mappings').insert([clientData]).select().single()

// Update client mapping
supabase.from('client_mappings').update(updates).eq('id', id).select().single()
```

##### 2. ClickUp Tasks Table
**Table:** `clickup_supabase_main`

**Purpose:** Stores ClickUp task data for project analytics

**Fields:**
- `task_id` - ClickUp task identifier
- `task_name` - Task title
- `status` - Task status
- `assignees` - Comma-separated assignee names
- `folder_name` - ClickUp folder name
- `list_name` - ClickUp list name
- `time_spent` - Time spent in milliseconds
- `date_updated` - Last update timestamp
- `due_date` - Task due date
- `priority` - Task priority

**Operations:**
```typescript
// Get tasks for specific client (filtered by folder and list)
supabase.from('clickup_supabase_main')
  .select('*')
  .eq('folder_name', clickupFolderName)
  .eq('list_name', clickupListName)
  .order('date_updated', { ascending: false })

// Get tasks with time filtering
supabase.from('clickup_supabase_main')
  .select('*')
  .eq('folder_name', clickupFolderName)
  .eq('list_name', clickupListName)
  .gte('date_updated', startTimestamp)
  .lte('date_updated', endTimestamp)

// Get all tasks for team analysis
supabase.from('clickup_supabase_main').select('*').order('date_updated', { ascending: false })
```

##### 3. Team Members Table
**Table:** `team_members`

**Purpose:** Stores team member information and capacity data

**Fields:**
- `id` - Primary key
- `clickup_name` - Name as it appears in ClickUp
- `display_name` - Display name for UI
- `team` - Team assignment (Design, Development, SEO, QA)
- `role` - Job role/title
- `weekly_hours` - Weekly capacity in hours
- `status` - Employment status

**Operations:**
```typescript
// Get all team members
supabase.from('team_members')
  .select('*')
  .order('team', { ascending: true })
  .order('display_name', { ascending: true })

// Filter team members by team
teamMembers.filter(member => member.team === teamName)
```

---

## Previous Project: AI Scorecard Dashboard

*Note: Based on your request mentioning Monday.com, Gemini, and Cursor APIs, here's the documentation for those endpoints from the previous project:*

### Monday.com API

**Base URL:** `https://api.monday.com/v2`

**Authentication:** Bearer token via `Authorization` header

**Endpoint:** `POST /`

**Purpose:** GraphQL API for project management data

**Example Query:**
```graphql
query {
  boards(ids: [BOARD_ID]) {
    id
    name
    groups {
      id
      title
      items_page(limit: 100) {
        items {
          id
          name
          column_values {
            id
            text
          }
        }
      }
    }
  }
}
```

**Environment Variables:**
- `MONDAY_API_KEY` - API authentication token
- `BOARD_ID` - Monday.com board identifier

### Google Gemini API

**Purpose:** AI usage analytics from Google Workspace

**Authentication:** Service Account JSON key

**Environment Variables:**
- `GOOGLE_SERVICE_ACCOUNT_JSON` - Service account credentials
- `DOMAIN_ADMIN_EMAIL` - Google Workspace admin email

**Data Source:** Google Admin SDK Reports API for Gemini usage statistics

### Cursor API

**Base URL:** `https://api.cursor.com/teams/daily-usage-data`

**Method:** `POST`

**Authentication:** Basic Auth with Base64 encoded API key

**Request Body:**
```json
{
  "startDate": 1752451200000,
  "endDate": 1753055999000
}
```

**Response Structure:**
```json
{
  "period": {
    "startDate": 1752451200000,
    "endDate": 1753055999000
  },
  "data": [
    {
      "date": 1752451200000,
      "email": "user@example.com",
      "isActive": true,
      "totalLinesAdded": 12,
      "totalLinesDeleted": 11,
      "acceptedLinesAdded": 9,
      "acceptedLinesDeleted": 8,
      "totalApplies": 8,
      "totalAccepts": 5,
      "totalRejects": 1,
      "totalTabsShown": 165,
      "totalTabsAccepted": 54,
      "composerRequests": 0,
      "chatRequests": 0,
      "agentRequests": 38,
      "cmdkUsages": 0,
      "subscriptionIncludedReqs": 38,
      "apiKeyReqs": 0,
      "usageBasedReqs": 0,
      "bugbotUsages": 0,
      "mostUsedModel": "default",
      "applyMostUsedExtension": "json",
      "tabMostUsedExtension": "tsx",
      "clientVersion": "1.2.4"
    }
  ]
}
```

**Environment Variables:**
- `CURSOR_API_KEY` - API authentication key (format: `key_xxxxx`)

---

## API Integration Patterns

### Error Handling
All API calls implement consistent error handling:
```typescript
try {
  const { data, error } = await apiCall()
  if (error) {
    console.error('❌ API Error:', error)
    throw error
  }
  return data
} catch (error) {
  console.error('💥 Failed API call:', error)
  return fallbackValue
}
```

### Caching Strategy
- **Supabase:** Real-time data, no caching needed
- **Monday.com:** 5-minute cache for board data
- **Gemini:** Historical data cached permanently, current week live
- **Cursor:** Historical data cached permanently, current week live

### Rate Limiting
- **Supabase:** No explicit rate limits for our usage
- **Monday.com:** 60 requests per minute
- **Gemini:** Google API quotas apply
- **Cursor:** 15-second timeout per request

### Security Considerations
- All API keys stored as environment variables
- No hardcoded credentials in source code
- Service role keys only used server-side
- Anonymous keys for client-side operations

---

## Environment Variables Summary

### Current Project (Supabase Dashboard)
```env
NEXT_PUBLIC_SUPABASE_URL="https://naitzbqgkbufxmuoypaz.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Previous Project (AI Scorecard)
```env
MONDAY_API_KEY="eyJhbGciOiJIUzI1NiJ9..."
CURSOR_API_KEY="key_56d28e8a367de2afd7980aa5629333bf2fbd9ae5fa63d71874452ac6f77011de"
GOOGLE_SERVICE_ACCOUNT_JSON="{\"type\":\"service_account\"...}"
DOMAIN_ADMIN_EMAIL="admin@company.com"
NODE_ENV="production"
PORT="8080"
```

---

## Data Flow Architecture

### Current Project
```
Frontend (Next.js) → Supabase Client → Supabase Database
                                    ↓
                              ClickUp Data (ETL)
```

### Previous Project
```
Frontend (React) → Node.js Server → External APIs
                                  ├── Monday.com API
                                  ├── Google Gemini API
                                  └── Cursor API
```

---

## Monitoring & Health Checks

### Health Check Endpoints
- **Current Project:** Built-in Supabase health monitoring
- **Previous Project:** `GET /api/health` - Returns service status

### Logging
- All API calls logged with timestamps
- Error tracking with detailed error messages
- Performance monitoring for slow queries

---

*Last Updated: July 18, 2025*
