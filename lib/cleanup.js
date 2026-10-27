import Post from '@/models/Post';
import Comment from '@/models/Comment';
import CommentLike from '@/models/CommentLike';
import Like from '@/models/Like';
import Folder from '@/models/Folder';
import QuizAttempt from '@/models/QuizAttempt';
import PostView from '@/models/PostView';
import WatchDaily from '@/models/WatchDaily';
import User from '@/models/User';
import Report from '@/models/Report';

// Content delete hone par us par aayi open reports "resolved" ho jaati hain (history rehti hai, queue saaf)
async function resolveReports(targetType, ids, note) {
  if (!ids || ids.length === 0) return;
  await Report.updateMany(
    { targetType, targetId: { $in: ids.map(String) }, status: 'open' },
    { $set: { status: 'resolved', resolution: note, resolvedAt: new Date() } }
  );
}

// Posts delete karte waqt unse jude saare comments, likes, saves, quiz attempts bhi hat jaate hain
export async function deletePostsAndData(postIds, note = 'Content deleted') {
  if (!postIds || postIds.length === 0) return;

  const comments = await Comment.find({ postId: { $in: postIds } }).select('_id').lean();
  const commentIds = comments.map((c) => c._id);

  await Promise.all([
    commentIds.length > 0 ? CommentLike.deleteMany({ commentId: { $in: commentIds } }) : null,
    Comment.deleteMany({ postId: { $in: postIds } }),
    Like.deleteMany({ postId: { $in: postIds } }),
    QuizAttempt.deleteMany({ postId: { $in: postIds } }),
    PostView.deleteMany({ postId: { $in: postIds } }),
    Folder.updateMany({ posts: { $in: postIds } }, { $pull: { posts: { $in: postIds } } }),
    resolveReports('post', postIds, note),
    resolveReports('comment', commentIds, note),
  ]);

  await Post.deleteMany({ _id: { $in: postIds } });
}

// Ek comment delete karta hai. Main comment ho to uske saare replies bhi, aur post ka comment count sahi karta hai.
export async function deleteCommentTree(commentId, note = 'Content deleted') {
  const root = await Comment.findById(commentId).select('_id postId parentId').lean();
  if (!root) return { removedIds: [], commentsCount: null };

  const replyIds = root.parentId
    ? []
    : (await Comment.find({ parentId: root._id }).select('_id').lean()).map((c) => c._id);
  const ids = [root._id, ...replyIds];

  await Promise.all([
    CommentLike.deleteMany({ commentId: { $in: ids } }),
    resolveReports('comment', ids, note),
  ]);
  await Comment.deleteMany({ _id: { $in: ids } });

  const commentsCount = await Comment.countDocuments({ postId: root.postId });
  await Post.updateOne({ _id: root.postId }, { $set: { comments: commentsCount } });

  return { removedIds: ids.map(String), commentsCount };
}

// User ka saara data saaf karta hai (posts, comments, likes, folders, follows, reports)
export async function deleteUserData(user) {
  const uid = user.firebaseUid;

  // 1) Is user ki apni posts aur un par laga sab kuch
  const myPosts = await Post.find({
    $or: [{ creatorUid: uid }, { creatorUid: null, creatorEmail: user.email }],
  })
    .select('_id')
    .lean();
  await deletePostsAndData(myPosts.map((p) => p._id));

  // 2) Dusron ki posts par is user ke likes: count wapas ghatao
  const myLikes = await Like.find({ userId: uid }).select('postId').lean();
  if (myLikes.length > 0) {
    await Post.bulkWrite(
      myLikes.map((l) => ({
        updateOne: { filter: { _id: l.postId, likes: { $gt: 0 } }, update: { $inc: { likes: -1 } } },
      }))
    );
    await Like.deleteMany({ userId: uid });
  }

  // 3) Is user ke comments (aur unke replies): post ka comment count dobara ginta hai
  const myComments = await Comment.find({ userId: uid }).select('_id postId').lean();
  if (myComments.length > 0) {
    const rootIds = myComments.map((c) => c._id);
    const replies = await Comment.find({ parentId: { $in: rootIds } }).select('_id').lean();
    const allIds = [...rootIds, ...replies.map((r) => r._id)];
    const affectedPostIds = [...new Set(myComments.map((c) => String(c.postId)))];

    await CommentLike.deleteMany({ commentId: { $in: allIds } });
    await resolveReports('comment', allIds, 'Content deleted');
    await Comment.deleteMany({ _id: { $in: allIds } });

    for (const postId of affectedPostIds) {
      const count = await Comment.countDocuments({ postId });
      await Post.updateOne({ _id: postId }, { $set: { comments: count } });
    }
  }

  // 4) Dusron ke comments par is user ke likes
  const myCommentLikes = await CommentLike.find({ userId: uid }).select('commentId').lean();
  if (myCommentLikes.length > 0) {
    await Comment.bulkWrite(
      myCommentLikes.map((l) => ({
        updateOne: { filter: { _id: l.commentId, likes: { $gt: 0 } }, update: { $inc: { likes: -1 } } },
      }))
    );
    await CommentLike.deleteMany({ userId: uid });
  }

  // 5) Baaki personal data (is user ki bheji hui reports aur is user par aayi profile reports bhi)
  await Promise.all([
    Folder.deleteMany({ userId: uid }),
    QuizAttempt.deleteMany({ userId: uid }),
    PostView.deleteMany({ userId: uid }),
    WatchDaily.deleteMany({ userId: uid }),
    Report.deleteMany({ reporterUid: uid }),
    Report.deleteMany({ targetType: 'user', targetId: uid }),
  ]);

  // 6) Followers/following lists se is user ko hatao
  await Promise.all([
    User.updateMany({ followers: uid }, { $pull: { followers: uid } }),
    User.updateMany({ following: uid }, { $pull: { following: uid } }),
  ]);
}