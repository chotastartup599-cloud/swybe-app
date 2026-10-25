import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Folder from '@/models/Folder';
import Post from '@/models/Post';
import { requireAuth, authErrorResponse, serverError } from '@/lib/apiAuth';
import { isObjectId } from '@/lib/helpers';

const MAX_POSTS_PER_FOLDER = 500;

export async function POST(req) {
  const auth = await requireAuth(req);
  if (auth.error) return authErrorResponse(auth);

  try {
    await connectDB();
    const { folderId, postId, action } = await req.json().catch(() => ({}));

    if (!isObjectId(folderId) || !isObjectId(postId)) {
      return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 });
    }

    // action: "remove" se post folder se hat jata hai (unsave). Default: save
    if (action === 'remove') {
      const updated = await Folder.findOneAndUpdate(
        { _id: folderId, userId: auth.uid },
        { $pull: { posts: postId } },
        { new: true }
      );
      if (!updated) return NextResponse.json({ success: false, error: 'Folder not found' }, { status: 404 });
      return NextResponse.json({ success: true, data: updated }, { status: 200 });
    }

    const postExists = await Post.exists({ _id: postId });
    if (!postExists) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
    }

    // Folder SIRF isi user ka hona chahiye (dusre ke folder me save nahi hoga)
    const updatedFolder = await Folder.findOneAndUpdate(
      { _id: folderId, userId: auth.uid, [`posts.${MAX_POSTS_PER_FOLDER - 1}`]: { $exists: false } },
      { $addToSet: { posts: postId } }, // $addToSet duplicate entries rokta hai
      { new: true }
    );

    if (!updatedFolder) {
      return NextResponse.json({ success: false, error: 'Folder nahi mila ya full hai.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedFolder }, { status: 200 });
  } catch (error) {
    return serverError(error, 'FolderSave');
  }
}