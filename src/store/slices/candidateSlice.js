import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { candidateService } from '../../services/candidateService';

// Async thunks for candidates
export const fetchCandidates = createAsyncThunk(
  'candidates/fetchCandidates',
  async (_, { rejectWithValue }) => {
    try {
      const response = await candidateService.getAllCandidates();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const fetchCandidateByEmail = createAsyncThunk(
  'candidates/fetchCandidateByEmail',
  async (email, { rejectWithValue }) => {
    try {
      const response = await candidateService.getCandidateByEmail(email);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const createCandidateInvitation = createAsyncThunk(
  'candidates/createInvitation',
  async (email, { rejectWithValue }) => {
    try {
      const response = await candidateService.createCandidateInvitation(email);
      return response.candidate;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

const initialState = {
  candidates: [],
  selectedCandidate: null,
  loading: false,
  error: null,
  createLoading: false
};

const candidateSlice = createSlice({
  name: 'candidates',
  initialState,
  reducers: {
    setSelectedCandidate: (state, action) => {
      state.selectedCandidate = action.payload;
    },
    clearSelectedCandidate: (state) => {
      state.selectedCandidate = null;
    },
    clearCandidatesError: (state) => {
      state.error = null;
    },
    resetCandidates: (state) => {
      return initialState;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch candidates
      .addCase(fetchCandidates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCandidates.fulfilled, (state, action) => {
        state.loading = false;
        state.candidates = action.payload;
      })
      .addCase(fetchCandidates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch candidate by email
      .addCase(fetchCandidateByEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCandidateByEmail.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedCandidate = action.payload;
      })
      .addCase(fetchCandidateByEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create candidate invitation
      .addCase(createCandidateInvitation.pending, (state) => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(createCandidateInvitation.fulfilled, (state, action) => {
        state.createLoading = false;
        if (action.payload) {
          state.candidates.push(action.payload);
        }
      })
      .addCase(createCandidateInvitation.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload;
      });
  }
});

export const { setSelectedCandidate, clearSelectedCandidate, clearCandidatesError, resetCandidates } = candidateSlice.actions;
export default candidateSlice.reducer;

