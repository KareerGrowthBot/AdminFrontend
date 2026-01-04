import React, { useState, useEffect, useMemo } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Home, Users, UserPlus, Settings, Briefcase, Shield, FileText } from "lucide-react";
import { authService } from "../../services/authService";
import { clearAuthCookies } from "../../utils/cookieUtils";
import { clearUserInfo } from "../../utils/storageUtils";
import { hasPermission, hasAnyPermission } from "../../utils/permissions";
import Layout from "./Layout";
import DashboardContent from "./DashboardContent";
import CreateUser from "../users/CreateUser";
import CreateRole from "../users/CreateRole";
import CreateCandidate from "../candidates/CreateCandidate";
import AddCandidate from "../candidates/AddCandidate";
import CreatePosition from "../positions/CreatePosition";
import CreateQuestionSet from "../questionSets/CreateQuestionSet";
import NotesAssessment from "../candidates/NotesAssessment";
import UsersAndRoles from "../users/UsersAndRoles";

import TestAssignments from "../candidates/TestAssignments";
import CandidateDatabase from "../candidates/CandidateDatabase";
import CandidateDetails from "../candidates/CandidateDetails";
import Positions from "../positions/Positions";
import MainDashboard from "./MainDashboard"; // Import MainDashboard
import Payment from "../payment/Payment";
import Billing from "../payment/Billing";
import { useSubscription } from "../../providers/SubscriptionProvider";

