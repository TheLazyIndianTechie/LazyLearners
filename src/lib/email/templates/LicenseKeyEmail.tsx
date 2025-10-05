/**
 * License Key Email Template
 *
 * Sent when a user receives a license key for a purchased course
 */

import React from 'react';
import { Text, Section, Hr, Code } from '@react-email/components';
import { BaseLayout } from './components/BaseLayout';
import { Button } from './components/Button';
import { LicenseKeyEmailData } from '../types';
import { emailTheme } from './theme';

interface LicenseKeyEmailProps {
  data: LicenseKeyEmailData;
}

export function LicenseKeyEmail({ data }: LicenseKeyEmailProps) {
  const { userName, courseName, licenseKey, activationUrl, expiresAt } = data;

  const formattedExpiry = expiresAt
    ? new Date(expiresAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <BaseLayout
      previewText={`Your license key for ${courseName} is ready!`}
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
        Your License Key is Ready! 🔑
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
        Thank you for your purchase! Here's your license key to activate and access your course.
      </Text>

      {/* License key card */}
      <Section
        style={{
          backgroundColor: emailTheme.colors.primary[50],
          padding: emailTheme.spacing[6],
          borderRadius: emailTheme.borderRadius.md,
          margin: '30px 0',
          border: `2px solid ${emailTheme.colors.primary[200]}`,
          textAlign: 'center',
        }}
      >
        <Text
          style={{
            margin: '0 0 16px',
            fontSize: emailTheme.typography.fontSize.sm,
            fontWeight: emailTheme.typography.fontWeight.semibold,
            color: emailTheme.colors.primary[600],
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          Your License Key
        </Text>

        <div
          style={{
            backgroundColor: emailTheme.colors.background.primary,
            padding: '20px',
            borderRadius: emailTheme.borderRadius.base,
            border: `2px dashed ${emailTheme.colors.primary[300]}`,
            marginBottom: '16px',
          }}
        >
          <Text
            style={{
              margin: '0',
              fontSize: emailTheme.typography.fontSize['2xl'],
              fontWeight: emailTheme.typography.fontWeight.bold,
              color: emailTheme.colors.primary[600],
              fontFamily: emailTheme.typography.fontFamily.mono,
              letterSpacing: '2px',
              wordBreak: 'break-all',
            }}
          >
            {licenseKey}
          </Text>
        </div>

        <Text
          style={{
            margin: '0',
            fontSize: emailTheme.typography.fontSize.xs,
            color: emailTheme.colors.text.tertiary,
          }}
        >
          Click the button below to automatically activate this key
        </Text>
      </Section>

      {/* Course details */}
      <Section
        style={{
          backgroundColor: emailTheme.colors.background.tertiary,
          padding: emailTheme.spacing[5],
          borderRadius: emailTheme.borderRadius.md,
          margin: '20px 0',
        }}
      >
        <Text
          style={{
            margin: '0 0 12px',
            fontSize: emailTheme.typography.fontSize.sm,
            fontWeight: emailTheme.typography.fontWeight.semibold,
            color: emailTheme.colors.text.tertiary,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Course Details
        </Text>

        <Text
          style={{
            margin: '0 0 12px',
            fontSize: emailTheme.typography.fontSize.lg,
            fontWeight: emailTheme.typography.fontWeight.bold,
            color: emailTheme.colors.text.primary,
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
                padding: '6px 0',
                fontSize: emailTheme.typography.fontSize.sm,
                color: emailTheme.colors.text.tertiary,
              }}
            >
              License Status:
            </td>
            <td
              style={{
                padding: '6px 0',
                fontSize: emailTheme.typography.fontSize.sm,
                color: emailTheme.colors.success.main,
                textAlign: 'right',
                fontWeight: emailTheme.typography.fontWeight.bold,
              }}
            >
              ✓ Active
            </td>
          </tr>
          {formattedExpiry && (
            <tr>
              <td
                style={{
                  padding: '6px 0',
                  fontSize: emailTheme.typography.fontSize.sm,
                  color: emailTheme.colors.text.tertiary,
                }}
              >
                Expires:
              </td>
              <td
                style={{
                  padding: '6px 0',
                  fontSize: emailTheme.typography.fontSize.sm,
                  color: emailTheme.colors.text.primary,
                  textAlign: 'right',
                }}
              >
                {formattedExpiry}
              </td>
            </tr>
          )}
          <tr>
            <td
              style={{
                padding: '6px 0',
                fontSize: emailTheme.typography.fontSize.sm,
                color: emailTheme.colors.text.tertiary,
              }}
            >
              Access:
            </td>
            <td
              style={{
                padding: '6px 0',
                fontSize: emailTheme.typography.fontSize.sm,
                color: emailTheme.colors.text.primary,
                textAlign: 'right',
                fontWeight: emailTheme.typography.fontWeight.semibold,
              }}
            >
              {formattedExpiry ? 'Limited' : 'Lifetime'}
            </td>
          </tr>
        </table>
      </Section>

      {/* CTA Button */}
      <Section style={{ margin: '40px 0 30px', textAlign: 'center' }}>
        <Button href={activationUrl} variant="primary" size="lg">
          Activate License & Start Learning →
        </Button>
      </Section>

      <Hr
        style={{
          margin: '30px 0',
          borderColor: emailTheme.colors.border.light,
        }}
      />

      {/* Activation instructions */}
      <Text
        style={{
          margin: '0 0 16px',
          fontSize: emailTheme.typography.fontSize.xl,
          fontWeight: emailTheme.typography.fontWeight.bold,
          color: emailTheme.colors.text.primary,
        }}
      >
        How to Activate 🚀
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
            <Text
              style={{
                margin: '0',
                fontSize: emailTheme.typography.fontSize.lg,
              }}
            >
              1️⃣
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
              Click the Activation Button
            </Text>
            <Text
              style={{
                margin: '0',
                fontSize: emailTheme.typography.fontSize.sm,
                color: emailTheme.colors.text.secondary,
                lineHeight: emailTheme.typography.lineHeight.relaxed,
              }}
            >
              Click the "Activate License" button above to automatically activate your key
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
              2️⃣
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
              Confirm Activation
            </Text>
            <Text
              style={{
                margin: '0',
                fontSize: emailTheme.typography.fontSize.sm,
                color: emailTheme.colors.text.secondary,
                lineHeight: emailTheme.typography.lineHeight.relaxed,
              }}
            >
              Your license will be activated instantly and linked to your account
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
              3️⃣
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
              Start Learning
            </Text>
            <Text
              style={{
                margin: '0',
                fontSize: emailTheme.typography.fontSize.sm,
                color: emailTheme.colors.text.secondary,
                lineHeight: emailTheme.typography.lineHeight.relaxed,
              }}
            >
              Access all course content immediately from your dashboard
            </Text>
          </td>
        </tr>
      </table>

      {/* Manual activation */}
      <Section
        style={{
          backgroundColor: emailTheme.colors.background.tertiary,
          padding: emailTheme.spacing[4],
          borderRadius: emailTheme.borderRadius.sm,
          margin: '30px 0',
        }}
      >
        <Text
          style={{
            margin: '0 0 8px',
            fontSize: emailTheme.typography.fontSize.sm,
            fontWeight: emailTheme.typography.fontWeight.bold,
            color: emailTheme.colors.text.primary,
          }}
        >
          💻 Manual Activation
        </Text>
        <Text
          style={{
            margin: '0 0 8px',
            fontSize: emailTheme.typography.fontSize.sm,
            color: emailTheme.colors.text.secondary,
            lineHeight: emailTheme.typography.lineHeight.relaxed,
          }}
        >
          You can also manually activate your license by:
        </Text>
        <ol
          style={{
            margin: '8px 0 0',
            paddingLeft: '20px',
            fontSize: emailTheme.typography.fontSize.sm,
            color: emailTheme.colors.text.secondary,
            lineHeight: emailTheme.typography.lineHeight.relaxed,
          }}
        >
          <li style={{ marginBottom: '4px' }}>Going to your account dashboard</li>
          <li style={{ marginBottom: '4px' }}>
            Clicking "Activate License" in the courses section
          </li>
          <li style={{ marginBottom: '4px' }}>Entering your license key</li>
        </ol>
      </Section>

      {/* Important info */}
      <Section
        style={{
          backgroundColor: emailTheme.colors.warning.light,
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
            color: emailTheme.colors.warning.dark,
          }}
        >
          ⚠️ Important
        </Text>
        <Text
          style={{
            margin: '0',
            fontSize: emailTheme.typography.fontSize.sm,
            color: emailTheme.colors.warning.dark,
            lineHeight: emailTheme.typography.lineHeight.relaxed,
          }}
        >
          Keep this license key safe! Do not share it with others. Each license key can
          only be activated once and is tied to your account.
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
        Ready to start your game development journey?
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
        Having trouble activating? Reply to this email and we'll help you get started.
      </Text>
    </BaseLayout>
  );
}

export default LicenseKeyEmail;
