import { useState } from 'react';
import type { Comment } from '@/types';
import { CommentInput } from './CommentInput';

interface CommentThreadProps {
  comments: Comment[];
  postId: number;
  depth?: number;
}

/**
 * Recursive comment thread component.
 * Renders nested replies with indentation and collapse/expand.
 */
export function CommentThread({ comments, postId, depth = 0 }: CommentThreadProps) {
  return (
    <div className={depth > 0 ? 'ml-6 border-l-2 border-gray-100 pl-4' : ''}>
      {comments.map((comment) => (
        <CommentNode key={comment.id} comment={comment} postId={postId} depth={depth} />
      ))}
    </div>
  );
}

function CommentNode({ comment, postId, depth }: { comment: Comment; postId: number; depth: number }) {
  const [showReply, setShowReply] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const hasReplies = comment.replies && comment.replies.length > 0;

  return (
    <div className="py-3">
      <div className="flex items-start gap-2">
        {comment.authorAvatarUrl ? (
          <img
            src={comment.authorAvatarUrl}
            alt=""
            className="w-7 h-7 rounded-full shrink-0"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center text-xs font-medium shrink-0">
            {comment.authorDisplayName?.[0]?.toUpperCase() || '?'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-gray-900">{comment.authorDisplayName}</span>
            <span className="text-xs text-gray-400">
              {new Date(comment.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p className="text-sm text-gray-700 mt-0.5 whitespace-pre-wrap">
            {comment.content}
          </p>
          <div className="flex items-center gap-3 mt-1">
            {depth < 3 && (
              <button
                onClick={() => setShowReply(!showReply)}
                className="text-xs text-gray-400 hover:text-blue-600"
              >
                Reply
              </button>
            )}
            {hasReplies && (
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                {collapsed
                  ? `Show ${comment.replies!.length} replies`
                  : 'Hide replies'}
              </button>
            )}
          </div>
        </div>
      </div>

      {showReply && (
        <div className="ml-9 mt-2">
          <CommentInput
            postId={postId}
            parentCommentId={comment.id}
            onSubmitted={() => setShowReply(false)}
            autoFocus
          />
        </div>
      )}

      {hasReplies && !collapsed && (
        <CommentThread
          comments={comment.replies!}
          postId={postId}
          depth={depth + 1}
        />
      )}
    </div>
  );
}
