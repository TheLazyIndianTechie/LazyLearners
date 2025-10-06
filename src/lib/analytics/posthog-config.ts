/**
 * PostHog dashboard and cohort configurations for LazyLearners analytics
 */

export interface PosthogDashboard {
  id: string;
  name: string;
  description: string;
  insightIds: string[];
  filters?: Record<string, any>;
}

export interface PosthogCohort {
  id: string;
  name: string;
  description: string;
  query: Record<string, any>;
}

export interface PosthogInsight {
  id: string;
  name: string;
  description: string;
  query: Record<string, any>;
  filters?: Record<string, any>;
}

/**
 * Pre-configured PostHog insights for learner engagement analytics
 */
export const POSTHOG_INSIGHTS: Record<string, PosthogInsight> = {
  // DAU/MAU/WAU Insights
  dau_trend: {
    id: "dau_trend",
    name: "Daily Active Users Trend",
    description: "Track daily active users over time",
    query: {
      kind: "TrendsQuery",
      properties: {
        type: "AND",
        values: [
          {
            key: "$event",
            operator: "is_not",
            value: "$feature_flag_called"
          }
        ]
      },
      breakdown: null,
      breakdown_type: null,
      display: "ActionsLineGraph",
      insight: "TRENDS",
      interval: "day",
      series: [
        {
          kind: "EventsNode",
          event: "$pageview",
          name: "$pageview",
          math: "dau"
        }
      ],
      trendsFilter: {
        compare: false,
        display: "ActionsLineGraph"
      }
    }
  },

  wau_trend: {
    id: "wau_trend",
    name: "Weekly Active Users Trend",
    description: "Track weekly active users over time",
    query: {
      kind: "TrendsQuery",
      properties: {
        type: "AND",
        values: [
          {
            key: "$event",
            operator: "is_not",
            value: "$feature_flag_called"
          }
        ]
      },
      breakdown: null,
      breakdown_type: null,
      display: "ActionsLineGraph",
      insight: "TRENDS",
      interval: "week",
      series: [
        {
          kind: "EventsNode",
          event: "$pageview",
          name: "$pageview",
          math: "weekly_active"
        }
      ],
      trendsFilter: {
        compare: false,
        display: "ActionsLineGraph"
      }
    }
  },

  mau_trend: {
    id: "mau_trend",
    name: "Monthly Active Users Trend",
    description: "Track monthly active users over time",
    query: {
      kind: "TrendsQuery",
      properties: {
        type: "AND",
        values: [
          {
            key: "$event",
            operator: "is_not",
            value: "$feature_flag_called"
          }
        ]
      },
      breakdown: null,
      breakdown_type: null,
      display: "ActionsLineGraph",
      insight: "TRENDS",
      interval: "month",
      series: [
        {
          kind: "EventsNode",
          event: "$pageview",
          name: "$pageview",
          math: "monthly_active"
        }
      ],
      trendsFilter: {
        compare: false,
        display: "ActionsLineGraph"
      }
    }
  },

  // Course Enrollment Funnel
  enrollment_funnel: {
    id: "enrollment_funnel",
    name: "Course Enrollment Funnel",
    description: "Track the journey from course discovery to enrollment",
    query: {
      kind: "FunnelsQuery",
      properties: {
        type: "AND",
        values: []
      },
      series: [
        {
          kind: "EventsNode",
          event: "$pageview",
          name: "$pageview",
          properties: [
            {
              key: "$current_url",
              operator: "icontains",
              value: "/courses/"
            }
          ]
        },
        {
          kind: "EventsNode",
          event: "course_enrolled",
          name: "course_enrolled"
        }
      ],
      funnelVizType: "steps",
      exclusions: [],
      filterTestAccounts: false,
      funnelWindowInterval: 14,
      funnelWindowIntervalUnit: "day",
      breakdownAttributionType: "first_touch",
      breakdownAttributionValue: 0,
      funnelWindowIntervalToDefault: true,
      exclusionsToDefault: true
    }
  },

  // Learning Progress Funnel
  learning_progression_funnel: {
    id: "learning_progression_funnel",
    name: "Learning Progression Funnel",
    description: "Track progression from enrollment to course completion",
    query: {
      kind: "FunnelsQuery",
      properties: {
        type: "AND",
        values: []
      },
      series: [
        {
          kind: "EventsNode",
          event: "course_enrolled",
          name: "course_enrolled"
        },
        {
          kind: "EventsNode",
          event: "lesson_started",
          name: "lesson_started"
        },
        {
          kind: "EventsNode",
          event: "lesson_completed",
          name: "lesson_completed"
        },
        {
          kind: "EventsNode",
          event: "course_completed",
          name: "course_completed"
        }
      ],
      funnelVizType: "steps",
      exclusions: [],
      filterTestAccounts: false,
      funnelWindowInterval: 90,
      funnelWindowIntervalUnit: "day",
      breakdownAttributionType: "first_touch",
      breakdownAttributionValue: 0,
      funnelWindowIntervalToDefault: true,
      exclusionsToDefault: true
    }
  },

   // Course Engagement by Category
   course_engagement_by_category: {
     id: "course_engagement_by_category",
     name: "Course Engagement by Category",
     description: "Compare engagement metrics across different course categories",
     query: {
       kind: "TrendsQuery",
       properties: {
         type: "AND",
         values: []
       },
       breakdown: {
         breakdown: "category",
         breakdown_type: "event"
       },
       breakdown_type: "event",
       display: "ActionsLineGraph",
       insight: "TRENDS",
       interval: "week",
       series: [
         {
           kind: "EventsNode",
           event: "lesson_completed",
           name: "lesson_completed",
           math: "total"
         }
       ],
       trendsFilter: {
         compare: false,
         display: "ActionsLineGraph"
       }
     },
     filters: {
       properties: [
         {
           key: "instructor_id",
           operator: "exact",
           value: "{instructor_id}"
         }
       ]
     }
   },

  // Quiz Performance
  quiz_completion_rate: {
    id: "quiz_completion_rate",
    name: "Quiz Completion and Pass Rates",
    description: "Track quiz completion and pass rates over time",
    query: {
      kind: "TrendsQuery",
      properties: {
        type: "AND",
        values: []
      },
      breakdown: null,
      breakdown_type: null,
      display: "ActionsLineGraph",
      insight: "TRENDS",
      interval: "week",
      series: [
        {
          kind: "EventsNode",
          event: "quiz_completed",
          name: "quiz_completed",
          math: "total"
        },
        {
          kind: "EventsNode",
          event: "quiz_passed",
          name: "quiz_passed",
          math: "total"
        }
      ],
      trendsFilter: {
        compare: false,
        display: "ActionsLineGraph"
      }
    }
  },

  // Video Engagement
  video_watch_time: {
    id: "video_watch_time",
    name: "Average Video Watch Time",
    description: "Track average time spent watching videos",
    query: {
      kind: "TrendsQuery",
      properties: {
        type: "AND",
        values: []
      },
      breakdown: null,
      breakdown_type: null,
      display: "ActionsLineGraph",
      insight: "TRENDS",
      interval: "week",
      series: [
        {
          kind: "EventsNode",
          event: "video_completed",
          name: "video_completed",
          math: "avg",
          math_property: "time_spent_seconds"
        }
      ],
      trendsFilter: {
        compare: false,
        display: "ActionsLineGraph"
      }
    }
  },

   // Session Analytics
   session_duration: {
     id: "session_duration",
     name: "Average Session Duration",
     description: "Track average session duration over time",
     query: {
       kind: "TrendsQuery",
       properties: {
         type: "AND",
         values: []
       },
       breakdown: null,
       breakdown_type: null,
       display: "ActionsLineGraph",
       insight: "TRENDS",
       interval: "day",
       series: [
         {
           kind: "EventsNode",
           event: "session_ended",
           name: "session_ended",
           math: "avg",
           math_property: "duration_seconds"
         }
       ],
       trendsFilter: {
         compare: false,
         display: "ActionsLineGraph"
       }
     },
     filters: {
       properties: [
         {
           key: "instructor_id",
           operator: "exact",
           value: "{instructor_id}"
         }
       ]
     }
   },

   // Engagement Retention
   user_retention: {
     id: "user_retention",
     name: "User Retention Analysis",
     description: "Track user retention and engagement over time",
     query: {
       kind: "RetentionQuery",
       properties: {
         type: "AND",
         values: []
       },
       target_entity: {
         type: "events",
         id: "course_enrolled",
         name: "course_enrolled"
       },
       returning_entity: {
         type: "events",
         id: "lesson_completed",
         name: "lesson_completed"
       },
       retention_type: "retention_first_time",
       total_intervals: 12,
       period: "Week"
     },
     filters: {
       properties: [
         {
           key: "instructor_id",
           operator: "exact",
           value: "{instructor_id}"
         }
       ]
     }
   },

   // Content Interaction Heatmap
   content_interaction_heatmap: {
     id: "content_interaction_heatmap",
     name: "Content Interaction Heatmap",
     description: "Visualize when learners are most active",
     query: {
       kind: "TrendsQuery",
       properties: {
         type: "AND",
         values: []
       },
       breakdown: {
         breakdown: "hour",
         breakdown_type: "event"
       },
       breakdown_type: "event",
       display: "ActionsLineGraph",
       insight: "TRENDS",
       interval: "day",
       series: [
         {
           kind: "EventsNode",
           event: "lesson_started",
           name: "lesson_started",
           math: "total"
         }
       ],
       trendsFilter: {
         compare: false,
         display: "ActionsLineGraph"
       }
     },
     filters: {
       properties: [
         {
           key: "instructor_id",
           operator: "exact",
           value: "{instructor_id}"
         }
       ]
     }
   }
      ],
      trendsFilter: {
        compare: false,
        display: "ActionsLineGraph"
      }
    }
  },

  // Video Analytics Insights
  video_retention_analysis: {
    id: "video_retention_analysis",
    name: "Video Retention Analysis",
    description: "Track how many viewers continue watching at different points in the video",
    query: {
      kind: "FunnelsQuery",
      properties: {
        type: "AND",
        values: []
      },
      series: [
        {
          kind: "EventsNode",
          event: "video_started",
          name: "video_started"
        },
        {
          kind: "EventsNode",
          event: "video_progress_25",
          name: "video_progress_25"
        },
        {
          kind: "EventsNode",
          event: "video_progress_50",
          name: "video_progress_50"
        },
        {
          kind: "EventsNode",
          event: "video_progress_75",
          name: "video_progress_75"
        },
        {
          kind: "EventsNode",
          event: "video_completed",
          name: "video_completed"
        }
      ],
      funnelVizType: "steps",
      exclusions: [],
      filterTestAccounts: false,
      funnelWindowInterval: 7,
      funnelWindowIntervalUnit: "day",
      breakdownAttributionType: "first_touch",
      breakdownAttributionValue: 0,
      funnelWindowIntervalToDefault: true,
      exclusionsToDefault: true
    }
  },

  video_watch_heatmap: {
    id: "video_watch_heatmap",
    name: "Video Watch Time Heatmap",
    description: "Visualize when your audience is most active throughout the week",
    query: {
      kind: "TrendsQuery",
      properties: {
        type: "AND",
        values: []
      },
      breakdown: {
        breakdown: "$time",
        breakdown_type: "event"
      },
      breakdown_type: "event",
      display: "ActionsLineGraph",
      insight: "TRENDS",
      interval: "hour",
      series: [
        {
          kind: "EventsNode",
          event: "video_started",
          name: "video_started",
          math: "total"
        }
      ],
      trendsFilter: {
        compare: false,
        display: "ActionsLineGraph"
      }
    }
  },

  video_engagement_metrics: {
    id: "video_engagement_metrics",
    name: "Video Engagement Metrics",
    description: "Detailed breakdown of user interactions and engagement patterns",
    query: {
      kind: "TrendsQuery",
      properties: {
        type: "AND",
        values: []
      },
      breakdown: null,
      breakdown_type: null,
      display: "ActionsLineGraph",
      insight: "TRENDS",
      interval: "day",
      series: [
        {
          kind: "EventsNode",
          event: "video_started",
          name: "video_started",
          math: "total"
        },
        {
          kind: "EventsNode",
          event: "video_completed",
          name: "video_completed",
          math: "total"
        },
        {
          kind: "EventsNode",
          event: "video_paused",
          name: "video_paused",
          math: "total"
        },
        {
          kind: "EventsNode",
          event: "video_seeked",
          name: "video_seeked",
          math: "total"
        }
      ],
      trendsFilter: {
        compare: false,
        display: "ActionsLineGraph"
      }
    }
  },

  video_completion_rate: {
    id: "video_completion_rate",
    name: "Video Completion Rate",
    description: "Track video completion rates over time",
    query: {
      kind: "TrendsQuery",
      properties: {
        type: "AND",
        values: []
      },
      breakdown: null,
      breakdown_type: null,
      display: "ActionsLineGraph",
      insight: "TRENDS",
      interval: "week",
      series: [
        {
          kind: "EventsNode",
          event: "video_completed",
          name: "video_completed",
          math: "total"
        },
        {
          kind: "EventsNode",
          event: "video_started",
          name: "video_started",
          math: "total"
        }
      ],
      trendsFilter: {
        compare: false,
        display: "ActionsLineGraph"
      }
    }
  },

  video_average_watch_time: {
    id: "video_average_watch_time",
    name: "Average Video Watch Time",
    description: "Track average time spent watching videos",
    query: {
      kind: "TrendsQuery",
      properties: {
        type: "AND",
        values: []
      },
      breakdown: null,
      breakdown_type: null,
      display: "ActionsLineGraph",
      insight: "TRENDS",
      interval: "week",
      series: [
        {
          kind: "EventsNode",
          event: "video_completed",
          name: "video_completed",
          math: "avg",
          math_property: "watch_time_seconds"
        }
      ],
      trendsFilter: {
        compare: false,
        display: "ActionsLineGraph"
      }
    }
  },

  video_drop_off_points: {
    id: "video_drop_off_points",
    name: "Video Drop-off Points",
    description: "Identify where viewers tend to stop watching",
    query: {
      kind: "TrendsQuery",
      properties: {
        type: "AND",
        values: []
      },
      breakdown: {
        breakdown: "progress_percentage",
        breakdown_type: "event"
      },
      breakdown_type: "event",
      display: "ActionsBarChart",
      insight: "TRENDS",
      interval: "month",
      series: [
        {
          kind: "EventsNode",
          event: "video_progress",
          name: "video_progress",
          math: "total"
        }
      ],
      trendsFilter: {
        compare: false,
        display: "ActionsBarChart"
      }
    }
  },

  video_quality_distribution: {
    id: "video_quality_distribution",
    name: "Video Quality Distribution",
    description: "Track which video qualities are most used",
    query: {
      kind: "TrendsQuery",
      properties: {
        type: "AND",
        values: []
      },
      breakdown: {
        breakdown: "video_quality",
        breakdown_type: "event"
      },
      breakdown_type: "event",
      display: "ActionsBarChart",
      insight: "TRENDS",
      interval: "month",
      series: [
        {
          kind: "EventsNode",
          event: "video_quality_changed",
          name: "video_quality_changed",
          math: "total"
        }
      ],
      trendsFilter: {
        compare: false,
        display: "ActionsBarChart"
      }
    }
  },

  video_device_distribution: {
    id: "video_device_distribution",
    name: "Video Device Distribution",
    description: "Track which devices are used for video playback",
    query: {
      kind: "TrendsQuery",
      properties: {
        type: "AND",
        values: []
      },
      breakdown: {
        breakdown: "$browser",
        breakdown_type: "event"
      },
      breakdown_type: "event",
      display: "ActionsBarChart",
      insight: "TRENDS",
      interval: "month",
      series: [
        {
          kind: "EventsNode",
          event: "video_started",
          name: "video_started",
          math: "total"
        }
      ],
      trendsFilter: {
        compare: false,
        display: "ActionsBarChart"
      }
    }
  }
};

