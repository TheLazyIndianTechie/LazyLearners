/**
 * Email Button Component
 *
 * Reusable button component for email templates with multiple variants
 */

import React from 'react';
import { Button as EmailButton, Link } from '@react-email/components';
import { emailTheme, emailStyles } from '../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}

const getButtonStyles = (
  variant: ButtonVariant,
  size: ButtonSize,
  fullWidth: boolean
) => {
  // Base styles
  const baseStyles: React.CSSProperties = {
    display: fullWidth ? 'block' : 'inline-block',
    width: fullWidth ? '100%' : 'auto',
    textAlign: 'center',
    textDecoration: 'none',
    borderRadius: emailTheme.borderRadius.base,
    fontWeight: emailTheme.typography.fontWeight.bold,
    fontFamily: emailTheme.typography.fontFamily.sans,
    cursor: 'pointer',
    border: 'none',
    transition: `all ${emailTheme.transitions.base}`,
  };

  // Size variations
  const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
    sm: {
      padding: '10px 20px',
      fontSize: emailTheme.typography.fontSize.sm,
    },
    md: {
      padding: '14px 28px',
      fontSize: emailTheme.typography.fontSize.base,
    },
    lg: {
      padding: '16px 32px',
      fontSize: emailTheme.typography.fontSize.lg,
    },
  };

  // Variant styles
  const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
      backgroundColor: emailTheme.colors.primary[500],
      color: emailTheme.colors.text.inverse,
    },
    secondary: {
      backgroundColor: emailTheme.colors.secondary[500],
      color: emailTheme.colors.text.inverse,
    },
    success: {
      backgroundColor: emailTheme.colors.success.main,
      color: emailTheme.colors.text.inverse,
    },
    outline: {
      backgroundColor: 'transparent',
      color: emailTheme.colors.primary[500],
      border: `2px solid ${emailTheme.colors.primary[500]}`,
    },
  };

  return {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant],
  };
};

export function Button({
  href,
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
}: ButtonProps) {
  const buttonStyles = getButtonStyles(variant, size, fullWidth);

  return (
    <table
      role="presentation"
      style={{
        width: fullWidth ? '100%' : 'auto',
        margin: '0',
        borderCollapse: 'collapse',
      }}
    >
      <tr>
        <td
          align="center"
          style={{
            borderRadius: emailTheme.borderRadius.base,
            backgroundColor:
              variant === 'outline' ? 'transparent' : buttonStyles.backgroundColor,
          }}
        >
          <Link
            href={href}
            className={className}
            style={buttonStyles}
          >
            {children}
          </Link>
        </td>
      </tr>
    </table>
  );
}

/**
 * Icon Button Component
 */
interface IconButtonProps {
  href: string;
  icon: string;
  label: string;
  variant?: ButtonVariant;
}

export function IconButton({
  href,
  icon,
  label,
  variant = 'primary',
}: IconButtonProps) {
  const styles = getButtonStyles(variant, 'md', false);

  return (
    <table role="presentation" style={{ margin: '0', borderCollapse: 'collapse' }}>
      <tr>
        <td
          align="center"
          style={{
            borderRadius: emailTheme.borderRadius.base,
            backgroundColor:
              variant === 'outline' ? 'transparent' : styles.backgroundColor,
          }}
        >
          <Link href={href} style={styles}>
            <span style={{ marginRight: '8px' }}>{icon}</span>
            {label}
          </Link>
        </td>
      </tr>
    </table>
  );
}
