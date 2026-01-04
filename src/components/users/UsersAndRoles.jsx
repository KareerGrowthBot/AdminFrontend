import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, UserPlus, Shield, Edit, Trash2, Eye, Plus, Users, Filter, RefreshCw, MoreVertical } from "lucide-react";
import { adminService } from "../../services/adminService";
import { roleService } from "../../services/roleService";
import { hasPermission } from "../../utils/permissions";
import SnackbarAlert from "../common/SnackbarAlert";

const UsersAndRoles = ({ adminInfo }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "users";

  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  }; // "users" or "roles"
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [openActionMenuId, setOpenActionMenuId] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openActionMenuId && !event.target.closest('.action-menu-container')) {
        setOpenActionMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openActionMenuId]);

  const toggleActionMenu = (id, e) => {
    e.stopPropagation();
    setOpenActionMenuId(openActionMenuId === id ? null : id);
  };

  // Advanced Filter State
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    status: [], // ["active", "inactive"]
    role: "All", // Role ID or Name
    type: "All", // For Roles tab: "System", "Custom"
    orderBy: "newest", // "newest", "oldest", "name_asc", "name_desc"
  });
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const filterMenuRef = useRef(null);

  const isLoadingRef = useRef(false);

  // Close filter menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target)) {
        setIsFilterMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setFilters({
      dateFrom: "",
      dateTo: "",
      status: [],
      role: "All",
      type: "All",
      orderBy: "newest"
    });
    setSearchTerm("");
  };

  const hasActiveFilters = () => {
    return (
      filters.dateFrom !== "" ||
      filters.dateTo !== "" ||
      filters.status.length > 0 ||
      filters.role !== "All" ||
      filters.type !== "All" ||
      filters.orderBy !== "newest" ||
      searchTerm !== ""
    );
  };

  // Load users from organization database
  const loadUsers = async () => {
    if (isLoadingRef.current) return;

    // ... existing loadUsers code ...
    // Note: Since I can't see the full loadUsers function here, I'm assuming it continues safely.
    // The previous view showed it starts around line 67. 
    // I will just replace the state definitions and helpers.
    setLoading(true);
    isLoadingRef.current = true;
    try {
      // Prioritize organizationId from localStorage to ensure we get the scoped data
      const organizationId = localStorage.getItem('organizationId') || adminInfo?.organization?.organizationId;
      let data;

      console.log("Loading users for Organization ID:", organizationId);

      if (organizationId) {
        data = await adminService.getUsersByOrganizationId(organizationId);
      } else {
        // Only fallback to all admins if absolutely no org ID is found (e.g. Super Admin root view)
        console.warn("No Organization ID found, fetching all admins.");
        data = await adminService.getAllAdmins();
      }

      console.log("Users fetched:", data);

      // Handle potential response wrapping or direct array (robustness)
      let usersData = [];
      if (Array.isArray(data)) {
        usersData = data;
      } else if (data?.data && Array.isArray(data.data)) {
        usersData = data.data;
      } else if (data?.content && Array.isArray(data.content)) {
        usersData = data.content;
      } else if (data?.users && Array.isArray(data.users)) {
        usersData = data.users;
      }

      setUsers(usersData);
    } catch (error) {
      console.error("Error loading users:", error);
      showMessage("Failed to load users", "error");
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  };



  // Load roles
  const loadRoles = async () => {
    if (isLoadingRef.current) return;

    setLoading(true);
    isLoadingRef.current = true;

    try {
      const organizationId = localStorage.getItem('organizationId') || adminInfo?.organization?.organizationId;

      if (organizationId) {
        const data = await roleService.getRolesByOrganizationId(organizationId);
        console.log("Roles fetched for table:", data);

        // Handle potential response wrapping or direct array (robustness)
        let rolesData = [];
        if (Array.isArray(data)) {
          rolesData = data;
        } else if (data?.data && Array.isArray(data.data)) {
          rolesData = data.data;
        } else if (data?.content && Array.isArray(data.content)) {
          rolesData = data.content;
        }

        setRoles(rolesData);
      } else {
        const data = await roleService.getAllRoles();
        // Handle potential response wrapping for getAllRoles as well
        let rolesData = [];
        if (Array.isArray(data)) {
          rolesData = data;
        } else if (data?.data && Array.isArray(data.data)) {
          rolesData = data.data;
        } else if (data?.content && Array.isArray(data.content)) {
          rolesData = data.content;
        }
        setRoles(rolesData);
      }
    } catch (error) {
      console.error("Error loading roles:", error);
      const errorMessage = error?.response?.data?.error || error?.message || "Failed to load roles. Please try again.";
      showMessage(errorMessage, "error");
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  };



  useEffect(() => {
    setCurrentPage(1);
    if (activeTab === "users") {
      loadUsers();
    } else {
      loadRoles();
    }
  }, [activeTab, adminInfo?.organization?.organizationId]);

  const showMessage = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };


  // Fetch roles specifically for the filter dropdown (doesn't trigger main table loading state)
  const fetchRolesForFilter = async () => {
    try {
      const organizationId = adminInfo?.organization?.organizationId || localStorage.getItem('organizationId');
      // console.log("Fetching roles for org:", organizationId); 
      if (organizationId) {
        const data = await roleService.getRolesByOrganizationId(organizationId);
        console.log("Roles fetched:", data);

        // Handle potential response wrapping or direct array
        let rolesData = [];
        if (Array.isArray(data)) {
          rolesData = data;
        } else if (data?.data && Array.isArray(data.data)) {
          rolesData = data.data;
        } else if (data?.content && Array.isArray(data.content)) {
          rolesData = data.content;
        }

        if (rolesData.length > 0) {
          setRoles(rolesData);
        }
      }
    } catch (error) {
      console.error("Error fetching roles for filter:", error);
    }
  };

  const handleCreateUser = () => {
    navigate("/dashboard/users/create");
  };

  // ... (keeping existing handlers)

  // ...

  // Inside the render, finding the Filter button
  // Note: I need to target the Filter button specifically.


  const handleCreateRole = () => {
    navigate("/dashboard/roles/create");
  };

  const handleEditUser = (user) => {
    console.log("Edit user:", user);
    showMessage("Edit functionality coming soon", "info");
  };

  const handleEditRole = (role) => {
    console.log("Edit role:", role);
    showMessage("Edit functionality coming soon", "info");
  };

  const handleViewUser = (user) => {
    console.log("View user:", user);
    showMessage("View functionality coming soon", "info");
  };

  const handleViewRole = (role) => {
    console.log("View role:", role);
    showMessage("View functionality coming soon", "info");
  };

  const handleDeleteUser = async (userId) => {
    try {
      await adminService.deleteAdmin(userId);
      showMessage("User deleted successfully");
      setSelectedUser(null);
      setShowDeleteConfirmModal(false);
      loadUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      const errorMessage = error?.response?.data?.error || error?.message || "Failed to delete user. Please try again.";
      showMessage(errorMessage, "error");
    }
  };

  const handleDeleteRole = async (roleId) => {
    try {
      // TODO: Implement delete role API call
      showMessage("Delete role functionality coming soon", "info");
      setSelectedRole(null);
      setShowDeleteConfirmModal(false);
    } catch (error) {
      console.error("Error deleting role:", error);
      const errorMessage = error?.response?.data?.error || error?.message || "Failed to delete role. Please try again.";
      showMessage(errorMessage, "error");
    }
  };

  // Filter users based on search term
  // Filtered Users Logic
  const filteredUsers = (Array.isArray(users) ? users : []).filter((user) => {
    // 1. Text Search
    const matchesSearch =
      (user.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (user.fullName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (typeof user.role === "string" ? user.role : user.role?.name || "").toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // 2. Date Range Filter
    if (filters.dateFrom) {
      // Assuming user doesn't have createdAt, skipping date for users for now or we can check property.
      // If Users have 'createdAt' or 'created_at', uncomment below:
      // const userDate = new Date(user.createdAt || user.created_at || 0);
      // if (userDate < new Date(filters.dateFrom)) return false;
    }
    if (filters.dateTo) {
      // const userDate = new Date(user.createdAt || user.created_at || 0);
      // const toDate = new Date(filters.dateTo);
      // toDate.setDate(toDate.getDate() + 1);
      // if (userDate >= toDate) return false;
    }

    // 3. Status Filter
    if (filters.status.length > 0) {
      const userStatus = user.active ? "active" : "inactive";
      if (!filters.status.includes(userStatus)) return false;
    }

    // 4. Role Filter
    if (filters.role !== "All") {
      const roleName = typeof user.role === "string" ? user.role : user.role?.name;
      if (roleName !== filters.role) return false;
    }

    return true;
  }).sort((a, b) => {
    // Note: Assuming users might not have createdAt, but handling it just in case or using ID/other field if needed.
    // For sorting by name, we use fullName.
    if (filters.orderBy === "newest") return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    if (filters.orderBy === "oldest") return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    if (filters.orderBy === "name_asc") return (a.fullName || "").localeCompare(b.fullName || "");
    if (filters.orderBy === "name_desc") return (b.fullName || "").localeCompare(a.fullName || "");
    return 0;
  });

  // Filtered Roles Logic
  const filteredRoles = roles.filter((role) => {
    // 1. Text Search
    const matchesSearch =
      (role.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (role.code?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (role.organization?.organizationName || "").toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // 2. Date Range
    if (filters.dateFrom) {
      const roleDate = new Date(role.createdAt);
      if (roleDate < new Date(filters.dateFrom)) return false;
    }
    if (filters.dateTo) {
      const roleDate = new Date(role.createdAt);
      const toDate = new Date(filters.dateTo);
      toDate.setDate(toDate.getDate() + 1);
      if (roleDate >= toDate) return false;
    }

    // 3. Type Filter
    if (filters.type !== "All") {
      const isSystem = role.system;
      if (filters.type === "System" && !isSystem) return false;
      if (filters.type === "Custom" && isSystem) return false;
    }

    return true;
  }).sort((a, b) => {
    if (filters.orderBy === "newest") return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    if (filters.orderBy === "oldest") return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    if (filters.orderBy === "name_asc") return (a.name || "").localeCompare(b.name || "");
    if (filters.orderBy === "name_desc") return (b.name || "").localeCompare(a.name || "");
    return 0;
  });

  const getStatusBadgeClasses = (status, type = 'user') => {
    // Common base classes from CandidateDatabase
    let baseClasses = "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset";

    if (type === 'user') {
      const isActive = status === true || status === 'Active';
      if (isActive) {
        return `${baseClasses} bg-green-50 text-green-700 ring-green-600/20`;
      }
      return `${baseClasses} bg-red-50 text-red-700 ring-red-600/20`;
    }

    if (type === 'role') {
      const isSystem = status === true || status === 'System';
      if (isSystem) {
        // System -> Purple (like INVITED)
        return `${baseClasses} bg-purple-50 text-purple-700 ring-purple-600/20`;
      }
      // Custom -> Cyan (like MANUALLY INVITED) or Blue
      return `${baseClasses} bg-cyan-50 text-cyan-700 ring-cyan-600/20`;
    }

    return baseClasses;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Access Control</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage users and roles in your organization</p>
        </div>
      </div>

      {/* Standard Controls (Search, Filter, Actions) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
        {/* Page Size Selector (Placeholder for UI consistency) */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <label className="text-xs text-gray-900 font-medium">Show</label>
          <select
            className="rounded-md border-gray-300 text-xs py-1.5 px-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none shadow-sm"
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            {[10, 20, 30, 40, 50].map((val) => (<option key={val} value={val}>{val}</option>))}
          </select>
          <span className="text-xs text-gray-900">Entries</span>
        </div>

        {/* Search Input */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <input
              type="text"
              placeholder={activeTab === "users" ? "Search users by email, name, or role..." : "Search roles by name or code..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-md pl-3 pr-3 py-1.5 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap justify-start sm:justify-end flex-shrink-0">
          <div className="relative" ref={filterMenuRef}>
            <button
              onClick={() => {
                if (!isFilterMenuOpen && activeTab === "users") {
                  fetchRolesForFilter();
                }
                setIsFilterMenuOpen(!isFilterMenuOpen);
              }}
              className={`p-1.5 ${hasActiveFilters() ? 'text-blue-700 bg-blue-50' : 'text-gray-500 hover:text-blue-700 hover:bg-gray-100'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition relative debug-filter-btn`}
              title="Filter"
            >
              <Filter size={20} className="h-5 w-5" />
              {hasActiveFilters() && (
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-blue-700 rounded-full"></span>
              )}
            </button>

            {isFilterMenuOpen && (
              <div className="absolute top-full right-0 z-50 mt-2 w-72 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none animate-in fade-in zoom-in-95 duration-100">
                <div className="p-4 text-xs space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">

                  {/* Date Range */}
                  <div>
                    <label className="block text-gray-900 font-medium mb-1">From Date</label>
                    <input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-900 font-medium mb-1">To Date</label>
                    <input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>

                  {/* Order By */}
                  <div>
                    <span className="block text-gray-900 font-medium mb-1">Order By</span>
                    <div className="space-y-0">
                      {[
                        { label: 'Newest First', value: 'newest' },
                        { label: 'Oldest First', value: 'oldest' },
                        { label: 'Name (A-Z)', value: 'name_asc' },
                        { label: 'Name (Z-A)', value: 'name_desc' },
                      ].map(({ label, value }) => (
                        <label key={value} className="flex items-center text-gray-900 cursor-pointer hover:bg-slate-50 py-0.5 px-1 rounded">
                          <input
                            type="radio"
                            name="orderBy"
                            value={value}
                            checked={filters.orderBy === value}
                            onChange={(e) => handleFilterChange('orderBy', e.target.value)}
                            className="mr-2 h-3.5 w-3.5 text-blue-700 focus:ring-blue-500 border-gray-300"
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Users Specific Filters */}
                  {activeTab === "users" && (
                    <>
                      <div>
                        <span className="block text-gray-900 font-medium mb-1">Status</span>
                        <div className="space-y-0">
                          {['active', 'inactive'].map((status) => (
                            <label key={status} className="flex items-center text-gray-900 cursor-pointer hover:bg-slate-50 py-0.5 px-1 rounded">
                              <input
                                type="checkbox"
                                checked={filters.status.includes(status)}
                                onChange={() => {
                                  const newStatus = filters.status.includes(status)
                                    ? filters.status.filter(s => s !== status)
                                    : [...filters.status, status];
                                  handleFilterChange('status', newStatus);
                                }}
                                className="mr-2 h-3.5 w-3.5 text-blue-700 border-gray-300 rounded focus:ring-blue-500"
                              />
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="block text-gray-900 font-medium mb-1">Role</span>
                        <select
                          value={filters.role}
                          onChange={(e) => handleFilterChange('role', e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-blue-500 focus:border-blue-500 outline-none"
                        >
                          <option value="All">All Roles</option>
                          {/* Unique roles from loaded users or roles list */}
                          {Array.isArray(roles) && [...new Set(roles.map(r => r.name).filter(Boolean))].map(roleName => (
                            <option key={roleName} value={roleName}>{roleName}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  {/* Roles Specific Filters */}
                  {activeTab === "roles" && (
                    <div>
                      <span className="block text-gray-900 font-medium mb-1">Type</span>
                      <div className="space-y-0">
                        {['All', 'System', 'Custom'].map(type => (
                          <label key={type} className="flex items-center cursor-pointer hover:bg-slate-50 py-0.5 px-1 rounded">
                            <input
                              type="radio"
                              name="roleType"
                              checked={filters.type === type}
                              onChange={() => handleFilterChange('type', type)}
                              className="mr-2 h-3.5 w-3.5 text-blue-700"
                            />
                            {type}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

                {/* Footer buttons */}
                <div className="p-2 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={clearAllFilters}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => {
              if (activeTab === "users") loadUsers();
              else loadRoles();
            }}
            title="Refresh Data"
            className="p-1.5 text-gray-500 hover:text-blue-700 hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            disabled={loading}
          >
            <div className={`h-5 w-5 flex items-center justify-center ${loading ? 'animate-spin' : ''}`}>
              <RefreshCw size={20} />
            </div>
          </button>

          <button
            onClick={() => setActiveTab(activeTab === "users" ? "roles" : "users")}
            className="inline-flex items-center gap-x-1.5 rounded-md bg-white border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all"
          >
            {activeTab === "users" ? (
              <>
                <Shield className="-ml-0.5 h-4 w-4" aria-hidden="true" />
                Show Roles
              </>
            ) : (
              <>
                <UserPlus className="-ml-0.5 h-4 w-4" aria-hidden="true" />
                Show Users
              </>
            )}
          </button>

          {activeTab === "users" && hasPermission("USER", "CREATE") && (
            <button
              onClick={handleCreateUser}
              className="inline-flex items-center gap-x-1.5 rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all"
            >
              <Plus className="-ml-0.5 h-4 w-4" aria-hidden="true" />
              Add User
            </button>
          )}

          {activeTab === "roles" && hasPermission("ROLE", "CREATE") && (
            <button
              onClick={handleCreateRole}
              className="inline-flex items-center gap-x-1.5 rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all"
            >
              <Plus className="-ml-0.5 h-4 w-4" aria-hidden="true" />
              Add Role
            </button>
          )}
        </div>
      </div>

      {/* Users Table */}
      {/* Users Table */}
      {activeTab === "users" && (
        <div className="bg-transparent flex flex-col">
          <div className="w-full">
            <table className="min-w-full border-separate" style={{ borderSpacing: '0 8px' }}>
              <thead className="sticky top-0 z-10 bg-qwikBlue shadow-sm">
                <tr className="rounded-md h-12 mb-4">
                  <th className="px-6 py-2.5 text-left text-xs font-semibold text-white bg-qwikBlue rounded-l-lg">UserId</th>
                  <th className="px-6 py-2.5 text-left text-xs font-semibold text-white bg-qwikBlue">Name</th>
                  <th className="px-6 py-2.5 text-left text-xs font-semibold text-white bg-qwikBlue">Email</th>
                  <th className="px-6 py-2.5 text-left text-xs font-semibold text-white bg-qwikBlue">Role</th>
                  <th className="px-6 py-2.5 text-left text-xs font-semibold text-white bg-qwikBlue">Mobile Number</th>
                  <th className="px-6 py-2.5 text-left text-xs font-semibold text-white bg-qwikBlue">Status</th>
                  <th className="px-6 py-2.5 text-left text-xs font-semibold text-white bg-qwikBlue rounded-r-lg">Action</th>
                </tr>
              </thead>
              <tbody className="bg-transparent">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-sm text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        Loading users...
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-sm text-gray-500">
                      {searchTerm ? "No users found matching your search" : "No users found"}
                    </td>
                  </tr>
                ) : (
                  filteredUsers
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((user) => (
                      <tr key={user.id} className="bg-white shadow-sm hover:shadow-md transition-shadow group rounded-md">
                        <td className="px-6 py-2 rounded-l-lg border-l border-y border-gray-100 text-xs font-medium text-black">
                          {user.userCode || "N/A"}
                        </td>
                        <td className="px-6 py-2 border-y border-gray-100 text-xs text-black">
                          {user.fullName || "Anonymous"}
                        </td>
                        <td className="px-6 py-2 border-y border-gray-100 text-xs text-black">
                          {user.email}
                        </td>
                        <td className="px-6 py-2 border-y border-gray-100 text-xs">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-black border border-blue-200">
                            {typeof user.role === 'string' ? user.role : user.role?.name || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-2 border-y border-gray-100 text-xs text-black">
                          {user.phone || "N/A"}
                        </td>
                        <td className="px-6 py-2 border-y border-gray-100 text-xs">
                          <span className={getStatusBadgeClasses(user.active, 'user')}>
                            {user.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-2 rounded-r-lg border-r border-y border-gray-100 text-xs">
                          <div className="relative action-menu-container">
                            <button
                              onClick={(e) => toggleActionMenu(user.id, e)}
                              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                            >
                              <MoreVertical size={16} />
                            </button>

                            {openActionMenuId === user.id && (
                              <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50 py-1">
                                {hasPermission("USER", "READ") && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setOpenActionMenuId(null); handleViewUser(user); }}
                                    className="flex items-center w-full px-4 py-2 text-xs text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                                  >
                                    <Eye size={12} className="mr-2" />
                                    View
                                  </button>
                                )}
                                {hasPermission("USER", "UPDATE") && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setOpenActionMenuId(null); handleEditUser(user); }}
                                    className="flex items-center w-full px-4 py-2 text-xs text-gray-700 hover:bg-gray-100 hover:text-navy-600"
                                  >
                                    <Edit size={12} className="mr-2" />
                                    Edit
                                  </button>
                                )}
                                {hasPermission("USER", "DELETE") && adminInfo?.id !== user.id && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setOpenActionMenuId(null); setSelectedUser(user); setShowDeleteConfirmModal(true); }}
                                    className="flex items-center w-full px-4 py-2 text-xs text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 size={12} className="mr-2" />
                                    Delete
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer for Users */}
          {filteredUsers.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50 mt-4 rounded-lg">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs text-gray-700">
                    Showing <span className="font-medium">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredUsers.length)}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> of <span className="font-medium">{filteredUsers.length}</span> entries
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex items-center gap-2" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <span className="text-xs text-gray-700 font-medium px-2">
                      Page {currentPage}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => (prev * itemsPerPage < filteredUsers.length ? prev + 1 : prev))}
                      disabled={currentPage * itemsPerPage >= filteredUsers.length}
                      className="relative inline-flex items-center px-2 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )
      }

      {/* Roles Table */}
      {
        activeTab === "roles" && (
          <div className="bg-transparent flex flex-col">
            <div className="w-full">
              <table className="min-w-full border-separate" style={{ borderSpacing: '0 8px' }}>
                <thead className="sticky top-0 z-10 bg-qwikBlue shadow-sm">
                  <tr className="rounded-md h-12 mb-4">
                    <th className="px-6 py-2.5 text-left text-xs font-semibold text-white bg-qwikBlue rounded-l-lg">Code</th>
                    <th className="px-6 py-2.5 text-left text-xs font-semibold text-white bg-qwikBlue">Name</th>
                    <th className="px-6 py-2.5 text-left text-xs font-semibold text-white bg-qwikBlue">Organization</th>
                    <th className="px-6 py-2.5 text-left text-xs font-semibold text-white bg-qwikBlue">Type</th>
                    <th className="px-6 py-2.5 text-left text-xs font-semibold text-white bg-qwikBlue">Created At</th>
                    <th className="px-6 py-2.5 text-left text-xs font-semibold text-white bg-qwikBlue rounded-r-lg">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-transparent">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-sm text-gray-500 bg-white rounded-xl shadow-sm">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          Loading roles...
                        </div>
                      </td>
                    </tr>
                  ) : filteredRoles.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-sm text-gray-500 bg-white rounded-xl shadow-sm">
                        {searchTerm ? "No roles found matching your search" : "No roles found"}
                      </td>
                    </tr>
                  ) : (
                    filteredRoles
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((role) => (
                        <tr key={role.id} className="bg-white shadow-sm hover:shadow-md transition-shadow group rounded-md">
                          <td className="px-6 py-2 rounded-l-lg border-l border-y border-gray-100 text-xs font-medium text-black">
                            {role.code || "-"}
                          </td>
                          <td className="px-6 py-2 border-y border-gray-100 text-xs font-medium text-black">{role.name}</td>
                          <td className="px-6 py-2 border-y border-gray-100 text-xs font-medium text-black">
                            {role.organization?.organizationName || <span className="text-black">Global</span>}
                          </td>
                          <td className="px-6 py-2 border-y border-gray-100 text-xs">
                            <span className={getStatusBadgeClasses(role.system, 'role')}>
                              {role.system ? "System" : "Custom"}
                            </span>
                          </td>
                          <td className="px-6 py-2 border-y border-gray-100 text-xs font-medium text-black">
                            {role.createdAt ? new Date(role.createdAt).toLocaleDateString() : "-"}
                          </td>
                          <td className="px-6 py-2 rounded-r-lg border-r border-y border-gray-100 text-xs">
                            <div className="relative action-menu-container">
                              <button
                                onClick={(e) => toggleActionMenu(role.id, e)}
                                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                              >
                                <MoreVertical size={16} />
                              </button>

                              {openActionMenuId === role.id && (
                                <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50 py-1">
                                  {hasPermission("ROLE", "READ") && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setOpenActionMenuId(null); handleViewRole(role); }}
                                      className="flex items-center w-full px-4 py-2 text-xs text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                                    >
                                      <Eye size={12} className="mr-2" />
                                      View
                                    </button>
                                  )}
                                  {hasPermission("ROLE", "UPDATE") && !role.system && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setOpenActionMenuId(null); handleEditRole(role); }}
                                      className="flex items-center w-full px-4 py-2 text-xs text-gray-700 hover:bg-gray-100 hover:text-navy-600"
                                    >
                                      <Edit size={12} className="mr-2" />
                                      Edit
                                    </button>
                                  )}
                                  {hasPermission("ROLE", "DELETE") && !role.system && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setOpenActionMenuId(null); setSelectedRole(role); setShowDeleteConfirmModal(true); }}
                                      className="flex items-center w-full px-4 py-2 text-xs text-red-600 hover:bg-red-50"
                                    >
                                      <Trash2 size={12} className="mr-2" />
                                      Delete
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer for Roles */}
            {filteredRoles.length > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50 mt-4 rounded-lg">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs text-gray-700">
                      Showing <span className="font-medium">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredRoles.length)}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredRoles.length)}</span> of <span className="font-medium">{filteredRoles.length}</span> entries
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex items-center gap-2" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <span className="text-xs text-gray-700 font-medium px-2">
                        Page {currentPage}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => (prev * itemsPerPage < filteredRoles.length ? prev + 1 : prev))}
                        disabled={currentPage * itemsPerPage >= filteredRoles.length}
                        className="relative inline-flex items-center px-2 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Next</span>
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      }

      {/* Delete Confirmation Modal */}
      {
        showDeleteConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xs font-bold text-navy-900">
                  Delete {activeTab === "users" ? "User" : "Role"}
                </h2>
                <button
                  onClick={() => {
                    setShowDeleteConfirmModal(false);
                    setSelectedUser(null);
                    setSelectedRole(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <p className="text-[10px] text-navy-700 mb-4">
                Are you sure you want to delete this {activeTab === "users" ? "user" : "role"}?
              </p>
              <div className="mb-4 text-[10px] text-navy-600">
                {activeTab === "users" && selectedUser && (
                  <>
                    <strong>Email:</strong> {selectedUser.email}<br />
                    <strong>Name:</strong> {selectedUser.fullName || "N/A"}
                  </>
                )}
                {activeTab === "roles" && selectedRole && (
                  <>
                    <strong>Name:</strong> {selectedRole.name}<br />
                    <strong>Code:</strong> {selectedRole.code || "N/A"}
                  </>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    if (activeTab === "users" && selectedUser) {
                      handleDeleteUser(selectedUser.id);
                    } else if (activeTab === "roles" && selectedRole) {
                      handleDeleteRole(selectedRole.id);
                    }
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition duration-200 text-[10px]"
                >
                  Delete
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirmModal(false);
                    setSelectedUser(null);
                    setSelectedRole(null);
                  }}
                  className="px-4 py-2 border-2 border-gold-300 hover:border-gold-600 text-gold-700 hover:text-gold-600 font-medium rounded-lg transition duration-200 text-[10px]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )
      }

      <SnackbarAlert
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={handleCloseSnackbar}
      />
    </div >
  );
};

export default UsersAndRoles;

