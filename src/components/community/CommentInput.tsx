import { useState } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { addComment } from '@/store/communitySlice';

interface CommentInputProps {
  postId: number;
  parentCommentId?: number | null;
  onSubmitted?: () => void;
  autoFocus?: boolean;
}

/**
 * Comment text input with submit button.
 */
export function CommentInput({ postId, parentCommentId, onSubmitted, autoFocus }: CommentInputProps) {
  const dispatch = useAppDispatch();
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    setSubmitting(true);
    try {
      await dispatch(
        addComment({ postId, content: trimmed, parentCommentId: parentCommentId ?? null }),
      ).unwrap();
      setContent('');
      onSubmitted?.();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-start gap-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={parentCommentId ? 'Write a reply...' : 'Write a comment...'}
        rows={2}
        autoFocus={autoFocus}
        className="flex-1 px-3 py-2 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <button
        type="submit"
        disabled={!content.trim() || submitting}
        className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
      >
        {submitting ? '...' : 'Post'}
      </button>
    </form>
  );
}
