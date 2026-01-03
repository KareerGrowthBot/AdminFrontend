import { createSlice } from '@reduxjs/toolkit';
import { fetchCredits, fetchJobRoles, fetchPositionRecommendationStats } from './dashboardThunks';

const initialState = {
  credits: {
    data: null,
    loading: false,
    error: null,
  },
  jobRoles: {
    data: [],
    loading: false,
    error: null,
  },
  recommendationStats: {
    data: null,
    loading: false,
    error: null,
  },
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    resetRecommendationStats: (state) => {
      state.recommendationStats.data = null;
      state.recommendationStats.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCredits.pending, (state) => {
        state.credits.loading = true;
        state.credits.error = null;
      })
      .addCase(fetchCredits.fulfilled, (state, action) => {
        state.credits.loading = false;
        state.credits.data = action.payload;
        state.credits.error = null;
      })
      .addCase(fetchCredits.rejected, (state, action) => {
        state.credits.loading = false;
        state.credits.error = action.payload;
        state.credits.data = null;
      })
      .addCase(fetchJobRoles.pending, (state) => {
        state.jobRoles.loading = true;
        state.jobRoles.error = null;
      })
      .addCase(fetchJobRoles.fulfilled, (state, action) => {
        state.jobRoles.loading = false;
        if (Array.isArray(action.payload)) {
          state.jobRoles.data = action.payload;
        } else {
          state.jobRoles.data = [];
        }
        state.jobRoles.error = null;
      })
      .addCase(fetchJobRoles.rejected, (state, action) => {
        state.jobRoles.loading = false;
        state.jobRoles.error = action.payload;
        state.jobRoles.data = [];
      })
      .addCase(fetchPositionRecommendationStats.pending, (state) => {
        state.recommendationStats.loading = true;
        state.recommendationStats.error = null;
      })
      .addCase(fetchPositionRecommendationStats.fulfilled, (state, action) => {
        state.recommendationStats.loading = false;
        state.recommendationStats.data = action.payload;
      })
      .addCase(fetchPositionRecommendationStats.rejected, (state, action) => {
        state.recommendationStats.loading = false;
        state.recommendationStats.error = action.payload;
        state.recommendationStats.data = null;
      });
  },
});

export const { resetRecommendationStats } = dashboardSlice.actions;
export default dashboardSlice.reducer;
