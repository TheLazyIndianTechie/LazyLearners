#!/usr/bin/env node

/**
 * Generate secure secrets for production environment
 * Usage: node scripts/generate-secrets.js
 */

const crypto = require('crypto');

function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

function generateBase64Secret(length = 32) {
  return crypto.randomBytes(length).toString('base64');
}

function generateJWT() {
  return crypto.randomBytes(64).toString('hex');
}

function generateEncryptionKey() {
  // AES-256 requires exactly 32 bytes (256 bits)
  return crypto.randomBytes(32).toString('hex');
}

console.log('🔐 Generating secure secrets for production...\n');

const secrets = {
  NEXTAUTH_SECRET: generateBase64Secret(32),
  JWT_SECRET: generateJWT(),
  ENCRYPTION_KEY: generateEncryptionKey(),
  SESSION_SECRET: generateSecret(32),
  API_SECRET: generateSecret(24)
};

console.log('📋 Environment Variables (copy these to Vercel Dashboard):');
console.log('=' * 60);

Object.entries(secrets).forEach(([key, value]) => {
  console.log(`${key}=${value}`);
});

console.log('\n📝 Vercel CLI Commands:');
console.log('=' * 60);

Object.entries(secrets).forEach(([key, value]) => {
  console.log(`npx vercel env add ${key} production`);
  console.log(`# When prompted, paste: ${value}\n`);
});

console.log('🔗 Production URLs:');
console.log('=' * 60);
console.log('NEXTAUTH_URL=https://gamelearn-platform-k6t2ug2a1-thelazyindiantechies-projects.vercel.app');
console.log('VERCEL_URL=https://gamelearn-platform-k6t2ug2a1-thelazyindiantechies-projects.vercel.app');

console.log('\n✅ Next Steps:');
console.log('1. Copy the environment variables above to Vercel Dashboard');
console.log('2. Set up external database (PostgreSQL) and Redis');
console.log('3. Configure OAuth providers (optional)');
console.log('4. Test the production deployment');

console.log('\n🔒 Security Notes:');
console.log('- Store these secrets securely');
console.log('- Never commit secrets to version control');
console.log('- Rotate secrets periodically');
console.log('- Use different secrets for development/staging/production');