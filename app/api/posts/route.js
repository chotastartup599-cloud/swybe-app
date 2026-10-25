import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Post from '@/models/Post';
import Like from '@/models/Like';
import Folder from '@/models/Folder';
import User from '@/models/User';
import QuizAttempt from '@/models/QuizAttempt';
import {
  getAuthUser,
  requireDbUser,
  authErrorResponse,
  serverError,
  cleanText,
  cleanList,
  isApprovedCreator,
} from '@/lib/apiAuth';
import { escapeRegex, stripQuizAnswer, isObjectId } from '@/lib/helpers';

const POST_TYPES = ['feed', 'reel', 'story', 'quiz'];
const MAX_LIMIT = 20;
const HOUR_MS = 60 * 60 * 1000;
const MAX_POSTS_PER_HOUR = 20;

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'okuevkuf';
const MEDIA_PREFIX = `https://res.cloudinary.com/${CLOUD_NAME}/`;

// Text post ke background sirf yehi allowed (upload page + dashboard share)
const ALLOWED_BACKGROUNDS = [
  'bg-gradient-to-tr from-pink-500 to-yellow-500',
  'bg-gradient-to-tr from-blue-600 to-purple-600',
  'bg-gradient-to-tr from-green-400 to-blue-500',
  'bg-gradient-to-tr from-orange-400 to-red-500',
  'bg-gradient-to-tr from-orange-500 to-red-500',
  'bg-gradient-to-tr from-yellow-400 to-orange-500',
  'bg-black',
];

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const postId = searchParams.get('id');
    const excludeTypes = (searchParams.get('excludeTypes') || '')
      .split(',')
      .map((t) => t.trim())
      .filter((t) => POST_TYPES.includes(t));
    const creatorUid = cleanText(searchParams.get('creatorUid') || '', 128);
    const subject = cleanText(searchParams.get('subject') || '', 40);
    const interests = (searchParams.get('interests') || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 20);
    const searchQuery = cleanText(searchParams.get('search') || '', 50);
    const followingOnly = searchParams.get('following') === 'true';
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '10', 10) || 10, 1), MAX_LIMIT);
    const skip = Math.min(Math.max(parseInt(searchParams.get('skip') || '0', 10) || 0, 0), 5000);

    // Viewer ki pehchaan SIRF token se (query ke userId par bharosa nahi)
    const viewer = await getAuthUser(req);
    const viewerUid = viewer ? viewer.uid : null;

    const query = {};
    const and = [];
    const now = new Date();

    // Share link: ek specific post
    if (postId) {
      if (!isObjectId(postId)) {
        return NextResponse.json({ success: false, error: 'Invalid post id' }, { status: 400 });
      }
      query._id = postId;
    }

    if (type) {
      if (!POST_TYPES.includes(type)) {
        return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
      }
      query.type = type;
    } else if (excludeTypes.length > 0) {
      query.type = { $nin: excludeTypes };
    }

    // Subject filter server par (pehle client page ke 10 posts me se chhaanta tha)
    if (subject) {
      and.push({ subject: { $regex: `^${escapeRegex(subject)}$`, $options: 'i' } });
    }

    // Kisi creator ki posts: nayi posts creatorUid se, purani posts (jinme uid nahi) email se match hoti hain.
    // Email client ko kabhi nahi jaati, server andar hi match karta hai.
    if (creatorUid) {
      const creator = await User.findOne({ firebaseUid: creatorUid }).select('email').lean();
      const creatorFilters = [{ creatorUid }];
      if (creator?.email) creatorFilters.push({ creatorUid: null, creatorEmail: creator.email });
      and.push({ $or: creatorFilters });
    }

    // Expired stories kabhi nahi dikhengi (search me bhi nahi)
    if (type === 'story') {
      and.push({ $or: [{ expiresAt: { $gt: now } }, { expiresAt: null }] });
    } else if (!type) {
      and.push({ $or: [{ type: { $ne: 'story' } }, { expiresAt: { $gt: now } }, { expiresAt: null }] });
    }

    // Following feed
    if (followingOnly) {
      if (!viewerUid) {
        return NextResponse.json({ success: true, data: [] }, { status: 200 });
      }
      const me = await User.findOne({ firebaseUid: viewerUid }).select('following').lean();
      const following = me?.following || [];
      if (following.length === 0) {
        return NextResponse.json({ success: true, data: [] }, { status: 200 });
      }
      const followedUsers = await User.find({ firebaseUid: { $in: following } }).select('email').lean();
      const emails = followedUsers.map((u) => u.email).filter(Boolean);
      and.push({ $or: [{ creatorUid: { $in: following } }, { creatorEmail: { $in: emails } }] });
    }

    // Search: user ka text escape hota hai, to invalid regex se crash nahi hoga
    if (searchQuery) {
      const rx = { $regex: escapeRegex(searchQuery), $options: 'i' };
      and.push({
        $or: [{ title: rx }, { caption: rx }, { subject: rx }, { creatorName: rx }, { tags: rx }],
      });
    }

    if (and.length > 0) query.$and = and;

    let posts = await Post.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    if (interests.length > 0 && !postId && !creatorUid && !searchQuery && type !== 'story' && !followingOnly) {
      posts = posts.sort((a, b) => {
        const aMatch = interests.includes(a.subject) || (a.tags || []).some((t) => interests.includes(t));
        const bMatch = interests.includes(b.subject) || (b.tags || []).some((t) => interests.includes(t));
        return bMatch - aMatch;
      });
    }

    // Creator ki taaza info (naam, photo, uid): purani posts me uid nahi hota, wo email se milta hai
    const uidSet = new Set();
    const emailSet = new Set();
    posts.forEach((p) => {
      if (p.creatorUid) uidSet.add(p.creatorUid);
      else if (p.creatorEmail) emailSet.add(p.creatorEmail);
    });

    const lookups = [];
    if (uidSet.size > 0) lookups.push({ firebaseUid: { $in: [...uidSet] } });
    if (emailSet.size > 0) lookups.push({ email: { $in: [...emailSet] } });

    const creators = lookups.length > 0
      ? await User.find({ $or: lookups }).select('firebaseUid email name photoURL').lean()
      : [];
    const byUid = new Map(creators.map((u) => [u.firebaseUid, u]));
    const byEmail = new Map(creators.map((u) => [u.email, u]));

    // isLiked / isSaved / quiz attempt: sirf is page ke posts ke liye
    const postIds = posts.map((p) => p._id);
    const likedSet = new Set();
    const savedSet = new Set();
    const attempts = new Map();

    if (viewerUid && postIds.length > 0) {
      const quizIds = posts.filter((p) => p.type === 'quiz').map((p) => p._id);
      const [likes, folders, tries] = await Promise.all([
        Like.find({ userId: viewerUid, postId: { $in: postIds } }).select('postId').lean(),
        Folder.find({ userId: viewerUid, posts: { $in: postIds } }).select('posts').lean(),
        quizIds.length > 0
          ? QuizAttempt.find({ userId: viewerUid, postId: { $in: quizIds } }).lean()
          : Promise.resolve([]),
      ]);
      likes.forEach((l) => likedSet.add(String(l.postId)));
      folders.forEach((f) => (f.posts || []).forEach((pid) => savedSet.add(String(pid))));
      tries.forEach((t) => attempts.set(String(t.postId), t));
    }

    const data = posts.map((post) => {
      const out = stripQuizAnswer(post); // sahi jawab client ko nahi jayega

      const creator = post.creatorUid ? byUid.get(post.creatorUid) : byEmail.get(post.creatorEmail);
      out.creatorUid = post.creatorUid || creator?.firebaseUid || null;
      out.creatorName = creator?.name || post.creatorName;
      out.creatorPhotoURL = creator?.photoURL || '';
      delete out.creatorEmail; // email public API se kabhi nahi jayegi

      if (viewerUid) {
        out.isLiked = likedSet.has(String(post._id));
        out.isSaved = savedSet.has(String(post._id));
      }
      if (post.type === 'quiz' && post.quizData) {
        const attempt = attempts.get(String(post._id));
        if (attempt) {
          // Jawab dene ke BAAD hi sahi option dikhta hai
          out.quizAttempt = {
            selectedIndex: attempt.selectedIndex,
            isCorrect: attempt.isCorrect,
            correctOptionIndex: post.quizData.correctOptionIndex,
            xpAwarded: attempt.xpAwarded,
          };
        }
      }
      return out;
    });

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    return serverError(error, 'PostsGet');
  }
}

