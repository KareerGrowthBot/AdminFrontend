import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { adminService } from '../../services/adminService';

// Async thunks for users
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminService.getAllAdmins();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const fetchUsersByOrganization = createAsyncThunk(
  'users/fetchUsersByOrganization',
  async (organizationId, { rejectWithValue }) => {
    try {
      const response = await adminService.getUsersByOrganizationId(organizationId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const createUser = createAsyncThunk(
  'users/createUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await adminService.createAdmin(userData);
      return response.admin;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const updateUser = createAsyncThunk(
  'users/updateUser',
  async ({ id, userData }, { rejectWithValue }) => {
    try {
      const response = await adminService.updateAdmin(id, userData);
      return response.admin;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const deleteUser = createAsyncThunk(
  'users/deleteUser',
  async (id, { rejectWithValue }) => {
    try {
      await adminService.deleteAdmin(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const activateUser = createAsyncThunk(
  'users/activateUser',
  async (id, { rejectWithValue }) => {
    try {
      const response = await adminService.activateAdmin(id);
      return response.admin;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const deactivateUser = createAsyncThunk(
  'users/deactivateUser',
  async (id, { rejectWithValue }) => {
    try {
      const response = await adminService.deactivateAdmin(id);
      return response.admin;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

const initialState = {
  users: [],
  selectedUser: null,
  loading: false,
  error: null,
  createLoading: false,
  updateLoading: false,
  deleteLoading: false
};

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setSelectedUser: (state, action) => {
      state.selectedUser = action.payload;
    },
    clearSelectedUser: (state) => {
      state.selectedUser = null;
    },
    clearUsersError: (state) => {
      state.error = null;
    },
    resetUsers: (state) => {
      return initialState;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch users by organization
      .addCase(fetchUsersByOrganization.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsersByOrganization.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsersByOrganization.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create user
      .addCase(createUser.pending, (state) => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.createLoading = false;
        state.users.push(action.payload);
      })
      .addCase(createUser.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload;
      })
      // Update user
      .addCase(updateUser.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.updateLoading = false;
        const index = state.users.findIndex(user => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        if (state.selectedUser?.id === action.payload.id) {
          state.selectedUser = action.payload;
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload;
      })
      // Delete user
      .addCase(deleteUser.pending, (state) => {
        state.deleteLoading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.users = state.users.filter(user => user.id !== action.payload);
        if (state.selectedUser?.id === action.payload) {
          state.selectedUser = null;
        }
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.deleteLoading = false;
        state.error = action.payload;
      })
      // Activate user
      .addCase(activateUser.fulfilled, (state, action) => {
        const index = state.users.findIndex(user => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      })
      // Deactivate user
      .addCase(deactivateUser.fulfilled, (state, action) => {
        const index = state.users.findIndex(user => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      });
  }
});

export const { setSelectedUser, clearSelectedUser, clearUsersError, resetUsers } = usersSlice.actions;
export default usersSlice.reducer;

