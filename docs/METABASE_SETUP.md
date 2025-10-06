# Metabase Revenue Analytics Setup

This document outlines the setup process for integrating Metabase with the LazyLearners platform for revenue analytics.

## Overview

The revenue analytics system provides instructors with comprehensive insights into their course revenue, including:
- Gross and net revenue tracking
- Refund analysis and rates
- Average Revenue Per User (ARPU) and Average Order Value (AOV)
- Time-series revenue trends
- Transaction success/failure rates

## Prerequisites

1. **Self-hosted Metabase instance** - Version 0.45.0 or later recommended
2. **Database access** - Metabase must connect to the same database as the application
3. **Signed embedding enabled** - Required for secure instructor-facing dashboards

## Environment Variables

Add the following environment variables to your `.env` file:

```bash
# Metabase Analytics
METABASE_SITE_URL="https://your-metabase-instance.com"
METABASE_SECRET_KEY="your_metabase_secret_key_here"
METABASE_DATABASE_ID="1"
```

## Metabase Configuration

### 1. Database Connection

Connect Metabase to your application database:

1. In Metabase admin panel, go to **Admin** → **Databases**
2. Click **Add database**
3. Configure connection to your SQLite/PostgreSQL database
4. Set the database name and connection details

### 2. Enable Signed Embedding

1. Go to **Admin** → **Settings** → **Embedding**
2. Enable **Signed embedding**
3. Generate and copy the **Secret key**
4. Add the secret key to your `METABASE_SECRET_KEY` environment variable

### 3. Create Revenue Analytics Questions

Create the following saved questions in Metabase for revenue analysis:

#### Gross Revenue by Course
```sql
SELECT
  c.title as course_title,
  c.id as course_id,
  COUNT(p.id) as total_payments,
  SUM(p.amount) / 100.0 as gross_revenue,
  AVG(p.amount) / 100.0 as avg_order_value
FROM payments p
JOIN courses c ON p.course_id = c.id
WHERE p.status = 'SUCCEEDED'
  AND p.created_at >= {{start_date}}
  AND p.created_at <= {{end_date}}
  AND c.instructor_id = {{instructor_id}}
GROUP BY c.id, c.title
ORDER BY gross_revenue DESC
```

#### Revenue Trends Over Time
```sql
SELECT
  DATE(p.created_at) as date,
  COUNT(p.id) as transactions,
  SUM(CASE WHEN p.status = 'SUCCEEDED' THEN p.amount ELSE 0 END) / 100.0 as gross_revenue,
  SUM(CASE WHEN p.status = 'CANCELLED' THEN p.amount ELSE 0 END) / 100.0 as refunds,
  (SUM(CASE WHEN p.status = 'SUCCEEDED' THEN p.amount ELSE 0 END) - SUM(CASE WHEN p.status = 'CANCELLED' THEN p.amount ELSE 0 END)) / 100.0 as net_revenue
FROM payments p
JOIN courses c ON p.course_id = c.id
WHERE c.instructor_id = {{instructor_id}}
  AND p.created_at >= {{start_date}}
  AND p.created_at <= {{end_date}}
GROUP BY DATE(p.created_at)
ORDER BY date
```

#### Refund Analysis
```sql
SELECT
  c.title as course_title,
  COUNT(CASE WHEN p.status = 'CANCELLED' THEN 1 END) as refund_count,
  COUNT(p.id) as total_payments,
  (COUNT(CASE WHEN p.status = 'CANCELLED' THEN 1 END) * 100.0 / COUNT(p.id)) as refund_rate,
  SUM(CASE WHEN p.status = 'CANCELLED' THEN p.amount ELSE 0 END) / 100.0 as total_refunds
FROM payments p
JOIN courses c ON p.course_id = c.id
WHERE c.instructor_id = {{instructor_id}}
  AND p.created_at >= {{start_date}}
  AND p.created_at <= {{end_date}}
GROUP BY c.id, c.title
HAVING total_payments > 0
ORDER BY refund_rate DESC
```

