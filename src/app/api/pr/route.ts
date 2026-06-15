import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { createPullRequest } from '@/lib/github';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // @ts-ignore
    if (!session || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in with GitHub.' }, { status: 401 });
    }

    const { repoUrl, title, branchName, stagedChanges } = await req.json();

    if (!repoUrl || !title || !branchName || !stagedChanges) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // @ts-ignore
    const token = session.accessToken;

    const prUrl = await createPullRequest({
      token,
      repoUrl,
      title,
      branchName,
      stagedChanges
    });

    return NextResponse.json({ url: prUrl });
  } catch (error: any) {
    console.error('Failed to create PR API:', error);
    return NextResponse.json({ error: error.message || 'Failed to create PR' }, { status: 500 });
  }
}