export async function POST(req) {
  const auth = await requireDbUser(req);
  if (auth.error) return authErrorResponse(auth);

  try {
    const body = await req.json().catch(() => ({}));
    const user = auth.user;
    const type = body.type;

    if (!POST_TYPES.includes(type)) {
      return NextResponse.json({ success: false, error: 'Invalid post type.' }, { status: 400 });
    }

    // Feed / Reel / Quiz sirf approved Master (ya admin). Story ke liye real account chahiye.
    const isCreator = isApprovedCreator(user);
    if (type === 'story') {
      if (auth.isAnonymous) {
        return NextResponse.json({ success: false, error: 'Story ke liye guest nahi, real account se login karo.' }, { status: 403 });
      }
    } else if (!isCreator) {
      return NextResponse.json({ success: false, error: 'Sirf approved Master hi Post, Reel ya Quiz bana sakta hai.' }, { status: 403 });
    }

    // Spam rokne ke liye: ek ghante me max 20 posts
    const recent = await Post.countDocuments({
      creatorUid: auth.uid,
      createdAt: { $gte: new Date(Date.now() - HOUR_MS) },
    });
    if (recent >= MAX_POSTS_PER_HOUR) {
      return NextResponse.json({ success: false, error: 'Bahut zyada posts. Thodi der baad try karo.' }, { status: 429 });
    }

    const title = cleanText(body.title, 100);
    if (!title) {
      return NextResponse.json({ success: false, error: 'Title required hai.' }, { status: 400 });
    }
    const caption = cleanText(body.caption, 2000, true);
    const isTextPost = body.isTextPost === true && (type === 'feed' || type === 'story');

    let mediaUrls = [];
    if (!isTextPost && type !== 'quiz') {
      mediaUrls = Array.isArray(body.mediaUrls)
        ? body.mediaUrls
            .filter((u) => typeof u === 'string' && u.startsWith(MEDIA_PREFIX) && u.length <= 500)
            .slice(0, 10)
        : [];
      if (mediaUrls.length === 0) {
        return NextResponse.json({ success: false, error: 'Media upload nahi hua. Dobara try karo.' }, { status: 400 });
      }
      if (type === 'reel') mediaUrls = mediaUrls.slice(0, 1);
    }

    if (isTextPost && !caption) {
      return NextResponse.json({ success: false, error: 'Text post me kuch likho.' }, { status: 400 });
    }

    let quizData;
    if (type === 'quiz') {
      const q = body.quizData || {};
      const question = cleanText(q.question, 300);
      const options = Array.isArray(q.options) ? q.options.map((o) => cleanText(o, 150)) : [];
      const correctOptionIndex = Number.isInteger(q.correctOptionIndex) ? q.correctOptionIndex : -1;
      if (
        !question ||
        options.length < 2 ||
        options.length > 6 ||
        options.some((o) => !o) ||
        correctOptionIndex < 0 ||
        correctOptionIndex >= options.length
      ) {
        return NextResponse.json({ success: false, error: 'Question aur saare options bharo, aur sahi option chuno.' }, { status: 400 });
      }
      quizData = { question, options, correctOptionIndex };
    }

    // Story ka expiry server decide karta hai: learner max 24h, creator max 30 din
    let expiresAt;
    if (type === 'story') {
      const maxMs = (isCreator ? 30 * 24 : 24) * HOUR_MS;
      const requested = body.expiresAt ? new Date(body.expiresAt).getTime() : NaN;
      let ms = Number.isFinite(requested) ? requested - Date.now() : 24 * HOUR_MS;
      ms = Math.min(Math.max(ms, HOUR_MS), maxMs);
      expiresAt = new Date(Date.now() + ms);
    }

    const backgroundColor = isTextPost
      ? (ALLOWED_BACKGROUNDS.includes(body.backgroundColor) ? body.backgroundColor : 'bg-black')
      : '';

    const newPost = await Post.create({
      title,
      caption,
      type,
      mediaUrls,
      // Creator ki pehchaan token/DB se, body se nahi
      creatorUid: auth.uid,
      creatorName: user.name,
      creatorEmail: user.email,
      instagramHandle: cleanText(body.instagramHandle, 40).replace(/[^A-Za-z0-9._@]/g, ''),
      isTextPost,
      backgroundColor,
      subject: cleanText(body.subject, 40).replace(/[.$]/g, '') || 'General',
      classLevel: cleanText(body.classLevel, 30) || 'General',
      tags: cleanList(body.tags, 10, 30),
      expiresAt,
      quizData,
    });

    return NextResponse.json({ success: true, data: stripQuizAnswer(newPost) }, { status: 201 });
  } catch (error) {
    return serverError(error, 'PostsCreate');
  }
}