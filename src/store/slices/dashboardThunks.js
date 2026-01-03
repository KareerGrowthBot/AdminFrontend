import { createAsyncThunk } from '@reduxjs/toolkit';
import { dashboardService } from '../../services/dashboardService';

export const fetchCredits = createAsyncThunk(
    'dashboard/fetchCredits',
    async (_, { rejectWithValue }) => {
        try {
            console.log('fetchCredits thunk: Calling API for credits...');
            const creditData = await dashboardService.getCredits();
            console.log('fetchCredits thunk: API response received', creditData);
            return creditData;
        } catch (error) {
            console.error('fetchCredits thunk: API call failed', error);
            return rejectWithValue(error.response?.data || error.message || 'Unknown API error fetching credits');
        }
    }
);

export const fetchJobRoles = createAsyncThunk(
    'dashboard/fetchJobRoles',
    async (_, { rejectWithValue }) => {
        try {
            console.log('fetchJobRoles thunk: Calling API endpoint for job roles: /positions/by/title...');
            const responseData = await dashboardService.getJobRoles();
            console.log('fetchJobRoles thunk: API response received (data array)', responseData);
            return responseData;
        } catch (error) {
            console.error('fetchJobRoles thunk: API call failed', error);
            return rejectWithValue(error.response?.data || error.message || 'Unknown API error fetching job roles');
        }
    }
);


export const fetchPositionRecommendationStats = createAsyncThunk(
    'dashboard/fetchPositionRecommendationStats',
    async (positionId, { rejectWithValue }) => {
        try {
            console.log(`fetchPositionRecommendationStats thunk: Calling API for position ${positionId}...`);
            const responseData = await dashboardService.getPositionRecommendationStats(positionId);
            console.log('fetchPositionRecommendationStats thunk: API response received', responseData);
            return responseData;
        } catch (error) {
            console.error('fetchPositionRecommendationStats thunk: API call failed', error);
            return rejectWithValue(error.response?.data || error.message || `Unknown API error fetching stats for ${positionId}`);
        }
    }
);

export const fetchCompany = createAsyncThunk(
    'dashboard/fetchCompany',
    async (_, { rejectWithValue }) => {
        try {
            console.log('fetchCompany thunk: Calling API...');
            const response = await dashboardService.getCompanyById();
            console.log('fetchCompany thunk: API response received', response);

            // Return only the data portion, not the full API response if structured that way in service
            // Service returns response.data which likely contains { success: true, data: { ... } }
            // But getCompanyById in service returns response.data directly.
            // Reference thunk returned response.data but getCompanyById in reference API returned response.data too.
            // Reference thunk logic: return response.data.
            // Wait, reference API: returns response.data. 
            // Reference thunk: return response.data.
            // So I should return response.data or response.data.data?
            // Reference API returned the whole object. Thunk says "return response.data"
            return response.data;
        } catch (error) {
            console.error('fetchCompany thunk: API call failed', error);
            return rejectWithValue(error.response?.data || error.message || 'Unknown API error fetching company');
        }
    }
);
