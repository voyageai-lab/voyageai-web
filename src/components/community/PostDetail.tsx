import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchPostDetail } from '@/store/communitySlice';
import { LikeButton } from './LikeButton';
import { CommentThread } from './CommentThread';
import { CommentInput } from './CommentInput';

interface PostDetailProps {
  postId: number;
}

/**
 * Full post detail view with itinerary embed and comment thread.
 */
export function PostDetail({ postId }: PostDetailProps) {
  const dispatch = useAppDispatch();
  const { currentPost, currentComments, loading } = useAppSelector((s) => s.community);

  useEffect(() => {
    dispatch(fetchPostDetail(postId));
  }, [dispatch, postId]);

  if (loading && !currentPost) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading post...</div>
      </div>
    );
  }

  if (!currentPost) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Post not found</p>
          <Link to="/community" className="text-blue-600 text-sm mt-2 inline-block">
            Back to Community
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link to="/community" className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <span className="text-xl font-bold text-blue-600">VoyageAI</span>
          <span className="text-sm text-gray-500">Community</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Post header */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {currentPost.title}
          </h1>
          {currentPost.description && (
            <p className="text-gray-600 mb-4">{currentPost.description}</p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              {currentPost.authorAvatarUrl ? (
                <img src={currentPost.authorAvatarUrl} alt="" className="w-6 h-6 rounded-full" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-medium">
                  {currentPost.authorDisplayName?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <span>{currentPost.authorDisplayName}</span>
              <span className="text-gray-300">|</span>
              <span>{new Date(currentPost.createdAt).toLocaleDateString()}</span>
            </div>

            <LikeButton
              postId={currentPost.id}
              likesCount={currentPost.likesCount}
              likedByMe={currentPost.likedByMe}
            />
          </div>
        </div>

        {/* Comments section */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Comments ({currentPost.commentsCount})
          </h2>

          <div className="mb-6">
            <CommentInput postId={postId} />
          </div>

          {currentComments.length > 0 ? (
            <CommentThread comments={currentComments} postId={postId} />
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">
              No comments yet. Be the first to comment!
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
