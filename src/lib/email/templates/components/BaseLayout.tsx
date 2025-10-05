/**
 * Base Email Layout Component
 *
 * Reusable layout for all email templates with header, content, and footer
 */

import React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Row,
  Column,
  Text,
  Link,
  Hr,
  Img,
} from '@react-email/components';
import { emailTheme } from '../theme';

interface BaseLayoutProps {
  children: React.ReactNode;
  previewText?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  unsubscribeUrl?: string;
  unsubscribeToken?: string;
}

export function BaseLayout({
  children,
  previewText,
  showHeader = true,
  showFooter = true,
  unsubscribeUrl,
  unsubscribeToken,
}: BaseLayoutProps) {
  const currentYear = new Date().getFullYear();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return (
    <Html lang="en">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="x-apple-disable-message-reformatting" />
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        {previewText && (
          <meta name="description" content={previewText} />
        )}
        <style>{`
          @media only screen and (max-width: 600px) {
            .email-container {
              width: 100% !important;
              max-width: 100% !important;
            }
            .email-section {
              padding: 20px !important;
            }
            .email-header {
              padding: 30px 20px !important;
            }
            .email-footer {
              padding: 15px 20px !important;
            }
            .email-button {
              padding: 12px 20px !important;
              font-size: 14px !important;
            }
          }

          @media (prefers-color-scheme: dark) {
            .dark-mode-support {
              background-color: #1f2937 !important;
              color: #f9fafb !important;
            }
          }

          /* Prevent Gmail from changing font */
          body, table, td, a {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
          }

          /* Remove spacing between tables in Outlook */
          table, td {
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
          }

          /* Better rendering in Outlook */
          img {
            -ms-interpolation-mode: bicubic;
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
          }
        `}</style>
      </Head>
      <Body
        style={{
          margin: '0',
          padding: '0',
          backgroundColor: emailTheme.colors.background.secondary,
          fontFamily: emailTheme.typography.fontFamily.sans,
        }}
      >
        {/* Preview text (hidden but shows in inbox) */}
        {previewText && (
          <div
            style={{
              display: 'none',
              fontSize: '1px',
              lineHeight: '1px',
              maxHeight: '0px',
              maxWidth: '0px',
              opacity: 0,
              overflow: 'hidden',
            }}
          >
            {previewText}
          </div>
        )}

        {/* Main container */}
        <table
          role="presentation"
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            margin: '0',
            padding: '0',
          }}
        >
          <tr>
            <td align="center" style={{ padding: '40px 20px' }}>
              <Container
                className="email-container"
                style={{
                  maxWidth: emailTheme.layout.maxWidth.email,
                  backgroundColor: emailTheme.colors.background.primary,
                  borderRadius: emailTheme.borderRadius.md,
                  boxShadow: emailTheme.shadow.base,
                  overflow: 'hidden',
                }}
              >
                {/* Header */}
                {showHeader && (
                  <Section
                    className="email-header"
                    style={{
                      background: emailTheme.gradients.primary,
                      padding: '40px',
                      textAlign: 'center',
                    }}
                  >
                    <Row>
                      <Column>
                        <Text
                          style={{
                            margin: '0',
                            fontSize: emailTheme.typography.fontSize['4xl'],
                            fontWeight: emailTheme.typography.fontWeight.bold,
                            color: emailTheme.colors.text.inverse,
                            letterSpacing: '-0.5px',
                          }}
                        >
                          🎮 LazyGameDevs
                        </Text>
                        <Text
                          style={{
                            margin: '8px 0 0',
                            fontSize: emailTheme.typography.fontSize.sm,
                            color: emailTheme.colors.primary[100],
                            fontWeight: emailTheme.typography.fontWeight.medium,
                            letterSpacing: '1px',
                            textTransform: 'uppercase',
                          }}
                        >
                          GameLearn Platform
                        </Text>
                      </Column>
                    </Row>
                  </Section>
                )}

                {/* Content */}
                <Section
                  className="email-section"
                  style={{
                    padding: '40px',
                  }}
                >
                  {children}
                </Section>

                {/* Footer */}
                {showFooter && (
                  <Section
                    className="email-footer"
                    style={{
                      padding: '20px 40px',
                      backgroundColor: emailTheme.colors.background.secondary,
                      textAlign: 'center',
                    }}
                  >
                    <Row>
                      <Column>
                        <Text
                          style={{
                            margin: '0 0 8px',
                            fontSize: emailTheme.typography.fontSize.xs,
                            color: emailTheme.colors.text.tertiary,
                            lineHeight: emailTheme.typography.lineHeight.relaxed,
                          }}
                        >
                          © {currentYear} LazyGameDevs. All rights reserved.
                        </Text>
                        <Text
                          style={{
                            margin: '0 0 8px',
                            fontSize: emailTheme.typography.fontSize.xs,
                            color: emailTheme.colors.text.tertiary,
                          }}
                        >
                          <Link
                            href={`${appUrl}/about`}
                            style={{
                              color: emailTheme.colors.primary[500],
                              textDecoration: 'none',
                            }}
                          >
                            About
                          </Link>
                          {' • '}
                          <Link
                            href={`${appUrl}/contact`}
                            style={{
                              color: emailTheme.colors.primary[500],
                              textDecoration: 'none',
                            }}
                          >
                            Contact
                          </Link>
                          {' • '}
                          <Link
                            href={`${appUrl}/privacy`}
                            style={{
                              color: emailTheme.colors.primary[500],
                              textDecoration: 'none',
                            }}
                          >
                            Privacy
                          </Link>
                          {' • '}
                          <Link
                            href={`${appUrl}/terms`}
                            style={{
                              color: emailTheme.colors.primary[500],
                              textDecoration: 'none',
                            }}
                          >
                            Terms
                          </Link>
                        </Text>

                        {/* Unsubscribe link */}
                        {unsubscribeUrl && (
                          <>
                            <Hr
                              style={{
                                margin: '12px 0',
                                borderColor: emailTheme.colors.border.light,
                              }}
                            />
                            <Text
                              style={{
                                margin: '8px 0 0',
                                fontSize: emailTheme.typography.fontSize.xs,
                                color: emailTheme.colors.text.tertiary,
                              }}
                            >
                              Don't want to receive these emails?{' '}
                              <Link
                                href={
                                  unsubscribeToken
                                    ? `${appUrl}/unsubscribe?token=${unsubscribeToken}`
                                    : unsubscribeUrl
                                }
                                style={{
                                  color: emailTheme.colors.primary[500],
                                  textDecoration: 'underline',
                                }}
                              >
                                Unsubscribe
                              </Link>
                            </Text>
                          </>
                        )}

                        <Text
                          style={{
                            margin: '12px 0 0',
                            fontSize: emailTheme.typography.fontSize.xs,
                            color: emailTheme.colors.gray[400],
                          }}
                        >
                          Empowering game developers to level up their skills
                        </Text>
                      </Column>
                    </Row>
                  </Section>
                )}
              </Container>

              {/* Spacer for email clients */}
              <div style={{ height: '20px' }}></div>
            </td>
          </tr>
        </table>
      </Body>
    </Html>
  );
}
