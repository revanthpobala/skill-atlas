'use server';

import { FileData } from './parser';

export async function fetchGithubRepo(url: string, token?: string): Promise<{ success: true; data: FileData[] } | { success: false; error: string }> {
  try {
    // Basic regex to extract owner and repo from various github URL formats
    const cleanUrl = url.replace(/^https?:\/\//, '').replace(/^www\./, '');
    const match = cleanUrl.match(/^(?:github\.com\/)?([^\/]+)\/([^\/]+)/);
    if (!match) return { success: false, error: 'Invalid GitHub URL format. Use "owner/repo" or "github.com/owner/repo"' };
    
    const [, owner, repo] = match;
    const cleanRepo = repo.replace('.git', '');

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let defaultBranch = 'main';
    try {
      const repoInfoUrl = `https://api.github.com/repos/${owner}/${cleanRepo}`;
      const repoRes = await fetch(repoInfoUrl, { headers });
      
      if (!repoRes.ok) {
        if (repoRes.status === 404 && !token) {
          return { success: false, error: 'Repository not found or is private. If private, please sign in first.' };
        } else if (repoRes.status === 403) {
          return { success: false, error: 'GitHub API rate limit exceeded or access forbidden. Please sign in to increase your rate limit.' };
        }
        return { success: false, error: `Failed to fetch repository metadata: ${repoRes.statusText}` };
      }
      
      const repoData = await repoRes.json();
      defaultBranch = repoData.default_branch || 'main';
    } catch (e: any) {
      if (e.name === 'TypeError' && e.message === 'Failed to fetch') {
        return { success: false, error: 'Network error: Could not reach GitHub API. Please check your internet connection, adblocker, or VPN/proxy settings.' };
      }
      return { success: false, error: e.message || 'Network error fetching repository metadata.' };
    }

    let response;
    try {
      const treeUrl = `https://api.github.com/repos/${owner}/${cleanRepo}/git/trees/${defaultBranch}?recursive=1`;
      response = await fetch(treeUrl, { headers });
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error fetching repository tree.' };
    }

    if (!response.ok) {
      return { success: false, error: `Failed to fetch repo tree: ${response.statusText}` };
    }
    
    const treeData = await response.json();
    if (!treeData.tree) return { success: false, error: 'No tree data found in repository.' };

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

    return { success: true, data: results };

  } catch (error: any) {
    console.error('GitHub fetch error:', error);
    return { success: false, error: error.message || 'Unknown error occurred.' };
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
  const cleanUrl = repoUrl.replace(/^https?:\/\//, '').replace(/^www\./, '');
  const match = cleanUrl.match(/^(?:github\.com\/)?([^\/]+)\/([^\/]+)/);
  if (!match) throw new Error('Invalid GitHub URL format. Use "owner/repo" or "github.com/owner/repo"');
  
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
