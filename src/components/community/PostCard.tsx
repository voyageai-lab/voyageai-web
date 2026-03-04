import { Link } from 'react-router-dom';
import type { CommunityPost } from '@/types';
import { LikeButton } from './LikeButton';

interface PostCardProps {
  post: CommunityPost;
}

/**
 * Card component for a community post in the feed.
 */
export function PostCard({ post }: PostCardProps) {
  return (
    <Link
      to={`/community/${post.id}`}
      className="block bg-white rounded-xl shadow-sm border hover:shadow-md transition overflow-hidden"
    >
      {/* Cover image */}
      {post.coverImageUrl ? (
        <img
          src={post.coverImageUrl}
          alt=""
          className="w-full h-40 object-cover"
        />
      ) : (
        <div className="w-full h-40 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <span className="text-4xl">✈️</span>
        </div>
      )}

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
          {post.title}
        </h3>
        {post.description && (
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">
            {post.description}
          </p>
        )}

        {/* Author + stats */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-2">
            {post.authorAvatarUrl ? (
              <img
                src={post.authorAvatarUrl}
                alt=""
                className="w-5 h-5 rounded-full"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-medium">
                {post.authorDisplayName?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <span>{post.authorDisplayName}</span>
          </div>

          <div className="flex items-center gap-3">
            <LikeButton
              postId={post.id}
              likesCount={post.likesCount}
              likedByMe={post.likedByMe}
              compact
            />
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {post.commentsCount}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
