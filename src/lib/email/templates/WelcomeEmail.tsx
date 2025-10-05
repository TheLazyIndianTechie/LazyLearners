/**
 * Welcome Email Template
 *
 * Sent to new users when they sign up for LazyGameDevs
 */

import React from 'react';
import { Text, Section, Row, Column, Hr } from '@react-email/components';
import { BaseLayout } from './components/BaseLayout';
import { Button } from './components/Button';
import { WelcomeEmailData } from '../types';
import { emailTheme } from './theme';

interface WelcomeEmailProps {
  data: WelcomeEmailData;
}

export function WelcomeEmail({ data }: WelcomeEmailProps) {
  const { userName, userEmail, loginUrl } = data;

  return (
    <BaseLayout
      previewText={`Welcome to LazyGameDevs, ${userName}! Start your game development journey today.`}
      showHeader={true}
      showFooter={true}
    >
      {/* Main greeting */}
      <Text
        style={{
          margin: '0 0 20px',
          fontSize: emailTheme.typography.fontSize['3xl'],
          fontWeight: emailTheme.typography.fontWeight.bold,
          color: emailTheme.colors.text.primary,
          lineHeight: emailTheme.typography.lineHeight.tight,
        }}
      >
        Welcome to LazyGameDevs! 🎉
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
        We're thrilled to have you join our community of game developers! Whether
        you're just starting out or looking to level up your skills, you're in the
        right place.
      </Text>

      {/* Success box */}
      <Section
        style={{
          backgroundColor: emailTheme.colors.success.light,
          borderLeft: `4px solid ${emailTheme.colors.success.main}`,
          padding: emailTheme.spacing[4],
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
          ✅ Account Created Successfully
        </Text>
        <Text
          style={{
            margin: '0',
            fontSize: emailTheme.typography.fontSize.sm,
            color: emailTheme.colors.success.dark,
          }}
        >
          Your account ({userEmail}) is now active and ready to use!
        </Text>
      </Section>

      {/* What's next section */}
      <Text
        style={{
          margin: '30px 0 16px',
          fontSize: emailTheme.typography.fontSize.xl,
          fontWeight: emailTheme.typography.fontWeight.bold,
          color: emailTheme.colors.text.primary,
        }}
      >
        What's Next? 🚀
      </Text>

      {/* Features grid */}
      <table
        role="presentation"
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          margin: '20px 0',
        }}
      >
        <tr>
          <td
            style={{
              padding: '16px',
              backgroundColor: emailTheme.colors.background.tertiary,
              borderRadius: emailTheme.borderRadius.md,
              verticalAlign: 'top',
            }}
          >
            <Text
              style={{
                margin: '0 0 8px',
                fontSize: emailTheme.typography.fontSize['2xl'],
              }}
            >
              🎯
            </Text>
            <Text
              style={{
                margin: '0 0 8px',
                fontSize: emailTheme.typography.fontSize.base,
                fontWeight: emailTheme.typography.fontWeight.bold,
                color: emailTheme.colors.text.primary,
              }}
            >
              Browse Courses
            </Text>
            <Text
              style={{
                margin: '0',
                fontSize: emailTheme.typography.fontSize.sm,
                color: emailTheme.colors.text.secondary,
                lineHeight: emailTheme.typography.lineHeight.relaxed,
              }}
            >
              Explore hundreds of game development courses from Unity to Unreal Engine
            </Text>
          </td>
        </tr>
      </table>

      <table
        role="presentation"
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          margin: '16px 0',
        }}
      >
        <tr>
          <td
            style={{
              padding: '16px',
              backgroundColor: emailTheme.colors.background.tertiary,
              borderRadius: emailTheme.borderRadius.md,
              verticalAlign: 'top',
            }}
          >
            <Text
              style={{
                margin: '0 0 8px',
                fontSize: emailTheme.typography.fontSize['2xl'],
              }}
            >
              📚
            </Text>
            <Text
              style={{
                margin: '0 0 8px',
                fontSize: emailTheme.typography.fontSize.base,
                fontWeight: emailTheme.typography.fontWeight.bold,
                color: emailTheme.colors.text.primary,
              }}
            >
              Learn at Your Pace
            </Text>
            <Text
              style={{
                margin: '0',
                fontSize: emailTheme.typography.fontSize.sm,
                color: emailTheme.colors.text.secondary,
                lineHeight: emailTheme.typography.lineHeight.relaxed,
              }}
            >
              Access courses anytime, anywhere with lifetime access to your purchases
            </Text>
          </td>
        </tr>
      </table>

      <table
        role="presentation"
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          margin: '16px 0',
        }}
      >
        <tr>
          <td
            style={{
              padding: '16px',
              backgroundColor: emailTheme.colors.background.tertiary,
              borderRadius: emailTheme.borderRadius.md,
              verticalAlign: 'top',
            }}
          >
            <Text
              style={{
                margin: '0 0 8px',
                fontSize: emailTheme.typography.fontSize['2xl'],
              }}
            >
              🏆
            </Text>
            <Text
              style={{
                margin: '0 0 8px',
                fontSize: emailTheme.typography.fontSize.base,
                fontWeight: emailTheme.typography.fontWeight.bold,
                color: emailTheme.colors.text.primary,
              }}
            >
              Earn Certificates
            </Text>
            <Text
              style={{
                margin: '0',
                fontSize: emailTheme.typography.fontSize.sm,
                color: emailTheme.colors.text.secondary,
                lineHeight: emailTheme.typography.lineHeight.relaxed,
              }}
            >
              Complete courses and earn certificates to showcase your achievements
            </Text>
          </td>
        </tr>
      </table>

      {/* CTA Button */}
      <Section style={{ margin: '40px 0 30px', textAlign: 'center' }}>
        <Button href={loginUrl} variant="primary" size="lg">
          Get Started Now →
        </Button>
      </Section>

      <Hr
        style={{
          margin: '30px 0',
          borderColor: emailTheme.colors.border.light,
        }}
      />

      {/* Tips section */}
      <Text
        style={{
          margin: '0 0 16px',
          fontSize: emailTheme.typography.fontSize.base,
          fontWeight: emailTheme.typography.fontWeight.bold,
          color: emailTheme.colors.text.primary,
        }}
      >
        💡 Quick Tips to Get Started:
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
          Complete your profile to get personalized course recommendations
        </li>
        <li style={{ marginBottom: '8px' }}>
          Add courses to your wishlist to track them for later
        </li>
        <li style={{ marginBottom: '8px' }}>
          Join our community forums to connect with other developers
        </li>
        <li style={{ marginBottom: '8px' }}>
          Check out free preview lessons before purchasing
        </li>
      </ul>

      {/* Help section */}
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
          Need Help?
        </Text>
        <Text
          style={{
            margin: '0',
            fontSize: emailTheme.typography.fontSize.sm,
            color: emailTheme.colors.info.dark,
            lineHeight: emailTheme.typography.lineHeight.relaxed,
          }}
        >
          If you have any questions or need assistance, our support team is here to
          help. Just reply to this email or visit our help center.
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
        Happy learning!
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

export default WelcomeEmail;
