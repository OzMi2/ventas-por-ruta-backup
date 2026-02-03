import { getUncachableGitHubClient } from '../server/github';
import * as fs from 'fs';

const REPO_OWNER = 'OzMi2';
const REPO_NAME = 'ventas-por-ruta';
const FILE_PATH = 'docs/DOCUMENTACION_COMPLETA.md';

async function main() {
  console.log('Uploading documentation...');
  const octokit = await getUncachableGitHubClient();
  const content = fs.readFileSync(FILE_PATH, 'utf-8');
  const base64Content = Buffer.from(content).toString('base64');
  
  let sha: string | undefined;
  try {
    const { data } = await octokit.repos.getContent({ owner: REPO_OWNER, repo: REPO_NAME, path: FILE_PATH });
    sha = (data as any).sha;
    console.log('File exists, updating...');
  } catch {
    console.log('File does not exist, creating...');
  }
  
  await octokit.repos.createOrUpdateFileContents({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    path: FILE_PATH,
    message: 'Add complete project documentation',
    content: base64Content,
    sha,
  });
  
  console.log('Documentation uploaded successfully!');
  console.log(`View at: https://github.com/${REPO_OWNER}/${REPO_NAME}/blob/main/${FILE_PATH}`);
}

main().catch(console.error);
