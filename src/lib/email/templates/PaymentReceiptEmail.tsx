/**
 * Payment Receipt Email Template
 *
 * Sent when a user completes a payment for a course
 */

import React from 'react';
import { Text, Section, Hr } from '@react-email/components';
import { BaseLayout } from './components/BaseLayout';
import { Button } from './components/Button';
import { PaymentReceiptEmailData } from '../types';
import { emailTheme } from './theme';

interface PaymentReceiptEmailProps {
  data: PaymentReceiptEmailData;
}

export function PaymentReceiptEmail({ data }: PaymentReceiptEmailProps) {
  const {
    userName,
    courseName,
    amount,
    currency,
    paymentDate,
    transactionId,
    invoiceUrl,
    items,
    subtotal,
    tax,
    total,
  } = data;

  const formattedDate = new Date(paymentDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <BaseLayout
      previewText={`Payment receipt for ${courseName} - ${formatCurrency(total, currency)}`}
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
        Payment Successful! 💳
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
        Thank you for your purchase! Your payment has been processed successfully. Here's your receipt for your records.
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
          ✅ Payment Confirmed
        </Text>
        <Text
          style={{
            margin: '0',
            fontSize: emailTheme.typography.fontSize.sm,
            color: emailTheme.colors.success.dark,
          }}
        >
          Amount: {formatCurrency(total, currency)} • Transaction ID: {transactionId}
        </Text>
      </Section>

      {/* Receipt card */}
      <Section
        style={{
          backgroundColor: emailTheme.colors.background.primary,
          padding: emailTheme.spacing[6],
          borderRadius: emailTheme.borderRadius.md,
          margin: '30px 0',
          border: `2px solid ${emailTheme.colors.border.light}`,
        }}
      >
        <Text
          style={{
            margin: '0 0 20px',
            fontSize: emailTheme.typography.fontSize.sm,
            fontWeight: emailTheme.typography.fontWeight.semibold,
            color: emailTheme.colors.primary[600],
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Payment Receipt
        </Text>

        {/* Transaction details */}
        <table
          role="presentation"
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginBottom: '20px',
          }}
        >
          <tr>
            <td
              style={{
                padding: '8px 0',
                fontSize: emailTheme.typography.fontSize.sm,
                color: emailTheme.colors.text.tertiary,
              }}
            >
              Date:
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
              }}
            >
              Transaction ID:
            </td>
            <td
              style={{
                padding: '8px 0',
                fontSize: emailTheme.typography.fontSize.sm,
                color: emailTheme.colors.text.primary,
                textAlign: 'right',
                fontFamily: emailTheme.typography.fontFamily.mono,
              }}
            >
              {transactionId}
            </td>
          </tr>
          <tr>
            <td
              style={{
                padding: '8px 0',
                fontSize: emailTheme.typography.fontSize.sm,
                color: emailTheme.colors.text.tertiary,
              }}
            >
              Payment Method:
            </td>
            <td
              style={{
                padding: '8px 0',
                fontSize: emailTheme.typography.fontSize.sm,
                color: emailTheme.colors.text.primary,
                textAlign: 'right',
              }}
            >
              {currency.toUpperCase()}
            </td>
          </tr>
        </table>

        <Hr
          style={{
            margin: '20px 0',
            borderColor: emailTheme.colors.border.light,
          }}
        />

        {/* Itemized list */}
        <Text
          style={{
            margin: '0 0 12px',
            fontSize: emailTheme.typography.fontSize.base,
            fontWeight: emailTheme.typography.fontWeight.bold,
            color: emailTheme.colors.text.primary,
          }}
        >
          Items Purchased
        </Text>

        <table
          role="presentation"
          style={{
            width: '100%',
            borderCollapse: 'collapse',
          }}
        >
          {items.map((item, index) => (
            <tr key={index}>
              <td
                style={{
                  padding: '12px 0',
                  fontSize: emailTheme.typography.fontSize.sm,
                  color: emailTheme.colors.text.primary,
                  borderBottom:
                    index < items.length - 1
                      ? `1px solid ${emailTheme.colors.border.light}`
                      : 'none',
                }}
              >
                {item.description}
              </td>
              <td
                style={{
                  padding: '12px 0',
                  fontSize: emailTheme.typography.fontSize.sm,
                  color: emailTheme.colors.text.primary,
                  textAlign: 'right',
                  fontWeight: emailTheme.typography.fontWeight.semibold,
                  borderBottom:
                    index < items.length - 1
                      ? `1px solid ${emailTheme.colors.border.light}`
                      : 'none',
                }}
              >
                {formatCurrency(item.amount, currency)}
              </td>
            </tr>
          ))}
        </table>

        <Hr
          style={{
            margin: '20px 0',
            borderColor: emailTheme.colors.border.light,
          }}
        />

        {/* Totals */}
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
              }}
            >
              Subtotal:
            </td>
            <td
              style={{
                padding: '8px 0',
                fontSize: emailTheme.typography.fontSize.sm,
                color: emailTheme.colors.text.primary,
                textAlign: 'right',
              }}
            >
              {formatCurrency(subtotal, currency)}
            </td>
          </tr>
          {tax && tax > 0 && (
            <tr>
              <td
                style={{
                  padding: '8px 0',
                  fontSize: emailTheme.typography.fontSize.sm,
                  color: emailTheme.colors.text.tertiary,
                }}
              >
                Tax:
              </td>
              <td
                style={{
                  padding: '8px 0',
                  fontSize: emailTheme.typography.fontSize.sm,
                  color: emailTheme.colors.text.primary,
                  textAlign: 'right',
                }}
              >
                {formatCurrency(tax, currency)}
              </td>
            </tr>
          )}
          <tr>
            <td
              style={{
                padding: '12px 0 0',
                fontSize: emailTheme.typography.fontSize.lg,
                fontWeight: emailTheme.typography.fontWeight.bold,
                color: emailTheme.colors.text.primary,
                borderTop: `2px solid ${emailTheme.colors.border.main}`,
              }}
            >
              Total:
            </td>
            <td
              style={{
                padding: '12px 0 0',
                fontSize: emailTheme.typography.fontSize.lg,
                fontWeight: emailTheme.typography.fontWeight.bold,
                color: emailTheme.colors.primary[600],
                textAlign: 'right',
                borderTop: `2px solid ${emailTheme.colors.border.main}`,
              }}
            >
              {formatCurrency(total, currency)}
            </td>
          </tr>
        </table>
      </Section>

      {/* Invoice button */}
      {invoiceUrl && (
        <Section style={{ margin: '30px 0', textAlign: 'center' }}>
          <Button href={invoiceUrl} variant="outline" size="md">
            📄 Download Invoice
          </Button>
        </Section>
      )}

      <Hr
        style={{
          margin: '30px 0',
          borderColor: emailTheme.colors.border.light,
        }}
      />

      {/* Next steps */}
      <Text
        style={{
          margin: '0 0 16px',
          fontSize: emailTheme.typography.fontSize.xl,
          fontWeight: emailTheme.typography.fontWeight.bold,
          color: emailTheme.colors.text.primary,
        }}
      >
        What's Next? 🚀
      </Text>

      <Section
        style={{
          backgroundColor: emailTheme.colors.primary[50],
          padding: emailTheme.spacing[5],
          borderRadius: emailTheme.borderRadius.md,
          margin: '20px 0',
        }}
      >
        <table role="presentation" style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                Check Your Email
              </Text>
              <Text
                style={{
                  margin: '0',
                  fontSize: emailTheme.typography.fontSize.sm,
                  color: emailTheme.colors.text.secondary,
                  lineHeight: emailTheme.typography.lineHeight.relaxed,
                }}
              >
                You'll receive a separate email with your course access and license key
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
                Access Your Course
              </Text>
              <Text
                style={{
                  margin: '0',
                  fontSize: emailTheme.typography.fontSize.sm,
                  color: emailTheme.colors.text.secondary,
                  lineHeight: emailTheme.typography.lineHeight.relaxed,
                }}
              >
                Visit your dashboard to start learning immediately
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
                Dive into your course and begin your game development journey
              </Text>
            </td>
          </tr>
        </table>
      </Section>

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
          💡 Keep This Email
        </Text>
        <Text
          style={{
            margin: '0',
            fontSize: emailTheme.typography.fontSize.sm,
            color: emailTheme.colors.info.dark,
            lineHeight: emailTheme.typography.lineHeight.relaxed,
          }}
        >
          Save this receipt for your records. If you need a refund or have any questions about your purchase, please contact our support team with your transaction ID.
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
        Thank you for choosing LazyGameDevs!
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
        Questions about your purchase? Contact us at support@lazygamedevs.com
      </Text>
    </BaseLayout>
  );
}

export default PaymentReceiptEmail;
