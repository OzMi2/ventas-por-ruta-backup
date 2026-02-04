import { getUncachableGitHubClient } from '../server/github';
import * as fs from 'fs';
import * as path from 'path';

const REPO_NAME = 'ventas-por-ruta-backup';
const IS_PRIVATE = false;

const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  '.replit',
  'replit.nix',
  '.upm',
  '.cache',
  '.config',
  'generated-icon.png',
  '.local',
  'scripts/push-to-github.ts',
  'scripts/push-backup.ts'
];

function shouldIgnore(filePath: string): boolean {
  return IGNORE_PATTERNS.some(pattern => filePath.includes(pattern));
}

function getAllFiles(dir: string, baseDir: string = dir): string[] {
  const files: string[] = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const relativePath = path.relative(baseDir, fullPath);
    
    if (shouldIgnore(relativePath)) continue;
    
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...getAllFiles(fullPath, baseDir));
    } else {
      files.push(relativePath);
    }
  }
  
  return files;
}

async function main() {
  console.log('Connecting to GitHub...');
  const octokit = await getUncachableGitHubClient();
  
  const { data: user } = await octokit.users.getAuthenticated();
  console.log(`Authenticated as: ${user.login}`);
  
  // Create or get repository
  let repoExists = false;
  try {
    await octokit.repos.get({ owner: user.login, repo: REPO_NAME });
    repoExists = true;
    console.log(`Repository ${REPO_NAME} already exists`);
  } catch (error: any) {
    if (error.status === 404) {
      console.log(`Creating repository ${REPO_NAME}...`);
      await octokit.repos.createForAuthenticatedUser({
        name: REPO_NAME,
        description: 'Backup - Ventas por Ruta PWA - Sistema de gestión de ventas y rutas',
        private: IS_PRIVATE,
        auto_init: false,
      });
      console.log('Repository created!');
    } else {
      throw error;
    }
  }

  console.log(`Repository URL: https://github.com/${user.login}/${REPO_NAME}`);

  // Initialize with README if new repo
  if (!repoExists) {
    try {
      await octokit.repos.createOrUpdateFileContents({
        owner: user.login,
        repo: REPO_NAME,
        path: 'README.md',
        message: 'Initial commit',
        content: Buffer.from(`# Ventas por Ruta PWA (Backup)\n\nBackup repository for the sales management system.`).toString('base64'),
      });
      console.log('Initialized repository with README');
    } catch (e) {
      // Ignore if already exists
    }
  }

  // Get all files
  const files = getAllFiles('.');
  console.log(`Found ${files.length} files to upload`);

  // Prepare tree
  console.log('Preparing files for commit...');
  const treeItems: any[] = [];
  
  for (const file of files) {
    const content = fs.readFileSync(file);
    const blob = await octokit.git.createBlob({
      owner: user.login,
      repo: REPO_NAME,
      content: content.toString('base64'),
      encoding: 'base64',
    });
    treeItems.push({
      path: file,
      mode: '100644',
      type: 'blob',
      sha: blob.data.sha,
    });
  }

  // Create tree
  const tree = await octokit.git.createTree({
    owner: user.login,
    repo: REPO_NAME,
    tree: treeItems,
  });
  console.log('Tree created, creating commit...');

  // Create commit
  const commit = await octokit.git.createCommit({
    owner: user.login,
    repo: REPO_NAME,
    message: `Backup: ${new Date().toISOString().split('T')[0]}`,
    tree: tree.data.sha,
  });
  console.log('Commit created, updating main branch...');

  // Update or create main branch
  try {
    await octokit.git.createRef({
      owner: user.login,
      repo: REPO_NAME,
      ref: 'refs/heads/main',
      sha: commit.data.sha,
    });
  } catch (e) {
    await octokit.git.updateRef({
      owner: user.login,
      repo: REPO_NAME,
      ref: 'heads/main',
      sha: commit.data.sha,
      force: true,
    });
  }

  console.log(`\n✅ BACKUP SUCCESS!`);
  console.log(`Repository: https://github.com/${user.login}/${REPO_NAME}`);
  console.log(`Files uploaded: ${files.length}`);
}

main().catch(console.error);
