import { useParams } from 'react-router-dom';
import { PostDetail } from '@/components/community/PostDetail';

/**
 * Single community post detail page.
 */
export function PostPage() {
  const { postId } = useParams<{ postId: string }>();
  if (!postId) return null;
  return <PostDetail postId={Number(postId)} />;
}