/**
 * Pre-configured PostHog cohorts for user segmentation
 */
export const POSTHOG_COHORTS: Record<string, PosthogCohort> = {
  // Active Learners
  active_learners_7d: {
    id: "active_learners_7d",
    name: "Active Learners (Last 7 Days)",
    description: "Users who have engaged with learning content in the last 7 days",
    query: {
      type: "AND",
      values: [
        {
          type: "OR",
          values: [
            {
              key: "lesson_started",
              event_type: "events",
              operator: "gte",
              value: 1,
              time_value: 7,
              time_interval: "day"
            },
            {
              key: "lesson_completed",
              event_type: "events",
              operator: "gte",
              value: 1,
              time_value: 7,
              time_interval: "day"
            },
            {
              key: "video_completed",
              event_type: "events",
              operator: "gte",
              value: 1,
              time_value: 7,
              time_interval: "day"
            },
            {
              key: "quiz_completed",
              event_type: "events",
              operator: "gte",
              value: 1,
              time_value: 7,
              time_interval: "day"
            }
          ]
        }
      ]
    }
  },

  active_learners_30d: {
    id: "active_learners_30d",
    name: "Active Learners (Last 30 Days)",
    description: "Users who have engaged with learning content in the last 30 days",
    query: {
      type: "AND",
      values: [
        {
          type: "OR",
          values: [
            {
              key: "lesson_started",
              event_type: "events",
              operator: "gte",
              value: 1,
              time_value: 30,
              time_interval: "day"
            },
            {
              key: "lesson_completed",
              event_type: "events",
              operator: "gte",
              value: 1,
              time_value: 30,
              time_interval: "day"
            },
            {
              key: "video_completed",
              event_type: "events",
              operator: "gte",
              value: 1,
              time_value: 30,
              time_interval: "day"
            },
            {
              key: "quiz_completed",
              event_type: "events",
              operator: "gte",
              value: 1,
              time_value: 30,
              time_interval: "day"
            }
          ]
        }
      ]
    }
  },

  // Course Completers
  course_completers: {
    id: "course_completers",
    name: "Course Completers",
    description: "Users who have completed at least one course",
    query: {
      type: "AND",
      values: [
        {
          key: "course_completed",
          event_type: "events",
          operator: "gte",
          value: 1
        }
      ]
    }
  },

  // High Engagement Users
  high_engagement_users: {
    id: "high_engagement_users",
    name: "High Engagement Users",
    description: "Users who spend significant time learning (top 25% by session duration)",
    query: {
      type: "AND",
      values: [
        {
          key: "session_ended",
          event_type: "events",
          operator: "gte",
          value: 5,
          math: "avg",
          math_property: "duration_seconds",
          operator_value: 1800 // 30 minutes average
        }
      ]
    }
  },

  // Quiz Performers
  quiz_excellent_performers: {
    id: "quiz_excellent_performers",
    name: "Excellent Quiz Performers",
    description: "Users who consistently score 90%+ on quizzes",
    query: {
      type: "AND",
      values: [
        {
          key: "quiz_passed",
          event_type: "events",
          operator: "gte",
          value: 3
        },
        {
          type: "OR",
          values: [
            {
              key: "quiz_completed",
              event_type: "events",
              operator: "gte",
              value: 1,
              math: "avg",
              math_property: "score_percentage",
              operator_value: 90
            }
          ]
        }
      ]
    }
  },

  // New vs Returning Learners
  new_learners: {
    id: "new_learners",
    name: "New Learners",
    description: "Users who enrolled in their first course within the last 30 days",
    query: {
      type: "AND",
      values: [
        {
          key: "course_enrolled",
          event_type: "events",
          operator: "eq",
          value: 1,
          time_value: 30,
          time_interval: "day"
        }
      ]
    }
  },

  returning_learners: {
    id: "returning_learners",
    name: "Returning Learners",
    description: "Users who have enrolled in multiple courses",
    query: {
      type: "AND",
      values: [
        {
          key: "course_enrolled",
          event_type: "events",
          operator: "gte",
          value: 2
        }
      ]
    }
  },

  // Video Engagement Cohorts
  video_completers: {
    id: "video_completers",
    name: "Video Completers",
    description: "Users who regularly complete video lessons",
    query: {
      type: "AND",
      values: [
        {
          key: "video_completed",
          event_type: "events",
          operator: "gte",
          value: 5,
          time_value: 30,
          time_interval: "day"
        }
      ]
    }
  },

  // Instructor-specific cohorts (dynamic)
  instructor_learners: {
    id: "instructor_learners_template",
    name: "Instructor Learners (Template)",
    description: "Users enrolled in courses by a specific instructor",
    query: {
      type: "AND",
      values: [
        {
          key: "course_enrolled",
          event_type: "events",
          operator: "gte",
          value: 1,
          properties: [
            {
              key: "instructor_id",
              operator: "exact",
              value: "{instructor_id}" // Template variable
            }
          ]
        }
      ]
    }
  }
};

