import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/auth/Login";
import Dashboard from "./components/dashboard/Dashboard";
import NotFound from "./components/common/NotFound";
import ErrorBoundary from "./components/common/ErrorBoundary";
import SnackbarAlert from "./components/common/SnackbarAlert";
import { authService } from "./services/authService";
import { roleService } from "./services/roleService";
import { clearAuthCookies } from "./utils/cookieUtils";
import { clearUserInfo } from "./utils/storageUtils";
import { setSessionCheckFlag } from "./config/axiosConfig";
import { hasPermission } from "./utils/permissions";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SubscriptionProvider } from "./providers/SubscriptionProvider";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminInfo, setAdminInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });

  const showMessage = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // Check for existing session on app mount
  useEffect(() => {
    const checkSession = async () => {
      // Set flag to prevent interceptor from redirecting
      setSessionCheckFlag(true);

      try {
        // Pass suppressLogging flag to suppress logs during session check
        const admin = await authService.getCurrentAdmin(true);
        if (admin) {
          setAdminInfo(admin);
          setIsAuthenticated(true);

          // Fetch and store role permissions if roleId exists
          let roleId = admin?.role?.id;
          const roleName = typeof admin?.role === 'string' ? admin.role : admin?.role?.name || admin?.role;

          // Store user id, role info, organizationId, and dbName in localStorage
          if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
            try {
              // Store user id
              if (admin?.id) {
                localStorage.setItem('userId', admin.id);
              }

              // Store role info
              if (roleName) {
                localStorage.setItem('roleName', roleName);
                localStorage.setItem('roleCode', roleName);
                if (roleName === 'ADMIN' || roleName === 'SUPERADMIN') {
                  localStorage.setItem('isSystemRole', 'true');
                }
              }

              // Store organizationId and dbName from admin object
              const organizationId = admin?.organization?.organizationId || null;
              const dbName = admin?.organization?.dbName || null;

              if (organizationId) {
                localStorage.setItem('organizationId', organizationId);
              }

              if (dbName) {
                localStorage.setItem('dbName', dbName);
                console.log('Stored dbName in localStorage from session:', dbName);
              } else {
                console.warn('dbName not found in admin response during session check');
              }
            } catch (error) {
              // Handle "Access to storage is not allowed from this context" error
              if (error.name === 'SecurityError' || error.message?.includes('storage') || error.message?.includes('not allowed')) {
                console.warn("Storage access not allowed in this context:", error.message);
              } else {
                console.error('Error storing data in localStorage:', error);
              }
            }
          }

          // If no role ID, try to get it by role name using organizationId
          if (!roleId && roleName) {
            try {
              const organizationId = admin?.organization?.organizationId;
              let roles = [];
              if (organizationId) {
                // Use organization-specific endpoint
                roles = await roleService.getRolesByOrganizationId(organizationId);
              } else {
                // Only use getAllRoles if no organizationId (for SUPERADMIN)
                roles = await roleService.getAllRoles();
              }
              const role = roles.find(r =>
                (typeof r === 'object' && (r.name === roleName || r.code === roleName)) ||
                r === roleName
              );
              if (role && typeof role === 'object' && role.id) {
                roleId = role.id;
              }
            } catch (roleError) {
              console.error('Error fetching roles:', roleError);
            }
          }

          // Explicitly call role API to get role details and permissions
          if (roleName) {
            try {
              const organizationId = admin?.organization?.organizationId || null;

              // Step 1: Explicitly call role API to get role with permissions
              console.log('Session Check: Calling role API for role:', roleName, 'organizationId:', organizationId);
              let role = null;

              if (organizationId) {
                // Get roles for organization
                const roles = await roleService.getRolesByOrganizationId(organizationId);
                role = roles.find(r =>
                  (typeof r === 'object' && (r.name === roleName || r.code === roleName)) ||
                  r === roleName
                );
                console.log('Session Check: Role found from organization roles:', role);
              } else {
                // Get all roles (for SUPERADMIN)
                const roles = await roleService.getAllRoles();
                role = roles.find(r =>
                  (typeof r === 'object' && (r.name === roleName || r.code === roleName)) ||
                  r === roleName
                );
                console.log('Session Check: Role found from all roles:', role);
              }

              // Step 2: Fetch and store permissions from the role
              if (role) {
                await authService.fetchRolePermissions(roleName, organizationId);
                console.log('Session Check: Permissions restored from role API');

                // Step 3: Check candidate permissions and log
                const allPerms = JSON.parse(localStorage.getItem('FeaturesPermissions') || '[]');
                const candidatePerm = allPerms.find(p =>
                  p.featureName && p.featureName.toUpperCase() === 'CANDIDATE'
                );

                if (candidatePerm && candidatePerm.permissionScopes && candidatePerm.permissionScopes.length > 0) {
                  console.log('Session Check: User has CANDIDATE permissions:', candidatePerm.permissionScopes);
                  console.log('Session Check: Candidate page will be shown in navigation');
                } else {
                  console.log('Session Check: User does NOT have CANDIDATE permissions');
                }
              } else {
                console.warn('Session Check: Role not found, cannot fetch permissions');
              }
            } catch (permError) {
              console.error('Session Check: Error fetching role/permissions:', permError);
              // Don't block session restore if permission fetch fails
            }
          } else {
            console.log('Session Check: Role name not found, cannot fetch permissions');
          }
        }
      } catch (error) {
        // Clear cookies if it's an auth error (401, 403) or admin not found (404)
        const status = error?.response?.status;
        const isAuthError = status === 401 || status === 403 || status === 404;

        if (isAuthError) {
          // Silently handle expected auth errors during session check - no logging
          clearAuthCookies();
        } else {
          // Only log unexpected errors (network issues, etc.) - but suppress for session check
          // Don't clear cookies on network errors - might be temporary
        }
        setIsAuthenticated(false);
      } finally {
        setSessionCheckFlag(false);
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const handleLogin = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      // Response is already normalized to { message, admin: { ... } } by authService
      const admin = response.admin;
      setAdminInfo(admin);
      setIsAuthenticated(true);

      // Store user id, role info, organizationId, dbName, and FULL adminInfo in localStorage
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem('adminInfo', JSON.stringify(admin));
          if (admin?.id) localStorage.setItem('userId', admin.id);

          const roleName = typeof admin?.role === 'string' ? admin.role : admin?.role?.name || admin?.role;
          if (roleName) {
            localStorage.setItem('roleName', roleName);
            localStorage.setItem('roleCode', roleName);
            if (roleName === 'ADMIN' || roleName === 'SUPERADMIN') {
              localStorage.setItem('isSystemRole', 'true');
            }
          }

          // Explicitly save roleId if available directly on admin object
          if (admin?.roleId) {
            localStorage.setItem('roleId', admin.roleId);
          } else if (admin?.role?.id) {
            localStorage.setItem('roleId', admin.role.id);
          }

          const organizationId = admin?.organization?.organizationId || null;
          const dbName = admin?.organization?.dbName || null;
          if (organizationId) localStorage.setItem('organizationId', organizationId);
          if (dbName) localStorage.setItem('dbName', dbName);

          if (admin?.isSubscription !== undefined) {
            localStorage.setItem('isSubscription', admin.isSubscription.toString());
          }

          // Fetch and store permissions explicitly to ensure they are saved
          if (roleName) {
            try {
              console.log('Login: Fetching permissions for role:', roleName);
              await authService.fetchRolePermissions(roleName, organizationId);
            } catch (permError) {
              console.error('Login: Error fetching permissions:', permError);
            }
          }

        } catch (error) {
          console.error('Error storing data in localStorage:', error);
        }
      }

      showMessage("Login successful");
    } catch (error) {
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear all cookies
      clearAuthCookies();

      // Clear all localStorage
      clearUserInfo();

      // Clear all sessionStorage
      try {
        if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
          sessionStorage.clear();
        }
      } catch (error) {
        console.warn('Error clearing sessionStorage:', error);
      }

      // Reset state
      setIsAuthenticated(false);
      setAdminInfo(null);

      // Navigate to login and force reload
      navigate("/login", { replace: true });
      setTimeout(() => {
        window.location.href = "/login";
      }, 100);

      // Clear user info and permissions from localStorage
      clearUserInfo(); // Clears userId, organizationId, dbName, roleName, roleCode, isSystemRole, FeaturesPermissions

      // Clear additional permissions from localStorage (like frontend_admin)
      try {
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
          try {
            localStorage.removeItem('roleData');
            localStorage.removeItem('roleId');

            // Clear individual feature permissions
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.endsWith('Permissions')) {
                keysToRemove.push(key);
              }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));

            console.log('Permissions cleared from localStorage');
          } catch (error) {
            // Handle "Access to storage is not allowed from this context" error
            if (error.name === 'SecurityError' || error.message?.includes('storage') || error.message?.includes('not allowed')) {
              console.warn("Storage access not allowed in this context:", error.message);
            } else {
              console.error('Error clearing localStorage:', error);
            }
          }
        }
      } catch (storageError) {
        if (storageError.name === 'SecurityError' || storageError.message?.includes('storage')) {
          console.warn("Storage access not allowed in this context:", storageError.message);
        } else {
          console.error("Error clearing permissions from localStorage:", storageError);
        }
      }

      showMessage("Logged out successfully");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-900 mx-auto"></div>
          <p className="mt-4 text-navy-700">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <SubscriptionProvider isAuthenticated={isAuthenticated}>
          <Router
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <Routes>
              <Route
                path="/"
                element={
                  isAuthenticated ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <Login onLogin={handleLogin} />
                  )
                }
              />
              <Route
                path="/dashboard/*"
                element={
                  isAuthenticated ? (
                    <Dashboard adminInfo={adminInfo} onLogout={handleLogout} />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <SnackbarAlert
              open={snackbar.open}
              message={snackbar.message}
              severity={snackbar.severity}
              onClose={handleCloseSnackbar}
            />
          </Router>
        </SubscriptionProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;

