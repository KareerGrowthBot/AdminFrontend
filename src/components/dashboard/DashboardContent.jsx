import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { hasPermission } from "../../utils/permissions";
import { Users as UsersIcon, UserPlus, Mail, Search, Edit, Trash2, X, Check, Shield, Plus, UserCheck, Briefcase, FileText, GraduationCap, TrendingUp, Activity, Clock, CheckCircle, XCircle, Download } from "lucide-react";
import * as XLSX from 'xlsx';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { adminService } from "../../services/adminService";
import { candidateService } from "../../services/candidateService";
import { roleService } from "../../services/roleService";
import { featureService } from "../../services/featureService";
import { permissionService } from "../../services/permissionService";
import { dashboardService } from "../../services/dashboardService";
import Positions from "../positions/Positions";
import { useSubscription } from "../../providers/SubscriptionProvider";
import SubscriptionExpired from "../common/SubscriptionExpired";


import UsersAndRoles from "../users/UsersAndRoles";
import SnackbarAlert from "../common/SnackbarAlert";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const DashboardContent = ({ adminInfo }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine current view from URL
  const getCurrentView = () => {
    const path = location.pathname;
    if (path === "/dashboard" || path === "/dashboard/") return "dashboard";
    if (path === "/dashboard/positions") return "positions";
    return "dashboard";
  };

  const currentView = getCurrentView();
  const { isSubscriptionActive, loading: subscriptionLoading } = useSubscription();
  const [admins, setAdmins] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [showEditAdminModal, setShowEditAdminModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showInviteCandidateModal, setShowInviteCandidateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const isLoadingAdminsRef = useRef(false);
  const isLoadingCandidatesRef = useRef(false);
  const isLoadingRolesRef = useRef(false);
  const loadedViewsRef = useRef(new Set());

  // Dashboard stats state
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    totalCandidates: 0,
    totalStudents: 0,
    totalPositions: 0,
    totalRoles: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    activeCandidates: 0,
    inactiveCandidates: 0,
    pendingCandidates: 0,
    completedTests: 0,
    degreeStats: {},
  });
  const [candidateTrends, setCandidateTrends] = useState({ labels: [], data: [] });
  const [candidateDistribution, setCandidateDistribution] = useState({ labels: [], data: [] });
  const [positionStats, setPositionStats] = useState({ labels: [], data: [] });
  const [userActivity, setUserActivity] = useState({ labels: [], logins: [], creations: [] });
  const [recentActivities, setRecentActivities] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  const showMessage = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // Handle Excel Export
  const handleDownloadExport = () => {
    try {
      // 1. Overview Statistics
      const overviewData = [
        { Metric: "Total Users", Value: dashboardStats.totalUsers || 0 },
        { Metric: "Total Candidates", Value: dashboardStats.totalCandidates || 0 },
        { Metric: "Total Positions", Value: dashboardStats.totalPositions || 0 },
        { Metric: "Active Roles", Value: dashboardStats.totalRoles || 0 },
        { Metric: "Active Users", Value: dashboardStats.activeUsers || 0 },
        { Metric: "Inactive Users", Value: dashboardStats.inactiveUsers || 0 },
        { Metric: "Completed Tests", Value: dashboardStats.completedTests || 0 },
      ];

      // 2. Candidate Trends
      const trendData = candidateTrends.labels.map((label, index) => ({
        Period: label,
        "Registered Candidates": candidateTrends.data[index] || 0
      }));

      // 3. Candidate Distribution (Mix)
      const distributionData = candidateDistribution.labels.map((label, index) => ({
        Status: label,
        Count: candidateDistribution.data[index] || 0
      }));

      // 4. Recent Activities
      const activityData = recentActivities.map(activity => ({
        Time: activity.timestamp || activity.time,
        User: activity.userName || activity.user || 'Unknown',
        Action: activity.action || activity.message || '-',
        Details: activity.details || '-'
      }));

      // Create Workbook and Sheets
      const wb = XLSX.utils.book_new();

      const wsOverview = XLSX.utils.json_to_sheet(overviewData);
      const wsTrends = XLSX.utils.json_to_sheet(trendData);
      const wsDistribution = XLSX.utils.json_to_sheet(distributionData);
      const wsActivities = XLSX.utils.json_to_sheet(activityData);

      // Add Sheets to Workbook
      XLSX.utils.book_append_sheet(wb, wsOverview, "Overview");
      XLSX.utils.book_append_sheet(wb, wsTrends, "Registration Trends");
      XLSX.utils.book_append_sheet(wb, wsDistribution, "Candidate Mix");
      XLSX.utils.book_append_sheet(wb, wsActivities, "Recent Activities");

      // Generate Filename
      const date = new Date().toISOString().split('T')[0];
      const fileName = `Dashboard_Analytics_${date}.xlsx`;

      // Export File
      XLSX.writeFile(wb, fileName);
      showMessage("Dashboard analytics downloaded successfully");
    } catch (error) {
      console.error("Export Error:", error);
      showMessage("Failed to generate Excel file", "error");
    }
  };

  // Load admins/users
  const loadAdmins = async () => {
    // Prevent duplicate calls
    if (isLoadingAdminsRef.current) {
      return;
    }

    isLoadingAdminsRef.current = true;
    try {
      setLoading(true);
      // Check if admin has organization (ADMIN) or not (SUPERADMIN)
      if (adminInfo?.organization?.organizationId) {
        // ADMIN: Use organization-specific API
        // Get organizationId from adminInfo or localStorage
        const organizationId = adminInfo.organization.organizationId || localStorage.getItem('organizationId');
        if (!organizationId) {
          console.error("Organization ID not found");
          return;
        }
        const data = await adminService.getUsersByOrganizationId(organizationId);
        setAdmins(data);
      } else {
        // SUPERADMIN: Use normal API
        // Always use organization-specific endpoint - don't use getAllAdmins()
        // Get organizationId from localStorage (stored on login)
        const organizationId = localStorage.getItem('organizationId');
        if (!organizationId) {
          console.error("Organization ID not found in localStorage");
          return;
        }
        const data = await adminService.getUsersByOrganizationId(organizationId);
        setAdmins(data);
      }
    } catch (error) {
      console.error("Error loading admins:", error);
      const errorMessage = error?.response?.data?.error || error?.message || "Failed to load admins. Please try again.";
      showMessage(errorMessage, "error");
    } finally {
      setLoading(false);
      isLoadingAdminsRef.current = false;
    }
  };

  // Load candidates
  const loadCandidates = async () => {
    // Prevent duplicate calls
    if (isLoadingCandidatesRef.current) {
      return;
    }

    isLoadingCandidatesRef.current = true;
    try {
      setLoading(true);
      const data = await candidateService.getAllCandidates();
      setCandidates(data);
    } catch (error) {
      console.error("Error loading candidates:", error);
      const errorMessage = error?.response?.data?.error || error?.message || "Failed to load candidates. Please try again.";
      showMessage(errorMessage, "error");
    } finally {
      setLoading(false);
      isLoadingCandidatesRef.current = false;
    }
  };

  // Load roles
  const loadRoles = async () => {
    // Prevent duplicate calls
    if (isLoadingRolesRef.current) {
      return;
    }

    isLoadingRolesRef.current = true;
    try {
      setLoading(true);
      // Check if admin has organization (ADMIN) or not (SUPERADMIN)
      if (adminInfo?.organization?.organizationId) {
        // ADMIN: Use organization-specific API
        const data = await roleService.getRolesByOrganizationId(adminInfo.organization.organizationId);
        setRoles(data);
      } else {
        // SUPERADMIN: Use normal API
        const data = await roleService.getAllRoles();
        setRoles(data);
      }
    } catch (error) {
      console.error("Error loading roles:", error);
      const errorMessage = error?.response?.data?.error || error?.message || "Failed to load roles. Please try again.";
      showMessage(errorMessage, "error");
    } finally {
      setLoading(false);
      isLoadingRolesRef.current = false;
    }
  };

  useEffect(() => {
    // Only load data if not already loaded for this view (prevent duplicate calls)
    if (currentView === "users-roles" && !loadedViewsRef.current.has("users-roles")) {
      loadedViewsRef.current.add("users-roles");
      // UsersAndRoles component will handle loading its own data
    } else if (currentView === "candidates" && !loadedViewsRef.current.has("candidates") && candidates.length === 0) {
      loadedViewsRef.current.add("candidates");
      loadCandidates();
    }
  }, [currentView]);

  // Handle Edit Admin
  const handleEditAdmin = (admin) => {
    setSelectedAdmin(admin);
    setShowEditAdminModal(true);
  };

  // Handle Delete Admin
  const handleDeleteAdmin = async (adminId) => {
    try {
      await adminService.deleteAdmin(adminId);
      showMessage("Admin deleted successfully");
      setShowDeleteConfirmModal(false);
      setSelectedAdmin(null);
      loadAdmins();
    } catch (error) {
      console.error("Error deleting admin:", error);
      const errorMessage = error?.response?.data?.error || error?.message || "Failed to delete admin. Please try again.";
      showMessage(errorMessage, "error");
    }
  };

  // Create Admin Modal - kept for backward compatibility but uses full page route now
  const CreateAdminModal = () => {
    const [formData, setFormData] = useState({
      email: "",
      password: "",
      fullName: "",
      phone: "",
      role: "SUBADMIN",
      organizationName: ""
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        await adminService.createAdmin(formData);
        showMessage("Admin created successfully");
        setShowCreateAdminModal(false);
        setFormData({ email: "", password: "", fullName: "", phone: "", role: "SUBADMIN", organizationName: "" });
        loadAdmins();
      } catch (error) {
        console.error("Error creating admin:", error);
        const errorMessage = error?.response?.data?.error || error?.message || "Failed to create admin. Please try again.";
        showMessage(errorMessage, "error");
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xs font-bold text-navy-900">Create SUBADMIN</h2>
            <button onClick={() => setShowCreateAdminModal(false)} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>

          {/* Info Box */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-[10px] text-blue-800">
              <strong>Required Fields:</strong> Email, Password, Full Name
            </p>
            <p className="text-xs text-blue-700 mt-1">
              SUBADMIN will automatically inherit your organization.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-medium text-navy-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition"
                placeholder="subadmin@example.com"
              />
            </div>

            <div>
              <label className="block text-[10px] font-medium text-navy-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition"
                placeholder="Enter password"
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
            </div>

            <div>
              <label className="block text-[10px] font-medium text-navy-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-4 py-2 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-[10px] font-medium text-navy-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition"
                placeholder="10-digit phone number"
                maxLength={10}
              />
              <p className="text-xs text-gray-500 mt-1">Optional - 10 digits</p>
            </div>

            <div>
              <label className="block text-[10px] font-medium text-navy-700 mb-1">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.role}
                disabled
                className="w-full px-4 py-2 border border-navy-300 rounded-lg bg-gray-100 cursor-not-allowed"
              >
                <option value="SUBADMIN">SUBADMIN</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                You can only create SUBADMIN users. They will have access to your organization's data.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="submit" className="flex-1 py-2 px-4 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-navy-900 font-semibold rounded-lg transition duration-200 shadow-lg">
                Create SUBADMIN
              </button>
              <button type="button" onClick={() => setShowCreateAdminModal(false)} className="px-4 py-2 border-2 border-gold-300 hover:border-gold-600 text-gold-700 hover:text-gold-600 font-medium rounded-lg transition duration-200">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Edit Admin Modal
  const EditAdminModal = () => {
    const [formData, setFormData] = useState({
      fullName: selectedAdmin?.fullName || "",
      phone: selectedAdmin?.phone || "",
      active: selectedAdmin?.active ?? true
    });

    useEffect(() => {
      if (selectedAdmin) {
        setFormData({
          fullName: selectedAdmin.fullName || "",
          phone: selectedAdmin.phone || "",
          active: selectedAdmin.active ?? true
        });
      }
    }, [selectedAdmin]);

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        await adminService.updateAdmin(selectedAdmin.id, formData);
        showMessage("Admin updated successfully");
        setShowEditAdminModal(false);
        setSelectedAdmin(null);
        loadAdmins();
      } catch (error) {
        console.error("Error updating admin:", error);
        const errorMessage = error?.response?.data?.error || error?.message || "Failed to update admin. Please try again.";
        showMessage(errorMessage, "error");
      }
    };

    if (!selectedAdmin) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xs font-bold text-navy-900">Edit Admin</h2>
            <button onClick={() => { setShowEditAdminModal(false); setSelectedAdmin(null); }} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-medium text-navy-700 mb-1">Email</label>
              <input
                type="email"
                value={selectedAdmin.email}
                disabled
                className="w-full px-4 py-2 border border-navy-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-navy-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-4 py-2 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-navy-700 mb-1">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-navy-700 mb-1">Status</label>
              <select
                value={formData.active ? "active" : "inactive"}
                onChange={(e) => setFormData({ ...formData, active: e.target.value === "active" })}
                className="w-full px-4 py-2 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 py-2 px-4 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-navy-900 font-semibold rounded-lg transition duration-200 shadow-lg">Update</button>
              <button type="button" onClick={() => { setShowEditAdminModal(false); setSelectedAdmin(null); }} className="px-4 py-2 border-2 border-gold-300 hover:border-gold-600 text-gold-700 hover:text-gold-600 font-medium rounded-lg transition duration-200">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Delete Confirmation Modal
  const DeleteConfirmModal = () => {
    if (!selectedAdmin) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xs font-bold text-navy-900">Delete Admin</h2>
            <button onClick={() => { setShowDeleteConfirmModal(false); setSelectedAdmin(null); }} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>
          <div className="mb-6">
            <p className="text-navy-700 mb-2">Are you sure you want to delete this admin?</p>
            <p className="text-[10px] text-gray-600">
              <strong>Email:</strong> {selectedAdmin.email}<br />
              <strong>Name:</strong> {selectedAdmin.fullName || "N/A"}
            </p>
            <p className="text-[10px] text-red-600 mt-4 font-medium">This action cannot be undone.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleDeleteAdmin(selectedAdmin.id)}
              className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition duration-200 shadow-lg"
            >
              Delete
            </button>
            <button
              onClick={() => { setShowDeleteConfirmModal(false); setSelectedAdmin(null); }}
              className="px-4 py-2 border-2 border-gray-300 hover:border-gray-600 text-gray-700 hover:text-gray-900 font-medium rounded-lg transition duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Invite Candidate Modal
  const InviteCandidateModal = () => {
    const [email, setEmail] = useState("");

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        await candidateService.createCandidateInvitation(email);
        showMessage("Candidate invitation sent successfully");
        setShowInviteCandidateModal(false);
        setEmail("");
        loadCandidates();
      } catch (error) {
        console.error("Error inviting candidate:", error);
        const errorMessage = error?.response?.data?.error || error?.message || "Failed to invite candidate. Please try again.";
        showMessage(errorMessage, "error");
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xs font-bold text-navy-900">Invite Candidate</h2>
            <button onClick={() => setShowInviteCandidateModal(false)} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-medium text-navy-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition"
                placeholder="candidate@example.com"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 py-2 px-4 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-navy-900 font-semibold rounded-lg transition duration-200 shadow-lg">Send Invitation</button>
              <button type="button" onClick={() => setShowInviteCandidateModal(false)} className="px-4 py-2 border-2 border-gold-300 hover:border-gold-600 text-gold-700 hover:text-gold-600 font-medium rounded-lg transition duration-200">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const filteredAdmins = admins.filter(admin =>
    admin.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCandidates = candidates.filter(candidate =>
    candidate.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Load dashboard data - single API call
  const loadDashboardData = async () => {
    if (dashboardLoading) return;

    // Get organization ID from adminInfo
    const organizationId = adminInfo?.organization?.organizationId;
    if (!organizationId) {
      console.error("Organization ID not found in adminInfo");
      showMessage("Organization ID not found", "error");
      return;
    }

    try {
      setDashboardLoading(true);
      // Single API call to get all dashboard data
      const allData = await dashboardService.getAllDashboardData(organizationId);

      // Extract data from the response
      setDashboardStats(allData.stats || {});
      setCandidateTrends(allData.candidateTrends || { labels: [], data: [] });
      setCandidateDistribution(allData.candidateDistribution || { labels: [], data: [] });
      setPositionStats(allData.positionStats || { labels: [], data: [] });
      setUserActivity(allData.userActivity || { labels: [], logins: [], creations: [] });
      setRecentActivities(allData.recentActivities?.activities || []);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      showMessage("Failed to load dashboard data", "error");
    } finally {
      setDashboardLoading(false);
    }
  };


  // Chart configurations with premium palette
  const candidateTrendChartData = {
    labels: candidateTrends.labels || [],
    datasets: [
      {
        label: "Candidates Registered",
        data: candidateTrends.data || [],
        borderColor: "#3B82F6",
        backgroundColor: "rgba(59, 130, 246, 0.05)",
        borderWidth: 3,
        fill: true,
        tension: 0.45,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointBackgroundColor: "#3B82F6",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
      },
    ],
  };

  const candidateDistributionChartData = {
    labels: candidateDistribution.labels || [],
    datasets: [
      {
        data: candidateDistribution.data || [],
        backgroundColor: [
          "#0F172A", // Slate 900
          "#3B82F6", // Blue 500
          "#10B981", // Emerald 500
          "#F59E0B", // Amber 500
          "#8B5CF6", // Violet 500
          "#EC4899", // Pink 500
        ],
        hoverOffset: 15,
        borderWidth: 0,
      },
    ],
  };

  const positionStatsChartData = {
    labels: positionStats.labels || [],
    datasets: [
      {
        label: "Positions",
        data: positionStats.data || [],
        backgroundColor: "#1E293B",
        borderRadius: 12,
        barThickness: 24,
      },
    ],
  };

  const userActivityChartData = {
    labels: userActivity.labels || [],
    datasets: [
      {
        label: "User Creations",
        data: userActivity.creations || [],
        backgroundColor: "#3B82F6",
        borderRadius: 8,
        barThickness: 16,
      },
      {
        label: "User Logins",
        data: userActivity.logins || [],
        backgroundColor: "#E2E8F0",
        borderRadius: 8,
        barThickness: 16,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        align: "start",
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: { size: 11, weight: '600', family: "'Inter', sans-serif" },
          color: "#64748B",
        },
      },
      tooltip: {
        backgroundColor: "#1E293B",
        padding: 12,
        titleFont: { size: 13, weight: 'bold' },
        bodyFont: { size: 12 },
        cornerRadius: 12,
        displayColors: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        border: { display: false },
        ticks: {
          font: { size: 11, weight: '500' },
          color: "#94A3B8",
          padding: 8,
        },
        grid: {
          color: "rgba(226, 232, 240, 0.4)",
          drawTicks: false,
        },
      },
      x: {
        border: { display: false },
        ticks: {
          font: { size: 11, weight: '500' },
          color: "#94A3B8",
          padding: 8,
        },
        grid: {
          display: false,
        },
      },
    },
  };

  // Dashboard/Home View
  if (currentView === "dashboard" || currentView === "home" || !currentView) {
    if (!isSubscriptionActive && !subscriptionLoading) {
      return <SubscriptionExpired />;
    }
    return (
      <div className="space-y-6 animate-in fade-in duration-700">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">Hello {adminInfo?.fullName?.split(' ')[0] || "Admin"}, here's what's happening today.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadDashboardData}
              disabled={dashboardLoading}
              className="p-2 bg-white border border-slate-100 rounded-xl shadow-sm hover:bg-slate-50 transition-all text-slate-600"
            >
              <Activity className={`w-5 h-5 ${dashboardLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleDownloadExport}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-md shadow-slate-200 hover:bg-slate-800 transition-all flex items-center gap-2"
            >
              <Download size={16} /> Download
            </button>
          </div>
        </div>

        {dashboardLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-600 mx-auto"></div>
              <p className="text-[10px] text-navy-700 mt-4">Loading dashboard...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Premium Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Users", val: dashboardStats.totalUsers, icon: UsersIcon, color: "blue" },
                { label: "Candidates", val: dashboardStats.totalCandidates, icon: UserCheck, color: "emerald" },
                { label: "Active Roles", val: dashboardStats.totalRoles, icon: Shield, color: "violet" },
                { label: "Positions", val: dashboardStats.totalPositions, icon: Briefcase, color: "amber" }
              ].map((stat, idx) => (
                <div key={idx} className="bg-white rounded-xl border border-slate-100 p-5 flex items-center justify-between shadow-sm group hover:scale-[1.01] transition-transform duration-300">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
                    <p className="text-3xl font-black text-slate-900 tracking-tight">{stat.val || 0}</p>
                    <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full w-fit">
                      <TrendingUp size={10} /> +12%
                    </div>
                  </div>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner
                    ${stat.color === 'blue' ? 'bg-blue-50 text-blue-600' : ''}
                    ${stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : ''}
                    ${stat.color === 'violet' ? 'bg-violet-50 text-violet-600' : ''}
                    ${stat.color === 'amber' ? 'bg-amber-50 text-amber-600' : ''}
                  `}>
                    <stat.icon size={26} />
                  </div>
                </div>
              ))}
            </div>

            {/* Main Visual Data Section */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Candidates Trend Area */}
              <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Registration Trends</h3>
                    <p className="text-xs text-slate-400 font-medium">Candidate registration volume over time</p>
                  </div>
                  <div className="flex items-center gap-2 p-1 bg-slate-50 rounded-xl">
                    <button className="px-3 py-1.5 text-[10px] font-bold bg-white text-slate-900 rounded-lg shadow-sm">Monthly</button>
                    <button className="px-3 py-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase">Weekly</button>
                  </div>
                </div>
                <div className="h-80 w-full">
                  <Line data={candidateTrendChartData} options={chartOptions} />
                </div>
              </div>

              {/* Distribution Sidebar */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col">
                <div className="mb-8 text-center">
                  <h3 className="text-lg font-bold text-slate-900">Candidate Mix</h3>
                  <p className="text-xs text-slate-400 font-medium">Distribution by profile status</p>
                </div>
                <div className="flex-1 min-h-[250px] relative flex items-center justify-center">
                  <Doughnut data={candidateDistributionChartData} options={{ ...chartOptions, cutout: '75%' }} />
                  <div className="absolute flex flex-col items-center">
                    <span className="text-3xl font-black text-slate-900">{dashboardStats.totalCandidates || 0}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total</span>
                  </div>
                </div>
                <div className="mt-8 space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl text-[11px] font-bold">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-slate-600">Active</span>
                    </div>
                    <span className="text-slate-900">{dashboardStats.activeCandidates || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-[11px] font-bold">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-slate-600">Pending</span>
                    </div>
                    <span className="text-slate-900">{dashboardStats.pendingCandidates || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary Data Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Position Analytics */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-slate-900 rounded-xl text-white">
                    <Briefcase size={18} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Position Openings</h3>
                </div>
                <div className="h-64">
                  <Bar data={positionStatsChartData} options={chartOptions} />
                </div>
              </div>

              {/* User Activity */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-blue-600 rounded-xl text-white">
                    <TrendingUp size={18} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">User Growth & Activity</h3>
                </div>
                <div className="h-64">
                  <Bar data={userActivityChartData} options={chartOptions} />
                </div>
              </div>
            </div>
            {/* Tertiary Data Section: Degree Stats & Recent Activity */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Degree Statistics */}
              {dashboardStats.degreeStats && Object.keys(dashboardStats.degreeStats).length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-emerald-600 rounded-xl text-white">
                      <GraduationCap size={18} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Education Breakdown</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(dashboardStats.degreeStats).map(([degree, count], idx) => (
                      <div key={degree} className="p-3.5 bg-slate-50 rounded-xl border border-transparent hover:border-slate-200 transition-all group">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{degree}</p>
                        <div className="flex items-end justify-between">
                          <span className="text-xl font-black text-slate-900">{count}</span>
                          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                            <item.icon size={14} /> {/* Fallback if needed, but let's use a standard one */}
                            <GraduationCap size={14} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Activity Feed */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-600 rounded-xl text-white">
                      <Clock size={18} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Activity Registry</h3>
                  </div>
                  <button className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest">View History</button>
                </div>
                <div className="space-y-3">
                  {recentActivities.length > 0 ? (
                    recentActivities.map((activity, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-all group">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-95
                          ${activity.type === "user" ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"}
                        `}>
                          {activity.type === "user" ? <UsersIcon size={20} /> : <UserCheck size={20} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">
                            {activity.type === "user" ? "New Administrator" : "Candidate Enrolled"}
                          </p>
                          <p className="text-xs text-slate-500 font-medium truncate">{activity.name}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-[10px] font-bold text-slate-900">
                            {activity.date ? new Date(activity.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ""}
                          </p>
                          <p className="text-[9px] font-bold text-slate-300 uppercase mt-0.5">Success</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                      <Clock size={40} className="mb-4 opacity-20" />
                      <p className="text-sm font-medium">No recent system movements</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Users and Roles are now handled by separate routes in Dashboard.jsx
  // This component only handles dashboard, candidates, and positions

  if (currentView === "positions") {
    return <Positions />;
  }






  // Users View (deprecated - use users-roles instead)
  if (currentView === "users") {
    return (
      <div className="space-y-4">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xs font-bold text-navy-900">Users</h1>
            <p className="text-navy-700 mt-2">Manage users</p>
          </div>
          {hasPermission("USER", "CREATE") && (
            <button
              onClick={() => navigate("/dashboard/create-admin")}
              className="py-2 px-4 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-navy-900 font-semibold rounded-lg transition duration-200 flex items-center gap-2 shadow-lg"
            >
              <UserPlus size={20} />
              <span>Add Users</span>
            </button>
          )}
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-navy-900 text-white">
                <tr>
                  <th className="px-6 py-3 text-left text-[10px] font-medium">Email</th>
                  <th className="px-6 py-3 text-left text-[10px] font-medium">Full Name</th>
                  <th className="px-6 py-3 text-left text-[10px] font-medium">Role</th>
                  <th className="px-6 py-3 text-left text-[10px] font-medium">Status</th>
                  <th className="px-6 py-3 text-left text-[10px] font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center">Loading...</td>
                  </tr>
                ) : filteredAdmins.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">No users found</td>
                  </tr>
                ) : (
                  filteredAdmins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-[10px]">{admin.email}</td>
                      <td className="px-6 py-4 text-[10px]">{admin.fullName || "-"}</td>
                      <td className="px-6 py-4 text-[10px]">
                        <span className="px-2 py-1 bg-navy-100 text-navy-800 rounded text-xs font-medium">
                          {(() => {
                            if (typeof admin.role === 'string') {
                              return admin.role;
                            }
                            if (typeof admin.role === 'object' && admin.role !== null && admin.role.name) {
                              return admin.role.name;
                            }
                            return "-";
                          })()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[10px]">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${admin.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}>
                          {admin.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[10px]">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditAdmin(admin)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit User"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => { setSelectedAdmin(admin); setShowDeleteConfirmModal(true); }}
                            className="text-red-600 hover:text-red-800"
                            title="Delete User"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showCreateAdminModal && <CreateAdminModal />}
        {showEditAdminModal && <EditAdminModal />}
        {showDeleteConfirmModal && <DeleteConfirmModal />}
        <SnackbarAlert
          open={snackbar.open}
          message={snackbar.message}
          severity={snackbar.severity}
          onClose={handleCloseSnackbar}
        />
      </div>
    );
  }

  // Roles View (deprecated - use users-roles instead)
  if (currentView === "roles") {
    return (
      <div className="space-y-4">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xs font-bold text-navy-900">Roles</h1>
            <p className="text-navy-700 mt-2">Manage roles</p>
          </div>
          {hasPermission("ROLE", "CREATE") && (
            <button
              onClick={() => navigate("/dashboard/create-role")}
              className="py-2 px-4 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-navy-900 font-semibold rounded-lg transition duration-200 flex items-center gap-2 shadow-lg"
            >
              <Plus size={20} />
              <span>Add Role</span>
            </button>
          )}
        </div>

        {/* Roles Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-navy-900 text-white">
                <tr>
                  <th className="px-6 py-3 text-left text-[10px] font-medium">Role ID</th>
                  <th className="px-6 py-3 text-left text-[10px] font-medium">Role Name</th>
                  <th className="px-6 py-3 text-left text-[10px] font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-4 text-center">Loading...</td>
                  </tr>
                ) : roles.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-4 text-center text-gray-500">No roles found</td>
                  </tr>
                ) : (
                  roles.map((role) => (
                    <tr key={role.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-[10px]">{role.id}</td>
                      <td className="px-6 py-4 text-[10px]">
                        <span className="px-2 py-1 bg-navy-100 text-navy-800 rounded text-xs font-medium">
                          {role.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[10px]">
                        <button className="text-blue-600 hover:text-blue-800">
                          <Edit size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <SnackbarAlert
          open={snackbar.open}
          message={snackbar.message}
          severity={snackbar.severity}
          onClose={handleCloseSnackbar}
        />
      </div>
    );
  }

  // Default dashboard view
  return (
    <div className="space-y-4">
      <div className="mb-8">
        <h1 className="text-xs font-bold text-navy-900">Welcome Back! 👋</h1>
        <p className="text-xs text-navy-700 mt-1">Admin Dashboard Overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card border-l-4 border-gold-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-navy-700 text-[10px] font-medium mb-1">Total Admins</p>
              <p className="text-xs font-bold text-navy-900">{admins.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-navy-700">
              <UsersIcon size={24} className="text-white" />
            </div>
          </div>
        </div>

        <div className="card border-l-4 border-gold-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-navy-700 text-[10px] font-medium mb-1">Total Candidates</p>
              <p className="text-xs font-bold text-navy-900">{candidates.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-navy-600">
              <UserPlus size={24} className="text-white" />
            </div>
          </div>
        </div>

        <div className="card border-l-4 border-gold-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-navy-700 text-[10px] font-medium mb-1">Active Candidates</p>
              <p className="text-xs font-bold text-navy-900">
                {candidates.filter(c => c.registrationPaid).length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-gold-500">
              <Check size={24} className="text-white" />
            </div>
          </div>
        </div>

        <div className="card border-l-4 border-gold-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-navy-700 text-[10px] font-medium mb-1">Pending Payments</p>
              <p className="text-xs font-bold text-navy-900">
                {candidates.filter(c => !c.registrationPaid).length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-gold-600">
              <Mail size={24} className="text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;

