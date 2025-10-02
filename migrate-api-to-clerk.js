#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Migrating API routes from NextAuth to Clerk...');

// Get all API files that use NextAuth
const apiFiles = execSync('find src/app/api -name "*.ts" | xargs grep -l "getServerSession\\|next-auth"', { encoding: 'utf-8' })
  .trim()
  .split('\n')
  .filter(file => file && !file.includes('[...nextauth]')); // Skip the NextAuth route itself

console.log(`Found ${apiFiles.length} API files to migrate:`);
apiFiles.forEach(file => console.log(`  - ${file}`));

apiFiles.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;

  // Replace imports
  if (content.includes('getServerSession')) {
    content = content.replace(
      /import { getServerSession } from "next-auth\/next"/g,
      'import { auth } from "@clerk/nextjs/server"'
    );
    content = content.replace(
      /import { getServerSession } from 'next-auth\/next'/g,
      'import { auth } from "@clerk/nextjs/server"'
    );
    hasChanges = true;
  }

  // Remove authOptions import
  if (content.includes('authOptions')) {
    content = content.replace(
      /import { authOptions } from ['"'][^'"]+['"]/g,
      ''
    );
    content = content.replace(
      /,\s*authOptions/g,
      ''
    );
    content = content.replace(
      /authOptions,?\s*/g,
      ''
    );
    hasChanges = true;
  }

  // Replace session calls
  content = content.replace(
    /const session = await getServerSession\(authOptions\)/g,
    'const { userId } = auth()'
  );

  // Replace authentication checks
  content = content.replace(
    /if \(!session\?\?.user\)/g,
    'if (!userId)'
  );
  content = content.replace(
    /if \(!session\.user\)/g,
    'if (!userId)'
  );
  content = content.replace(
    /session\?\?.user\?\?.id/g,
    'userId'
  );
  content = content.replace(
    /session\.user\.id/g,
    'userId'
  );

  if (content.includes('getServerSession') || content.includes('session')) {
    hasChanges = true;
  }

  if (hasChanges) {
    fs.writeFileSync(filePath, content);
    console.log(`✓ Updated: ${filePath}`);
  } else {
    console.log(`- Skipped: ${filePath} (no changes needed)`);
  }
});

console.log('\nAPI migration complete!');