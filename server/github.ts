// GitHub integration using Replit connector
import { Octokit } from '@octokit/rest'

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
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

export async function getUncachableGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

export async function pushToGitHub(repoName: string, isPrivate: boolean = true) {
  const octokit = await getUncachableGitHubClient();
  
  const { data: user } = await octokit.users.getAuthenticated();
  const owner = user.login;
  
  let repo;
  try {
    const { data } = await octokit.repos.get({ owner, repo: repoName });
    repo = data;
    console.log(`Repository ${repoName} already exists`);
  } catch (e: any) {
    if (e.status === 404) {
      const { data } = await octokit.repos.createForAuthenticatedUser({
        name: repoName,
        private: isPrivate,
        auto_init: false,
      });
      repo = data;
      console.log(`Created new repository: ${repoName}`);
    } else {
      throw e;
    }
  }
  
  return {
    owner,
    repoName,
    cloneUrl: repo.clone_url,
    htmlUrl: repo.html_url,
  };
}
