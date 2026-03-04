import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchPosts } from '@/store/communitySlice';
import { PostCard } from './PostCard';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

/**
 * Community feed showing shared travel plans as a card grid.
 * Supports infinite scroll with cursor-based pagination.
 */
export function CommunityFeed() {
  const dispatch = useAppDispatch();
  const { posts, loading, hasMore, cursor } = useAppSelector((s) => s.community);

  useEffect(() => {
    dispatch(fetchPosts({ cursor: null }));
  }, [dispatch]);

  const loadMore = () => {
    if (!loading && hasMore) {
      dispatch(fetchPosts({ cursor }));
    }
  };

  const sentinelRef = useInfiniteScroll(loadMore, hasMore && !loading);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/chat" className="text-xl font-bold text-blue-600">
              VoyageAI
            </Link>
            <span className="text-sm font-medium text-gray-500">Community</span>
          </div>
          <Link
            to="/chat"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Back to Chat
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {posts.length === 0 && !loading ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🌍</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No posts yet
            </h2>
            <p className="text-gray-500 mb-6">
              Be the first to share your travel plan with the community!
            </p>
            <Link
              to="/chat"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              Create a Trip
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {loading && (
          <div className="text-center py-8 text-gray-400 animate-pulse">
            Loading more...
          </div>
        )}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-1" />
      </main>
    </div>
  );
}
