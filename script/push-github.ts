import { getUncachableGitHubClient } from '../server/github.js';
import * as fs from 'fs';
import * as path from 'path';

const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  '.cache',
  '.config',
  '.upm',
  'attached_assets',
  '.local',
];

function shouldIgnore(filePath: string): boolean {
  for (const pattern of IGNORE_PATTERNS) {
    if (filePath.includes(pattern)) {
      return true;
    }
  }
  if (filePath.endsWith('.log')) return true;
  return false;
}

function getAllFiles(dir: string, baseDir: string = dir): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);
    
    if (shouldIgnore(relativePath)) continue;
    
    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath, baseDir));
    } else {
      files.push(relativePath);
    }
  }
  return files;
}

async function pushToRepo(repoName: string) {
  console.log(`\n🚀 Pushing to ${repoName}...`);
  const octokit = await getUncachableGitHubClient();
  
  const { data: user } = await octokit.users.getAuthenticated();
  const owner = user.login;
  console.log(`  Owner: ${owner}`);
  
  let repo;
  try {
    const { data } = await octokit.repos.get({ owner, repo: repoName });
    repo = data;
    console.log(`  Repository exists: ${repo.html_url}`);
  } catch (e: any) {
    if (e.status === 404) {
      const { data } = await octokit.repos.createForAuthenticatedUser({
        name: repoName,
        private: true,
        auto_init: true,
      });
      repo = data;
      console.log(`  Created new repository: ${repo.html_url}`);
      await new Promise(r => setTimeout(r, 2000));
    } else {
      throw e;
    }
  }
  
  let baseSha: string;
  try {
    const { data: ref } = await octokit.git.getRef({ owner, repo: repoName, ref: 'heads/main' });
    baseSha = ref.object.sha;
  } catch (e: any) {
    try {
      const { data: ref } = await octokit.git.getRef({ owner, repo: repoName, ref: 'heads/master' });
      baseSha = ref.object.sha;
    } catch {
      const { data: treeData } = await octokit.git.createTree({ owner, repo: repoName, tree: [] });
      const { data: commit } = await octokit.git.createCommit({
        owner,
        repo: repoName,
        message: 'Initial commit',
        tree: treeData.sha,
      });
      baseSha = commit.sha;
    }
  }
  
  console.log(`  Base SHA: ${baseSha.substring(0, 7)}`);
  
  const files = getAllFiles('.');
  console.log(`  Found ${files.length} files to push`);
  
  const treeItems: any[] = [];
  let processed = 0;
  for (const file of files) {
    try {
      const content = fs.readFileSync(file);
      const hasNullBytes = content.includes(0x00);
      
      const { data: blob } = await octokit.git.createBlob({
        owner,
        repo: repoName,
        content: hasNullBytes ? content.toString('base64') : content.toString('utf-8'),
        encoding: hasNullBytes ? 'base64' : 'utf-8',
      });
      
      treeItems.push({
        path: file,
        mode: '100644',
        type: 'blob',
        sha: blob.sha,
      });
      processed++;
      if (processed % 50 === 0) {
        console.log(`  Processed ${processed}/${files.length} files...`);
      }
    } catch (e) {
      // Skip problematic files silently
    }
  }
  
  console.log(`  Created ${treeItems.length} blobs`);
  
  const { data: tree } = await octokit.git.createTree({
    owner,
    repo: repoName,
    tree: treeItems,
  });
  
  const { data: commit } = await octokit.git.createCommit({
    owner,
    repo: repoName,
    message: `Update: ${new Date().toISOString().split('T')[0]} - Technical documentation added`,
    tree: tree.sha,
    parents: [baseSha],
  });
  
  try {
    await octokit.git.updateRef({
      owner,
      repo: repoName,
      ref: 'heads/main',
      sha: commit.sha,
      force: true,
    });
  } catch {
    await octokit.git.createRef({
      owner,
      repo: repoName,
      ref: 'refs/heads/main',
      sha: commit.sha,
    });
  }
  
  console.log(`  ✅ Pushed successfully to ${repo.html_url}`);
  return repo.html_url;
}

async function main() {
  console.log('Starting GitHub push to both repositories...\n');
  
  try {
    const pwaUrl = await pushToRepo('Pwa');
    const backupUrl = await pushToRepo('backup');
    
    console.log('\n========================================');
    console.log('✅ Both repositories updated successfully!');
    console.log(`   Pwa: ${pwaUrl}`);
    console.log(`   backup: ${backupUrl}`);
    console.log('========================================');
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
