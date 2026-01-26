import React, { useState, useEffect, useRef, Fragment } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  Plus, Edit, Trash2, Search, User, MoreVertical, Eye,
  Upload, Download, X, RefreshCw, FileText, Video, Send,
  Filter, AlertTriangle, ChevronDown, BookOpen, Check,
  Mail, Phone, GraduationCap, Building2, Calendar, Code
} from "lucide-react";
import PermissionWrapper from "../common/PermissionWrapper";
import { candidateService } from "../../services/candidateService";
import { positionService } from "../../services/positionService";
import { questionSetService } from "../../services/questionSetService";
import { authService } from "../../services/authService";
import { hasPermission } from "../../utils/permissions";
import { useSubscription } from "../../providers/SubscriptionProvider";
import AccessDenied from "../common/AccessDenied";
import SubscriptionExpired from "../common/SubscriptionExpired";
import SnackbarAlert from "../common/SnackbarAlert";

const getPaginationItems = (currentPage, totalPages, siblingCount = 1, boundaryCount = 1) => {
  if (totalPages < 1) return [];
  if (totalPages === 1) return [0];

  const numbers = new Set();
  for (let i = 0; i < boundaryCount; i++) if (i < totalPages) numbers.add(i);
  for (let i = 0; i < boundaryCount; i++) if (totalPages - 1 - i >= 0) numbers.add(totalPages - 1 - i);
  numbers.add(currentPage);
  for (let i = 1; i <= siblingCount; i++) {
    if (currentPage - i >= 0) numbers.add(currentPage - i);
    if (currentPage + i < totalPages) numbers.add(currentPage + i);
  }
  const sortedPageNumbers = Array.from(numbers).sort((a, b) => a - b);
  const result = [];
  let lastPushedPage = -1;
  for (const page of sortedPageNumbers) {
    if (lastPushedPage !== -1 && page - lastPushedPage > 1) {
      result.push(`ellipsis-${lastPushedPage}-${page}`);
    }
    result.push(page);
    lastPushedPage = page;
  }
  return result;
};

const ResumeScoreCircular = ({ score }) => {
  if (score === null || score === undefined || isNaN(score)) {
    return <span className="text-xs text-gray-500">N/A</span>;
  }

  const normalizedScore = Math.max(0, Math.min(100, parseInt(score)));
  const circumference = 2 * Math.PI * 14;
  const offset = circumference - (normalizedScore / 100) * circumference;

  let scoreColorClass = '';
  let borderColorClass = '';

  if (normalizedScore < 40) {
    scoreColorClass = 'text-red-600';
    borderColorClass = 'border-red-500';
  } else if (normalizedScore >= 40 && normalizedScore < 60) {
    scoreColorClass = 'text-yellow-600';
    borderColorClass = 'border-yellow-500';
  } else if (normalizedScore >= 60 && normalizedScore < 80) {
    scoreColorClass = 'text-blue-600';
    borderColorClass = 'border-blue-500';
  } else if (normalizedScore >= 80) {
    scoreColorClass = 'text-green-600';
    borderColorClass = 'border-green-500';
  }

  return (
    <div className={`relative w-8 h-8 flex items-center justify-center rounded-full border-2 ${borderColorClass}`}>
      <svg className="w-full h-full" viewBox="0 0 32 32">
        <circle
          className="text-gray-200"
          strokeWidth="3"
          fill="none"
          cx="16"
          cy="16"
          r="14"
        />
        <circle
          className={scoreColorClass}
          strokeWidth="3"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
          cx="16"
          cy="16"
          r="14"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
        />
      </svg>
      <div className={`absolute text-[10px] font-semibold ${scoreColorClass}`}>
        {normalizedScore}%
      </div>
    </div>
  );
};

