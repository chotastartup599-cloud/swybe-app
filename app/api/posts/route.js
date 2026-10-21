import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Post from '@/models/Post';
import Like from '@/models/Like';
import Folder from '@/models/Folder';
import User from '@/models/User'; // <-- Import User

export async function GET(req) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const creatorEmail = searchParams.get('creatorEmail');
    const interests = searchParams.get('interests')?.split(',') || [];
    const userId = searchParams.get('userId');
    const searchQuery = searchParams.get('search');
    const followingOnly = searchParams.get('following') === 'true'; // <-- Naya param
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = parseInt(searchParams.get('skip') || '0');
    
    let query = {};
    if (type) query.type = type;
    if (creatorEmail) query.creatorEmail = creatorEmail;

    // FOLLOWING LOGIC
    if (followingOnly && userId) {
      const currentUser = await User.findOne({ firebaseUid: userId });
      if (currentUser && currentUser.following.length > 0) {
        // Following list me UIDs hain, unhe emails me convert karo
        const followedUsers = await User.find({ firebaseUid: { $in: currentUser.following } }).select('email');
        const followedEmails = followedUsers.map(u => u.email);
        query.creatorEmail = { $in: followedEmails };
      } else {
        // Agar kisi ko follow nahi karta, toh khali result bhejo
        return NextResponse.json({ success: true, data: [] }, { status: 200 });
      }
    }

    if (type === 'story') {
      query.$or = [
        { expiresAt: { $gt: new Date() } },
        { expiresAt: null }
      ];
    }

    if (searchQuery) {
      query.$or = [
        { title: { $regex: searchQuery, $options: 'i' } },
        { caption: { $regex: searchQuery, $options: 'i' } },
        { subject: { $regex: searchQuery, $options: 'i' } },
        { creatorName: { $regex: searchQuery, $options: 'i' } },
        { tags: { $in: [new RegExp(searchQuery, 'i')] } }
      ];
    }
    
    let posts = await Post.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);

    if (interests.length > 0 && !creatorEmail && !searchQuery && type !== 'story' && !followingOnly) {
      posts = posts.sort((a, b) => {
        const aMatch = interests.includes(a.subject) || a.tags?.some(t => interests.includes(t));
        const bMatch = interests.includes(b.subject) || b.tags?.some(t => interests.includes(t));
        return bMatch - aMatch; 
      });
    }

    if (userId) {
      const userLikes = await Like.find({ userId });
      const likedPostIds = userLikes.map(like => like.postId.toString());

      const userFolders = await Folder.find({ userId });
      const savedPostIds = userFolders.flatMap(folder => folder.posts.map(p => p.toString()));

      posts = posts.map(post => ({
        ...post._doc,
        isLiked: likedPostIds.includes(post._id.toString()),
        isSaved: savedPostIds.includes(post._id.toString())
      }));
    }

    return NextResponse.json({ success: true, data: posts }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const newPost = await Post.create(body);
    return NextResponse.json({ success: true, data: newPost }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}