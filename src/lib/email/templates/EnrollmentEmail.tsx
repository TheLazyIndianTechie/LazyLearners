/**
 * Enrollment Confirmation Email Template
 *
 * Sent when a user enrolls in a course
 */

import React from 'react';
import { Text, Section, Hr } from '@react-email/components';
import { BaseLayout } from './components/BaseLayout';
import { Button } from './components/Button';
import { EnrollmentEmailData } from '../types';
import { emailTheme } from './theme';

interface EnrollmentEmailProps {
  data: EnrollmentEmailData;
}

export function EnrollmentEmail({ data }: EnrollmentEmailProps) {
  const { userName, courseName, courseUrl, instructorName, enrollmentDate } = data;
  const formattedDate = new Date(enrollmentDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <BaseLayout
      previewText={`You're enrolled in ${courseName}! Start learning today.`}
      showHeader={true}
      showFooter={true}
    >
      {/* Main heading */}
      <Text
        style={{
          margin: '0 0 20px',
          fontSize: emailTheme.typography.fontSize['3xl'],
          fontWeight: emailTheme.typography.fontWeight.bold,
          color: emailTheme.colors.text.primary,
          lineHeight: emailTheme.typography.lineHeight.tight,
        }}
      >
        You're Enrolled! 🎉
      </Text>

      <Text
        style={{
          margin: '0 0 20px',
          fontSize: emailTheme.typography.fontSize.lg,
          color: emailTheme.colors.text.secondary,
          lineHeight: emailTheme.typography.lineHeight.relaxed,
        }}
      >
        Hi {userName},
      </Text>

      <Text
        style={{
          margin: '0 0 20px',
          fontSize: emailTheme.typography.fontSize.base,
          color: emailTheme.colors.text.secondary,
          lineHeight: emailTheme.typography.lineHeight.relaxed,
        }}
      >
        Congratulations! You've successfully enrolled in your new course. Your learning
        journey is about to begin!
      </Text>

      {/* Success box */}
      <Section
        style={{
          backgroundColor: emailTheme.colors.success.light,
          borderLeft: `4px solid ${emailTheme.colors.success.main}`,
          padding: emailTheme.spacing[5],
          borderRadius: emailTheme.borderRadius.sm,
          margin: '20px 0',
        }}
      >
        <Text
          style={{
            margin: '0 0 8px',
            fontSize: emailTheme.typography.fontSize.base,
            fontWeight: emailTheme.typography.fontWeight.bold,
            color: emailTheme.colors.success.dark,
          }}
        >
          ✅ Enrollment Confirmed
        </Text>
        <Text
          style={{
            margin: '0',
            fontSize: emailTheme.typography.fontSize.sm,
            color: emailTheme.colors.success.dark,
          }}
        >
          You now have lifetime access to this course
        </Text>
      </Section>

      {/* Course details card */}
      <Section
        style={{
          backgroundColor: emailTheme.colors.background.tertiary,
          padding: emailTheme.spacing[6],
          borderRadius: emailTheme.borderRadius.md,
          margin: '30px 0',
          border: `1px solid ${emailTheme.colors.border.light}`,
        }}
      >
        <Text
          style={{
            margin: '0 0 16px',
            fontSize: emailTheme.typography.fontSize.sm,
            fontWeight: emailTheme.typography.fontWeight.semibold,
            color: emailTheme.colors.primary[600],
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Course Details
        </Text>

        <Text
          style={{
            margin: '0 0 16px',
            fontSize: emailTheme.typography.fontSize.xl,
            fontWeight: emailTheme.typography.fontWeight.bold,
            color: emailTheme.colors.text.primary,
            lineHeight: emailTheme.typography.lineHeight.tight,
          }}
        >
          {courseName}
        </Text>

        <table
          role="presentation"
          style={{
            width: '100%',
            borderCollapse: 'collapse',
          }}
        >
          <tr>
            <td
              style={{
                padding: '8px 0',
                fontSize: emailTheme.typography.fontSize.sm,
                color: emailTheme.colors.text.tertiary,
                fontWeight: emailTheme.typography.fontWeight.semibold,
              }}
            >
              Instructor:
            </td>
            <td
              style={{
                padding: '8px 0',
                fontSize: emailTheme.typography.fontSize.sm,
                color: emailTheme.colors.text.primary,
                textAlign: 'right',
              }}
            >
              {instructorName}
            </td>
          </tr>
          <tr>
            <td
              style={{
                padding: '8px 0',
                fontSize: emailTheme.typography.fontSize.sm,
                color: emailTheme.colors.text.tertiary,
                fontWeight: emailTheme.typography.fontWeight.semibold,
              }}
            >
              Enrolled:
            </td>
            <td
              style={{
                padding: '8px 0',
                fontSize: emailTheme.typography.fontSize.sm,
                color: emailTheme.colors.text.primary,
                textAlign: 'right',
              }}
            >
              {formattedDate}
            </td>
          </tr>
          <tr>
            <td
              style={{
                padding: '8px 0',
                fontSize: emailTheme.typography.fontSize.sm,
                color: emailTheme.colors.text.tertiary,
                fontWeight: emailTheme.typography.fontWeight.semibold,
              }}
            >
              Access:
            </td>
            <td
              style={{
                padding: '8px 0',
                fontSize: emailTheme.typography.fontSize.sm,
                color: emailTheme.colors.success.main,
                textAlign: 'right',
                fontWeight: emailTheme.typography.fontWeight.bold,
              }}
            >
              ✓ Lifetime
            </td>
          </tr>
        </table>
      </Section>

      {/* CTA Button */}
      <Section style={{ margin: '40px 0 30px', textAlign: 'center' }}>
        <Button href={courseUrl} variant="primary" size="lg">
          Start Learning Now →
        </Button>
      </Section>

      <Hr
        style={{
          margin: '30px 0',
          borderColor: emailTheme.colors.border.light,
        }}
      />

      {/* What's included */}
      <Text
        style={{
          margin: '0 0 16px',
          fontSize: emailTheme.typography.fontSize.xl,
          fontWeight: emailTheme.typography.fontWeight.bold,
          color: emailTheme.colors.text.primary,
        }}
      >
        What's Included 📦
      </Text>

      <table
        role="presentation"
        style={{
          width: '100%',
          borderCollapse: 'collapse',
        }}
      >
        <tr>
          <td style={{ padding: '12px 0', verticalAlign: 'top', width: '32px' }}>
            <Text
              style={{
                margin: '0',
                fontSize: emailTheme.typography.fontSize.lg,
              }}
            >
              📹
            </Text>
          </td>
          <td style={{ padding: '12px 0 12px 12px', verticalAlign: 'top' }}>
            <Text
              style={{
                margin: '0 0 4px',
                fontSize: emailTheme.typography.fontSize.base,
                fontWeight: emailTheme.typography.fontWeight.semibold,
                color: emailTheme.colors.text.primary,
              }}
            >
              On-Demand Video Lessons
            </Text>
            <Text
              style={{
                margin: '0',
                fontSize: emailTheme.typography.fontSize.sm,
                color: emailTheme.colors.text.secondary,
                lineHeight: emailTheme.typography.lineHeight.relaxed,
              }}
            >
              Watch high-quality video lessons at your own pace
            </Text>
          </td>
        </tr>
        <tr>
          <td style={{ padding: '12px 0', verticalAlign: 'top', width: '32px' }}>
            <Text
              style={{
                margin: '0',
                fontSize: emailTheme.typography.fontSize.lg,
              }}
            >
              📝
            </Text>
          </td>
          <td style={{ padding: '12px 0 12px 12px', verticalAlign: 'top' }}>
            <Text
              style={{
                margin: '0 0 4px',
                fontSize: emailTheme.typography.fontSize.base,
                fontWeight: emailTheme.typography.fontWeight.semibold,
                color: emailTheme.colors.text.primary,
              }}
            >
              Downloadable Resources
            </Text>
            <Text
              style={{
                margin: '0',
                fontSize: emailTheme.typography.fontSize.sm,
                color: emailTheme.colors.text.secondary,
                lineHeight: emailTheme.typography.lineHeight.relaxed,
              }}
            >
              Access course materials, code files, and project assets
            </Text>
          </td>
        </tr>
        <tr>
          <td style={{ padding: '12px 0', verticalAlign: 'top', width: '32px' }}>
            <Text
              style={{
                margin: '0',
                fontSize: emailTheme.typography.fontSize.lg,
              }}
            >
              🏆
            </Text>
          </td>
          <td style={{ padding: '12px 0 12px 12px', verticalAlign: 'top' }}>
            <Text
              style={{
                margin: '0 0 4px',
                fontSize: emailTheme.typography.fontSize.base,
                fontWeight: emailTheme.typography.fontWeight.semibold,
                color: emailTheme.colors.text.primary,
              }}
            >
              Certificate of Completion
            </Text>
            <Text
              style={{
                margin: '0',
                fontSize: emailTheme.typography.fontSize.sm,
                color: emailTheme.colors.text.secondary,
                lineHeight: emailTheme.typography.lineHeight.relaxed,
              }}
            >
              Earn a certificate when you complete the course
            </Text>
          </td>
        </tr>
        <tr>
          <td style={{ padding: '12px 0', verticalAlign: 'top', width: '32px' }}>
            <Text
              style={{
                margin: '0',
                fontSize: emailTheme.typography.fontSize.lg,
              }}
            >
              💬
            </Text>
          </td>
          <td style={{ padding: '12px 0 12px 12px', verticalAlign: 'top' }}>
            <Text
              style={{
                margin: '0 0 4px',
                fontSize: emailTheme.typography.fontSize.base,
                fontWeight: emailTheme.typography.fontWeight.semibold,
                color: emailTheme.colors.text.primary,
              }}
            >
              Q&A Support
            </Text>
            <Text
              style={{
                margin: '0',
                fontSize: emailTheme.typography.fontSize.sm,
                color: emailTheme.colors.text.secondary,
                lineHeight: emailTheme.typography.lineHeight.relaxed,
              }}
            >
              Ask questions and get help from the instructor and community
            </Text>
          </td>
        </tr>
      </table>

      <Hr
        style={{
          margin: '30px 0',
          borderColor: emailTheme.colors.border.light,
        }}
      />

      {/* Tips for success */}
      <Text
        style={{
          margin: '0 0 16px',
          fontSize: emailTheme.typography.fontSize.base,
          fontWeight: emailTheme.typography.fontWeight.bold,
          color: emailTheme.colors.text.primary,
        }}
      >
        💡 Tips for Success:
      </Text>

      <ul
        style={{
          margin: '0 0 20px',
          paddingLeft: '20px',
          color: emailTheme.colors.text.secondary,
          fontSize: emailTheme.typography.fontSize.sm,
          lineHeight: emailTheme.typography.lineHeight.relaxed,
        }}
      >
        <li style={{ marginBottom: '8px' }}>
          Set aside dedicated time each week for learning
        </li>
        <li style={{ marginBottom: '8px' }}>
          Take notes and bookmark important lessons
        </li>
        <li style={{ marginBottom: '8px' }}>
          Practice by building your own projects
        </li>
        <li style={{ marginBottom: '8px' }}>
          Engage with the Q&A section when you have questions
        </li>
      </ul>

      {/* Info box */}
      <Section
        style={{
          backgroundColor: emailTheme.colors.info.light,
          padding: emailTheme.spacing[4],
          borderRadius: emailTheme.borderRadius.sm,
          margin: '30px 0 20px',
        }}
      >
        <Text
          style={{
            margin: '0 0 8px',
            fontSize: emailTheme.typography.fontSize.sm,
            fontWeight: emailTheme.typography.fontWeight.bold,
            color: emailTheme.colors.info.dark,
          }}
        >
          📱 Learn Anywhere
        </Text>
        <Text
          style={{
            margin: '0',
            fontSize: emailTheme.typography.fontSize.sm,
            color: emailTheme.colors.info.dark,
            lineHeight: emailTheme.typography.lineHeight.relaxed,
          }}
        >
          Access your course on any device - desktop, tablet, or mobile. Your progress
          syncs automatically across all devices.
        </Text>
      </Section>

      {/* Closing */}
      <Text
        style={{
          margin: '20px 0 8px',
          fontSize: emailTheme.typography.fontSize.base,
          color: emailTheme.colors.text.secondary,
          lineHeight: emailTheme.typography.lineHeight.relaxed,
        }}
      >
        We can't wait to see what you'll create!
      </Text>

      <Text
        style={{
          margin: '0',
          fontSize: emailTheme.typography.fontSize.base,
          fontWeight: emailTheme.typography.fontWeight.semibold,
          color: emailTheme.colors.text.primary,
        }}
      >
        The LazyGameDevs Team
      </Text>

      <Text
        style={{
          margin: '16px 0 0',
          fontSize: emailTheme.typography.fontSize.xs,
          color: emailTheme.colors.text.tertiary,
        }}
      >
        P.S. Need help getting started? Reply to this email and we'll guide you through your first steps.
      </Text>
    </BaseLayout>
  );
}

export default EnrollmentEmail;
