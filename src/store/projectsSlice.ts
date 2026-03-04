import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '@/api/client';
import type { Project, ShareResponse } from '@/types';

interface ProjectsState {
  projects: Project[];
  activeProjectId: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: ProjectsState = {
  projects: [],
  activeProjectId: null,
  loading: false,
  error: null,
};

export const fetchProjects = createAsyncThunk<Project[], void>(
  'projects/fetchAll',
  async () => {
    return apiClient.get<Project[]>('/projects');
  },
);

export const deleteProject = createAsyncThunk<string, string>(
  'projects/delete',
  async (projectId) => {
    await apiClient.delete(`/projects/${projectId}`);
    return projectId;
  },
);

export const renameProject = createAsyncThunk<
  Project,
  { projectId: string; title: string }
>('projects/rename', async ({ projectId, title }) => {
  return apiClient.put<Project>(`/projects/${projectId}`, { title });
});

export const shareProject = createAsyncThunk<
  ShareResponse,
  string
>('projects/share', async (projectId) => {
  return apiClient.post<ShareResponse>(`/projects/${projectId}/share`);
});

export const revokeShare = createAsyncThunk<
  string,
  string
>('projects/revokeShare', async (projectId) => {
  await apiClient.delete(`/projects/${projectId}/share`);
  return projectId;
});

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setActiveProject(state, action: PayloadAction<string | null>) {
      state.activeProjectId = action.payload;
    },
    addProject(state, action: PayloadAction<Project>) {
      // Add to front of list (most recent first)
      state.projects.unshift(action.payload);
    },
    clearProjects(state) {
      state.projects = [];
      state.activeProjectId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load projects';
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.projects = state.projects.filter(
          (p) => p.projectId !== action.payload,
        );
        if (state.activeProjectId === action.payload) {
          state.activeProjectId = null;
        }
      })
      .addCase(renameProject.fulfilled, (state, action) => {
        const idx = state.projects.findIndex(
          (p) => p.projectId === action.payload.projectId,
        );
        if (idx !== -1) {
          state.projects[idx] = action.payload;
        }
      })
      .addCase(shareProject.fulfilled, (state, action) => {
        const idx = state.projects.findIndex(
          (p) => p.projectId === action.payload.projectId,
        );
        if (idx !== -1) {
          state.projects[idx].visibility = action.payload.visibility as Project['visibility'];
          state.projects[idx].shareToken = action.payload.shareToken;
        }
      })
      .addCase(revokeShare.fulfilled, (state, action) => {
        const idx = state.projects.findIndex(
          (p) => p.projectId === action.payload,
        );
        if (idx !== -1) {
          state.projects[idx].visibility = 'PRIVATE';
          state.projects[idx].shareToken = null;
        }
      });
  },
});

export const { setActiveProject, addProject, clearProjects } =
  projectsSlice.actions;
export default projectsSlice.reducer;
