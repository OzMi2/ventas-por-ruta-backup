import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as path from 'path';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

async function getGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function getAllFiles(dir: string, baseDir: string = dir): { path: string; content: string; isBinary: boolean }[] {
  const files: { path: string; content: string; isBinary: boolean }[] = [];
  const ignoreDirs = ['node_modules', '.git', '.cache', '.upm', '.config', '.local', '__pycache__', '.replit'];
  const binaryExts = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.pdf', '.zip', '.tar', '.gz', '.webp'];
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);
    
    if (ignoreDirs.includes(entry.name)) continue;
    if (entry.name.startsWith('.') && entry.name !== '.well-known' && entry.name !== '.gitignore' && entry.name !== '.env.example') continue;
    if (entry.name === 'replit.nix' || entry.name === '.replit') continue;
    
    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath, baseDir));
    } else if (entry.isFile()) {
      try {
        const stats = fs.statSync(fullPath);
        if (stats.size > 25 * 1024 * 1024) continue;
        
        const isBinary = binaryExts.some(ext => entry.name.toLowerCase().endsWith(ext));
        
        if (isBinary) {
          const content = fs.readFileSync(fullPath).toString('base64');
          files.push({ path: relativePath, content, isBinary: true });
        } else {
          const content = fs.readFileSync(fullPath, 'utf-8');
          files.push({ path: relativePath, content, isBinary: false });
        }
      } catch (e) {
        console.log(`Skipping ${relativePath}: ${e}`);
      }
    }
  }
  
  return files;
}

async function pushToRepo(octokit: Octokit, owner: string, repo: string, files: { path: string; content: string; isBinary: boolean }[]) {
  console.log(`\n=== Pushing to ${owner}/${repo} ===`);
  
  let sha: string | undefined;
  let branch = 'main';
  
  try {
    const { data: ref } = await octokit.git.getRef({ owner, repo, ref: 'heads/main' });
    sha = ref.object.sha;
  } catch (e: any) {
    if (e.status === 404) {
      try {
        const { data: ref } = await octokit.git.getRef({ owner, repo, ref: 'heads/master' });
        sha = ref.object.sha;
        branch = 'master';
      } catch {
        console.log('No existing branch found');
      }
    }
  }

  console.log(`Base commit: ${sha || 'none'}, branch: ${branch}`);
  console.log(`Creating ${files.length} blobs (with rate limiting)...`);
  
  const blobs: { path: string; sha: string; mode: '100644'; type: 'blob' }[] = [];
  const batchSize = 5;
  
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    
    const batchResults = await Promise.all(
      batch.map(async (file) => {
        try {
          const { data } = await octokit.git.createBlob({
            owner,
            repo,
            content: file.content,
            encoding: file.isBinary ? 'base64' : 'utf-8',
          });
          return { path: file.path, sha: data.sha, mode: '100644' as const, type: 'blob' as const };
        } catch (e: any) {
          if (e.status === 403) {
            console.log(`Rate limited, waiting 60s...`);
            await sleep(60000);
            const { data } = await octokit.git.createBlob({
              owner,
              repo,
              content: file.content,
              encoding: file.isBinary ? 'base64' : 'utf-8',
            });
            return { path: file.path, sha: data.sha, mode: '100644' as const, type: 'blob' as const };
          }
          throw e;
        }
      })
    );
    
    blobs.push(...batchResults);
    console.log(`Progress: ${blobs.length}/${files.length} blobs`);
    
    if (i + batchSize < files.length) {
      await sleep(1000);
    }
  }

  console.log(`Created ${blobs.length} blobs, creating tree...`);

  const { data: tree } = await octokit.git.createTree({
    owner,
    repo,
    tree: blobs,
    base_tree: sha,
  });

  console.log(`Tree created: ${tree.sha}`);

  const { data: commit } = await octokit.git.createCommit({
    owner,
    repo,
    message: `Full project backup - PWA Build Ready - ${new Date().toISOString()}`,
    tree: tree.sha,
    parents: sha ? [sha] : [],
  });

  console.log(`Commit created: ${commit.sha}`);

  try {
    await octokit.git.updateRef({
      owner,
      repo,
      ref: `heads/${branch}`,
      sha: commit.sha,
      force: true,
    });
    console.log(`Updated ${branch} branch`);
  } catch {
    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branch}`,
      sha: commit.sha,
    });
    console.log(`Created ${branch} branch`);
  }

  console.log(`Successfully pushed to https://github.com/${owner}/${repo}`);
}

async function main() {
  const repos = [
    { owner: 'OzMi2', repo: 'ventas-por-ruta' },
    { owner: 'OzMi2', repo: 'ventas-por-ruta-backup' },
  ];

  console.log('Getting GitHub client...');
  const octokit = await getGitHubClient();
  
  console.log('Getting authenticated user...');
  const { data: user } = await octokit.users.getAuthenticated();
  console.log(`Authenticated as: ${user.login}`);

  console.log('\nCollecting files (excluding node_modules, .git, .cache)...');
  const files = getAllFiles('.');
  console.log(`Found ${files.length} files to push`);

  console.log('\nWaiting 90 seconds for rate limit to reset...');
  await sleep(90000);

  for (const { owner, repo } of repos) {
    try {
      await pushToRepo(octokit, owner, repo, files);
      console.log('\nWaiting 30 seconds before next repo...');
      await sleep(30000);
    } catch (e: any) {
      console.error(`Error pushing to ${owner}/${repo}:`, e.message);
    }
  }

  console.log('\n=== All done! ===');
}

main().catch(console.error);
