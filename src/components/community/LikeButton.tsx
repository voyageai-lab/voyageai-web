import { useState } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { toggleLike } from '@/store/communitySlice';

interface LikeButtonProps {
  postId: number;
  likesCount: number;
  likedByMe: boolean;
  compact?: boolean;
}

/**
 * Like button with optimistic update.
 * Immediately updates the UI and reverts on API failure.
 */
export function LikeButton({ postId, likesCount, likedByMe, compact }: LikeButtonProps) {
  const dispatch = useAppDispatch();
  const [optimisticLiked, setOptimisticLiked] = useState(likedByMe);
  const [optimisticCount, setOptimisticCount] = useState(likesCount);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Optimistic update
    const newLiked = !optimisticLiked;
    setOptimisticLiked(newLiked);
    setOptimisticCount((c) => c + (newLiked ? 1 : -1));

    try {
      await dispatch(toggleLike(postId)).unwrap();
    } catch {
      // Revert on failure
      setOptimisticLiked(!newLiked);
      setOptimisticCount((c) => c + (newLiked ? -1 : 1));
    }
  };

  if (compact) {
    return (
      <button
        onClick={handleClick}
        className="flex items-center gap-1 hover:text-red-500 transition"
      >
        <svg
          className={`w-3.5 h-3.5 ${optimisticLiked ? 'fill-red-500 text-red-500' : ''}`}
          fill={optimisticLiked ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        {optimisticCount}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition ${
        optimisticLiked
          ? 'bg-red-50 border-red-200 text-red-600'
          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
      }`}
    >
      <svg
        className={`w-4 h-4 ${optimisticLiked ? 'fill-red-500 text-red-500' : ''}`}
        fill={optimisticLiked ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
      {optimisticCount} {optimisticCount === 1 ? 'Like' : 'Likes'}
    </button>
  );
}
