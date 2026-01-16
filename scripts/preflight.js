#!/usr/bin/env node

/**
 * Preflight check script to validate required environment variables
 * before building the application.
 * 
 * Usage:
 *   - Production build: Will fail if required env vars are missing
 *   - Development: Will show warnings only
 */

const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
];

const isProduction = process.env.NODE_ENV === 'production' || process.argv.includes('--production');

let hasErrors = false;

console.log('🔍 Running preflight environment check...\n');

requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  
  if (!value || value.trim() === '' || value.startsWith('YOUR_')) {
    const message = `❌ Missing or invalid: ${envVar}`;
    
    if (isProduction) {
      console.error(message);
      hasErrors = true;
    } else {
      console.warn(`⚠️  Warning: ${envVar} is not set (OK for development)`);
    }
  } else {
    console.log(`✓ ${envVar} is configured`);
  }
});

console.log('');

if (hasErrors) {
  console.error('❌ Preflight check FAILED!');
  console.error('Required environment variables are missing.');
  console.error('Please set them in your deployment platform (Vercel/Netlify) or .env file.\n');
  process.exit(1);
}

if (isProduction) {
  console.log('✅ Preflight check PASSED - all required environment variables are set\n');
} else {
  console.log('ℹ️  Development mode - warnings are OK\n');
}
