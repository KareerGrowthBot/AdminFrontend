import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { questionSetService } from '../../services/questionSetService';

// Async thunks for question sets
export const fetchQuestionSets = createAsyncThunk(
  'questionsets/fetchQuestionSets',
  async (_, { rejectWithValue }) => {
    try {
      const response = await questionSetService.getAllQuestionSets();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const fetchQuestionSetById = createAsyncThunk(
  'questionsets/fetchQuestionSetById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await questionSetService.getQuestionSetById(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const fetchQuestionSetsByPositionId = createAsyncThunk(
  'questionsets/fetchQuestionSetsByPositionId',
  async (positionId, { rejectWithValue }) => {
    try {
      const response = await questionSetService.getQuestionSetsByPositionId(positionId);
      return { positionId, questionSets: response };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const createQuestionSet = createAsyncThunk(
  'questionsets/createQuestionSet',
  async (questionSetData, { rejectWithValue }) => {
    try {
      const response = await questionSetService.createQuestionSet(questionSetData);
      return response.questionSet || response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const updateQuestionSet = createAsyncThunk(
  'questionsets/updateQuestionSet',
  async ({ id, questionSetData }, { rejectWithValue }) => {
    try {
      const response = await questionSetService.updateQuestionSet(id, questionSetData);
      return response.questionSet || response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const deleteQuestionSet = createAsyncThunk(
  'questionsets/deleteQuestionSet',
  async (id, { rejectWithValue }) => {
    try {
      await questionSetService.deleteQuestionSet(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

const initialState = {
  questionSets: [],
  questionSetsByPosition: {}, // { positionId: [questionSets] }
  selectedQuestionSet: null,
  loading: false,
  error: null,
  createLoading: false,
  updateLoading: false,
  deleteLoading: false
};

const questionsetSlice = createSlice({
  name: 'questionsets',
  initialState,
  reducers: {
    setSelectedQuestionSet: (state, action) => {
      state.selectedQuestionSet = action.payload;
    },
    clearSelectedQuestionSet: (state) => {
      state.selectedQuestionSet = null;
    },
    clearQuestionSetsError: (state) => {
      state.error = null;
    },
    resetQuestionSets: (state) => {
      return initialState;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch question sets
      .addCase(fetchQuestionSets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuestionSets.fulfilled, (state, action) => {
        state.loading = false;
        state.questionSets = action.payload;
      })
      .addCase(fetchQuestionSets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch question set by ID
      .addCase(fetchQuestionSetById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuestionSetById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedQuestionSet = action.payload;
      })
      .addCase(fetchQuestionSetById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch question sets by position ID
      .addCase(fetchQuestionSetsByPositionId.fulfilled, (state, action) => {
        const { positionId, questionSets } = action.payload;
        state.questionSetsByPosition[positionId] = questionSets;
      })
      // Create question set
      .addCase(createQuestionSet.pending, (state) => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(createQuestionSet.fulfilled, (state, action) => {
        state.createLoading = false;
        state.questionSets.push(action.payload);
        // Also add to position-specific list if positionId exists
        if (action.payload.positionId) {
          if (!state.questionSetsByPosition[action.payload.positionId]) {
            state.questionSetsByPosition[action.payload.positionId] = [];
          }
          state.questionSetsByPosition[action.payload.positionId].push(action.payload);
        }
      })
      .addCase(createQuestionSet.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload;
      })
      // Update question set
      .addCase(updateQuestionSet.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
      })
      .addCase(updateQuestionSet.fulfilled, (state, action) => {
        state.updateLoading = false;
        const index = state.questionSets.findIndex(qs => qs.id === action.payload.id);
        if (index !== -1) {
          state.questionSets[index] = action.payload;
        }
        if (state.selectedQuestionSet?.id === action.payload.id) {
          state.selectedQuestionSet = action.payload;
        }
        // Update in position-specific list
        if (action.payload.positionId) {
          const posId = action.payload.positionId;
          if (state.questionSetsByPosition[posId]) {
            const posIndex = state.questionSetsByPosition[posId].findIndex(qs => qs.id === action.payload.id);
            if (posIndex !== -1) {
              state.questionSetsByPosition[posId][posIndex] = action.payload;
            }
          }
        }
      })
      .addCase(updateQuestionSet.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload;
      })
      // Delete question set
      .addCase(deleteQuestionSet.pending, (state) => {
        state.deleteLoading = true;
        state.error = null;
      })
      .addCase(deleteQuestionSet.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.questionSets = state.questionSets.filter(qs => qs.id !== action.payload);
        if (state.selectedQuestionSet?.id === action.payload) {
          state.selectedQuestionSet = null;
        }
        // Remove from position-specific lists
        Object.keys(state.questionSetsByPosition).forEach(posId => {
          state.questionSetsByPosition[posId] = state.questionSetsByPosition[posId].filter(
            qs => qs.id !== action.payload
          );
        });
      })
      .addCase(deleteQuestionSet.rejected, (state, action) => {
        state.deleteLoading = false;
        state.error = action.payload;
      });
  }
});

export const { setSelectedQuestionSet, clearSelectedQuestionSet, clearQuestionSetsError, resetQuestionSets } = questionsetSlice.actions;
export default questionsetSlice.reducer;