const getStatusBadgeClasses = (status) => {
  const normalizedStatus = (status || "PENDING").toUpperCase().replace('_', ' ');
  let baseClasses = "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset";

  if (normalizedStatus === 'ACTIVE') {
    return `${baseClasses} bg-green-50 text-green-700 ring-green-600/20`;
  }
  if (normalizedStatus === 'INACTIVE') {
    return `${baseClasses} bg-gray-50 text-gray-700 ring-gray-600/20`;
  }
  if (normalizedStatus === 'INVITED' || normalizedStatus === 'INVITE SENT') {
    return `${baseClasses} bg-purple-50 text-purple-700 ring-purple-600/20`;
  }
  if (normalizedStatus === 'RE-INVITED' || normalizedStatus === 'RE-INVITE SENT' || normalizedStatus === 'REINVITED') {
    return `${baseClasses} bg-purple-100 text-purple-800 ring-purple-600/30`;
  }
  if (normalizedStatus === 'MANUAL INVITED' || normalizedStatus === 'MANUALLY INVITED' || normalizedStatus === 'MANUALLYINVITED') {
    return `${baseClasses} bg-cyan-100 text-cyan-700 ring-cyan-600/20`;
  }
  if (normalizedStatus === 'FAILED') {
    return `${baseClasses} bg-red-100 text-red-700 ring-red-600/20`;
  }
  if (normalizedStatus === 'PENDING' || normalizedStatus === 'NOT INVITED') {
    return `${baseClasses} bg-gray-100 text-gray-600 ring-gray-400/20`;
  }

  // Test/Interview related statuses
  if (normalizedStatus === 'RECOMMENDED') {
    return `${baseClasses} bg-green-50 text-green-700 ring-green-600/20`;
  }
  if (normalizedStatus === 'NOT RECOMMENDED' || normalizedStatus === 'RESUME REJECTED') {
    return `${baseClasses} bg-red-50 text-red-700 ring-red-600/20`;
  }
  if (normalizedStatus === 'TEST COMPLETED') {
    return `${baseClasses} bg-blue-50 text-blue-700 ring-blue-600/20`;
  }
  if (normalizedStatus === 'IN PROGRESS') {
    return `${baseClasses} bg-gray-100 text-gray-600 ring-blue-600/20`;
  }

  return `${baseClasses} bg-gray-100 text-gray-600 ring-gray-500/20`;
};

const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return date.toLocaleDateString('en-GB', options);
  } catch (e) {
    return dateString;
  }
};

const normalizeLabel = (label) => {
  return (label || '').toString().toUpperCase().replace(/\s/g, '');
};

