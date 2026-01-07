import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Users as UsersIcon, UserPlus, Settings, Briefcase, Shield, FileText, Search, Edit, Eye, Trash2, X, Check, XCircle, AlertCircle, ToggleLeft, ToggleRight, Loader, RefreshCw, Filter, ChevronDown, Plus, MoreVertical } from "lucide-react";
import { adminService } from "../../services/adminService";
import { hasPermission } from "../../utils/permissions";
import SnackbarAlert from "../common/SnackbarAlert";

const Users = ({ adminInfo }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedUserPermissions, setSelectedUserPermissions] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [editingUser, setEditingUser] = useState({ fullName: "", phone: "" });
  const [togglingStatus, setTogglingStatus] = useState(false);

  // Pagination State
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRefs = useRef({});

  // Pagination helper
  const getPaginationItems = (current, total) => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i);
    if (current < 3) return [0, 1, 2, 3, '...', total - 1];
    if (current > total - 4) return [0, '...', total - 4, total - 3, total - 2, total - 1];
    return [0, '...', current - 1, current, current + 1, '...', total - 1];
  };
  const isLoadingRef = useRef(false);

  const getRoleName = (role) => {
    return (role || "N/A").toUpperCase().replace(/_/g, " ");
  };

  // Load users from backend
  const loadUsers = async (refresh = false) => {
    if (isLoadingRef.current && !refresh) return;

    setLoading(true);
    isLoadingRef.current = true;

    try {
      let response;
      const organizationId = adminInfo?.organization?.organizationId || localStorage.getItem('organizationId');

      if (organizationId) {
        response = await adminService.getUsersByOrganizationId(organizationId);
      } else {
        const params = {
          page: currentPage,
          size: pageSize,
          search: searchTerm
        };
        response = await adminService.getAllAdmins(params);
      }

      console.log("Loaded users:", response);

      let usersData = [];

      if (response && response.content) {
        usersData = response.content;
      } else if (Array.isArray(response)) {
        usersData = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        usersData = response.data;
      }

      setUsers(usersData);
    } catch (error) {
      console.error("Error loading users:", error);
      const errorMessage = error?.response?.data?.error || error?.message || "Failed to load users. Please try again.";
      showMessage(errorMessage, "error");
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  };

  // Handle view permissions
  const handleViewPermissions = (user) => {
    // Permissions should be in the user object from the API response
    const permissions = user.permissions || [];
    setSelectedUserPermissions(permissions);
    setSelectedUser(user);
    setShowPermissionsModal(true);
  };

  useEffect(() => {
    loadUsers();
  }, [currentPage, pageSize, adminInfo?.organization?.organizationId]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close if clicking outside any open menu
      if (openMenuId && menuRefs.current[openMenuId] && !menuRefs.current[openMenuId].contains(event.target)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenuId]);

  const showMessage = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleCreate = () => {
    navigate("/dashboard/users/create");
  };

  const handleEdit = async (user) => {
    try {
      const userDetails = await adminService.getAdminById(user.id);
      setEditingUser({
        fullName: userDetails.fullName || "",
        phone: userDetails.phone || ""
      });
      setSelectedUser(userDetails);
      setShowEditModal(true);
    } catch (error) {
      console.error("Error loading user details:", error);
      showMessage("Failed to load user details", "error");
    }
  };

  const handleView = async (user) => {
    try {
      const userDetails = await adminService.getAdminById(user.id);
      setSelectedUser(userDetails);
      setShowViewModal(true);
    } catch (error) {
      console.error("Error loading user details:", error);
      showMessage("Failed to load user details", "error");
    }
  };

  const handleSaveEdit = async () => {
    try {
      await adminService.updateAdmin(selectedUser.id, {
        fullName: editingUser.fullName,
        phone: editingUser.phone
      });
      showMessage("User updated successfully");
      setShowEditModal(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      const errorMessage = error?.response?.data?.error || error?.message || "Failed to update user. Please try again.";
      showMessage(errorMessage, "error");
    }
  };

  const handleToggleStatus = async (user) => {
    if (togglingStatus) return;

    setTogglingStatus(true);
    try {
      if (user.active) {
        await adminService.deactivateAdmin(user.id);
        showMessage("User deactivated successfully");
      } else {
        await adminService.activateAdmin(user.id);
        showMessage("User activated successfully");
      }
      loadUsers();
    } catch (error) {
      console.error("Error toggling user status:", error);
      const errorMessage = error?.response?.data?.error || error?.message || "Failed to update user status. Please try again.";
      showMessage(errorMessage, "error");
    } finally {
      setTogglingStatus(false);
    }
  };

  // Filter users based on search term - ensure users is always an array
  const filteredUsers = Array.isArray(users) ? users.filter(user =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (typeof user.role === 'string' ? user.role.toLowerCase() : user.role?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  ) : [];

  const getStatusBadgeClasses = (status) => {
    const isActive = status === true || status === 'Active';
    let baseClasses = "inline-flex items-center rounded-md px-2 py-1 text-[10px] font-medium ring-1 ring-inset";

    if (isActive) {
      return `${baseClasses} bg-green-50 text-green-700 ring-green-600/20`;
    }
    return `${baseClasses} bg-gray-100 text-gray-600 ring-gray-500/20`;
  };

  // Pagination Logic
  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startEntry = totalItems > 0 ? currentPage * pageSize + 1 : 0;
  const endEntry = totalItems > 0 ? Math.min((currentPage + 1) * pageSize, totalItems) : 0;
  const currentTableData = filteredUsers.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const paginationItems = getPaginationItems(currentPage, totalPages);



  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Management</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Orchestrate and supervise your administrator network.</p>
        </div>

      </div>

      {/* Standard Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
        {/* Page Size Selector */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <label htmlFor="pageSize" className="text-xs text-gray-900 font-medium">Show</label>
          <select
            id="pageSize"
            value={pageSize}
            onChange={(e) => { setPageSize(parseInt(e.target.value)); setCurrentPage(0); }}
            className="rounded-md border-gray-300 text-xs py-1.5 px-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none shadow-sm"
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
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(0); }}
              placeholder="Search by name, email, or role..."
              className="w-full border border-gray-300 rounded-md pl-3 pr-3 py-1.5 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap justify-start sm:justify-end flex-shrink-0">
          <div className="relative">
            <button
              onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
              className="p-1.5 text-gray-500 hover:text-blue-700 hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              title="Filter"
            >
              <Filter className="h-5 w-5" />
            </button>
          </div>
          <button
            onClick={() => loadUsers(true)}
            title="Refresh Data"
            className="p-1.5 text-gray-500 hover:text-blue-700 hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            disabled={loading}
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {hasPermission("USER", "CREATE") && (
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-x-1.5 rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all"
            >
              <Plus className="-ml-0.5 h-4 w-4" aria-hidden="true" />
              Add User
            </button>
          )}
        </div>
      </div>

      {/* Modern Table Container */}
      <div className="w-full mt-1">
        <div className="w-full">
          <table className="min-w-full border-separate" style={{ borderSpacing: '0 8px' }}>
            <thead className="sticky top-0 z-10 bg-qwikBlue shadow-sm">
              <tr className="rounded-md h-12 mb-4">
                <th className="px-6 py-2.5 text-left text-xs font-semibold text-white tracking-wider rounded-l-lg">User ID</th>
                <th className="px-6 py-2.5 text-left text-xs font-semibold text-white tracking-wider">User</th>
                <th className="px-6 py-2.5 text-left text-xs font-semibold text-white tracking-wider">Role Level</th>
                <th className="px-6 py-2.5 text-left text-xs font-semibold text-white tracking-wider">Identity Contact</th>
                <th className="px-6 py-2.5 text-left text-xs font-semibold text-white tracking-wider">Current Status</th>
                <th className="px-6 py-2.5 text-left text-xs font-semibold text-white tracking-wider rounded-r-lg">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-transparent">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                      <p className="text-sm font-bold text-slate-400">Loading users...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-30 grayscale">
                      <Search size={48} className="text-slate-900" />
                      <p className="text-lg font-black text-slate-900">{searchTerm ? "No matches found" : "No users onboarded"}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentTableData.map((user) => (
                  <tr key={user.id} className="bg-white shadow-sm hover:shadow-md transition-shadow group rounded-md">
                    <td className="px-6 py-2 rounded-l-lg border-l border-y border-gray-100">
                      <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                        {user.userCode || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-2 border-y border-gray-100">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium text-slate-900 truncate max-w-[200px]">{user.fullName || "Anonymous"}</span>
                        <span className="text-[11px] font-medium text-slate-400 lowercase">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-2 border-y border-gray-100">
                      <div className="flex flex-col gap-0.5">
                        <span className="flex items-center gap-1.5 px-3 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-medium rounded-lg w-fit outline outline-1 outline-blue-100">
                          {getRoleName(user.role)}
                        </span>
                        <button
                          onClick={() => handleViewPermissions(user)}
                          className="text-[10px] font-medium text-slate-400 hover:text-blue-500 transition-colors mt-0.5 text-left bg-transparent"
                        >
                          View Privileges
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-2 border-y border-gray-100">
                      <span className="text-[11px] font-medium text-slate-700">{user.phone || "No contact"}</span>
                      <p className="text-[9px] font-medium text-slate-400 mt-0">Verified Identity</p>
                    </td>
                    <td className="px-6 py-2 border-y border-gray-100">
                      <span className={getStatusBadgeClasses(user.active)}>
                        {user.active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-6 py-2 rounded-r-lg border-r border-y border-gray-100">
                      <div className="relative flex justify-start" ref={el => menuRefs.current[user.id] = el}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === user.id ? null : user.id);
                          }}
                          className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-full transition-all"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {openMenuId === user.id && (
                          <div className="absolute right-0 mt-8 w-48 bg-white rounded-xl shadow-xl z-50 border border-slate-100 py-1.5 animate-in fade-in zoom-in-95 duration-200">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(null);
                                handleView(user);
                              }}
                              className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2 transition-all"
                            >
                              <Eye size={14} /> View Details
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(null);
                                handleEdit(user);
                              }}
                              className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2 transition-all"
                            >
                              <Edit size={14} /> Edit Profile
                            </button>
                            <div className="h-px bg-slate-50 my-1" />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(null);
                                handleToggleStatus(user);
                              }}
                              disabled={togglingStatus}
                              className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center gap-2 transition-all ${user.active
                                ? 'text-red-600 hover:bg-red-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                                }`}
                            >
                              {user.active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                              {user.active ? "Deactivate User" : "Activate User"}
                            </button>
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

        {/* Pagination Footer */}
        {totalItems > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-xs text-gray-700">
                  Showing <span className="font-medium">{startEntry}</span> to <span className="font-medium">{endEntry}</span> of <span className="font-medium">{totalItems}</span> entries
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex items-center gap-2" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                    className="relative inline-flex items-center px-3 py-1.5 rounded-md border border-gray-300 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-300 transition-colors"
                  >
                    Prev
                  </button>
                  {paginationItems.map((item, index) => {
                    if (typeof item === 'string') {
                      return <span key={index} className="relative inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700">...</span>;
                    }
                    return (
                      <button
                        key={index}
                        onClick={() => setCurrentPage(item)}
                        className={`relative inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${currentPage === item
                          ? 'bg-blue-700 text-white shadow-sm hover:bg-blue-800'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                      >
                        {item + 1}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={currentPage === totalPages - 1}
                    className="relative inline-flex items-center px-3 py-1.5 rounded-md border border-gray-300 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-300 transition-colors"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Refined Modals */}
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-[60] p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col scale-in duration-300">
            <div className="flex justify-between items-center p-6 border-b border-slate-50 bg-slate-50/50">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">User Dossier</h2>
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-0.5">Comprehensive identity profile</p>
              </div>
              <button onClick={() => setShowViewModal(false)} className="w-10 h-10 flex items-center justify-center bg-white rounded-full text-slate-400 hover:text-slate-900 shadow-sm border border-slate-100 transition-all hover:-rotate-90">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-6 mb-2">
                <div className="w-16 h-16 bg-slate-900 rounded-xl flex items-center justify-center text-white text-2xl font-black">
                  {selectedUser.fullName?.[0] || selectedUser.email?.[0]?.toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">{selectedUser.fullName || "Anonymous Agent"}</h3>
                  <p className="text-sm font-medium text-slate-400">{selectedUser.email}</p>
                  <p className="mt-2 flex items-center gap-1.5 px-3 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full w-fit">
                    {getRoleName(selectedUser.role)} Office
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-50">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Ident</p>
                  <p className="text-sm font-bold text-slate-700">#{selectedUser.id?.slice(-8).toUpperCase() || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Line</p>
                  <p className="text-sm font-bold text-slate-700">{selectedUser.phone || "Unverified"}</p>
                </div>
                <div className="space-y-1 text-left">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Creation Date</p>
                  <p className="text-sm font-bold text-slate-700">{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Portal Status</p>
                  <p className={`text - sm font - bold ${selectedUser.active ? 'text-emerald-500' : 'text-slate-400'} `}>
                    {selectedUser.active ? "Full Access" : "Restricted"}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-5 bg-slate-50 border-t border-slate-100">
              <button onClick={() => setShowViewModal(false)} className="w-full py-3 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg hover:bg-slate-800 transition-all">Dismiss Portal View</button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6 pb-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Edit Identity</h2>
              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">Update administrator credentials</p>
            </div>
            <div className="p-6 pt-2 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Fixed Reference</label>
                <input type="text" value={selectedUser.email || ""} disabled className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-400 cursor-not-allowed opacity-60" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Full Identity</label>
                <input
                  type="text"
                  value={editingUser.fullName}
                  onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
                  className="w-full px-5 py-3 border border-slate-100 bg-white focus:border-indigo-100 focus:bg-slate-50/50 rounded-2xl transition-all text-xs font-bold text-slate-900 outline-none"
                  placeholder="e.g. Victor Krum"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Secure Contact</label>
                <input
                  type="text"
                  value={editingUser.phone}
                  onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                  className="w-full px-5 py-3 border border-slate-100 bg-white focus:border-indigo-100 focus:bg-slate-50/50 rounded-2xl transition-all text-xs font-bold text-slate-900 outline-none"
                  placeholder="+1 234 567 890"
                />
              </div>
            </div>
            <div className="p-6 pt-0 flex gap-3">
              <button onClick={handleSaveEdit} className="flex-1 py-3 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">Apply Modification</button>
              <button onClick={() => setShowEditModal(false)} className="flex-1 py-3 bg-slate-50 text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-xl border border-slate-100 hover:bg-slate-100 transition-all">Abort</button>
            </div>
          </div>
        </div>
      )}

      {showPermissionsModal && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Security Privileges</h2>
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5">{selectedUser.fullName || selectedUser.email}</p>
              </div>
              <button onClick={() => setShowPermissionsModal(false)} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 shadow-sm border border-slate-100 transition-all">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto space-y-3 scrollbar-hide">
              {selectedUserPermissions && selectedUserPermissions.length > 0 ? (
                selectedUserPermissions.map((perm, index) => {
                  const feature = perm.featureName || perm.feature || "-";
                  const scopes = perm.permissionScopes || perm.scopes || [];
                  return (
                    <div key={index} className="p-5 bg-slate-50/50 border border-slate-100 rounded-2xl hover:shadow-inner transition-all group">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                          <Shield size={16} />
                        </div>
                        <span className="text-xs font-black text-slate-900 tracking-tight uppercase">{feature}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {scopes.map((scope, sIdx) => (
                          <span key={sIdx} className="px-3 py-1.5 bg-white text-slate-600 text-[10px] font-bold rounded-xl border border-slate-100 shadow-sm">
                            {scope}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="py-16 flex flex-col items-center justify-center opacity-30 grayscale">
                  <Shield size={64} className="text-slate-900" />
                  <p className="text-sm font-black text-slate-900 mt-4 uppercase">Zero Credentials Assigned</p>
                </div>
              )}
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100">
              <button onClick={() => setShowPermissionsModal(false)} className="w-full py-3 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg hover:bg-slate-800 transition-all">Acknowledge Privileges</button>
            </div>
          </div>
        </div>
      )}

      <SnackbarAlert
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={handleCloseSnackbar}
      />
    </div >
  );
};

export default Users;

