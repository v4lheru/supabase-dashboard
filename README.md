# Project Analytics Dashboard

A comprehensive project analytics dashboard for Veza Digital, built with Next.js and connected to Supabase for real-time project tracking and financial analysis.

## Features

🎯 **Real-time Project Analytics**
- Individual client project dashboards
- Aggregated analytics across all projects
- Financial metrics (revenue, costs, profit margins)
- Time tracking and utilization metrics

📊 **Data Sources**
- **ClickUp Integration**: Live task data and time tracking
- **Supabase Database**: Client configurations and project mappings
- **Dynamic Calculations**: Real-time financial and performance metrics

🔄 **Project Types**
- **On-going Projects**: Monthly retainer-based with recurring hours
- **One-time Projects**: Fixed scope with total hour allocations

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Database**: Supabase (PostgreSQL)
- **UI Components**: Radix UI with Tailwind CSS
- **Charts**: Recharts for data visualization
- **Deployment**: Railway

## Getting Started

### Prerequisites
- Node.js 18+
- npm or pnpm
- Supabase account

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Schema

### Tables

#### `client_mappings`
- Client configuration and project setup
- Project types (on-going/one-time)
- Monthly hour allocations
- ClickUp and Slack integrations

#### `clickup_supabase`
- Live ClickUp task data
- Time tracking information
- Task status and assignments
- Project folder mappings

## Key Features

### 📈 Individual Project Analytics
- Project type identification
- Hours allocated vs. spent
- Financial performance metrics
- Task status breakdown
- Team member contributions

### 📊 Aggregated Analytics
- Cross-project performance overview
- Combined financial metrics
- Resource utilization across teams
- Project health indicators

### 🎛️ Dynamic Client Management
- Real-time client list from database
- Easy project type switching
- Configurable hourly rates and allocations

## Deployment

### Railway Deployment (Recommended)

This project is fully configured for Railway deployment:

#### 1. Prerequisites
- Railway account (https://railway.app)
- GitHub repository access
- Supabase project with required tables

#### 2. Deploy to Railway
1. **Connect Repository**: Link your GitHub repo to Railway
2. **Set Environment Variables** in Railway dashboard:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```
3. **Deploy**: Railway will automatically build and deploy using `railway.json`

#### 3. Railway Configuration
The included `railway.json` provides:
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Builder**: NIXPACKS (automatic detection)
- **Restart Policy**: ON_FAILURE with 10 retries

#### 4. Required Environment Variables
Copy `.env.example` to `.env.local` for local development, or set these in Railway:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public API key (safe for frontend)
- `SUPABASE_SERVICE_ROLE_KEY` - Admin key (optional, server-side only)

#### 5. Database Setup
Ensure your Supabase project has:
- `client_mappings` table with project configurations
- `clickup_supabase_main` table with ClickUp task data
- Proper RLS policies for data access

✅ **Ready for Production**: All dependencies, build scripts, and configurations are included in the repository.

## Contributing

1. Ensure all changes maintain TypeScript type safety
2. Test with real Supabase data
3. Follow the established component patterns
4. Update documentation for new features

## Architecture

```
├── app/                    # Next.js app router
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── *.tsx            # Feature components
├── lib/                  # Utilities and services
│   ├── supabase.ts      # Database client
│   ├── data-services.ts # Data fetching logic
│   └── types.ts         # TypeScript interfaces
└── cline_docs/          # Project documentation
```

## License

Private project for Veza Digital internal use.