const CandidateDatabase = ({ adminInfo: propAdminInfo }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSubscriptionActive, loading: subscriptionLoading } = useSubscription();
  const [candidates, setCandidates] = useState([]);

  const [positions, setPositions] = useState([]);
  const [questionSets, setQuestionSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminInfo, setAdminInfo] = useState(null);


  // UI State matching reference
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    createdFrom: '',
    createdTo: '',
    orderBy: 'createdAtDesc',
    status: [],
    postedBy: 'All Users',
    postedById: '',
    createdBy: '',
    // paymentStatus: 'All', // Removed
  });

  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [resendingInviteId, setResendingInviteId] = useState(null);

  // Details Drawer State
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [fullCandidateDetails, setFullCandidateDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const showMessage = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const isLoadingRef = useRef(false);
  const menuRefs = useRef({});
  const filterMenuRef = useRef(null);

  useEffect(() => {
    // Load admin info from localStorage instead of hitting backend
    const loadAdminInfo = () => {
      try {
        const adminStr = localStorage.getItem('adminInfo');
        if (adminStr) {
          setAdminInfo(JSON.parse(adminStr));
        }
      } catch (error) {
        console.error("Error loading admin info from localStorage:", error);
      }
    };

    loadAdminInfo();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      let clickedInside = false;
      Object.keys(menuRefs.current).forEach((id) => {
        if (menuRefs.current[id] && menuRefs.current[id].contains(event.target)) {
          clickedInside = true;
        }
      });
      if (!clickedInside) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId) {
      // Use click event instead of mousedown to allow menu item clicks to complete first
      document.addEventListener("click", handleClickOutside, true);
      return () => {
        document.removeEventListener("click", handleClickOutside, true);
      };
    }
  }, [openMenuId]);

  useEffect(() => {
    // Load positions and question sets on mount (needed for both tabs)
    if (adminInfo && positions.length === 0 && questionSets.length === 0) {
      loadPositionsAndQuestionSets();
    }
  }, [adminInfo]);

  // Handle navigation state (for setting active tab and forcing reload)


  // Load data when admin info changes or forced reload
  useEffect(() => {
    if (adminInfo) {
      // Force reload if coming from AddCandidate
      const shouldForceReload = location.state?.forceReload || false;
      loadCandidates(shouldForceReload);
    }
  }, [adminInfo]);

  const loadPositionsAndQuestionSets = async () => {
    try {
      const [positionsResponse, questionSetsResponse] = await Promise.all([
        positionService.getAllPositions(),
        questionSetService.getAllQuestionSets()
      ]);

      // Handle positions paginated or direct array
      let positionsData = [];
      if (Array.isArray(positionsResponse)) {
        positionsData = positionsResponse;
      } else if (positionsResponse?.content && Array.isArray(positionsResponse.content)) {
        positionsData = positionsResponse.content;
      } else if (positionsResponse?.data && Array.isArray(positionsResponse.data)) {
        positionsData = positionsResponse.data;
      }
      setPositions(positionsData);

      // Handle question sets paginated or direct array
      let questionSetsData = [];
      if (Array.isArray(questionSetsResponse)) {
        questionSetsData = questionSetsResponse;
      } else if (questionSetsResponse?.content && Array.isArray(questionSetsResponse.content)) {
        questionSetsData = questionSetsResponse.content;
      } else if (questionSetsResponse?.data && Array.isArray(questionSetsResponse.data)) {
        questionSetsData = questionSetsResponse.data;
      }
      setQuestionSets(questionSetsData);
    } catch (error) {
      console.error("Error loading positions and question sets:", error);
    }
  };

  const loadCandidates = async (forceReload = false, silent = false) => {
    // Prevent duplicate calls
    if (isLoadingRef.current && !forceReload) {
      return;
    }

    // Don't reload if data already exists (unless forced)
    if (!forceReload && candidates.length > 0) {
      return;
    }

    isLoadingRef.current = true;

    try {
      if (!silent) {
        setLoading(true);
      }

      // Get organizationId from adminInfo or localStorage
      const organizationId = localStorage.getItem('organizationId') || adminInfo?.organization?.organizationId || null;

      // Load all candidates (was college tab)
      const response = await candidateService.getAllCandidates({ organizationId });

      // Handle paginated response (PageResponseDTO) or direct array
      let candidatesData = [];
      if (response && Array.isArray(response)) {
        candidatesData = response; // Direct array response
      } else if (response && response.content && Array.isArray(response.content)) {
        candidatesData = response.content; // Paginated response
      } else if (response && response.data && Array.isArray(response.data)) {
        candidatesData = response.data; // Response wrapped in data object
      } else if (response && response.error) {
        console.error("Error response from API:", response.error);
        candidatesData = [];
      } else {
        console.warn("Unexpected response format:", response);
        candidatesData = [];
      }

      setCandidates(candidatesData);

    } catch (error) {
      console.error("Error loading data:", error);
      setCandidates([]);
      if (!silent) {
        alert("Failed to load candidates. Please try again.");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
      isLoadingRef.current = false;
    }
  };

  // Manual Filter Logic
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
    setCurrentPage(0);
  };

  const handleStatusFilterChange = (status) => {
    const currentStatus = filters.status || [];
    const newStatus = currentStatus.includes(status)
      ? currentStatus.filter(s => s !== status)
      : [...currentStatus, status];
    handleFilterChange('status', newStatus);
  };

  const clearAllFilters = () => {
    setFilters({
      createdFrom: '',
      createdTo: '',
      orderBy: 'createdAtDesc',
      status: [],
      postedBy: 'All Users',
      postedById: '',
      createdBy: '',
      // paymentStatus: 'All',
    });
    setSearchQuery('');
    setCurrentPage(0);
  };

  const hasActiveFilters = () => {
    return (
      filters.createdFrom !== '' ||
      filters.createdTo !== '' ||
      filters.status.length > 0 ||
      filters.postedBy !== 'All Users' ||
      filters.orderBy !== 'createdAtDesc' ||
      // filters.paymentStatus !== 'All' ||
      searchQuery !== ''
    );
  };

  // Click outside listener for custom filter menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target)) {
        setIsFilterMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getPositionTitle = (positionId) => {
    if (!Array.isArray(positions)) return positionId;
    const position = positions.find(p => p.id === positionId);
    return position ? position.title : positionId;
  };

  const parseCSVLine = (line) => {
    const result = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const handleBulkUpload = async (file = null) => {
    // ... (Keep existing implementation logic but simplified/cleaned if needed)
    // For brevity, assuming the logic from previous view is correct, replicating it here:
    const fileToUpload = file;
    if (!fileToUpload) return alert("Please select a CSV file");

    try {
      const text = await fileToUpload.text();
      const lines = text.split("\n").filter(line => line.trim());
      if (lines.length < 2) return alert("CSV must have header and data");

      const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase().replace(/\s+/g, ""));
      const candidatesToUpload = [];

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length !== headers.length) continue;
        const c = {};
        headers.forEach((h, idx) => c[h] = values[idx] || "");

        candidatesToUpload.push({
          name: c.name || "",
          email: c.email || "",
          mobileNumber: c.mobilenumber || "",
          regNo: c.registrationnumber || c.regno || "",
          college: c.college || "",
          degree: c.degree || "",
          stream: c.stream || "",
          academicYearStart: parseInt(c.academicyearstart) || null,
          academicYearEnd: parseInt(c.academicyearend) || null,
          address: c.address || ""
        });
      }

      const valid = candidatesToUpload.filter(c => c.name && c.email && c.mobileNumber);
      if (valid.length === 0) return alert("No valid candidates found");

      let savedCount = 0;
      for (const c of valid) {
        try {
          await candidateService.addCandidate(c);
          savedCount++;
        } catch (e) { console.error(e); }
      }
      alert(`Uploaded ${savedCount} candidates.`);
      if (activeTab === "college") loadDataForTab(true);
    } catch (e) {
      console.error(e);
      alert("Upload failed");
    }
  };

  const handleEdit = (candidate) => {
    const id = candidate.id || candidate.candidateId;
    const candidateData = {
      ...candidate,
      id: id,
      name: candidate.name || candidate.candidateName || candidate.fullName,
    };
    // Navigate to Add Candidate page with pre-filled data
    navigate("/dashboard/candidates/add", {
      state: { candidateId: id, candidate: candidateData, candidateFound: true, email: candidate.email }
    });
  };

  const handleView = async (candidate) => {
    const id = candidate.id || candidate.candidateId;
    if (!id) {
      showMessage("Candidate ID missing. Unable to view details.", "error");
      return;
    }

    try {
      setLoadingDetails(true);
      setShowDetailsDrawer(true);
      setOpenMenuId(null);
      const data = await candidateService.getCandidateById(id);
      setFullCandidateDetails(data);
    } catch (error) {
      console.error("Error fetching candidate full details:", error);
      showMessage("Failed to fetch candidate details", "error");
      setShowDetailsDrawer(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleResendInvite = async (candidate) => {
    const id = candidate.id || candidate.candidateId;

    if (!id) {
      showMessage("Candidate ID missing. Unable to resend invitation.", "error");
      return;
    }

    // Check if already processing
    if (resendingInviteId === id) {
      return;
    }

    try {
      setResendingInviteId(id);
      setOpenMenuId(null);
      showMessage("Sending invitation...", "info");

      await candidateService.resendInvite(id);
      showMessage("Invitation resent successfully", "success");

      // Refresh only the candidates data silently (without showing loading state)
      await loadCandidates(true, true);
    } catch (error) {
      const errorMessage = error?.response?.data?.error || error?.message || "Failed to resend invitation";
      showMessage(errorMessage, "error");
    } finally {
      setResendingInviteId(null);
    }
  };

  const handleCSVFileSelect = (e) => {
    if (e.target.files[0]) handleBulkUpload(e.target.files[0]);
  };

  const handleCreate = () => {
    navigate("/dashboard/candidates/add");
  };

  // Filter candidates based on active tab and local state
  const getFilteredCandidates = () => {

    let filtered = Array.isArray(candidates) ? candidates : [];
    if (!Array.isArray(filtered)) return [];

    // 1. Text Search
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(candidate =>
        (candidate.email || '').toLowerCase().includes(lowerQuery) ||
        (candidate.fullName || candidate.candidateName || '').toLowerCase().includes(lowerQuery) ||
        (candidate.candidateCode || '').toLowerCase().includes(lowerQuery) ||
        getPositionTitle(candidate.positionId)?.toLowerCase().includes(lowerQuery)
      );
    }

    // 2. Status Filter
    if (filters.status.length > 0) {
      filtered = filtered.filter(candidate =>
        filters.status.includes((candidate.status || candidate.recommendationStatus || 'PENDING').toUpperCase())
      );
    }

    // 3. Date Range Filter
    if (filters.createdFrom) {
      const fromDate = new Date(filters.createdFrom);
      filtered = filtered.filter(c => new Date(c.candidateCreatedAt || c.createdAt) >= fromDate);
    }
    if (filters.createdTo) {
      const toDate = new Date(filters.createdTo);
      const toDateObj = new Date(filters.createdTo);
      toDateObj.setDate(toDateObj.getDate() + 1);
      filtered = filtered.filter(c => new Date(c.candidateCreatedAt || c.createdAt) < toDateObj);
    }

    // 4. Sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.candidateCreatedAt || a.createdAt).getTime();
      const dateB = new Date(b.candidateCreatedAt || b.createdAt).getTime();
      if (filters.orderBy === 'createdAtAsc') return dateA - dateB;
      if (filters.orderBy === 'createdAtDesc') return dateB - dateA;
      if (filters.orderBy === 'jobTitleAsc') {
        const titleA = getPositionTitle(a.positionId) || '';
        const titleB = getPositionTitle(b.positionId) || '';
        return titleA.localeCompare(titleB);
      }
      return 0;
    });

    // 5. Payment Status Filter - REMOVED
    /*
    if (filters.paymentStatus !== 'All') {
      const isPaid = filters.paymentStatus === 'Paid';
      filtered = filtered.filter(c => (c.registrationPaid || c.registration_paid) === isPaid);
    }
    */

    return filtered;
  };

  const filteredData = getFilteredCandidates();

  // Pagination Logic
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startEntry = totalItems > 0 ? currentPage * pageSize + 1 : 0;
  const endEntry = totalItems > 0 ? Math.min((currentPage + 1) * pageSize, totalItems) : 0;
  const currentTableData = filteredData.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  const paginationItems = getPaginationItems(currentPage, totalPages);

  if (!hasPermission("CANDIDATE", "READ")) {
    return <AccessDenied message="You do not have permission to view candidates." />;
  }

  if (subscriptionLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Candidate Database</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Hello {adminInfo?.fullName?.split(' ')[0] || "Admin"}, manage your candidates here.</p>
        </div>
      </div>

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
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(0); }}
              placeholder="Search by name, email, code, job title..."
              className="w-full border border-gray-300 rounded-md pl-3 pr-3 py-1.5 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Actions: Refresh, Filter, New Candidate, Bulk Upload */}
        <div className="flex items-center gap-2 flex-wrap justify-start sm:justify-end flex-shrink-0">
          <button
            onClick={() => loadCandidates(true)}
            title="Refresh Data"
            className="p-1.5 text-gray-500 hover:text-blue-700 hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            disabled={loading}
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>



          {/* Manual Filter Menu Implementation */}
          <div className="relative" ref={filterMenuRef}>
            <button
              onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
              className={`p-1.5 ${hasActiveFilters() ? 'text-blue-700 bg-blue-50' : 'text-gray-500 hover:text-blue-700 hover:bg-gray-100'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition relative debug-filter-btn`}
              title="Filters"
            >
              <Filter className="h-5 w-5" />
              {hasActiveFilters() && (
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-blue-700 rounded-full"></span>
              )}
            </button>

            {isFilterMenuOpen && (
              <div className="absolute top-full right-0 z-50 mt-2 w-80 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none animate-in fade-in zoom-in-95 duration-100">
                <div className="max-h-[60vh] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                  <div className="p-4 text-xs space-y-4">
                    {/* Date Range */}
                    <div>
                      <label className="block text-gray-900 font-medium mb-1">From Date</label>
                      <input
                        type="date"
                        value={filters.createdFrom}
                        onChange={(e) => handleFilterChange('createdFrom', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-900 font-medium mb-1">To Date</label>
                      <input
                        type="date"
                        value={filters.createdTo}
                        onChange={(e) => handleFilterChange('createdTo', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>

                    {/* Status Checkboxes */}
                    <div>
                      <span className="block text-gray-900 font-medium mb-1">Status</span>
                      {['ACTIVE', 'INACTIVE'].map((status) => (
                        <label key={status} className="flex items-center mt-1 text-gray-900 cursor-pointer hover:bg-slate-50 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={filters.status.includes(status)}
                            onChange={() => handleStatusFilterChange(status)}
                            className="mr-2 h-3.5 w-3.5 text-blue-700 border-gray-300 rounded focus:ring-blue-500"
                          />
                          {status.replace('_', ' ')}
                        </label>
                      ))}
                    </div>

                    {/* Order By Radio */}
                    <div>
                      <span className="block text-gray-900 font-medium mb-1">Order By</span>
                      {[
                        { label: 'Newest to Oldest', value: 'createdAtDesc' },
                        { label: 'Oldest to Newest', value: 'createdAtAsc' },
                        { label: 'Title A-Z', value: 'jobTitleAsc' },
                      ].map(({ label, value }) => (
                        <label key={value} className="flex items-center mt-1 text-gray-900 cursor-pointer">
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
                    {/* Payment Status - REMOVED */}
                    {/* 
                    <div>
                      <span className="block text-gray-900 font-medium mb-1">Payment Status</span>
                      {['All', 'Paid', 'Unpaid'].map((status) => (
                        <label key={status} className="flex items-center mt-1 text-gray-900 cursor-pointer p-1 rounded hover:bg-slate-50">
                          <input
                            type="radio"
                            name="paymentStatus"
                            value={status}
                            checked={filters.paymentStatus === status}
                            onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
                            className="mr-2 h-3.5 w-3.5 text-blue-700 focus:ring-blue-500 border-gray-300"
                          />
                          {status}
                        </label>
                      ))}
                    </div>
                    */}
                  </div>
                </div>
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  <button
                    onClick={clearAllFilters}
                    className="w-full bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-100 transition text-xs font-medium"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Upload Button */}
          {hasPermission("CANDIDATE", "CREATE") && (
            <>
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVFileSelect}
                className="hidden"
                id="bulk-upload-input"
                disabled={!isSubscriptionActive}
              />
              <label
                htmlFor="bulk-upload-input"
                className={`inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 transition-all cursor-pointer ${!isSubscriptionActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={isSubscriptionActive ? "Bulk Upload CSV" : "Subscription Expired"}
              >
                <Upload className="h-4 w-4" />
                Upload
              </label>
            </>
          )}

          {/* New Candidate Button */}
          <PermissionWrapper
            feature="CANDIDATE"
            scope="CREATE"
            fallback={null}
          >
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-x-1.5 rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Add Candidate</span>
            </button>
          </PermissionWrapper>
        </div>
      </div>



      {/* Table Container */}
      <div className="w-full mt-1">
        <div className="w-full">
          <table className="min-w-full border-separate" style={{ borderSpacing: '0 8px' }}>
            <thead className="sticky top-0 z-10 bg-qwikBlue shadow-sm">
              <tr className="rounded-md h-12 mb-4">
                <th scope="col" className="px-6 py-2.5 text-center text-xs font-semibold text-white bg-qwikBlue rounded-l-lg">Candidate Code</th>
                <th scope="col" className="px-6 py-2.5 text-center text-xs font-semibold text-white bg-qwikBlue">Reg No</th>
                <th scope="col" className="px-6 py-2.5 text-center text-xs font-semibold text-white bg-qwikBlue">Name</th>
                <th scope="col" className="px-6 py-2.5 text-center text-xs font-semibold text-white bg-qwikBlue">Mobile</th>
                <th scope="col" className="px-6 py-2.5 text-center text-xs font-semibold text-white bg-qwikBlue">College</th>
                <th scope="col" className="px-6 py-2.5 text-center text-xs font-semibold text-white bg-qwikBlue">Degree / Stream</th>
                <th scope="col" className="px-6 py-2.5 text-center text-xs font-semibold text-white bg-qwikBlue">Status</th>
                <th scope="col" className="px-6 py-2.5 text-center text-xs font-semibold text-white bg-qwikBlue">Last Login</th>
                <th scope="col" className="px-6 py-2.5 text-center text-xs font-semibold text-white bg-qwikBlue rounded-r-lg">Action</th>
              </tr>
            </thead>
            <tbody className="bg-transparent">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-20 text-center text-gray-500 bg-white rounded-lg shadow-sm">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
                      <span>Loading candidates...</span>
                    </div>
                  </td>
                </tr>
              ) : currentTableData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-20 text-center text-gray-500 bg-white rounded-lg shadow-sm">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search className="h-8 w-8 text-gray-300" />
                      <span className="font-medium">No candidates found</span>
                      <span className="text-xs">Try adjusting your search or filters</span>
                    </div>
                  </td>
                </tr>
              ) : (
                currentTableData.map((candidate) => (
                  <tr key={candidate.id || candidate.candidateId} className="bg-white shadow-sm hover:shadow-md transition-shadow group rounded-md">
                    <>
                      <td className="px-4 py-2 text-center text-gray-900 font-medium text-xs rounded-l-lg border-l border-y border-gray-100">
                        {candidate.code || candidate.candidateCode || "-"}
                      </td>
                      <td className="px-4 py-2 text-center text-gray-900 font-medium text-xs border-y border-gray-100">
                        {candidate.regNo || 'N/A'}
                      </td>
                      <td className="px-4 py-2 text-center border-y border-gray-100">
                        <div className="flex flex-col gap-0.5 items-center">
                          <span className="text-gray-900 text-xs font-medium">{candidate.fullName || candidate.name || 'N/A'}</span>
                          <span className="text-blue-600 text-[10px]" title={candidate.email}>{candidate.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-center text-gray-600 text-xs border-y border-gray-100">
                        {candidate.mobileNumber || candidate.phone || 'N/A'}
                      </td>
                      <td className="px-4 py-2 text-center text-gray-600 text-xs border-y border-gray-100">
                        {candidate.college || candidate.collegeName || 'N/A'}
                      </td>
                      <td className="px-4 py-2 text-center border-y border-gray-100">
                        <div className="flex flex-col gap-0.5 items-center">
                          <span className="text-gray-600 text-xs">
                            {candidate.degree && candidate.stream ? `${candidate.degree} - ${candidate.stream}` : (candidate.degree || candidate.stream || 'N/A')}
                          </span>
                          <span className="text-blue-600 text-[10px]">
                            {candidate.academicYearStart && candidate.academicYearEnd ? `${candidate.academicYearStart}-${candidate.academicYearEnd}` : 'N/A'}
                          </span>
                        </div>
                      </td>
                      {/* Payment Column Removed */}
                      {/*
                      <td className="px-4 py-2 text-left border-y border-gray-100">
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-medium ring-1 ring-inset ${candidate.registrationPaid || candidate.registration_paid
                          ? "bg-green-50 text-green-700 ring-green-600/20"
                          : "bg-gray-50 text-gray-600 ring-gray-500/10"
                          }`}>
                          {candidate.registrationPaid || candidate.registration_paid ? "PAID" : "UNPAID"}
                        </span>
                      </td>
                      */}
                      <td className="px-4 py-2 text-center border-y border-gray-100">
                        <span className={`${getStatusBadgeClasses(candidate.status)} px-3 py-1`}>
                          {(candidate.status || 'NOT INVITED').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center text-gray-600 whitespace-nowrap text-xs border-y border-gray-100">
                        {formatDateTime(candidate.lastLogin)}
                      </td>
                      <td className="px-4 py-2 text-center rounded-r-lg border-r border-y border-gray-100">
                        <div className="relative flex justify-center" ref={el => {
                          const candidateId = candidate.id || candidate.candidateId;
                          if (candidateId) {
                            menuRefs.current[candidateId] = el;
                          }
                        }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              const candidateId = candidate.id || candidate.candidateId;
                              setOpenMenuId(openMenuId === candidateId ? null : candidateId);
                            }}
                            className="text-gray-400 hover:text-blue-600 transition p-1 hover:bg-gray-100 rounded-full focus:outline-none"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>

                          {openMenuId === (candidate.id || candidate.candidateId) && (
                            <div
                              className="absolute right-0 mt-8 w-40 bg-white rounded-md shadow-lg z-50 border border-gray-100 py-1 text-left animate-in fade-in zoom-in-95 duration-75"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* Resume Option */}
                              {(candidate.resumePath || candidate.resumeFilename) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(null);
                                    const path = candidate.resumePath || candidate.resumeFilename;
                                    const url = path.startsWith('http') ? path : `/api/resumes/${path}`;
                                    const filename = path.split('/').pop() || 'Resume';
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.setAttribute('download', filename);
                                    link.setAttribute('target', '_blank');
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                  }}
                                  className="w-full px-4 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 transition-colors"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                  Resume
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId(null);
                                  handleView(candidate);
                                }}
                                className="w-full px-4 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 transition-colors"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                View
                              </button>
                              <PermissionWrapper feature="CANDIDATE" scope="UPDATE">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(null);
                                    handleEdit(candidate);
                                  }}
                                  className="w-full px-4 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 transition-colors"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                  Edit
                                </button>
                              </PermissionWrapper>
                              <PermissionWrapper feature="CANDIDATE" scope="UPDATE">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const normalizedStatus = normalizeLabel(candidate.status);
                                    const candidateId = candidate.id || candidate.candidateId;
                                    const isProcessing = resendingInviteId === candidateId;

                                    if (normalizedStatus === 'MANUALLYINVITED' || isProcessing) {
                                      return;
                                    }
                                    handleResendInvite(candidate);
                                  }}
                                  disabled={normalizeLabel(candidate.status) === 'MANUALLYINVITED' || resendingInviteId === (candidate.id || candidate.candidateId)}
                                  className={`w-full px-4 py-2 text-xs flex items-center gap-2 transition-colors ${normalizeLabel(candidate.status) === 'MANUALLYINVITED' || resendingInviteId === (candidate.id || candidate.candidateId)
                                    ? "text-gray-300 cursor-not-allowed bg-gray-50"
                                    : "text-gray-700 hover:bg-green-50 hover:text-green-700"
                                    }`}
                                >
                                  {resendingInviteId === (candidate.id || candidate.candidateId) ? (
                                    <>
                                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                      Sending...
                                    </>
                                  ) : (
                                    <>
                                      <Send className="h-3.5 w-3.5" />
                                      {normalizeLabel(candidate.status) === 'MANUALLYINVITED' ? "Invite Sent" : "Resend Invite"}
                                    </>
                                  )}
                                </button>
                              </PermissionWrapper>
                            </div>
                          )}
                        </div>
                      </td>
                    </>
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
      <SnackbarAlert
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      />

      {/* Candidate Details Drawer - Rendered via Portal */}
      {showDetailsDrawer && createPortal(
        <div className="fixed inset-0 z-[10000] overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
            onClick={() => setShowDetailsDrawer(false)}
          />

          {/* Drawer Content */}
          <div className="absolute inset-y-0 right-0 w-full sm:w-[500px] md:w-[600px] bg-slate-50 shadow-2xl transition-transform animate-in slide-in-from-right duration-300 border-l border-slate-200 flex flex-col">
            {/* Header */}
            <div className="px-6 py-5 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-bold text-slate-900 leading-tight">Candidate Details</h2>
                <p className="text-[11px] font-medium text-slate-500 mt-1 uppercase tracking-wider">Comprehensive View</p>
              </div>
              <button
                onClick={() => setShowDetailsDrawer(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 pb-12">
              {loadingDetails ? (
                <div className="h-full flex flex-col items-center justify-center space-y-4">
                  <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                  <p className="text-xs font-bold text-slate-400">Fetching complete details...</p>
                </div>
              ) : fullCandidateDetails ? (
                <>
                  {/* Section: Personal Information */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Personal Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <DetailItem label="Full Name" value={fullCandidateDetails.fullName || fullCandidateDetails.name || fullCandidateDetails.candidateName} icon={<User size={10} />} />
                      <DetailItem label="Email Address" value={fullCandidateDetails.email} icon={<Mail size={10} />} />
                      <DetailItem label="Mobile Number" value={fullCandidateDetails.mobileNumber || fullCandidateDetails.phone || "Not Provided"} icon={<Phone size={10} />} />
                      <DetailItem label="Candidate Code" value={fullCandidateDetails.code || fullCandidateDetails.candidateCode || "N/A"} icon={<Code size={10} />} />
                      <DetailItem label="Registration Number" value={fullCandidateDetails.regNo || "Not Provided"} />
                      <DetailItem label="Status"
                        value={
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${(fullCandidateDetails.status || '').toUpperCase() === 'ACTIVE' || (fullCandidateDetails.status || '').toUpperCase() === 'TEST_COMPLETED'
                            ? 'bg-green-50 text-green-700'
                            : (fullCandidateDetails.status || '').toUpperCase() === 'INVITED' || (fullCandidateDetails.status || '').toUpperCase() === 'MANUALLY INVITED'
                              ? 'bg-purple-50 text-purple-700'
                              : 'bg-gray-50 text-gray-700'
                            }`}>
                            {(fullCandidateDetails.status || 'PENDING').toUpperCase()}
                          </span>
                        }
                      />
                    </div>
                  </div>

                  {/* Section: Academic Information */}
                  <div className="space-y-4 pt-2">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Academic Information
                    </h3>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                        <DetailItem label="College" value={fullCandidateDetails.college || fullCandidateDetails.collegeName || "Not Provided"} icon={<Building2 size={10} />} />
                        <DetailItem label="Degree" value={fullCandidateDetails.degree || "Not Provided"} icon={<GraduationCap size={10} />} />
                        <DetailItem label="Stream" value={fullCandidateDetails.stream || "Not Provided"} />
                        <DetailItem label="Semester" value={fullCandidateDetails.semester || "Not Provided"} />
                        <DetailItem label="Academic Year" value={
                          fullCandidateDetails.academicYearStart && fullCandidateDetails.academicYearEnd
                            ? `${fullCandidateDetails.academicYearStart} - ${fullCandidateDetails.academicYearEnd}`
                            : "Not Provided"
                        } />
                      </div>
                    </div>
                  </div>

                  {/* Section: Account Information */}
                  <div className="space-y-4 pt-2">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Account Information
                    </h3>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                        <DetailItem label="Last Login" value={
                          fullCandidateDetails.lastLogin
                            ? new Date(fullCandidateDetails.lastLogin).toLocaleString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                            : "Never"
                        } icon={<Calendar size={10} />} />
                        <DetailItem label="Created At" value={
                          fullCandidateDetails.createdAt || fullCandidateDetails.candidateCreatedAt
                            ? new Date(fullCandidateDetails.createdAt || fullCandidateDetails.candidateCreatedAt).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })
                            : "N/A"
                        } />
                        <DetailItem label="Registration Paid" value={
                          fullCandidateDetails.registrationPaid || fullCandidateDetails.registration_paid
                            ? <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700">Paid</span>
                            : <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-50 text-gray-700">Unpaid</span>
                        } />
                      </div>
                    </div>
                  </div>

                  {/* Section: Resume Information */}
                  {(fullCandidateDetails.resumePath || fullCandidateDetails.resumeFilename) && (
                    <div className="space-y-4 pt-2">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Resume Information
                      </h3>
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <DetailItem label="Resume File" value={
                          <a
                            href={fullCandidateDetails.resumePath?.startsWith('http')
                              ? fullCandidateDetails.resumePath
                              : `/api/resumes/${fullCandidateDetails.resumePath || fullCandidateDetails.resumeFilename}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <Download size={10} /> {fullCandidateDetails.resumeFilename || fullCandidateDetails.resumePath?.split('/').pop() || 'Resume'}
                          </a>
                        } />
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// Helper component for detail items
const DetailItem = ({ label, value, icon }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-1">
      {icon}{label}
    </span>
    <span className="text-xs font-semibold text-slate-800 break-words">{value || "—"}</span>
  </div>
);

export default CandidateDatabase;
