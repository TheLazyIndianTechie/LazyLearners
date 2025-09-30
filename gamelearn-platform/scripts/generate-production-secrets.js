#!/usr/bin/env node

/**
 * Production Secrets Generator
 * Generates secure secrets for production deployment
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function generateSecureSecret(length = 32) {
  return crypto.randomBytes(length).toString('base64');
}

function generateHexSecret(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

function generateAlphanumericSecret(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateProductionSecrets() {
  const secrets = {
    // Core application secrets
    JWT_SECRET: generateSecureSecret(64),
    ENCRYPTION_KEY: generateSecureSecret(32),

    // Session and security
    SESSION_SECRET: generateSecureSecret(32),
    WEBHOOK_SECRET: generateSecureSecret(32),

    // Database security
    DB_ENCRYPTION_KEY: generateSecureSecret(32),

    // API rate limiting
    RATE_LIMIT_SECRET: generateAlphanumericSecret(24),

    // Development bypass (should NOT be set in production)
    // ENABLE_VIDEO_TEST: 'false', // Explicitly false for production
  };

  return secrets;
}

function createProductionEnvTemplate(secrets) {
  const template = `# =============================================================================
# GENERATED PRODUCTION SECRETS
# =============================================================================
# Generated on: ${new Date().toISOString()}
#
# IMPORTANT:
# - These are production-ready secrets
# - Store these securely and never commit to version control
# - Each secret should be used only once per environment
# - Regenerate secrets if they are ever compromised
#
# Copy these values to your Vercel environment variables dashboard
# =============================================================================

# Core Application Secrets (REQUIRED)
JWT_SECRET="${secrets.JWT_SECRET}"
ENCRYPTION_KEY="${secrets.ENCRYPTION_KEY}"

# Session Management
SESSION_SECRET="${secrets.SESSION_SECRET}"

# Webhook Security
WEBHOOK_SECRET="${secrets.WEBHOOK_SECRET}"

# Database Security
DB_ENCRYPTION_KEY="${secrets.DB_ENCRYPTION_KEY}"

# Rate Limiting
RATE_LIMIT_SECRET="${secrets.RATE_LIMIT_SECRET}"

# =============================================================================
# ADDITIONAL CONFIGURATION REQUIRED
# =============================================================================
# The following variables need to be configured with your actual service values:

# Database (Replace with your production database URL)
# DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require&connection_limit=20"

# Redis (Replace with your production Redis URL)
# REDIS_URL="rediss://default:password@host:port"

# Clerk Authentication (Replace with your production Clerk keys)
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_YOUR_PRODUCTION_KEY"
# CLERK_SECRET_KEY="sk_live_YOUR_PRODUCTION_KEY"
# CLERK_WEBHOOK_SECRET="whsec_YOUR_PRODUCTION_SECRET"

# Dodo Payments (Replace with your production Dodo keys)
# DODO_API_KEY="YOUR_PRODUCTION_DODO_API_KEY"
# DODO_WEBHOOK_SECRET="whsec_YOUR_PRODUCTION_DODO_WEBHOOK_SECRET"
# DODO_ENVIRONMENT="live"

# Production Domain (Replace with your actual domain)
# APP_URL="https://your-production-domain.vercel.app"
# API_BASE_URL="https://your-production-domain.vercel.app/api"

# CORS Origins (Replace with your actual domains)
# CORS_ORIGINS="https://your-production-domain.vercel.app,https://lazygamedevs.com"

# =============================================================================
# SECURITY NOTES
# =============================================================================
# 1. Never use these secrets in development or staging environments
# 2. Rotate these secrets every 90 days or if compromised
# 3. Store backups of these secrets in a secure password manager
# 4. Use different secrets for staging and production environments
# 5. Monitor for any unauthorized use of these secrets
# =============================================================================
`;

  return template;
}

function saveSecretsFile(content, filename = '.env.production.secrets') {
  const filePath = path.join(process.cwd(), filename);

  try {
    fs.writeFileSync(filePath, content, { mode: 0o600 }); // Restrict file permissions
    console.log(`✅ Production secrets generated and saved to: ${filename}`);
    console.log(`📁 File location: ${filePath}`);
    console.log(`🔒 File permissions set to 600 (owner read/write only)`);
  } catch (error) {
    console.error(`❌ Error saving secrets file: ${error.message}`);
    process.exit(1);
  }
}

function displaySecurityInstructions() {
  console.log(`
🔐 PRODUCTION SECRETS GENERATED SUCCESSFULLY!

⚠️  IMPORTANT SECURITY INSTRUCTIONS:

1. 📋 Copy the generated secrets to your Vercel Dashboard:
   - Go to your Vercel project dashboard
   - Navigate to Settings → Environment Variables
   - Add each secret as a new environment variable
   - Set environment to "Production"

2. 🔒 Secure Storage:
   - Store a backup of these secrets in a secure password manager
   - Never commit the .env.production.secrets file to version control
   - Delete the file after copying secrets to Vercel

3. 🔄 Rotation Schedule:
   - Rotate all secrets every 90 days
   - Regenerate immediately if any secret is compromised
   - Use different secrets for staging and production

4. 🚫 What NOT to do:
   - Don't use these secrets in development
   - Don't share secrets via email or chat
   - Don't store secrets in plain text files long-term
   - Don't reuse secrets across different environments

5. ✅ Verification Steps:
   - Test all functionality after deploying with new secrets
   - Verify authentication flow works
   - Confirm payment processing works
   - Check that video streaming functions properly

6. 🆘 If Secrets are Compromised:
   - Regenerate all secrets immediately
   - Update Vercel environment variables
   - Redeploy the application
   - Monitor for unauthorized access
   - Consider rotating related service API keys

📖 For detailed deployment instructions, see:
   - VERCEL_DEPLOYMENT_GUIDE.md
   - PRODUCTION_SECURITY_CHECKLIST.md
   - PRODUCTION_DATABASE_SETUP.md
`);
}

function main() {
  console.log('🔐 Generating production secrets for GameLearn Platform...\n');

  // Generate secure secrets
  const secrets = generateProductionSecrets();

  // Create production environment template
  const content = createProductionEnvTemplate(secrets);

  // Save to file
  saveSecretsFile(content);

  // Display security instructions
  displaySecurityInstructions();

  console.log('\n🎉 Production secrets generation complete!');
  console.log('   Follow the security instructions above to deploy safely.');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  generateSecureSecret,
  generateHexSecret,
  generateAlphanumericSecret,
  generateProductionSecrets,
  createProductionEnvTemplate
};