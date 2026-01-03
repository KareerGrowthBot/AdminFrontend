import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../services/authService';
import { adminService } from '../../services/adminService';

// Async thunks for profile
export const fetchCurrentAdmin = createAsyncThunk(
  'profile/fetchCurrentAdmin',
  async (suppressLogging = false, { rejectWithValue }) => {
    try {
      const response = await authService.getCurrentAdmin(suppressLogging);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const updateProfile = createAsyncThunk(
  'profile/updateProfile',
  async ({ id, profileData }, { rejectWithValue }) => {
    try {
      const response = await adminService.updateAdmin(id, profileData);
      return response.admin;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

const initialState = {
  currentAdmin: null,
  loading: false,
  error: null,
  updateLoading: false
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setCurrentAdmin: (state, action) => {
      state.currentAdmin = action.payload;
    },
    clearCurrentAdmin: (state) => {
      state.currentAdmin = null;
    },
    clearProfileError: (state) => {
      state.error = null;
    },
    resetProfile: (state) => {
      return initialState;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch current admin
      .addCase(fetchCurrentAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAdmin = action.payload;
      })
      .addCase(fetchCurrentAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update profile
      .addCase(updateProfile.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.currentAdmin = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload;
      });
  }
});

export const { setCurrentAdmin, clearCurrentAdmin, clearProfileError, resetProfile } = profileSlice.actions;
export default profileSlice.reducer;

