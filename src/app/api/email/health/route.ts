/**
 * Email Health Check API
 * GET /api/email/health
 *
 * Checks email service configuration, connectivity, and domain authentication
 */

import { NextResponse } from 'next/server';
import { checkEmailHealth, verifyEmailDomain } from '@/lib/email/service';
import { isEmailConfigured, getActiveProvider, isDryRunMode } from '@/lib/email/config';

export async function GET() {
  try {
    // Check if email is configured
    const configured = isEmailConfigured();

    if (!configured) {
      return NextResponse.json(
        {
          success: false,
          healthy: false,
          error: 'Email service not configured',
          provider: null,
          dryRun: true,
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    const provider = getActiveProvider();
    const dryRun = isDryRunMode();

    // Perform health check
    const healthStatus = await checkEmailHealth();

    // Try to verify domain (optional, may fail if no domain configured)
    let domainVerification;
    try {
      domainVerification = await verifyEmailDomain();
    } catch (error) {
      domainVerification = {
        verified: false,
        spf: false,
        dkim: false,
        dmarc: false,
        error: error instanceof Error ? error.message : 'Domain verification not available',
      };
    }

    // Determine overall health
    const healthy = healthStatus.healthy && (!dryRun || dryRun);

    return NextResponse.json(
      {
        success: true,
        healthy,
        provider,
        dryRun,
        latency: healthStatus.latency,
        domain: domainVerification,
        timestamp: healthStatus.timestamp.toISOString(),
        error: healthStatus.error,
      },
      { status: healthy ? 200 : 503 }
    );
  } catch (error) {
    console.error('[Email Health Check] Error:', error);

    return NextResponse.json(
      {
        success: false,
        healthy: false,
        error: error instanceof Error ? error.message : 'Health check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
