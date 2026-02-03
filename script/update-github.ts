import { getUncachableGitHubClient } from '../server/github';
import * as fs from 'fs';

const REPO_OWNER = 'OzMi2';
const REPO_NAME = 'ventas-por-ruta';

async function uploadFile(octokit: any, path: string, message: string) {
  const content = fs.readFileSync(path, 'utf-8');
  const base64Content = Buffer.from(content).toString('base64');
  
  let sha: string | undefined;
  try {
    const { data } = await octokit.repos.getContent({ owner: REPO_OWNER, repo: REPO_NAME, path });
    sha = (data as any).sha;
    console.log(`Updating ${path}...`);
  } catch {
    console.log(`Creating ${path}...`);
  }
  
  await octokit.repos.createOrUpdateFileContents({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    path,
    message,
    content: base64Content,
    sha,
  });
  console.log(`✓ ${path} uploaded`);
}

async function main() {
  const octokit = await getUncachableGitHubClient();
  
  await uploadFile(octokit, 'nixpacks.toml', 'Configure Nixpacks for Node.js 20');
  await uploadFile(octokit, '.node-version', 'Specify Node.js 20 version');
  await uploadFile(octokit, 'package-lock.json', 'Update package-lock.json');
  
  console.log('\n✅ All files uploaded to GitHub!');
  console.log('Now redeploy in Railway.');
}

main().catch(console.error);
