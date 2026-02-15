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
        state.user = {
          username: action.payload.username,
          email: action.payload.email,
        };
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
        state.user = {
          username: action.payload.username,
          email: action.payload.email,
        };
        Cookies.set('token', action.payload.token, { expires: 1 });
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Registration failed';
      });
  },
});

export const { logout, clearError, setUser } = authSlice.actions;
export default authSlice.reducer;
