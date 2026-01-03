import { configureStore } from '@reduxjs/toolkit';
import dashboardReducer from './slices/dashboardSlice';
import usersReducer from './slices/usersSlice';
import rolesReducer from './slices/rolesSlice';
import profileReducer from './slices/profileSlice';
import candidateReducer from './slices/candidateSlice';
import positionReducer from './slices/positionSlice';
import questionsetReducer from './slices/questionsetSlice';

export const store = configureStore({
  reducer: {
    dashboard: dashboardReducer,
    users: usersReducer,
    roles: rolesReducer,
    profile: profileReducer,
    candidate: candidateReducer,
    position: positionReducer,
    questionset: questionsetReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

