/**
 * Progress Milestone Email Template
 *
 * Sent when a user reaches a progress milestone (25%, 50%, 75%, 100%)
 */

import React from 'react';
import { Text, Section, Hr } from '@react-email/components';
import { BaseLayout } from './components/BaseLayout';
import { Button } from './components/Button';
import { ProgressMilestoneEmailData } from '../types';
import { emailTheme } from './theme';

interface ProgressMilestoneEmailProps {
  data: ProgressMilestoneEmailData;
}

export function ProgressMilestoneEmail({ data }: ProgressMilestoneEmailProps) {
  const {
    userName,
    courseName,
    courseUrl,
    percentComplete,
    milestone,
    lessonsCompleted,
    totalLessons,
  } = data;

  const getMilestoneEmoji = (milestone: number) => {
    switch (milestone) {
      case 25:
        return '🎯';
      case 50:
        return '🔥';
      case 75:
        return '⭐';
      case 100:
        return '🏆';
      default:
        return '✨';
    }
  };

  const getMilestoneMessage = (milestone: number) => {
    switch (milestone) {
      case 25:
        return "You're off to a great start!";
      case 50:
        return "You're halfway there!";
      case 75:
        return "Almost there, keep going!";
      case 100:
        return "You did it! Course complete!";
      default:
        return "Keep up the great work!";
    }
  };

  const getMilestoneColor = (milestone: number) => {
    switch (milestone) {
      case 25:
        return emailTheme.colors.info.main;
      case 50:
        return emailTheme.colors.warning.main;
      case 75:
        return emailTheme.colors.secondary[500];
      case 100:
        return emailTheme.colors.success.main;
      default:
        return emailTheme.colors.primary[500];
    }
  };

  const milestoneEmoji = getMilestoneEmoji(milestone);
  const milestoneMessage = getMilestoneMessage(milestone);
  const milestoneColor = getMilestoneColor(milestone);

  return (
    <BaseLayout
      previewText={`${milestone}% complete in ${courseName}! ${milestoneMessage}`}
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
        Milestone Reached! {milestoneEmoji}
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
        Congratulations! You've reached {milestone}% completion in your course. {milestoneMessage}
      </Text>

      {/* Progress card */}
      <Section
        style={{
          backgroundColor: emailTheme.colors.background.tertiary,
          padding: emailTheme.spacing[6],
          borderRadius: emailTheme.borderRadius.md,
          margin: '30px 0',
          border: `2px solid ${emailTheme.colors.border.light}`,
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
          Your Progress
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

        {/* Progress bar */}
        <div
          style={{
            width: '100%',
            height: '12px',
            backgroundColor: emailTheme.colors.gray[200],
            borderRadius: emailTheme.borderRadius.full,
            overflow: 'hidden',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              width: `${percentComplete}%`,
              height: '100%',
              backgroundColor: milestoneColor,
              borderRadius: emailTheme.borderRadius.full,
              transition: `width ${emailTheme.transitions.base}`,
            }}
          />
        </div>

        {/* Stats */}
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
                padding: '8px',
                textAlign: 'center',
                backgroundColor: emailTheme.colors.background.primary,
                borderRadius: emailTheme.borderRadius.sm,
              }}
            >
              <Text
                style={{
                  margin: '0 0 4px',
                  fontSize: emailTheme.typography.fontSize['2xl'],
                  fontWeight: emailTheme.typography.fontWeight.bold,
                  color: milestoneColor,
                }}
              >
                {percentComplete}%
              </Text>
              <Text
                style={{
                  margin: '0',
                  fontSize: emailTheme.typography.fontSize.xs,
                  color: emailTheme.colors.text.tertiary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Complete
              </Text>
            </td>
            <td style={{ width: '16px' }}></td>
            <td
              style={{
                padding: '8px',
                textAlign: 'center',
                backgroundColor: emailTheme.colors.background.primary,
                borderRadius: emailTheme.borderRadius.sm,
              }}
            >
              <Text
                style={{
                  margin: '0 0 4px',
                  fontSize: emailTheme.typography.fontSize['2xl'],
                  fontWeight: emailTheme.typography.fontWeight.bold,
                  color: emailTheme.colors.primary[500],
                }}
              >
                {lessonsCompleted}
              </Text>
              <Text
                style={{
                  margin: '0',
                  fontSize: emailTheme.typography.fontSize.xs,
                  color: emailTheme.colors.text.tertiary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Lessons
              </Text>
            </td>
            <td style={{ width: '16px' }}></td>
            <td
              style={{
                padding: '8px',
                textAlign: 'center',
                backgroundColor: emailTheme.colors.background.primary,
                borderRadius: emailTheme.borderRadius.sm,
              }}
            >
              <Text
                style={{
                  margin: '0 0 4px',
                  fontSize: emailTheme.typography.fontSize['2xl'],
                  fontWeight: emailTheme.typography.fontWeight.bold,
                  color: emailTheme.colors.gray[500],
                }}
              >
                {totalLessons - lessonsCompleted}
              </Text>
              <Text
                style={{
                  margin: '0',
                  fontSize: emailTheme.typography.fontSize.xs,
                  color: emailTheme.colors.text.tertiary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Remaining
              </Text>
            </td>
          </tr>
        </table>
      </Section>

      {/* Milestone achievement badge */}
      <Section
        style={{
          backgroundColor: milestoneColor + '15',
          padding: emailTheme.spacing[5],
          borderRadius: emailTheme.borderRadius.md,
          margin: '30px 0',
          textAlign: 'center',
          border: `2px solid ${milestoneColor}`,
        }}
      >
        <Text
          style={{
            margin: '0 0 12px',
            fontSize: emailTheme.typography.fontSize['5xl'],
          }}
        >
          {milestoneEmoji}
        </Text>
        <Text
          style={{
            margin: '0 0 8px',
            fontSize: emailTheme.typography.fontSize.xl,
            fontWeight: emailTheme.typography.fontWeight.bold,
            color: emailTheme.colors.text.primary,
          }}
        >
          {milestone}% Milestone Unlocked!
        </Text>
        <Text
          style={{
            margin: '0',
            fontSize: emailTheme.typography.fontSize.base,
            color: emailTheme.colors.text.secondary,
          }}
        >
          {milestoneMessage}
        </Text>
      </Section>

      {/* CTA Button */}
      <Section style={{ margin: '40px 0 30px', textAlign: 'center' }}>
        <Button href={courseUrl} variant="primary" size="lg">
          {milestone === 100 ? 'View Certificate →' : 'Continue Learning →'}
        </Button>
      </Section>

      <Hr
        style={{
          margin: '30px 0',
          borderColor: emailTheme.colors.border.light,
        }}
      />

      {/* Encouragement section */}
      {milestone < 100 ? (
        <>
          <Text
            style={{
              margin: '0 0 16px',
              fontSize: emailTheme.typography.fontSize.xl,
              fontWeight: emailTheme.typography.fontWeight.bold,
              color: emailTheme.colors.text.primary,
            }}
          >
            Keep the Momentum Going! 💪
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
              You're making excellent progress - don't stop now!
            </li>
            <li style={{ marginBottom: '8px' }}>
              Set aside time each day to complete a lesson
            </li>
            <li style={{ marginBottom: '8px' }}>
              Practice what you've learned by building projects
            </li>
            <li style={{ marginBottom: '8px' }}>
              Share your progress with the community
            </li>
          </ul>
        </>
      ) : (
        <>
          <Text
            style={{
              margin: '0 0 16px',
              fontSize: emailTheme.typography.fontSize.xl,
              fontWeight: emailTheme.typography.fontWeight.bold,
              color: emailTheme.colors.text.primary,
            }}
          >
            What's Next? 🎓
          </Text>

          <table
            role="presentation"
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              margin: '20px 0',
            }}
          >
            <tr>
              <td style={{ padding: '12px 0', verticalAlign: 'top', width: '32px' }}>
                <Text style={{ margin: '0', fontSize: emailTheme.typography.fontSize.lg }}>
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
                  Claim Your Certificate
                </Text>
                <Text
                  style={{
                    margin: '0',
                    fontSize: emailTheme.typography.fontSize.sm,
                    color: emailTheme.colors.text.secondary,
                    lineHeight: emailTheme.typography.lineHeight.relaxed,
                  }}
                >
                  Download your completion certificate to showcase your achievement
                </Text>
              </td>
            </tr>
            <tr>
              <td style={{ padding: '12px 0', verticalAlign: 'top', width: '32px' }}>
                <Text style={{ margin: '0', fontSize: emailTheme.typography.fontSize.lg }}>
                  📚
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
                  Explore More Courses
                </Text>
                <Text
                  style={{
                    margin: '0',
                    fontSize: emailTheme.typography.fontSize.sm,
                    color: emailTheme.colors.text.secondary,
                    lineHeight: emailTheme.typography.lineHeight.relaxed,
                  }}
                >
                  Continue your learning journey with related courses
                </Text>
              </td>
            </tr>
            <tr>
              <td style={{ padding: '12px 0', verticalAlign: 'top', width: '32px' }}>
                <Text style={{ margin: '0', fontSize: emailTheme.typography.fontSize.lg }}>
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
                  Share Your Success
                </Text>
                <Text
                  style={{
                    margin: '0',
                    fontSize: emailTheme.typography.fontSize.sm,
                    color: emailTheme.colors.text.secondary,
                    lineHeight: emailTheme.typography.lineHeight.relaxed,
                  }}
                >
                  Inspire others by sharing your learning journey
                </Text>
              </td>
            </tr>
          </table>
        </>
      )}

      {/* Success box */}
      <Section
        style={{
          backgroundColor: emailTheme.colors.success.light,
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
            color: emailTheme.colors.success.dark,
          }}
        >
          🌟 Pro Tip
        </Text>
        <Text
          style={{
            margin: '0',
            fontSize: emailTheme.typography.fontSize.sm,
            color: emailTheme.colors.success.dark,
            lineHeight: emailTheme.typography.lineHeight.relaxed,
          }}
        >
          {milestone === 100
            ? 'Leave a review to help other learners discover this course!'
            : 'Consistency is key! Try to complete at least one lesson per day to maintain your learning streak.'}
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
        {milestone === 100
          ? "We're so proud of what you've accomplished!"
          : "Keep up the amazing work!"}
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
    </BaseLayout>
  );
}

export default ProgressMilestoneEmail;
