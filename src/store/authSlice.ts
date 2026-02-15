import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';
import { apiClient } from '@/api/client';
import type { AuthResponse, LoginRequest, RegisterRequest, User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: Cookies.get('token') || null,
  loading: false,
  error: null,
};

export const login = createAsyncThunk<AuthResponse, LoginRequest>(
  'auth/login',
  async (credentials) => {
    return apiClient.post<AuthResponse>('/auth/login', credentials);
  },
);

export const register = createAsyncThunk<AuthResponse, RegisterRequest>(
  'auth/register',
  async (data) => {
    return apiClient.post<AuthResponse>('/auth/register', data);
  },
);

export const fetchCurrentUser = createAsyncThunk<User, void>(
  'auth/fetchCurrentUser',
  async () => {
    return apiClient.get<User>('/auth/me');
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.error = null;
      Cookies.remove('token');
    },
    clearError(state) {
      state.error = null;
    },
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
    },
    setToken(state, action: PayloadAction<string>) {
      state.token = action.payload;
      Cookies.set('token', action.payload, { expires: 1 });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        Cookies.set('token', action.payload.token, { expires: 1 });
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Login failed';
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        Cookies.set('token', action.payload.token, { expires: 1 });
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Registration failed';
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        // Token invalid, clear auth
        state.user = null;
        state.token = null;
        Cookies.remove('token');
      });
  },
});

export const { logout, clearError, setUser, setToken } = authSlice.actions;
export default authSlice.reducer;
