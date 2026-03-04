import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '@/api/client';
import type { CommunityPost, Comment } from '@/types';

interface CommunityState {
  posts: CommunityPost[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  cursor: string | null;
  currentPost: CommunityPost | null;
  currentComments: Comment[];
}

const initialState: CommunityState = {
  posts: [],
  loading: false,
  error: null,
  hasMore: true,
  cursor: null,
  currentPost: null,
  currentComments: [],
};

interface FetchPostsResponse {
  posts: CommunityPost[];
  nextCursor: string | null;
}

export const fetchPosts = createAsyncThunk<
  FetchPostsResponse,
  { cursor: string | null }
>('community/fetchPosts', async ({ cursor }) => {
  const params = cursor ? `?cursor=${cursor}` : '';
  return apiClient.get<FetchPostsResponse>(`/community/posts${params}`);
});

export const fetchPostDetail = createAsyncThunk<
  { post: CommunityPost; comments: Comment[] },
  number
>('community/fetchPostDetail', async (postId) => {
  const [post, comments] = await Promise.all([
    apiClient.get<CommunityPost>(`/community/posts/${postId}`),
    apiClient.get<Comment[]>(`/community/posts/${postId}/comments`),
  ]);
  return { post, comments };
});

export const toggleLike = createAsyncThunk<
  { postId: number; liked: boolean },
  number
>('community/toggleLike', async (postId) => {
  return apiClient.post<{ postId: number; liked: boolean }>(
    `/community/posts/${postId}/like`,
  );
});

export const addComment = createAsyncThunk<
  Comment,
  { postId: number; content: string; parentCommentId: number | null }
>('community/addComment', async ({ postId, content, parentCommentId }) => {
  return apiClient.post<Comment>(`/community/posts/${postId}/comments`, {
    content,
    parentCommentId,
  });
});

export const createPost = createAsyncThunk<
  CommunityPost,
  { projectId: string; title: string; description?: string }
>('community/createPost', async (body) => {
  return apiClient.post<CommunityPost>('/community/posts', body);
});

const communitySlice = createSlice({
  name: 'community',
  initialState,
  reducers: {
    resetCommunity(state) {
      Object.assign(state, initialState);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch posts (paginated)
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.loading = false;
        const { posts, nextCursor } = action.payload;
        // If first page, replace; otherwise append
        if (!action.meta.arg.cursor) {
          state.posts = posts;
        } else {
          state.posts.push(...posts);
        }
        state.cursor = nextCursor;
        state.hasMore = nextCursor !== null;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load posts';
      })

      // Post detail
      .addCase(fetchPostDetail.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPostDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPost = action.payload.post;
        state.currentComments = action.payload.comments;
      })

      // Toggle like (optimistic handled in component, update store on success)
      .addCase(toggleLike.fulfilled, (state, action) => {
        const { postId, liked } = action.payload;
        const delta = liked ? 1 : -1;
        const idx = state.posts.findIndex((p) => p.id === postId);
        if (idx !== -1) {
          state.posts[idx].likesCount += delta;
          state.posts[idx].likedByMe = liked;
        }
        if (state.currentPost?.id === postId) {
          state.currentPost.likesCount += delta;
          state.currentPost.likedByMe = liked;
        }
      })

      // Add comment
      .addCase(addComment.fulfilled, (state, action) => {
        const comment = action.payload;
        if (comment.parentCommentId) {
          // Nested reply -- add to parent's replies array
          const addReply = (comments: Comment[]): boolean => {
            for (const c of comments) {
              if (c.id === comment.parentCommentId) {
                if (!c.replies) c.replies = [];
                c.replies.push(comment);
                return true;
              }
              if (c.replies && addReply(c.replies)) return true;
            }
            return false;
          };
          addReply(state.currentComments);
        } else {
          state.currentComments.push(comment);
        }
        if (state.currentPost) {
          state.currentPost.commentsCount += 1;
        }
      })

      // Create post
      .addCase(createPost.fulfilled, (state, action) => {
        state.posts.unshift(action.payload);
      });
  },
});

export const { resetCommunity } = communitySlice.actions;
export default communitySlice.reducer;
