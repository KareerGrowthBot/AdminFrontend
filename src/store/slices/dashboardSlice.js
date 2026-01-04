import { createSlice } from '@reduxjs/toolkit';
import { fetchCredits, fetchJobRoles } from './dashboardThunks';

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
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
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
      });
  },
});

export default dashboardSlice.reducer;
