'use server';

import { FileData } from './parser';

export async function fetchGithubRepo(url: string, token?: string): Promise<FileData[]> {
  try {
    // Basic regex to extract owner and repo from various github URL formats
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) throw new Error('Invalid GitHub URL');
    
    const [, owner, repo] = match;
    const cleanRepo = repo.replace('.git', '');

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let response;
    
    try {
      const treeUrlMain = `https://api.github.com/repos/${owner}/${cleanRepo}/git/trees/main?recursive=1`;
      response = await fetch(treeUrlMain, { headers });
      
      // Fallback to master if main doesn't exist
      if (response.status === 404) {
        const treeUrlMaster = `https://api.github.com/repos/${owner}/${cleanRepo}/git/trees/master?recursive=1`;
        response = await fetch(treeUrlMaster, { headers });
      }
    } catch (e: any) {
      if (e.name === 'TypeError' && e.message === 'Failed to fetch') {
        throw new Error('Network error: Could not reach GitHub API. Please check your internet connection, adblocker, or VPN/proxy settings.');
      }
      throw e;
    }

    if (!response.ok) {
      if (response.status === 404 && !token) {
        throw new Error('Repository or branch not found. If this is a private repository, please sign in first.');
      } else if (response.status === 403) {
        throw new Error('GitHub API rate limit exceeded. Please sign in to increase your rate limit.');
      }
      throw new Error(`Failed to fetch repo tree: ${response.statusText}`);
    }
    
    const treeData = await response.json();
    if (!treeData.tree) throw new Error('No tree data found');

    // 2. Fetch contents for text files (skills and scripts) in chunks to avoid hanging sockets
    const blobs = treeData.tree.filter((item: any) => item.type === 'blob');
    const results: FileData[] = [];
    const chunkSize = 25;

    for (let i = 0; i < blobs.length; i += chunkSize) {
      const chunk = blobs.slice(i, i + chunkSize);
      const chunkPromises = chunk.map(async (file: any): Promise<FileData | null> => {
        try {
          // Exclude obvious binaries
          const ext = file.path.split('.').pop()?.toLowerCase();
          const isBinary = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'pdf', 'mp4', 'ico', 'zip'].includes(ext || '');
          
          if (!isBinary) {
            const rawUrl = `https://raw.githubusercontent.com/${owner}/${cleanRepo}/main/${file.path}`;
            const contentResponse = await fetch(rawUrl, { headers });
            if (!contentResponse.ok) return { path: file.path, content: 'Failed to fetch content.' };
            const content = await contentResponse.text();
            return { path: file.path, content };
          } else {
            return { path: file.path, content: 'Binary file viewing not supported.' };
          }
        } catch (e) {
          console.error(`Failed to fetch ${file.path}`, e);
          return null;
        }
      });

      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults.filter(Boolean) as FileData[]);
    }

    return results;

  } catch (error) {
    console.error('GitHub fetch error:', error);
    throw error;
  }
}

export async function createPullRequest({
  token,
  repoUrl,
  title,
  branchName,
  stagedChanges,
}: {
  token: string;
  repoUrl: string;
  title: string;
  branchName: string;
  stagedChanges: Record<string, string>;
}): Promise<string> {
  const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) throw new Error('Invalid GitHub URL');
  
  const [, owner, repoName] = match;
  const repo = repoName.replace('.git', '');

  // Dynamic import of octokit since we don't want it to fail standard parsing in Edge runtime if not needed
  const { Octokit } = await import('@octokit/rest');
  const octokit = new Octokit({ auth: token });

  // 1. Get the default branch and its latest commit SHA
  const { data: repoData } = await octokit.repos.get({ owner, repo });
  const defaultBranch = repoData.default_branch;

  const { data: refData } = await octokit.git.getRef({
    owner,
    repo,
    ref: `heads/${defaultBranch}`,
  });
  const baseSha = refData.object.sha;

  // 2. Create Blobs for each changed file
  const treeItems = await Promise.all(
    Object.entries(stagedChanges).map(async ([path, content]) => {
      const { data: blobData } = await octokit.git.createBlob({
        owner,
        repo,
        content,
        encoding: 'utf-8',
      });
      return {
        path,
        mode: '100644' as const,
        type: 'blob' as const,
        sha: blobData.sha,
      };
    })
  );

  // 3. Create a new Tree containing the new blobs
  const { data: newTree } = await octokit.git.createTree({
    owner,
    repo,
    base_tree: baseSha,
    tree: treeItems,
  });

  // 4. Create a Commit pointing to the new Tree
  const { data: newCommit } = await octokit.git.createCommit({
    owner,
    repo,
    message: title,
    tree: newTree.sha,
    parents: [baseSha],
  });

  // 5. Create a new Branch (Reference) pointing to the new Commit
  await octokit.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branchName}`,
    sha: newCommit.sha,
  });

  // 6. Create the Pull Request
  const { data: prData } = await octokit.pulls.create({
    owner,
    repo,
    title,
    head: branchName,
    base: defaultBranch,
    body: 'Automated PR generated by Skill Atlas Editor.',
  });

  return prData.html_url;
}
