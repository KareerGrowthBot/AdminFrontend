import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Users, UserPlus, Settings, Briefcase, Shield, FileText, Search, Edit, Eye, Trash2, X, Check, XCircle, AlertCircle, ToggleLeft, ToggleRight, Loader, RefreshCw, Filter, Plus, MoreVertical } from "lucide-react";
import { positionService } from "../../services/positionService";
import { questionSetService } from "../../services/questionSetService";
import { hasPermission } from "../../utils/permissions";
import PositionForm from "./PositionForm";
import SnackbarAlert from "../common/SnackbarAlert";
import { useSubscription } from "../../providers/SubscriptionProvider";
import AccessDenied from "../common/AccessDenied";
import SubscriptionExpired from "../common/SubscriptionExpired";
import PermissionWrapper from "../common/PermissionWrapper";
import { BookOpen } from "lucide-react";

const Positions = () => {
  const navigate = useNavigate();
  const { isSubscriptionActive, loading: subscriptionLoading } = useSubscription();
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPosition, setEditingPosition] = useState(null);
  const [viewingPosition, setViewingPosition] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showViewModal, setShowViewModal] = useState(false);
  // Pagination State
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [activeActionMenu, setActiveActionMenu] = useState(null);

  // Read-only questions modal state
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [questionsList, setQuestionsList] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);

  const isLoadingRef = useRef(false);
  const hasLoadedRef = useRef(false);

  // Pagination helper
  const getPaginationItems = (current, total) => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i);
    if (current < 3) return [0, 1, 2, 3, '...', total - 1];
    if (current > total - 4) return [0, '...', total - 4, total - 3, total - 2, total - 1];
    return [0, '...', current - 1, current, current + 1, '...', total - 1];
  };

  useEffect(() => {
    if (!hasLoadedRef.current && !isLoadingRef.current) {
      loadData();
    }

    const handleClickOutside = (event) => {
      if (activeActionMenu && !event.target.closest('.action-menu-container')) {
        setActiveActionMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeActionMenu]);

  const loadData = async (forceReload = false) => {
    // Prevent duplicate calls
    if (isLoadingRef.current) {
      return;
    }

    // Don't reload if data already exists and not forcing reload
    if (!forceReload && hasLoadedRef.current && positions.length > 0) {
      return;
    }

    isLoadingRef.current = true;

    try {
      setLoading(true);

      const organizationId = localStorage.getItem('organizationId');

      // Load positions - API now returns paginated response with content array
      const response = await positionService.getAllPositions({ organizationId });

      // Handle paginated response (PageResponseDTO) or direct array
      let positionsData = [];
      if (response && Array.isArray(response)) {
        // Direct array response (backward compatibility)
        positionsData = response;
      } else if (response && response.content && Array.isArray(response.content)) {
        // Paginated response with content array
        positionsData = response.content;
      } else if (response && response.data && Array.isArray(response.data)) {
        // Response wrapped in data object
        positionsData = response.data;
      } else if (response && response.error) {
        // Error response
        console.error("Error response from API:", response.error);
        positionsData = [];
      } else {
        // Unknown response format, default to empty array
        console.warn("Unexpected response format:", response);
        positionsData = [];
      }

      setPositions(positionsData);
    } catch (error) {
      console.error("Error loading data:", error);
      // Ensure positions is always an array even on error
      setPositions([]);
      alert("Failed to load positions. Please try again.");
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
      hasLoadedRef.current = true;
    }
  };



  const handleCreatePosition = () => {
    navigate("/dashboard/positions/create");
  };

  const handleEdit = (position) => {
    setEditingPosition(position);
    setShowForm(true);
  };

  const handleView = async (position) => {
    try {
      const positionDetails = await positionService.getPositionById(position.id);
      setViewingPosition(positionDetails);
      setShowViewModal(true);
    } catch (error) {
      console.error("Error loading position details:", error);
      showMessage("Failed to load position details", "error");
    }
  };

  const handleToggleStatus = async (position) => {
    if (togglingStatus) return;

    setTogglingStatus(true);
    try {
      if (position.positionStatus === "ACTIVE") {
        await positionService.deactivatePosition(position.id);
        showMessage("Position deactivated successfully");
      } else {
        await positionService.activatePosition(position.id);
        showMessage("Position activated successfully");
      }
      loadData(true);
    } catch (error) {
      console.error("Error toggling position status:", error);
      const errorMessage = error?.response?.data?.error || error?.message || "Failed to update position status. Please try again.";
      showMessage(errorMessage, "error");
    } finally {
      setTogglingStatus(false);
    }
  };

  const getStatusBadgeClasses = (status) => {
    const normalizedStatus = (status || "OPEN").toUpperCase();
    let baseClasses = "inline-flex items-center rounded-md px-2 py-1 text-[10px] font-medium ring-1 ring-inset";

    if (normalizedStatus === 'OPEN' || normalizedStatus === 'ACTIVE') {
      return `${baseClasses} bg-green-50 text-green-700 ring-green-600/20`;
    }
    if (normalizedStatus === 'CLOSED' || normalizedStatus === 'INACTIVE') {
      return `${baseClasses} bg-red-50 text-red-700 ring-red-600/20`;
    }
    if (normalizedStatus === 'DRAFT') {
      return `${baseClasses} bg-gray-100 text-gray-600 ring-gray-500/20`;
    }
    return `${baseClasses} bg-blue-50 text-blue-700 ring-blue-600/20`;
  };

  const showMessage = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingPosition(null);
    loadData();
  };

  const handleManageQuestions = async (positionId) => {
    // Check permission - if allowed, navigate to create/manage page
    if (hasPermission("POSITION", "CREATE")) {
      const position = Array.isArray(positions) ? positions.find(p => p.id === positionId) : null;
      navigate("/dashboard/question-sets/create", {
        state: {
          positionId: positionId,
          positionCode: position?.code,
          positionTitle: position?.title
        }
      });
    } else {
      // If not allowed, show read-only popup with assigned questions
      setQuestionsLoading(true);
      setShowQuestionsModal(true);
      try {
        const position = Array.isArray(positions) ? positions.find(p => p.id === positionId) : null;
        const data = await questionSetService.getQuestionSetDetailsByPositionId(position.id);
        console.log("Fetched detailed questions:", data);
        setQuestionsList(data || []);
      } catch (error) {
        console.error("Error fetching questions:", error);
        showMessage("Failed to load assigned questions", "error");
        setQuestionsList([]);
      } finally {
        setQuestionsLoading(false);
      }
    }
  };

  // Ensure positions is always an array before filtering
  const filteredPositions = Array.isArray(positions) ? positions.filter((position) =>
    position.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    position.code?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  // Pagination Logic
  const totalItems = filteredPositions.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startEntry = totalItems > 0 ? currentPage * pageSize + 1 : 0;
  const endEntry = totalItems > 0 ? Math.min((currentPage + 1) * pageSize, totalItems) : 0;
  const currentTableData = filteredPositions.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const paginationItems = getPaginationItems(currentPage, totalPages);


  if (!hasPermission("POSITION", "READ")) {
    return <AccessDenied message="You do not have permission to view positions." />;
  }

  if (subscriptionLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
        <p className="mt-4 text-slate-500 font-medium">Checking subscription...</p>
      </div>
    );
  }

  // Removed SubscriptionExpired block to allow 'View' access

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Position Management</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage all positions in your organization</p>
        </div>
        <div className="flex items-center gap-3">
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
              placeholder="Search by position code, description..."
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
            onClick={() => loadData(true)}
            title="Refresh Data"
            className="p-1.5 text-gray-500 hover:text-blue-700 hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            disabled={loading}
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <PermissionWrapper
            scope="CREATE"
            fallback={null}
          >
            <button
              onClick={handleCreatePosition}
              className="inline-flex items-center gap-x-1.5 rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all"
            >
              <Plus className="-ml-0.5 h-4 w-4" aria-hidden="true" />
              Add Position
            </button>
          </PermissionWrapper>
        </div>
      </div>

      {/* Positions Table */}
      <div className="w-full mt-1">
        <div className="w-full">
          <table className="min-w-full border-separate" style={{ borderSpacing: '0 8px' }}>
            <thead className="sticky top-0 z-10 bg-qwikBlue shadow-sm">
              <tr className="rounded-md h-12 mb-4">
                <th className="px-6 py-2.5 text-left text-xs font-semibold text-white bg-qwikBlue rounded-l-lg">Code</th>
                <th className="px-6 py-2.5 text-left text-xs font-semibold text-white bg-qwikBlue">Title</th>
                <th className="px-6 py-2.5 text-left text-xs font-semibold text-white bg-qwikBlue">Type</th>
                <th className="px-6 py-2.5 text-center text-xs font-semibold text-white bg-qwikBlue">Status</th>
                <th className="px-6 py-2.5 text-center text-xs font-semibold text-white bg-qwikBlue">Invited</th>
                <th className="px-6 py-2.5 text-center text-xs font-semibold text-white bg-qwikBlue">Completed</th>
                <th className="px-6 py-2.5 text-center text-xs font-semibold text-white bg-qwikBlue">Openings</th>
                <th className="px-6 py-2.5 text-center text-xs font-semibold text-white bg-qwikBlue">Experience</th>
                <th className="px-6 py-2.5 text-center text-xs font-semibold text-white bg-qwikBlue">Assessments</th>
                <th className="px-6 py-2.5 text-center text-xs font-semibold text-white bg-qwikBlue rounded-r-lg">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-transparent">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                      <p className="text-sm font-bold text-slate-400">Loading positions...</p>
                    </div>
                  </td>
                </tr>
              ) : currentTableData.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-20 text-center text-xs text-gray-500">
                    <div className="flex flex-col items-center gap-4 opacity-30">
                      <FileText size={48} className="text-slate-400" />
                      <p className="text-lg font-black text-slate-900">{searchTerm ? "No positions found matching your search" : "No positions found"}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentTableData.map((position) => {
                  return (
                    <tr key={position.id} className="bg-white shadow-sm hover:shadow-md transition-shadow group rounded-md">
                      <td className="px-6 py-2 rounded-l-lg border-l border-y border-gray-100 text-xs font-medium text-gray-900">{position.code}</td>
                      <td className="px-6 py-2 border-y border-gray-100 text-xs text-gray-700">{position.title}</td>
                      <td className="px-6 py-2 border-y border-gray-100 text-xs text-gray-700">{position.domainType || "-"}</td>
                      <td className="px-6 py-2 border-y border-gray-100 text-xs text-center">
                        <span className={getStatusBadgeClasses(position.positionStatus)}>
                          {(position.positionStatus || "OPEN").toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-2 border-y border-gray-100 text-xs text-gray-700 text-center">{position.interviewInviteSent || 0}</td>
                      <td className="px-6 py-2 border-y border-gray-100 text-xs text-gray-700 text-center">{position.completedInterviews || 0}</td>
                      <td className="px-6 py-2 border-y border-gray-100 text-xs text-gray-700 text-center">{position.noOfPositions || "-"}</td>
                      <td className="px-6 py-2 border-y border-gray-100 text-xs text-gray-700 text-center">
                        {position.minimumExperience || 0} - {position.maximumExperience || "∞"} yrs
                      </td>
                      <td className="px-6 py-2 border-y border-gray-100 text-xs text-center">
                        <button
                          onClick={() => handleManageQuestions(position.id)}
                          className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 transition-colors"
                          title="Manage Question Sets"
                        >
                          <BookOpen size={16} />
                          <span className="text-xs font-medium">Questions</span>
                        </button>
                      </td>
                      <td className="px-6 py-2 rounded-r-lg border-r border-y border-gray-100 text-xs">
                        <div className="flex justify-center items-center action-menu-container relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveActionMenu(activeActionMenu === position.id ? null : position.id);
                            }}
                            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                            title="Actions"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {activeActionMenu === position.id && (
                            <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden py-1 animate-in fade-in zoom-in duration-200"
                              style={{ top: '100%', right: '10px' }}>
                              <button
                                onClick={() => {
                                  handleView(position);
                                  setActiveActionMenu(null);
                                }}
                                className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors text-left"
                              >
                                <Eye size={14} />
                                <span>View Details</span>
                              </button>

                              <PermissionWrapper feature="POSITION" scope="UPDATE">
                                <button
                                  onClick={() => {
                                    handleEdit(position);
                                    setActiveActionMenu(null);
                                  }}
                                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors text-left"
                                >
                                  <Edit size={14} />
                                  <span>Edit Position</span>
                                </button>
                              </PermissionWrapper>

                              <button
                                onClick={() => {
                                  handleToggleStatus(position);
                                  setActiveActionMenu(null);
                                }}
                                disabled={togglingStatus}
                                className={`flex items-center gap-2 w-full px-3 py-1.5 text-xs transition-colors text-left ${position.positionStatus === "ACTIVE"
                                  ? 'text-amber-700 hover:bg-amber-50 hover:text-amber-800'
                                  : 'text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800'
                                  }`}
                              >
                                {position.positionStatus === "ACTIVE" ? (
                                  <>
                                    <ToggleRight size={14} />
                                    <span>Deactivate</span>
                                  </>
                                ) : (
                                  <>
                                    <ToggleLeft size={14} />
                                    <span>Activate</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
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


      {/* Edit Position Modal - Only show when editing existing position */}
      {
        showForm && editingPosition && (
          <PositionForm
            position={editingPosition}
            onClose={handleFormClose}
          />
        )
      }



      {/* View Position Modal */}
      {
        showViewModal && viewingPosition && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex justify-between items-center p-4 border-b border-gray-200">
                <h2 className="text-sm font-bold text-navy-900">Position Details</h2>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setViewingPosition(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-semibold text-gray-600">Code</label>
                    <p className="text-[10px] text-gray-900 mt-1">{viewingPosition.code || "-"}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-600">Title</label>
                    <p className="text-[10px] text-gray-900 mt-1">{viewingPosition.title || "-"}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-600">Domain</label>
                    <p className="text-[10px] text-gray-900 mt-1">{viewingPosition.domainType || "-"}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-600">Status</label>
                    <p className="text-[10px] mt-1">
                      <span className={`px-2 py-1 text-[9px] font-semibold rounded-full ${viewingPosition.positionStatus === "ACTIVE"
                        ? "bg-green-100 text-green-800"
                        : viewingPosition.positionStatus === "CLOSED"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                        }`}>
                        {viewingPosition.positionStatus || "DRAFT"}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-600">Number of Positions</label>
                    <p className="text-[10px] text-gray-900 mt-1">{viewingPosition.noOfPositions || "-"}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-600">Experience</label>
                    <p className="text-[10px] text-gray-900 mt-1">
                      {viewingPosition.minimumExperience || 0} - {viewingPosition.maximumExperience || "∞"} yrs
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setViewingPosition(null);
                  }}
                  className="w-full px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white font-medium rounded-lg transition duration-200 text-[10px]"
                >
                  Close
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

      {/* Assigned Questions Modal (Read-Only) */}
      {showQuestionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-navy-900">Assigned Questions</h3>
                <p className="text-xs text-gray-500 mt-0.5">Questions assigned to this position</p>
              </div>
              <button
                onClick={() => setShowQuestionsModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {questionsLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader className="w-8 h-8 text-blue-600 animate-spin mb-3" />
                  <p className="text-xs text-gray-500 font-medium">Loading questions...</p>
                </div>
              ) : questionsList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                    <BookOpen className="text-gray-400" size={24} />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">No Questions Assigned</p>
                  <p className="text-xs text-gray-500 mt-1 max-w-xs">There are no question sets currently assigned to this position.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {questionsList.map((item, index) => {
                    const qSet = item.questionSet || item; // Fallback if regular QS
                    const details = item.questionDetails;

                    return (
                      <div key={qSet.id || index} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                              {qSet.questionSetCode || "Question Set"}
                            </span>
                            {qSet.isActive && (
                              <span className="flex items-center gap-1 text-[10px] text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded">
                                <Check size={10} /> Active
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-500 font-mono">
                            {qSet.totalDuration ? `${qSet.totalDuration} mins` : '-'}
                          </span>
                        </div>

                        <div className="p-4 bg-white">
                          {/* Stats Header */}
                          <div className="flex gap-4 mb-4 border-b border-gray-100 pb-3">
                            <div className="text-center px-3 py-1 bg-slate-50 rounded">
                              <div className="text-[10px] text-slate-400 font-bold uppercase">Total</div>
                              <div className="text-sm font-bold text-slate-800">{qSet.totalQuestions || 0}</div>
                            </div>
                            <div className="text-center px-3 py-1 bg-slate-50 rounded">
                              <div className="text-[10px] text-slate-400 font-bold uppercase">Coding</div>
                              <div className="text-sm font-bold text-slate-800">{qSet.codingQuestionsCount || 0}</div>
                            </div>
                            <div className="text-center px-3 py-1 bg-slate-50 rounded">
                              <div className="text-[10px] text-slate-400 font-bold uppercase">Aptitude</div>
                              <div className="text-sm font-bold text-slate-800">{qSet.aptitudeQuestionsCount || 0}</div>
                            </div>
                          </div>

                          {/* Questions Rendering */}
                          {!details ? (
                            <div className="text-xs text-gray-400 italic text-center py-2">Details not available</div>
                          ) : (
                            <div className="space-y-4">
                              {/* General Questions */}
                              {details.generalQuestions?.questions?.length > 0 && (
                                <div>
                                  <h4 className="text-xs font-bold text-navy-800 mb-2 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                    General Questions
                                  </h4>
                                  <ul className="space-y-2 pl-2">
                                    {details.generalQuestions.questions.map((q, idx) => (
                                      <li key={q.id || idx} className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 flex gap-2">
                                        <span className="font-mono text-slate-400">{idx + 1}.</span>
                                        <div className="flex-1">
                                          <p className="font-medium">{q.question}</p>
                                          {q.answer && <p className="mt-1 text-slate-500 text-[10px] border-t border-slate-200 pt-1">Default Answer: {q.answer}</p>}
                                        </div>
                                        <span className="text-[10px] text-slate-400 whitespace-nowrap">{q.timeToAnswer}m</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Position Specific Questions */}
                              {details.positionSpecificQuestions?.questions?.length > 0 && (
                                <div>
                                  <h4 className="text-xs font-bold text-navy-800 mb-2 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                                    Position Specific
                                  </h4>
                                  <ul className="space-y-2 pl-2">
                                    {details.positionSpecificQuestions.questions.map((q, idx) => (
                                      <li key={q.id || idx} className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 flex gap-2">
                                        <span className="font-mono text-slate-400">{idx + 1}.</span>
                                        <div className="flex-1">
                                          <p className="font-medium">{q.question}</p>
                                        </div>
                                        <span className="text-[10px] text-slate-400 whitespace-nowrap">{q.timeToAnswer}m</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Coding Questions */}
                              {details.codingQuestions?.length > 0 && (
                                <div>
                                  <h4 className="text-xs font-bold text-navy-800 mb-2 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                                    Coding Challenges
                                  </h4>
                                  <ul className="space-y-2 pl-2">
                                    {details.codingQuestions.map((q, idx) => (
                                      <li key={q.id || idx} className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                                        <div className="flex justify-between items-start mb-1">
                                          <span className="font-bold text-[10px] text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">{q.programmingLanguage} ({q.difficultyLevel})</span>
                                          <span className="text-[10px] text-slate-400">{q.codeDuration}</span>
                                        </div>
                                        <p className="font-medium text-slate-700">{q.customCodingQuestion || q.questionSource}</p>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Aptitude Questions */}
                              {details.aptitudeQuestions?.length > 0 && (
                                <div>
                                  <h4 className="text-xs font-bold text-navy-800 mb-2 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                                    Aptitude Assessment
                                  </h4>
                                  <ul className="space-y-2 pl-2">
                                    {details.aptitudeQuestions.map((q, idx) => (
                                      <li key={q.id || idx} className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                                        <div className="flex justify-between items-center mb-1">
                                          <span className="font-semibold text-slate-800">{q.questionSource}</span>
                                          <span className="text-[10px] text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100">{q.difficultyLevel}</span>
                                        </div>
                                        <div className="flex gap-3 text-[10px] text-slate-500">
                                          <span>Questions: <b>{q.numberOfQuestions}</b></span>
                                          <span>Time: <b>{q.timeToAnswer}m</b></span>
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end">
              <button
                onClick={() => setShowQuestionsModal(false)}
                className="px-4 py-2 bg-white border border-gray-300 shadow-sm text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Positions;
