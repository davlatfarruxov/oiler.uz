import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '@/lib/api/axios';

export interface AuthUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  tenantId?: string;
  isTenantOwner?: boolean;
  permissions?: string[];
  assignedRole?: { id: string; name: string };
}

interface Tenant {
  id: string;
  companyName: string;
  businessEmail?: string;
  businessPhone?: string;
  address?: string;
  plan: string;
  isActive: boolean;
}

interface AuthState {
  user: AuthUser | null;
  tenant: Tenant | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
}

const getInitialState = (): AuthState => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    const tenantData = localStorage.getItem('tenant');
    return {
      user: null,
      tenant: tenantData ? JSON.parse(tenantData) : null,
      accessToken: token,
      isLoading: false,
      error: null
    };
  }
  return {
    user: null,
    tenant: null,
    accessToken: null,
    isLoading: false,
    error: null
  };
};

const initialState: AuthState = getInitialState();

function unwrapApiData(res: { data?: unknown }) {
  const b = res.data as Record<string, unknown> | undefined;
  if (b && typeof b === 'object' && 'data' in b && b.data !== undefined) {
    return b.data;
  }
  return b;
}

type AuthPayload = {
  user: AuthUser;
  tenant: Tenant;
  accessToken: string;
};

export const register = createAsyncThunk(
  'auth/register',
  async (data: {
    name: string;
    email: string;
    password: string;
    companyName: string;
    businessEmail?: string;
    businessPhone?: string;
    address?: string;
  }) => {
    const response = await api.post('/auth/register', data);
    return unwrapApiData(response) as AuthPayload;
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (data: { identifier: string; password: string }) => {
    const response = await api.post('/auth/login', data);
    return unwrapApiData(response) as AuthPayload;
  }
);

export const getProfile = createAsyncThunk('auth/profile', async () => {
  const response = await api.get('/auth/profile');
  return unwrapApiData(response) as { user: AuthUser; tenant: Tenant };
});

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  await api.post('/auth/logout');
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.tenant = null;
      state.accessToken = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('tenant');
      }
    },
    setCredentials: (state, action: PayloadAction<{ user: AuthUser; tenant?: Tenant; accessToken: string }>) => {
      state.user = action.payload.user;
      state.tenant = action.payload.tenant || null;
      state.accessToken = action.payload.accessToken;
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', action.payload.accessToken);
        if (action.payload.tenant) {
          localStorage.setItem('tenant', JSON.stringify(action.payload.tenant));
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        const p = action.payload as AuthPayload;
        state.user = p.user;
        state.tenant = p.tenant;
        state.accessToken = p.accessToken;
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', p.accessToken);
          if (p.tenant) {
            localStorage.setItem('tenant', JSON.stringify(p.tenant));
          }
        }
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Registration failed';
      })
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        const p = action.payload as AuthPayload;
        state.user = p.user;
        state.tenant = p.tenant;
        state.accessToken = p.accessToken;
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', p.accessToken);
          if (p.tenant) {
            localStorage.setItem('tenant', JSON.stringify(p.tenant));
          }
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Login failed';
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.tenant = action.payload.tenant;
        if (typeof window !== 'undefined') {
          localStorage.setItem('tenant', JSON.stringify(action.payload.tenant));
        }
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.tenant = null;
        state.accessToken = null;
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('tenant');
        }
      });
  }
});

export const { logout, setCredentials } = authSlice.actions;
export default authSlice.reducer;
