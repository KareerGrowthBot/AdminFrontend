import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { positionService } from '../../services/positionService';

// Async thunks for positions
export const fetchPositions = createAsyncThunk(
  'positions/fetchPositions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await positionService.getAllPositions();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const fetchPositionById = createAsyncThunk(
  'positions/fetchPositionById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await positionService.getPositionById(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const createPosition = createAsyncThunk(
  'positions/createPosition',
  async (positionData, { rejectWithValue }) => {
    try {
      const response = await positionService.createPosition(positionData);
      return response.position || response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const updatePosition = createAsyncThunk(
  'positions/updatePosition',
  async ({ id, positionData }, { rejectWithValue }) => {
    try {
      const response = await positionService.updatePosition(id, positionData);
      return response.position || response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const deletePosition = createAsyncThunk(
  'positions/deletePosition',
  async (id, { rejectWithValue }) => {
    try {
      await positionService.deletePosition(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

// Position Titles
export const fetchPositionTitles = createAsyncThunk(
  'positions/fetchPositionTitles',
  async (_, { rejectWithValue }) => {
    try {
      const response = await positionService.getAllPositionTitles();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const createPositionTitle = createAsyncThunk(
  'positions/createPositionTitle',
  async (title, { rejectWithValue }) => {
    try {
      const response = await positionService.createPositionTitle(title);
      return response.positionTitle || response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const updatePositionTitle = createAsyncThunk(
  'positions/updatePositionTitle',
  async ({ id, title }, { rejectWithValue }) => {
    try {
      const response = await positionService.updatePositionTitle(id, title);
      return response.positionTitle || response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const deletePositionTitle = createAsyncThunk(
  'positions/deletePositionTitle',
  async (id, { rejectWithValue }) => {
    try {
      await positionService.deletePositionTitle(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);



const initialState = {
  positions: [],
  positionTitles: [],
  selectedPosition: null,
  loading: false,
  error: null,
  createLoading: false,
  updateLoading: false,
  deleteLoading: false
};

const positionSlice = createSlice({
  name: 'positions',
  initialState,
  reducers: {
    setSelectedPosition: (state, action) => {
      state.selectedPosition = action.payload;
    },
    clearSelectedPosition: (state) => {
      state.selectedPosition = null;
    },
    clearPositionsError: (state) => {
      state.error = null;
    },
    resetPositions: (state) => {
      return initialState;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch positions
      .addCase(fetchPositions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPositions.fulfilled, (state, action) => {
        state.loading = false;
        state.positions = action.payload;
      })
      .addCase(fetchPositions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch position by ID
      .addCase(fetchPositionById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPositionById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedPosition = action.payload;
      })
      .addCase(fetchPositionById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create position
      .addCase(createPosition.pending, (state) => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(createPosition.fulfilled, (state, action) => {
        state.createLoading = false;
        state.positions.push(action.payload);
      })
      .addCase(createPosition.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload;
      })
      // Update position
      .addCase(updatePosition.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
      })
      .addCase(updatePosition.fulfilled, (state, action) => {
        state.updateLoading = false;
        const index = state.positions.findIndex(pos => pos.id === action.payload.id);
        if (index !== -1) {
          state.positions[index] = action.payload;
        }
        if (state.selectedPosition?.id === action.payload.id) {
          state.selectedPosition = action.payload;
        }
      })
      .addCase(updatePosition.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload;
      })
      // Delete position
      .addCase(deletePosition.pending, (state) => {
        state.deleteLoading = true;
        state.error = null;
      })
      .addCase(deletePosition.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.positions = state.positions.filter(pos => pos.id !== action.payload);
        if (state.selectedPosition?.id === action.payload) {
          state.selectedPosition = null;
        }
      })
      .addCase(deletePosition.rejected, (state, action) => {
        state.deleteLoading = false;
        state.error = action.payload;
      })
      // Position Titles
      .addCase(fetchPositionTitles.fulfilled, (state, action) => {
        state.positionTitles = action.payload;
      })
      .addCase(createPositionTitle.fulfilled, (state, action) => {
        state.positionTitles.push(action.payload);
      })
      .addCase(updatePositionTitle.fulfilled, (state, action) => {
        const index = state.positionTitles.findIndex(title => title.id === action.payload.id);
        if (index !== -1) {
          state.positionTitles[index] = action.payload;
        }
      })
      .addCase(deletePositionTitle.fulfilled, (state, action) => {
        state.positionTitles = state.positionTitles.filter(title => title.id !== action.payload);
      })

  }
});

export const { setSelectedPosition, clearSelectedPosition, clearPositionsError, resetPositions } = positionSlice.actions;
export default positionSlice.reducer;

