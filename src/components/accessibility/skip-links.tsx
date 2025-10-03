"use client"

/**
 * Skip Links Component
 *
 * Provides keyboard navigation shortcuts to skip to main content sections.
 * Essential for WCAG 2.1 AA compliance - allows keyboard users to bypass repetitive navigation.
 *
 * Usage: Include at the top of the layout before any other content
 * Related: Task 18.4 - Implement skip navigation links
 */

export function SkipLinks() {
  return (
    <div className="skip-links">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <a href="#navigation" className="skip-link">
        Skip to navigation
      </a>
      <a href="#footer" className="skip-link">
        Skip to footer
      </a>

      <style jsx>{`
        .skip-links {
          position: absolute;
          top: 0;
          left: 0;
          z-index: 9999;
        }

        .skip-link {
          position: absolute;
          top: -40px;
          left: 0;
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          padding: 12px 24px;
          text-decoration: none;
          font-weight: 600;
          border-radius: 0 0 4px 0;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          transition: top 0.2s ease-in-out;
          z-index: 10000;
        }

        .skip-link:focus {
          top: 0;
          outline: 3px solid hsl(var(--ring));
          outline-offset: 2px;
        }

        .skip-link:not(:focus) {
          clip: rect(0, 0, 0, 0);
          clip-path: inset(50%);
          height: 1px;
          overflow: hidden;
          position: absolute;
          white-space: nowrap;
          width: 1px;
        }
      `}</style>
    </div>
  )
}