const Dashboard = ({ adminInfo, onLogout }) => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarMinimized, setSidebarMinimized] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Check if permissions are loaded - only check localStorage, don't call API
  useEffect(() => {
    const checkPermissions = () => {
      try {
        const permissions = localStorage.getItem("FeaturesPermissions");
        if (permissions) {
          const parsed = JSON.parse(permissions);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setPermissionsLoaded(true);
            console.log('Dashboard: Permissions loaded from localStorage:', parsed);
            // Force a re-render
            setRefreshKey(prev => prev + 1);
          } else {
            setPermissionsLoaded(false);
          }
        } else {
          setPermissionsLoaded(false);
        }
      } catch (error) {
        console.error("Error checking permissions:", error);
        setPermissionsLoaded(false);
      }
    };

    // Check immediately - only reads from localStorage, no API calls
    checkPermissions();

    // Listen for storage events (when permissions are stored from another tab/window)
    // This only reads from localStorage, doesn't call API
    const handleStorageChange = (e) => {
      if (e.key === 'FeaturesPermissions') {
        console.log('Dashboard: FeaturesPermissions changed in localStorage');
        checkPermissions();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [adminInfo]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      clearAuthCookies();
      clearUserInfo(); // Clear userId, organizationId, dbName, roleName, etc. from localStorage
      onLogout();
    } catch (error) {
      console.error("Logout error:", error);
      clearAuthCookies();
      clearUserInfo(); // Clear userId, organizationId, dbName, roleName, etc. from localStorage
      onLogout();
    }
  };


  // Define all menu items with their permission requirements
  const allMenuItems = [
    {
      icon: Home,
      label: "Dashboard",
      id: "dashboard",
      onClick: () => navigate("/dashboard"),
      // Dashboard is always accessible
      requiredPermission: null
    },
    {
      icon: Users,
      label: "Roles & Users",
      id: "users",
      // Remove explicit onClick as Layout handles Link generation based on ID
      onClick: null,
      // Always accessible (no permission check required as per previous setup)
      requiredPermission: null
    },
    {
      icon: Briefcase,
      label: "Positions",
      id: "positions",
      onClick: () => navigate("/dashboard/positions"),
      // Show if user has ANY position permission
      requiredPermission: { feature: "POSITION", checkAny: true }
    },
    {
      icon: Users,
      label: "Candidates",
      id: "candidates-group",
      // Show if user has ANY candidate permission
      requiredPermission: { feature: "CANDIDATE", checkAny: true },
      submenu: [
        {
          label: "Candidates List",
          id: "candidate-database",
          onClick: () => navigate("/dashboard/candidate-database"),
        },
        {
          label: "Test Candidates",
          id: "test-assignments",
          onClick: () => navigate("/dashboard/test-assignments"),
        }
      ]
    },
    {
      icon: FileText,
      label: "Notes & Assessment",
      id: "assessments",
      onClick: () => navigate("/dashboard/assessments"),
      // Show if user has ANY candidate permission
      requiredPermission: { feature: "CANDIDATE", checkAny: true }
    },
  ];

  // Retrieve role name and check if user is Admin
  const roleName = localStorage.getItem("roleName");
  const isAdmin = roleName && (roleName.toUpperCase() === "ADMIN" || roleName.toUpperCase() === "SUPERADMIN");

  // Modify "Roles & Users" to require Admin access
  const allMenuItemsWithAuth = allMenuItems.map(item => {
    if (item.id === "users") {
      return { ...item, requiresAdmin: true };
    }
    return item;
  });

  // Filter menu items based on user permissions
  // Use useMemo to recalculate when permissions might change
  const menuItems = useMemo(() => {
    console.log('Dashboard: Filtering menu items, permissionsLoaded:', permissionsLoaded);

    try {
      const allPermsStr = localStorage.getItem("FeaturesPermissions");
      const allPerms = allPermsStr ? JSON.parse(allPermsStr) : [];
      console.log('Dashboard: All permissions from localStorage:', allPerms);

      // Check for CANDIDATE permission specifically
      const candidatePerm = allPerms.find(p =>
        p.featureName && p.featureName.toUpperCase() === 'CANDIDATE'
      );
      console.log('Dashboard: CANDIDATE permission found:', candidatePerm);

      return allMenuItemsWithAuth.filter(item => {
        // Check for Admin requirement
        if (item.requiresAdmin && !isAdmin) {
          return false;
        }

        // If no permission required, always show (like Dashboard)
        if (!item.requiredPermission) {
          return true;
        }

        // Check if we need to check for ANY permission or specific scope
        let hasAccess = false;
        if (item.requiredPermission.checkAny) {
          // Check if user has ANY permission for this feature
          hasAccess = hasAnyPermission(item.requiredPermission.feature);
          console.log(`Dashboard: Menu item "${item.label}" (${item.id}):`, {
            feature: item.requiredPermission.feature,
            checkAny: true,
            hasAccess,
            permissionsLoaded,
            allPerms
          });
        } else {
          // Check if user has the specific permission scope
          hasAccess = hasPermission(item.requiredPermission.feature, item.requiredPermission.scope);
          console.log(`Dashboard: Menu item "${item.label}" (${item.id}):`, {
            feature: item.requiredPermission.feature,
            scope: item.requiredPermission.scope,
            hasAccess,
            permissionsLoaded,
            allPerms
          });
        }

        return hasAccess;
      });
    } catch (error) {
      console.error('Dashboard: Error filtering menu items:', error);
      // On error, show only dashboard
      return allMenuItems.filter(item => !item.requiredPermission);
    }
  }, [permissionsLoaded, adminInfo, navigate, refreshKey]);

  // Normalize adminInfo to handle nested admin object
  const user = adminInfo?.admin || adminInfo || {};

  return (
    <Layout
      email={user?.email}
      fullName={user?.fullName}
      role={user?.role}
      onLogout={handleLogout}
      menuItems={menuItems}
    >
      <Routes>
        <Route path="/" element={
          <MainDashboard adminInfo={adminInfo} />
        } />
        <Route path="/users" element={
          <UsersAndRoles adminInfo={adminInfo} initialTab="users" />
        } />
        <Route path="/users/create" element={<CreateUser adminInfo={adminInfo} />} />
        <Route path="/roles" element={
          <UsersAndRoles adminInfo={adminInfo} initialTab="roles" />
        } />
        <Route path="/roles/create" element={<CreateRole adminInfo={adminInfo} />} />
        <Route path="/test-assignments" element={
          <TestAssignments adminInfo={adminInfo} />
        } />
        <Route path="/candidate-database" element={
          <CandidateDatabase adminInfo={adminInfo} />
        } />
        {/* Legacy redirect for old bookmarks */}
        <Route path="/candidates" element={<Navigate to="/dashboard/test-assignments" replace />} />
        <Route path="/candidates/:id" element={<CandidateDetails adminInfo={adminInfo} />} />
        <Route path="/candidates/create" element={<CreateCandidate adminInfo={adminInfo} />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/candidates/add" element={<AddCandidate adminInfo={adminInfo} />} />
        <Route path="/positions" element={
          <Positions />
        } />
        <Route path="/positions/create" element={<CreatePosition adminInfo={adminInfo} />} />
        <Route path="/assessments" element={
          <NotesAssessment adminInfo={adminInfo} />
        } />
        <Route path="/question-sets/create" element={<CreateQuestionSet adminInfo={adminInfo} />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
};

export default Dashboard;
