import { getUncachableGitHubClient } from '../server/github';
import * as fs from 'fs';
import * as path from 'path';

const REPOS = ['ventas-por-ruta-pwa', 'ventas-por-ruta-backup'];
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
  'scripts/push-to-github.ts'
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

async function pushToRepo(octokit: any, username: string, repoName: string, tree: any[]) {
  console.log(`\n📦 Pushing to ${repoName}...`);
  
  let repo;
  try {
    const { data } = await octokit.repos.get({ owner: username, repo: repoName });
    repo = data;
    console.log(`Repository ${repoName} already exists`);
  } catch (e: any) {
    if (e.status === 404) {
      const { data } = await octokit.repos.createForAuthenticatedUser({
        name: repoName,
        private: IS_PRIVATE,
        auto_init: false,
        description: 'Sistema de ventas por ruta - PWA offline-first'
      });
      repo = data;
      console.log(`Created new repository: ${repoName}`);
    } else {
      throw e;
    }
  }
  
  let parentSha: string | null = null;
  
  try {
    const { data: ref } = await octokit.git.getRef({
      owner: username,
      repo: repoName,
      ref: 'heads/main'
    });
    parentSha = ref.object.sha;
  } catch (e: any) {
    if (e.status === 404) {
      console.log('Repository is empty, creating initial commit...');
      try {
        await octokit.repos.createOrUpdateFileContents({
          owner: username,
          repo: repoName,
          path: 'README.md',
          message: 'Initial commit',
          content: Buffer.from('# Ventas por Ruta PWA\n\nSistema de ventas offline-first para vendedores de ruta.').toString('base64'),
        });
        const { data: ref } = await octokit.git.getRef({
          owner: username,
          repo: repoName,
          ref: 'heads/main'
        });
        parentSha = ref.object.sha;
      } catch (initError: any) {
        if (initError.status !== 422) throw initError;
      }
    } else {
      throw e;
    }
  }
  
  const { data: treeData } = await octokit.git.createTree({
    owner: username,
    repo: repoName,
    tree,
    base_tree: parentSha || undefined
  });
  
  console.log('Tree created, creating commit...');
  
  const { data: commit } = await octokit.git.createCommit({
    owner: username,
    repo: repoName,
    message: 'Full project upload - Ventas por Ruta PWA - ' + new Date().toISOString(),
    tree: treeData.sha,
    parents: parentSha ? [parentSha] : []
  });
  
  console.log('Commit created, updating main branch...');
  
  try {
    await octokit.git.updateRef({
      owner: username,
      repo: repoName,
      ref: 'heads/main',
      sha: commit.sha,
      force: true
    });
  } catch (e: any) {
    if (e.status === 422) {
      await octokit.git.createRef({
        owner: username,
        repo: repoName,
        ref: 'refs/heads/main',
        sha: commit.sha
      });
    } else {
      throw e;
    }
  }
  
  console.log(`✅ SUCCESS: ${repo.html_url}`);
  return repo.html_url;
}

async function main() {
  console.log('Connecting to GitHub...');
  const octokit = await getUncachableGitHubClient();
  
  const { data: user } = await octokit.users.getAuthenticated();
  console.log(`Authenticated as: ${user.login}`);
  
  const baseDir = process.cwd();
  const files = getAllFiles(baseDir);
  console.log(`Found ${files.length} files to upload`);
  
  const tree: { path: string; mode: '100644'; type: 'blob'; content: string }[] = [];
  
  for (const file of files) {
    const fullPath = path.join(baseDir, file);
    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      tree.push({
        path: file,
        mode: '100644',
        type: 'blob',
        content
      });
    } catch (e) {
      console.log(`Skipping binary or unreadable file: ${file}`);
    }
  }
  
  console.log(`Preparing ${tree.length} files for commit...`);
  
  const results: string[] = [];
  for (const repoName of REPOS) {
    try {
      const url = await pushToRepo(octokit, user.login, repoName, tree);
      results.push(url);
    } catch (err: any) {
      console.error(`❌ Error with ${repoName}:`, err.message);
    }
  }
  
  console.log('\n========================================');
  console.log('📋 SUMMARY');
  console.log('========================================');
  console.log(`Files uploaded: ${tree.length}`);
  console.log('Repositories updated:');
  results.forEach(url => console.log(`  - ${url}`));
}

main().catch(console.error);
