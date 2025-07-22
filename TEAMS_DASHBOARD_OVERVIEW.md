# Teams Dashboard - Executive Overview

## 🎯 **Business Objective**
The Teams Dashboard provides real-time visibility into team capacity, utilization, and workload distribution across our organization. This enables data-driven resource allocation, identifies bottlenecks, and optimizes team productivity.

## 📊 **Key Business Metrics**

### **Team Capacity Management**
- **Weekly Capacity**: Total available hours per team per week
- **Utilization Rate**: Percentage of capacity actually used
- **Availability Forecasting**: Upcoming capacity for project planning
- **Workload Distribution**: Individual member allocation across projects

### **Performance Indicators**
- **Optimal Range**: 70-90% utilization (Green)
- **High Load**: 90-100% utilization (Yellow) 
- **Overloaded**: >100% utilization (Red)
- **Underutilized**: <70% utilization (Red)

---

## 🏗️ **Technical Architecture**

### **Data Sources**
1. **team_members** table - Team structure and capacity configuration
2. **clickup_supabase_main** table - Real-time task and time tracking data
3. **client_mappings** table - Project and client configuration

### **Database Schema**

#### **team_members Table**
```sql
- id: Unique identifier
- clickup_name: Name as it appears in ClickUp (for data mapping)
- display_name: Human-readable name for dashboard
- team: Team assignment (Design, Development, SEO, QA)
- role: Job title/position
- weekly_hours: Individual capacity (e.g., 40h/week)
- status: Active/Inactive status
- team_total_weekly_hours: Pre-calculated team capacity
- team_members_count: Pre-calculated team size
```

#### **clickup_supabase_main Table**
```sql
- task_id: Unique task identifier
- task_name: Task description
- assignees: Comma-separated list of assigned team members
- time_spent: Time tracked in milliseconds
- status: Task status (complete, in progress, etc.)
- date_updated: Last modification timestamp
- folder_name: Project/client folder
- priority: Task priority level
- due_date: Task deadline
```

---

## 🧮 **Calculation Logic**

### **Individual Utilization Formula**
```
Utilization % = (Actual Hours Worked / Available Hours) × 100

Where:
- Actual Hours = Sum of time_spent (converted from milliseconds to hours)
- Available Hours = weekly_hours × time_period_weeks
- Time periods: This week, Last week, Last 30 days, Last 3 months
```

### **Shared Task Time Allocation**
When multiple team members are assigned to a task:
```
Individual Hours = Total Task Hours ÷ Number of Assignees

Example: 
- Task with 8 hours, assigned to 2 people
- Each person gets credited with 4 hours
```

### **Team-Level Aggregation**
```
Team Utilization = Average of all active team member utilizations
Team Capacity = Sum of all team member weekly_hours
Team Availability = 100% - Current Utilization %
```

---

## 📈 **Key Performance Indicators (KPIs)**

### **Capacity Metrics**
- **Weekly Capacity**: Total team hours available per week
- **Previous Week Utilization**: Last week's actual vs. planned capacity
- **Previous Month Average**: 30-day rolling average utilization
- **Upcoming Availability**: Forecasted capacity for next week/month

### **Productivity Metrics**
- **Active Tasks**: Current workload per team/individual
- **Completed Tasks**: Weekly/monthly completion rates
- **Team Progress**: Ratio of completed to total assigned tasks
- **Project Distribution**: Hours allocated across different clients/projects

### **Workload Balance Indicators**
- **Overutilization**: Members working >100% capacity
- **Underutilization**: Members working <70% capacity
- **Capacity Timeline**: Visual forecast of upcoming availability
- **Task Status Distribution**: Breakdown by To Do, In Progress, Waiting Approval, Completed

---

## 🎨 **Team Structure**

### **Current Organization**
- **Design Team**: 6 members, 160h/week capacity
  - Lead Designer: David Prodanovic (40h/week)
  - Designers: Inna Ramashko (40h), Aleksa Lucic (40h)
  - Part-time: Ana Dusanic (15h), Jelena Dusanic (15h), Natasha Abate (10h)

- **Development Team**: 5 members, 185h/week capacity
  - Developers: Sasa Kuridza (40h), Dusan Nedeljkovic (40h), Andrija Tanasijević (40h), Andrej Jovic (40h)
  - Part-time: Milan Kostic (25h/week)

