import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { roleService } from '../../services/roleService';

// Async thunks for roles
export const fetchRoles = createAsyncThunk(
  'roles/fetchRoles',
  async (_, { rejectWithValue }) => {
    try {
      const response = await roleService.getAllRoles();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const fetchRolesByOrganization = createAsyncThunk(
  'roles/fetchRolesByOrganization',
  async (organizationId, { rejectWithValue }) => {
    try {
      const response = await roleService.getRolesByOrganizationId(organizationId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const fetchRoleById = createAsyncThunk(
  'roles/fetchRoleById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await roleService.getRoleById(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const createRole = createAsyncThunk(
  'roles/createRole',
  async (roleData, { rejectWithValue }) => {
    try {
      const response = await roleService.createRole(roleData);
      return response.role;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const updateRole = createAsyncThunk(
  'roles/updateRole',
  async ({ id, roleData }, { rejectWithValue }) => {
    try {
      const response = await roleService.updateRole(id, roleData);
      return response.role;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

const initialState = {
  roles: [],
  selectedRole: null,
  loading: false,
  error: null,
  createLoading: false,
  updateLoading: false
};

const rolesSlice = createSlice({
  name: 'roles',
  initialState,
  reducers: {
    setSelectedRole: (state, action) => {
      state.selectedRole = action.payload;
    },
    clearSelectedRole: (state) => {
      state.selectedRole = null;
    },
    clearRolesError: (state) => {
      state.error = null;
    },
    resetRoles: (state) => {
      return initialState;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch roles
      .addCase(fetchRoles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.loading = false;
        state.roles = action.payload;
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch roles by organization
      .addCase(fetchRolesByOrganization.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRolesByOrganization.fulfilled, (state, action) => {
        state.loading = false;
        state.roles = action.payload;
      })
      .addCase(fetchRolesByOrganization.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch role by ID
      .addCase(fetchRoleById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoleById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedRole = action.payload;
      })
      .addCase(fetchRoleById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create role
      .addCase(createRole.pending, (state) => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(createRole.fulfilled, (state, action) => {
        state.createLoading = false;
        state.roles.push(action.payload);
      })
      .addCase(createRole.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload;
      })
      // Update role
      .addCase(updateRole.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
      })
      .addCase(updateRole.fulfilled, (state, action) => {
        state.updateLoading = false;
        const index = state.roles.findIndex(role => role.id === action.payload.id);
        if (index !== -1) {
          state.roles[index] = action.payload;
        }
        if (state.selectedRole?.id === action.payload.id) {
          state.selectedRole = action.payload;
        }
      })
      .addCase(updateRole.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload;
      });
  }
});

export const { setSelectedRole, clearSelectedRole, clearRolesError, resetRoles } = rolesSlice.actions;
export default rolesSlice.reducer;

