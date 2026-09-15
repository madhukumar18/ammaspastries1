import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

console.log('----------------------------------------------------');
console.log('🚀 Git Auto-Sync Service Started');
console.log(`📁 Watching project: ${ROOT_DIR}`);
console.log('🔗 Remote target: https://github.com/madhukumar18/ammaspastries1.git');
console.log('⏱️ Changes will automatically commit and push on file save');
console.log('----------------------------------------------------');

let debounceTimer = null;
let isSyncing = false;

const IGNORED_PATHS = [
  '.git',
  'node_modules',
  'vendor',
  'dist',
  'dist-ssr',
  'storage/logs',
  'storage/framework',
  '.idea',
  '.vscode',
  'package-lock.json',
];

function shouldIgnore(filename) {
  if (!filename) return true;
  const normalized = filename.replace(/\\/g, '/');
  return IGNORED_PATHS.some(ignored => 
    normalized.includes(`/${ignored}/`) || 
    normalized.startsWith(`${ignored}/`) || 
    normalized === ignored ||
    normalized.endsWith('.log') ||
    normalized.endsWith('.tmp')
  );
}

function syncToGit() {
  if (isSyncing) return;
  isSyncing = true;

  try {
    const status = execSync('git status --porcelain', { cwd: ROOT_DIR, encoding: 'utf8' }).trim();
    if (!status) {
      isSyncing = false;
      return;
    }

    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    console.log(`\n⚡ [${timestamp}] Detected project save. Updating GitHub repository...`);

    execSync('git add .', { cwd: ROOT_DIR, stdio: 'pipe' });
    execSync(`git commit -m "auto: update project on save (${timestamp})"`, { cwd: ROOT_DIR, stdio: 'pipe' });
    execSync('git push origin main', { cwd: ROOT_DIR, stdio: 'pipe' });

    console.log(`✅ [${timestamp}] Successfully pushed latest changes to https://github.com/madhukumar18/ammaspastries1.git`);
  } catch (error) {
    console.error('❌ Auto-sync error:', error.message);
  } finally {
    isSyncing = false;
  }
}

function handleFileChange(eventType, filename) {
  if (shouldIgnore(filename)) return;

  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  // Debounce for 4 seconds after saving
  debounceTimer = setTimeout(() => {
    syncToGit();
  }, 4000);
}

// Watch both frontend and backend
const watchDirs = [
  path.join(ROOT_DIR, 'frontend', 'src'),
  path.join(ROOT_DIR, 'frontend', 'public'),
  path.join(ROOT_DIR, 'backend', 'app'),
  path.join(ROOT_DIR, 'backend', 'routes'),
  path.join(ROOT_DIR, 'backend', 'config'),
  path.join(ROOT_DIR, 'backend', 'database'),
];

watchDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    try {
      fs.watch(dir, { recursive: true }, (eventType, filename) => {
        handleFileChange(eventType, path.join(dir, filename || ''));
      });
      console.log(`👀 Watching directory: ${path.relative(ROOT_DIR, dir)}`);
    } catch (e) {
      console.warn(`Could not watch ${dir}:`, e.message);
    }
  }
});

// Watch root configuration files
const rootFiles = ['package.json', '.gitignore'];
rootFiles.forEach(f => {
  const fp = path.join(ROOT_DIR, f);
  if (fs.existsSync(fp)) {
    fs.watch(fp, (eventType) => handleFileChange(eventType, f));
  }
});
