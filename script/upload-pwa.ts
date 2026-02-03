import { getUncachableGitHubClient } from '../server/github';
import * as fs from 'fs';

const REPO_OWNER = 'OzMi2';
const REPO_NAME = 'ventas-por-ruta';

async function uploadFile(octokit: any, localPath: string, repoPath: string, message: string) {
  const content = fs.readFileSync(localPath);
  const base64Content = content.toString('base64');
  
  let sha: string | undefined;
  try {
    const { data } = await octokit.repos.getContent({ owner: REPO_OWNER, repo: REPO_NAME, path: repoPath });
    sha = (data as any).sha;
  } catch {}
  
  await octokit.repos.createOrUpdateFileContents({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    path: repoPath,
    message,
    content: base64Content,
    sha,
  });
  console.log(`✓ ${repoPath}`);
}

async function main() {
  const octokit = await getUncachableGitHubClient();
  
  await uploadFile(octokit, 'client/public/manifest.json', 'client/public/manifest.json', 'Add PWA manifest');
  await uploadFile(octokit, 'client/index.html', 'client/index.html', 'Add PWA meta tags');
  
  const iconSizes = ['72x72', '96x96', '128x128', '144x144', '152x152', '192x192', '384x384', '512x512'];
  for (const size of iconSizes) {
    await uploadFile(octokit, `client/public/icons/icon-${size}.png`, `client/public/icons/icon-${size}.png`, `Add PWA icon ${size}`);
  }
  
  console.log('\n✅ PWA files uploaded!');
}

main().catch(console.error);