/**
 * Pre-configured PostHog dashboards
 */
export const POSTHOG_DASHBOARDS: Record<string, PosthogDashboard> = {
  // Main Analytics Dashboard
  main_analytics: {
    id: "main_analytics",
    name: "Main Analytics Dashboard",
    description: "Comprehensive overview of platform analytics",
    insightIds: [
      "dau_trend",
      "wau_trend",
      "mau_trend",
      "enrollment_funnel",
      "learning_progression_funnel"
    ]
  },

  // Learning Engagement Dashboard
  learning_engagement: {
    id: "learning_engagement",
    name: "Learning Engagement Dashboard",
    description: "Detailed view of learner engagement and progress",
    insightIds: [
      "course_engagement_by_category",
      "quiz_completion_rate",
      "video_watch_time",
      "session_duration"
    ]
  },

  // Instructor Dashboard Template
  instructor_template: {
    id: "instructor_template",
    name: "Instructor Analytics (Template)",
    description: "Analytics dashboard for individual instructors",
    insightIds: [
      "enrollment_funnel",
      "learning_progression_funnel",
      "course_engagement_by_category",
      "quiz_completion_rate"
    ],
    filters: {
      properties: [
        {
          key: "instructor_id",
          operator: "exact",
          value: "{instructor_id}" // Template variable
        }
      ]
    }
  },

  // Course-specific Dashboard Template
  course_template: {
    id: "course_template",
    name: "Course Analytics (Template)",
    description: "Analytics dashboard for individual courses",
    insightIds: [
      "enrollment_funnel",
      "learning_progression_funnel",
      "video_watch_time",
      "quiz_completion_rate"
    ],
    filters: {
      properties: [
        {
          key: "course_id",
          operator: "exact",
          value: "{course_id}" // Template variable
        }
      ]
    }
  },

  // Video Analytics Dashboard
  video_analytics: {
    id: "video_analytics",
    name: "Video Analytics Dashboard",
    description: "Comprehensive video analytics with retention, engagement, and performance metrics",
    insightIds: [
      "video_retention_analysis",
      "video_watch_heatmap",
      "video_engagement_metrics",
      "video_completion_rate",
      "video_average_watch_time",
      "video_drop_off_points",
      "video_quality_distribution",
      "video_device_distribution"
    ]
  },

  // Video Analytics Dashboard Template (scoped to course/video)
  video_analytics_template: {
    id: "video_analytics_template",
    name: "Video Analytics (Template)",
    description: "Video analytics dashboard for specific courses or videos",
    insightIds: [
      "video_retention_analysis",
      "video_watch_heatmap",
      "video_engagement_metrics",
      "video_completion_rate",
      "video_average_watch_time",
      "video_drop_off_points",
      "video_quality_distribution",
      "video_device_distribution"
    ],
    filters: {
      properties: []
    }
  }
};