#### ARPU and AOV Metrics
```sql
WITH course_stats AS (
  SELECT
    c.id as course_id,
    c.title as course_title,
    COUNT(DISTINCT CASE WHEN p.status = 'SUCCEEDED' THEN p.user_id END) as unique_purchasers,
    COUNT(CASE WHEN p.status = 'SUCCEEDED' THEN p.id END) as successful_payments,
    SUM(CASE WHEN p.status = 'SUCCEEDED' THEN p.amount ELSE 0 END) / 100.0 as gross_revenue
  FROM courses c
  LEFT JOIN payments p ON c.id = p.course_id
    AND p.created_at >= {{start_date}}
    AND p.created_at <= {{end_date}}
  WHERE c.instructor_id = {{instructor_id}}
  GROUP BY c.id, c.title
)
SELECT
  course_title,
  unique_purchasers,
  successful_payments,
  gross_revenue,
  CASE WHEN unique_purchasers > 0 THEN gross_revenue / unique_purchasers ELSE 0 END as arpu,
  CASE WHEN successful_payments > 0 THEN gross_revenue / successful_payments ELSE 0 END as aov
FROM course_stats
ORDER BY gross_revenue DESC
```

### 4. Create Revenue Dashboard

Create a dashboard that combines these questions:

1. **Revenue Overview** - KPI cards showing key metrics
2. **Revenue Trends** - Line chart of revenue over time
3. **Top Performing Courses** - Bar chart of revenue by course
4. **Refund Analysis** - Table showing refund rates by course
5. **ARPU/AOV Trends** - Charts showing user value metrics

### 5. Configure Dashboard Permissions

1. Go to **Admin** → **Permissions** → **Embed**
2. Enable embedding for the revenue dashboard
3. Set appropriate parameter mappings for instructor filtering

## Application Integration

### Dashboard IDs

Update the dashboard configuration in `src/components/analytics/revenue-dashboard.tsx`:

```typescript
const REVENUE_DASHBOARD_CONFIG = {
  revenueOverview: {
    dashboardId: 1, // Replace with actual Metabase dashboard ID
    title: "Revenue Overview",
    description: "Comprehensive view of revenue metrics and trends",
  },
  // ... other dashboard configs
};
```

### Parameter Mapping

The application automatically maps the following parameters to Metabase:

- `instructor_id` - Filters data for the current instructor
- `course_ids` - Filters data for selected courses (optional)
- `start_date` - Start date for analysis window
- `end_date` - End date for analysis window

## Security Considerations

1. **Signed Embedding** - All embeds use signed tokens that expire
2. **Instructor Isolation** - Data is automatically filtered by instructor ID
3. **Parameter Validation** - All parameters are validated server-side
4. **Token Expiration** - Embed tokens expire after 1 hour
5. **Caching** - Embed responses are cached for 5 minutes

## Troubleshooting

### Common Issues

1. **Embed not loading**
   - Check that `METABASE_SITE_URL` and `METABASE_SECRET_KEY` are set
   - Verify Metabase embedding is enabled
   - Check browser console for CORS errors

2. **No data showing**
   - Verify database connection in Metabase
   - Check that instructor has courses with payment data
   - Validate date range parameters

3. **Permission errors**
   - Ensure dashboard is published and embedding enabled
   - Check that instructor ID parameter is correctly mapped

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` to see detailed embed request logs.

## Performance Optimization

1. **Caching** - Embed tokens are cached for 5 minutes
2. **Lazy Loading** - Dashboards load only when viewed
3. **Parameter Filtering** - Queries are filtered at the database level
4. **Pagination** - Large datasets are paginated in Metabase

## Future Enhancements

- Real-time revenue updates
- Advanced cohort analysis
- Predictive revenue forecasting
- Custom dashboard builder for instructors
- Revenue goal tracking and alerts