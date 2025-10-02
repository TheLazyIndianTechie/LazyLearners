#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files that need updating
const filesToUpdate = [
  'src/app/dashboard/page.tsx',
  'src/app/courses/[id]/page.tsx',
  'src/app/courses/[id]/lessons/[lessonId]/page.tsx',
  'src/app/instructor/dashboard/page.tsx',
  'src/app/instructor/courses/[id]/edit/page.tsx',
  'src/app/instructor/courses/create/page.tsx',
  'src/app/instructor/page.tsx',
  'src/hooks/useCollaboration.ts',
  'src/hooks/use-quiz.ts',
  'src/hooks/use-dashboard.ts',
  'src/hooks/use-progress.ts'
];

filesToUpdate.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');

  // Replace imports
  content = content.replace(
    /import { useSession(?:, [^}]+)? } from "next-auth\/react"/g,
    'import { useUser } from "@clerk/nextjs"'
  );

  content = content.replace(
    /import { useSession } from ['"]next-auth\/react['"]/g,
    'import { useUser } from "@clerk/nextjs"'
  );

  // Replace session usage patterns
  content = content.replace(
    /const { data: session(?:, status)? } = useSession\(\)/g,
    'const { isSignedIn, user } = useUser()'
  );

  content = content.replace(
    /const { data: session } = useSession\(\)/g,
    'const { isSignedIn, user } = useUser()'
  );

  // Replace session references
  content = content.replace(/session\?\.user/g, 'user');
  content = content.replace(/!!session/g, 'isSignedIn');
  content = content.replace(/!session/g, '!isSignedIn');
  content = content.replace(/session?.user?.id/g, 'user?.id');
  content = content.replace(/session?.user?.email/g, 'user?.emailAddresses?.[0]?.emailAddress');
  content = content.replace(/session?.user?.name/g, 'user?.fullName');
  content = content.replace(/session\.user\.id/g, 'user?.id');
  content = content.replace(/session\.user\.email/g, 'user?.emailAddresses?.[0]?.emailAddress');
  content = content.replace(/session\.user\.name/g, 'user?.fullName');

  fs.writeFileSync(fullPath, content);
  console.log(`Updated: ${filePath}`);
});

console.log('Migration complete!');