/**
 * Helper function to get dashboard configuration with instructor/course scoping
 */
export function getScopedDashboard(
  dashboardKey: keyof typeof POSTHOG_DASHBOARDS,
  scope: { instructorId?: string; courseId?: string }
): PosthogDashboard {
  const template = POSTHOG_DASHBOARDS[dashboardKey];

  if (!template) {
    throw new Error(`Dashboard ${dashboardKey} not found`);
  }

  // Deep clone the dashboard
  const dashboard = JSON.parse(JSON.stringify(template)) as PosthogDashboard;

  // Apply scoping filters
  if (scope.instructorId || scope.courseId) {
    dashboard.filters = dashboard.filters || {};

    if (scope.instructorId) {
      dashboard.filters.properties = dashboard.filters.properties || [];
      dashboard.filters.properties.push({
        key: "instructor_id",
        operator: "exact",
        value: scope.instructorId
      });
    }

    if (scope.courseId) {
      dashboard.filters.properties = dashboard.filters.properties || [];
      dashboard.filters.properties.push({
        key: "course_id",
        operator: "exact",
        value: scope.courseId
      });
    }
  }

  return dashboard;
}

/**
 * Helper function to get cohort configuration with instructor scoping
 */
export function getScopedCohort(
  cohortKey: keyof typeof POSTHOG_COHORTS,
  scope: { instructorId?: string }
): PosthogCohort {
  const template = POSTHOG_COHORTS[cohortKey];

  if (!template) {
    throw new Error(`Cohort ${cohortKey} not found`);
  }

  // Deep clone the cohort
  const cohort = JSON.parse(JSON.stringify(template)) as PosthogCohort;

  // Apply instructor scoping
  if (scope.instructorId) {
    cohort.query.values = cohort.query.values || [];

    // Add instructor filter to the query
    cohort.query.values.push({
      key: "instructor_id",
      operator: "exact",
      value: scope.instructorId
    });
  }

  return cohort;
}