- **SEO Team**: 1 member, 40h/week capacity
  - SEO Specialist: Mina Djoric (40h/week)

- **QA Team**: 1 member, 40h/week capacity
  - QA Specialist: Nina Popovic (40h/week)

---

## 🔄 **Data Flow Process**

### **Real-Time Data Pipeline**
1. **ClickUp Integration**: Time tracking data flows into clickup_supabase_main
2. **Team Mapping**: clickup_name field links ClickUp users to team_members table
3. **Calculation Engine**: Processes raw time data into utilization metrics
4. **Dashboard Display**: Real-time visualization of team performance

### **Time Period Analysis**
- **This Week**: Rolling 7-day window from current date
- **Last Week**: Previous 7-day period
- **This Month**: Current calendar month
- **Last 30 Days**: Rolling 30-day window
- **Last 3 Months**: Rolling 90-day average for trend analysis

---

## 🚦 **Color-Coded Status System**

### **Utilization Status Colors**
- 🟢 **Green (70-90%)**: Optimal productivity range
- 🟡 **Yellow (90-100%)**: High load, monitor closely
- 🔴 **Red (>100%)**: Overloaded, requires immediate attention
- 🔴 **Red (<70%)**: Underutilized, potential for more work

### **Capacity Availability Colors**
- 🟢 **Green (>30% available)**: Good capacity for new projects
- 🟡 **Yellow (10-30% available)**: Limited capacity, plan carefully
- 🔴 **Red (<10% available)**: Overloaded, no additional capacity

---

## 📊 **Business Intelligence Features**

### **Forecasting Capabilities**
- **Next Week Capacity**: Predicted availability based on current workload
- **Next 2 Weeks**: Medium-term capacity planning
- **Next Month**: Long-term resource allocation planning

### **Project Allocation Tracking**
- **Current Projects**: Which projects each team member is working on
- **Average Weekly Hours**: Historical allocation per project
- **Project Distribution**: Workload spread across different clients

### **Task Management Integration**
- **Active Tasks**: Real-time view of current assignments
- **Task Status**: Progress tracking across different stages
- **Priority Management**: High/medium/low priority task distribution
- **Due Date Monitoring**: Upcoming deadlines and overdue items

---

## 💼 **Executive Decision Support**

### **Resource Planning**
- Identify teams approaching capacity limits
- Plan hiring needs based on utilization trends
- Optimize project assignments across team members
- Balance workload to prevent burnout

### **Performance Monitoring**
- Track team productivity trends over time
- Identify high-performing and struggling team members
- Monitor project delivery efficiency
- Assess impact of workload on quality

### **Strategic Insights**
- **Capacity Constraints**: Which teams are bottlenecks?
- **Utilization Patterns**: Are we over/under-utilizing talent?
- **Project Profitability**: Resource allocation vs. revenue impact
- **Team Scaling**: Data-driven hiring and team expansion decisions

---

## 🔧 **Technical Implementation**

### **Data Accuracy Measures**
- Real-time synchronization with ClickUp
- Automated time conversion (milliseconds to hours)
- Proper handling of shared task assignments
- Historical data preservation for trend analysis

### **Performance Optimization**
- Efficient database queries with proper indexing
- Cached calculations for frequently accessed metrics
- Responsive design for mobile and desktop access
- Real-time updates without page refresh

### **Security & Access Control**
- Role-based access to sensitive team data
- Secure API connections to external systems
- Data privacy compliance for employee information
- Audit trails for data access and modifications

---

## 📋 **Action Items & Recommendations**

### **Immediate Actions**
1. **Monitor Red Status Teams**: Address overutilization immediately
2. **Redistribute Workload**: Balance assignments across team members
3. **Capacity Planning**: Use forecasting for upcoming project assignments

### **Strategic Recommendations**
1. **Hiring Decisions**: Teams consistently >90% utilization need expansion
2. **Process Optimization**: Identify bottlenecks causing overutilization
3. **Training Needs**: Underutilized members may need skill development
4. **Project Prioritization**: Use capacity data for project selection

---

*This dashboard provides real-time, data-driven insights into team performance, enabling proactive management and strategic decision-making for optimal resource utilization.*
