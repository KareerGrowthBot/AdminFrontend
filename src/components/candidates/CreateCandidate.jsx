import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Save, Upload, FileText, Search, X, Filter } from "lucide-react";
import { candidateService } from "../../services/candidateService";
import { positionService } from "../../services/positionService";
import { questionSetService } from "../../services/questionSetService";
import { questionSectionService } from "../../services/questionSectionService";
import { fileService } from "../../services/fileService";
import { authService } from "../../services/authService";
import { assessmentSummaryService } from "../../services/assessmentSummaryService";
import SnackbarAlert from "../common/SnackbarAlert";

const CreateCandidate = ({ adminInfo }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const questionSetIdFromState = location.state?.questionSetId;
  const positionIdFromState = location.state?.positionId;
  const candidateIdFromState = location.state?.candidateId;
  const candidateFromState = location.state?.candidate;
  const emailFromState = location.state?.email;
  const isEditMode = location.state?.isEditMode || false;

  const [formData, setFormData] = useState({
    positionId: positionIdFromState || location.state?.positionId || "",
    positionTitle: location.state?.positionTitle || "",
    positionCode: location.state?.positionCode || "",
    questionSetId: questionSetIdFromState || location.state?.questionSetId || "",
    interviewScheduleType: location.state?.interviewScheduleType || "LINK_VALIDITY",
    linkExpiresInDays: location.state?.linkExpiresInDays || "7",
    linkType: location.state?.linkType || "PRIVATE", // PRIVATE or PUBLIC
    candidateEmail: emailFromState || location.state?.candidateEmail || "",
    candidateName: location.state?.candidateName || "",
    whatsappNumber: location.state?.whatsappNumber || "",
    resumeFile: null,
    resumeFileName: location.state?.resumeFileName || "",
    resumeFilePath: location.state?.resumeFilePath || "",
    semester: location.state?.semester || "",
    registrationPaid: location.state?.registrationPaid || false
  });

  const [publicLink, setPublicLink] = useState("");
  const [generatingLink, setGeneratingLink] = useState(false);
  const [linkParams, setLinkParams] = useState({
    positionId: "",
    questionSetId: "",
    linkExpiresInDays: ""
  });
  const [checkingExistingLink, setCheckingExistingLink] = useState(false);

  const [showNotFoundPopup, setShowNotFoundPopup] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [semesterDropdownOpen, setSemesterDropdownOpen] = useState(false);
  const [semesterFilter, setSemesterFilter] = useState("");

  const [positions, setPositions] = useState([]);
  const [questionSets, setQuestionSets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarSearchTerm, setSidebarSearchTerm] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [advancedFilters, setAdvancedFilters] = useState({
    department: "",
    batchStart: "",
    batchEnd: "",
    stream: "",
    degree: ""
  });
  const [sidebarDropdowns, setSidebarDropdowns] = useState({
    stream: false,
    degree: false
  });
  const [sidebarFilters, setSidebarFilters] = useState({
    stream: "",
    degree: ""
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [adminInfoState, setAdminInfoState] = useState(adminInfo || null);

  const isLoadingPositionsRef = useRef(false);
  const isLoadingQuestionSetsRef = useRef(false);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadPositions();
      if (formData.positionId) {
        loadQuestionSets(formData.positionId);
      }
      loadAdminInfo();
    }
  }, []);

  useEffect(() => {
    if (adminInfoState) {
      loadCandidates();
    }
  }, [adminInfoState]);

  // Update form data from location state when navigating back from AddCandidate
  useEffect(() => {
    if (location.state) {
      const updates = {};
      if (location.state.positionId && location.state.positionId !== formData.positionId) {
        updates.positionId = location.state.positionId;
      }
      if (location.state.questionSetId && location.state.questionSetId !== formData.questionSetId) {
        updates.questionSetId = location.state.questionSetId;
      }
      if (location.state.interviewScheduleType && location.state.interviewScheduleType !== formData.interviewScheduleType) {
        updates.interviewScheduleType = location.state.interviewScheduleType;
      }
      if (location.state.linkExpiresInDays && location.state.linkExpiresInDays !== formData.linkExpiresInDays) {
        updates.linkExpiresInDays = location.state.linkExpiresInDays;
      }
      if (location.state.linkType && location.state.linkType !== formData.linkType) {
        updates.linkType = location.state.linkType;
      }
      if (location.state.candidateEmail && location.state.candidateEmail !== formData.candidateEmail) {
        updates.candidateEmail = location.state.candidateEmail;
      }
      if (location.state.candidateName && location.state.candidateName !== formData.candidateName) {
        updates.candidateName = location.state.candidateName;
      }
      if (location.state.whatsappNumber && location.state.whatsappNumber !== formData.whatsappNumber) {
        updates.whatsappNumber = location.state.whatsappNumber;
      }
      if (location.state.resumeFileName && location.state.resumeFileName !== formData.resumeFileName) {
        updates.resumeFileName = location.state.resumeFileName;
      }
      if (location.state.resumeFilePath && location.state.resumeFilePath !== formData.resumeFilePath) {
        updates.resumeFilePath = location.state.resumeFilePath;
      }

      if (Object.keys(updates).length > 0) {
        setFormData(prev => ({ ...prev, ...updates }));
      }
    }

    // Also handle emailFromState for backward compatibility
    if (emailFromState && emailFromState !== formData.candidateEmail) {
      setFormData(prev => ({ ...prev, candidateEmail: emailFromState }));
    }
  }, [location.state, emailFromState]);

  useEffect(() => {
    filterCandidates();
  }, [sidebarSearchTerm, advancedFilters, candidates]);

  const loadAdminInfo = async () => {
    try {
      if (!adminInfo) {
        const admin = await authService.getCurrentAdmin();
        setAdminInfoState(admin);
      } else {
        setAdminInfoState(adminInfo);
      }
    } catch (error) {
      console.error("Error loading admin info:", error);
    }
  };

  const loadCandidates = async () => {
    try {
      const organizationId = adminInfoState?.organization?.organizationId || null;
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
      console.error("Error loading candidates:", error);
      setCandidates([]); // Ensure candidates is always an array on error
    }
  };

  const filterCandidates = () => {
    // Ensure candidates is an array before filtering
    if (!Array.isArray(candidates)) {
      setFilteredCandidates([]);
      return;
    }

    let filtered = [...candidates];

    // Apply search filter
    if (sidebarSearchTerm) {
      const searchLower = sidebarSearchTerm.toLowerCase();
      filtered = filtered.filter((candidate) => {
        return (
          candidate.regNo?.toLowerCase().includes(searchLower) ||
          candidate.name?.toLowerCase().includes(searchLower) ||
          candidate.fullName?.toLowerCase().includes(searchLower) ||
          candidate.email?.toLowerCase().includes(searchLower) ||
          candidate.mobileNumber?.toLowerCase().includes(searchLower) ||
          candidate.phone?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply advanced filters
    if (advancedFilters.department) {
      filtered = filtered.filter((candidate) =>
        candidate.college?.toLowerCase().includes(advancedFilters.department.toLowerCase())
      );
    }
    if (advancedFilters.stream) {
      filtered = filtered.filter((candidate) =>
        candidate.stream?.toLowerCase().includes(advancedFilters.stream.toLowerCase())
      );
    }
    if (advancedFilters.batchStart) {
      filtered = filtered.filter((candidate) =>
        candidate.academicYearStart?.toString() === advancedFilters.batchStart
      );
    }
    if (advancedFilters.batchEnd) {
      filtered = filtered.filter((candidate) =>
        candidate.academicYearEnd?.toString() === advancedFilters.batchEnd
      );
    }
    if (advancedFilters.degree) {
      filtered = filtered.filter((candidate) =>
        candidate.degree?.toLowerCase().includes(advancedFilters.degree.toLowerCase())
      );
    }

    setFilteredCandidates(filtered);
  };

  const handleClearFilters = () => {
    setSidebarSearchTerm("");
    setAdvancedFilters({
      department: "",
      batchStart: "",
      batchEnd: "",
      stream: "",
      degree: ""
    });
    setSidebarFilters({
      stream: "",
      degree: ""
    });
    setShowAdvancedFilters(false);
  };

  const handleSelectCandidate = (candidate) => {
    // Debug log to see what we're getting from API
    console.log("Selected candidate data:", candidate);
    console.log("All candidate keys:", Object.keys(candidate));

    // Fill all available fields from candidate data
    // API returns: resumeFilename (camelCase) and resumePath (camelCase) from getAllCandidatesWithStatus
    // Check all possible field name variations (prioritize camelCase as that's what API returns)
    const resumeFileName = candidate.resumeFilename ||
      candidate.resumeFileName ||
      candidate.resume_filename || "";

    const resumeFilePath = candidate.resumePath ||
      candidate.resumeStoragePath ||
      candidate.resume_storage_path || "";

    console.log("Extracted resume info:", { resumeFileName, resumeFilePath });

    const updatedFormData = {
      ...formData,
      candidateEmail: candidate.email || "",
      candidateName: candidate.fullName || candidate.name || "",
      whatsappNumber: candidate.mobileNumber || candidate.phone || "",
      semester: candidate.semester || "",
      resumeFilePath: resumeFilePath,
      resumeFileName: resumeFileName,
      registrationPaid: candidate.registrationPaid || false
    };

    setFormData(updatedFormData);

    // If resume exists, set the selected file indicator to show it in the UI
    if (resumeFileName && resumeFileName.trim() !== "") {
      setSelectedFile({
        name: resumeFileName,
        path: resumeFilePath
      });
      console.log("Set selectedFile:", { name: resumeFileName, path: resumeFilePath });
    } else {
      // Clear selected file if no resume
      setSelectedFile(null);
      console.log("No resume found, cleared selectedFile");
    }

    setSidebarOpen(false);
  };

  // Get unique values for filter dropdowns
  const getUniqueDepartments = () => {
    const departments = new Set();
    candidates.forEach(c => {
      if (c.college) departments.add(c.college);
    });
    return Array.from(departments).sort();
  };

  const getUniqueStreams = () => {
    const streams = new Set();
    candidates.forEach(c => {
      if (c.stream) streams.add(c.stream);
    });
    return Array.from(streams).sort();
  };

  const getUniqueBatchYears = () => {
    const years = new Set();
    candidates.forEach(c => {
      if (c.academicYearStart) years.add(c.academicYearStart.toString());
      if (c.academicYearEnd) years.add(c.academicYearEnd.toString());
    });
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  };

  useEffect(() => {
    if (formData.positionId && formData.positionId !== positionIdFromState) {
      loadQuestionSets(formData.positionId);
    }
  }, [formData.positionId]);

  // Check for existing public link when parameters change
  useEffect(() => {
    const checkExistingLink = async () => {
      // Only check if we're in PUBLIC link mode and all required fields are filled
      if (formData.linkType === "PUBLIC" &&
        formData.positionId &&
        formData.questionSetId &&
        formData.linkExpiresInDays) {

        // Check if parameters have changed (normalize linkExpiresInDays for comparison)
        const currentParams = {
          positionId: formData.positionId,
          questionSetId: formData.questionSetId,
          linkExpiresInDays: formData.linkExpiresInDays.toString()
        };

        const paramsChanged =
          linkParams.positionId !== currentParams.positionId ||
          linkParams.questionSetId !== currentParams.questionSetId ||
          linkParams.linkExpiresInDays !== currentParams.linkExpiresInDays;

        // If parameters match existing link params, don't check again
        if (!paramsChanged && publicLink) {
          return;
        }

        setCheckingExistingLink(true);
        try {
          const response = await candidateService.getExistingPublicLink({
            positionId: formData.positionId,
            questionSetId: formData.questionSetId,
            linkExpiresInDays: parseInt(formData.linkExpiresInDays)
          });

          if (response.exists && response.publicLink) {
            // Check if link is expired
            if (response.expired) {
              showMessage("The previously generated link has expired. Please generate a new link.", "warning");
              setPublicLink("");
              setLinkParams(currentParams);
            } else {
              setPublicLink(response.publicLink);
              setLinkParams(currentParams);
            }
          } else {
            // No existing link found, clear if params changed
            if (paramsChanged) {
              setPublicLink("");
            }
            setLinkParams(currentParams);
          }
        } catch (error) {
          console.error("Error checking existing link:", error);
          // Don't show error, just continue
        } finally {
          setCheckingExistingLink(false);
        }
      } else if (formData.linkType === "PUBLIC") {
        // Clear link if required fields are missing
        setPublicLink("");
        setLinkParams({
          positionId: "",
          questionSetId: "",
          linkExpiresInDays: ""
        });
      }
    };

    checkExistingLink();
  }, [formData.linkType, formData.positionId, formData.questionSetId, formData.linkExpiresInDays]);

  // Load candidate data if editing
  useEffect(() => {
    if (candidateFromState) {
      setFormData(prev => ({
        ...prev,
        positionId: candidateFromState.positionId || "",
        questionSetId: candidateFromState.questionSetId || "",
        candidateEmail: candidateFromState.email || "",
        candidateName: candidateFromState.fullName || "",
        whatsappNumber: candidateFromState.phone || "",
        resumeFilePath: candidateFromState.resumePath || "",
        resumeFileName: candidateFromState.resumeFileName || ""
      }));
    }
  }, [candidateFromState]);

  const loadPositions = async () => {
    if (isLoadingPositionsRef.current) return;
    isLoadingPositionsRef.current = true;
    try {
      const response = await positionService.getAllPositions();

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
      console.error("Error loading positions:", error);
      // Ensure positions is always an array even on error
      setPositions([]);
      showMessage("Failed to load positions", "error");
    } finally {
      isLoadingPositionsRef.current = false;
    }
  };

  const loadQuestionSets = async (positionId) => {
    if (isLoadingQuestionSetsRef.current) return;
    if (!positionId) return;

    isLoadingQuestionSetsRef.current = true;
    try {
      const data = await questionSetService.getQuestionSetsByPositionId(positionId);
      setQuestionSets(data);
      // Auto-select first question set if available
      if (data.length > 0 && !formData.questionSetId) {
        setFormData(prev => ({ ...prev, questionSetId: data[0].id }));
      }
    } catch (error) {
      console.error("Error loading question sets:", error);
      showMessage("Failed to load question sets", "error");
    } finally {
      isLoadingQuestionSetsRef.current = false;
    }
  };

  const semesterOptions = [
    "Semester 1", "Semester 2", "Semester 3", "Semester 4",
    "Semester 5", "Semester 6", "Semester 7", "Semester 8",
    "1st Year", "2nd Year", "3rd Year", "4th Year",
    "Completed", "Passed Out"
  ];

  const handleSemesterInputChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, semester: value }));
    setSemesterFilter(value);
    setSemesterDropdownOpen(true);
  };

  const handleSemesterSelect = (value) => {
    setFormData(prev => ({ ...prev, semester: value }));
    setSemesterFilter(value);
    setSemesterDropdownOpen(false);
  };

  const degreeOptions = [
    "B.Tech", "B.E", "B.Sc", "B.Com", "B.A", "BBA", "BCA",
    "M.Tech", "M.E", "M.Sc", "M.Com", "M.A", "MBA", "MCA",
    "B.Pharm", "M.Pharm", "BDS", "MBBS", "LLB", "LLM",
    "B.Ed", "M.Ed", "PhD", "Diploma", "Other"
  ];

  const streamOptions = [
    "Computer Science", "Information Technology", "Electronics and Communication",
    "Electrical Engineering", "Mechanical Engineering", "Civil Engineering",
    "Chemical Engineering", "Aerospace Engineering", "Biotechnology",
    "Data Science", "Artificial Intelligence", "Cyber Security", "Cloud Computing",
    "Mathematics", "Physics", "Chemistry", "Biology", "Commerce", "Economics",
    "Business Administration", "Finance", "Marketing", "Human Resources",
    "Arts", "Design", "Architecture", "Law", "Medical", "Pharmacy", "Education", "Other"
  ];

  const handleSidebarDropdownSelect = (field, value) => {
    setAdvancedFilters(prev => ({ ...prev, [field]: value }));
    setSidebarFilters(prev => ({ ...prev, [field]: value }));
    setSidebarDropdowns(prev => ({ ...prev, [field]: false }));
  };

  const handleSidebarDropdownInputChange = (field) => (e) => {
    const value = e.target.value;
    setAdvancedFilters(prev => ({ ...prev, [field]: value }));
    setSidebarFilters(prev => ({ ...prev, [field]: value }));
    setSidebarDropdowns(prev => ({ ...prev, [field]: true }));
  };

  const filteredSemesterOptions = semesterOptions.filter(opt =>
    opt.toLowerCase().includes((semesterFilter || "").toLowerCase())
  );

  const showMessage = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleChange = async (e) => {
    const { name, value, type, checked } = e.target;

    // If position is being changed, fetch position details
    if (name === "positionId" && value) {
      try {
        const positionDetails = await positionService.getPositionById(value);
        setFormData(prev => ({
          ...prev,
          [name]: value,
          positionTitle: positionDetails?.title || "",
          positionCode: positionDetails?.code || ""
        }));
      } catch (error) {
        console.error("Error fetching position details:", error);
        setFormData(prev => ({
          ...prev,
          [name]: value,
          positionTitle: "",
          positionCode: ""
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleEmailBlur = async (e) => {
    const email = e.target.value.trim();

    // Only check if email is valid and contains @
    if (email && email.includes("@")) {
      setCheckingEmail(true);
      try {
        // Search candidate by email in organization (automatically filtered by current admin's organization)
        const candidate = await candidateService.searchCandidateByEmail(email);
        if (candidate) {
          // Populate form with candidate details
          setFormData(prev => ({
            ...prev,
            candidateName: candidate.fullName || "",
            whatsappNumber: candidate.phone || "",
            semester: candidate.semester || "",
            resumeFilePath: candidate.resumePath || candidate.resumeFilename || "",
            resumeFileName: candidate.resumeFilename || ""
          }));

          // If resume exists, show it
          if (candidate.resumePath || candidate.resumeFilename) {
            setSelectedFile(null); // Clear selected file since we have existing resume
          }
        }
      } catch (error) {
        // Candidate not found - show popup
        if (error.response?.status === 404) {
          setShowNotFoundPopup(true);
        }
      } finally {
        setCheckingEmail(false);
      }
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        showMessage("Please select a PDF or Word document (.docx)", "error");
        return;
      }
      setSelectedFile(file);
      setUploading(true);
      try {
        const uploadResponse = await fileService.uploadResume(file);
        const path = uploadResponse.path || uploadResponse.filePath;
        const name = uploadResponse.originalFileName || uploadResponse.fileName || file.name;
        setFormData(prev => ({
          ...prev,
          resumeFileName: name,
          resumeFilePath: path
        }));
        showMessage("Resume uploaded successfully", "success");
      } catch (err) {
        console.error("Resume upload failed:", err);
        showMessage(err?.response?.data?.error || "Failed to upload resume. Please try again.", "error");
        setSelectedFile(null);
        setFormData(prev => ({ ...prev, resumeFileName: "", resumeFilePath: "" }));
      } finally {
        setUploading(false);
        e.target.value = "";
      }
    } else {
      setSelectedFile(null);
      setFormData(prev => ({ ...prev, resumeFileName: "", resumeFilePath: "" }));
    }
  };

  const handleRemoveFile = async () => {
    const path = formData.resumeFilePath;
    if (path && path.startsWith("resumes/")) {
      try {
        const parts = path.split("/");
        const subfolder = parts[0];
        const filename = parts.slice(1).join("/");
        await fileService.deleteFile(subfolder, filename);
      } catch (e) {
        console.warn("Could not delete resume from server:", e);
      }
    }
    setSelectedFile(null);
    setFormData(prev => ({ ...prev, resumeFileName: "", resumeFilePath: "" }));
  };

  const handleGeneratePublicLink = async () => {
    // Validation
    if (!formData.positionId) {
      showMessage("Please select a position", "error");
      return;
    }
    if (!formData.questionSetId) {
      showMessage("Please select a question set", "error");
      return;
    }

    try {
      setGeneratingLink(true);

      // Calculate expiration date from today + linkExpiresInDays
      const expiresInDays = parseInt(formData.linkExpiresInDays) || 7;
      const today = new Date();
      const expiresAt = new Date(today);
      expiresAt.setDate(today.getDate() + expiresInDays);

      // Format as YYYY-MM-DD HH:mm:ss for backend
      const year = expiresAt.getFullYear();
      const month = String(expiresAt.getMonth() + 1).padStart(2, '0');
      const day = String(expiresAt.getDate()).padStart(2, '0');
      const hours = String(expiresAt.getHours()).padStart(2, '0');
      const minutes = String(expiresAt.getMinutes()).padStart(2, '0');
      const seconds = String(expiresAt.getSeconds()).padStart(2, '0');
      const expiresAtFormatted = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

      console.log("Calculated expiration date:", expiresAtFormatted, "from today +", expiresInDays, "days");

      const response = await candidateService.generatePublicLink({
        positionId: formData.positionId,
        positionTitle: formData.positionTitle,
        positionCode: formData.positionCode,
        questionSetId: formData.questionSetId,
        linkExpiresInDays: expiresInDays,
        expiresAt: expiresAtFormatted, // Send calculated date
        interviewScheduleType: formData.interviewScheduleType || "LINK_VALIDITY"
      });

      if (response && response.publicLink) {
        setPublicLink(response.publicLink);
        // Update link params to match current form data
        setLinkParams({
          positionId: formData.positionId,
          questionSetId: formData.questionSetId,
          linkExpiresInDays: formData.linkExpiresInDays.toString()
        });

        // Log all returned details for debugging
        console.log("Public link generated with details:", {
          publicLink: response.publicLink,
          positionId: response.positionId,
          positionTitle: response.positionTitle,
          positionCode: response.positionCode,
          questionSetId: response.questionSetId,
          questionSetCode: response.questionSetCode,
          interviewScheduleType: response.interviewScheduleType,
          linkExpiresInDays: response.linkExpiresInDays,
          expiresAt: response.expiresAt
        });

        showMessage("Public link generated successfully!", "success");
      } else {
        showMessage("Failed to generate link", "error");
      }
    } catch (error) {
      console.error("Error generating public link:", error);
      const errorMessage = error?.response?.data?.error || error?.message || "Failed to generate link. Please try again.";
      showMessage(errorMessage, "error");
    } finally {
      setGeneratingLink(false);
    }
  };

  // Check if button should be disabled
  const isGenerateButtonDisabled = () => {
    if (generatingLink || checkingExistingLink) return true;
    if (!formData.positionId || !formData.questionSetId) return false; // Allow click to show validation

    // Check if current params match the link params (normalize linkExpiresInDays for comparison)
    const currentParams = {
      positionId: formData.positionId,
      questionSetId: formData.questionSetId,
      linkExpiresInDays: formData.linkExpiresInDays.toString()
    };

    const paramsMatch =
      linkParams.positionId === currentParams.positionId &&
      linkParams.questionSetId === currentParams.questionSetId &&
      linkParams.linkExpiresInDays === currentParams.linkExpiresInDays;

    // Disable if link exists and params match
    return publicLink && paramsMatch;
  };

  const handleCopyLink = () => {
    if (publicLink) {
      navigator.clipboard.writeText(publicLink);
      showMessage("Link copied to clipboard!", "success");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.positionId) {
      showMessage("Please select a position", "error");
      return;
    }
    if (!formData.questionSetId) {
      showMessage("Please select a question set", "error");
      return;
    }
    if (formData.linkType === "PRIVATE") {
      if (!formData.candidateEmail) {
        showMessage("Please enter candidate email", "error");
        return;
      }
      if (!formData.candidateName) {
        showMessage("Please enter candidate name", "error");
        return;
      }
      if (!formData.whatsappNumber) {
        showMessage("Please enter WhatsApp number", "error");
        return;
      }

      if (!selectedFile && !formData.resumeFilePath) {
        showMessage("Please upload candidate resume", "error");
        return;
      }
    }
    if (formData.linkType === "PUBLIC") {
      if (!publicLink) {
        showMessage("Please generate a public link first", "error");
        return;
      }
      // For public link, we don't need to submit - the link is already generated
      showMessage("Public link is ready to share!", "success");
      return;
    }

    try {
      setLoading(true);

      // Resume already uploaded on file select (same as JD) and path stored in form state.
      const resumePath = formData.resumeFilePath;
      const resumeFileName = formData.resumeFileName;
      if (!resumePath) {
        showMessage("Please upload candidate resume", "error");
        setLoading(false);
        return;
      }

      const candidateData = {
        email: formData.candidateEmail,
        fullName: formData.candidateName,
        phone: formData.whatsappNumber,
        positionId: formData.positionId,
        questionSetId: formData.questionSetId,
        interviewScheduleType: formData.interviewScheduleType,
        linkExpiresInDays: parseInt(formData.linkExpiresInDays),
        linkType: formData.linkType,
        resumePath,
        resumeFileName,
        semester: formData.semester,
        registrationPaid: formData.registrationPaid
      };

      if (isEditMode && candidateIdFromState) {
        // TODO: Add update API when available
        showMessage("Update functionality coming soon", "info");
      } else {
        // POST /api/candidates/create then POST /api/candidates/private-link (visible in browser Network).
        const res = await candidateService.createCandidate(candidateData);
        const c = res?.candidate;
        const cp = res?.candidatePosition;
        const candidateId = c?.id ?? cp?.candidateId;
        const positionId = cp?.positionId ?? formData.positionId;
        const questionSetId = cp?.questionSetId ?? formData.questionSetId;

        if (candidateId && positionId) {
          try {
            await candidateService.createOrGetPrivateLink({
              candidateId,
              positionId,
              questionSetId: questionSetId || undefined
            });
          } catch (e) {
            console.warn("Private link create/get failed (non-blocking):", e?.response?.data || e?.message);
          }

          // Create assessment summary after candidate is created and linked to position
          // This API is called when a candidate is added to a test
          // Note: candidateId remains the same for multiple positions, but each position gets its own assessment summary
          if (questionSetId) {
            try {
              console.log("🔄 Starting assessment summary creation for candidate...");
              console.log("🔄 Candidate ID:", candidateId, "(same candidateId for all positions)");
              console.log("🔄 Position ID:", positionId, "(unique per position)");
              console.log("🔄 Question Set ID:", questionSetId, "(unique per position)");

              // Step 1: Fetch position details to get organizationId (if needed)
              console.log("📥 Fetching position details...");
              const positionDetails = await positionService.getPositionById(positionId);
              console.log("✅ Position details:", positionDetails);

              // Step 2: Fetch question set details to get question counts
              console.log("📥 Fetching question set details...");
              const questionSetDetails = await questionSetService.getQuestionSetById(questionSetId);
              console.log("✅ Question set details:", questionSetDetails);

              // Step 2.5: Fetch question section details to get round times
              console.log("📥 Fetching question section details...");
              let questionSectionData = null;
              let round1Time = null;
              let round2Time = null;
              let round3Time = null;
              let round4Time = null;
              
              try {
                const questionSectionResponse = await questionSectionService.getQuestionSectionByQuestionSet(questionSetId);
                console.log("✅ Question section response:", questionSectionResponse);
                
                if (questionSectionResponse?.status === "success" && questionSectionResponse?.data) {
                  questionSectionData = questionSectionResponse.data;
                  round1Time = questionSectionData.round1Time || null;
                  round2Time = questionSectionData.round2Time || null;
                  round3Time = questionSectionData.round3Time || null;
                  round4Time = questionSectionData.round4Time || null;
                  
                  console.log("✅ Round times from question section:", {
                    round1Time,
                    round2Time,
                    round3Time,
                    round4Time
                  });
                } else {
                  console.warn("⚠️ Question section data not found or invalid format");
                }
              } catch (sectionError) {
                console.warn("⚠️ Failed to fetch question section, will use null for round times:", sectionError);
              }

              // Extract question counts from question set
              const generalCount = questionSetDetails?.generalQuestionsCount || 0;
              const positionSpecificCount = questionSetDetails?.positionSpecificQuestionsCount || 0;
              const codingCount = questionSetDetails?.codingQuestionsCount || 0;
              const aptitudeCount = questionSetDetails?.aptitudeQuestionsCount || 0;
              const totalDuration = questionSetDetails?.totalDuration || 0;

              console.log("📊 Question counts:", {
                general: generalCount,
                positionSpecific: positionSpecificCount,
                coding: codingCount,
                aptitude: aptitudeCount,
                totalDuration: totalDuration
              });

              // Determine round assignments (matching backend pattern)
              // round1=general, round2=position, round3=coding, round4=aptitude
              const round1Assigned = generalCount > 0;
              const round2Assigned = positionSpecificCount > 0;
              const round3Assigned = codingCount > 0;     // round3 = coding
              const round4Assigned = aptitudeCount > 0;   // round4 = aptitude
              const totalRoundsAssigned = [round1Assigned, round2Assigned, round3Assigned, round4Assigned].filter(Boolean).length;

              console.log("🎯 Round assignments:", {
                round1Assigned,
                round2Assigned,
                round3Assigned,
                round4Assigned,
                totalRoundsAssigned
              });

              // Step 3: Create assessment summary
              // Note: candidateId is the same for all positions, but positionId and questionSetId are unique per position
              // This allows one candidate to have multiple assessment summaries (one per position)
              const assessmentStatePayload = {
                positionId: positionId,  // Unique per position
                candidateId: candidateId,  // Same candidateId for all positions
                questionId: questionSetId,  // Unique per position (this is the questionSetId)
                totalRoundsAssigned: totalRoundsAssigned,
                totalRoundsCompleted: 0,
                totalInterviewTime: String(totalDuration),  // Total duration in minutes (as string)
                
                // Round 1 - General Questions
                round1Assigned: round1Assigned,
                round1Completed: false,
                round1Time: round1Time,  // Round time from question section (hh:mm:ss format)
                round1TimeTaken: null,
                round1StartTime: null,
                round1EndTime: null,
                
                // Round 2 - Position Specific Questions
                round2Assigned: round2Assigned,
                round2Completed: false,
                round2Time: round2Time,  // Round time from question section (hh:mm:ss format)
                round2TimeTaken: null,
                round2StartTime: null,
                round2EndTime: null,
                
                // Round 3 - Coding Questions
                round3Assigned: round3Assigned,
                round3Completed: false,
                round3Time: round3Time,  // Round time from question section (hh:mm:ss format)
                round3TimeTaken: null,
                round3StartTime: null,
                round3EndTime: null,
                
                // Round 4 - Aptitude Questions
                round4Assigned: round4Assigned,
                round4Completed: false,
                round4Time: round4Time,  // Round time from question section (hh:mm:ss format)
                round4TimeTaken: null,
                round4StartTime: null,
                round4EndTime: null,
                
                isAssessmentCompleted: false,
                isReportGenerated: false,
                
                // Optional time fields (can be null initially)
                totalCompletionTime: null,
                assessmentStartTime: null,
                assessmentEndTime: null
              };

              console.log("📤 Calling assessment summary API...");
              console.log("📤 API URL: http://localhost:8085/assessment-summaries");
              console.log("📤 Payload:", JSON.stringify(assessmentStatePayload, null, 2));
              
              const assessmentResult = await assessmentSummaryService.createAssessmentSummary(assessmentStatePayload);
              console.log("✅ Assessment summary created/updated:", assessmentResult);
              console.log("✅ Full API Response:", JSON.stringify(assessmentResult, null, 2));
            } catch (assessmentError) {
              console.error("❌ Failed to create assessment summary:", assessmentError);
              console.error("❌ Error response:", assessmentError.response?.data);
              console.error("❌ Error status:", assessmentError.response?.status);
              // Don't block the flow - assessment summary creation failure shouldn't block candidate creation
            }
          } else {
            console.warn("⚠️ Question Set ID not available, skipping assessment summary creation");
          }
        }

        showMessage(
          "Candidate added to test. Resume evaluation in progress. We'll notify the candidate if eligible.",
          "success"
        );

        setTimeout(() => {
          navigate("/dashboard/test-assignments", {
            state: { activeTab: "test", forceReload: true }
          });
        }, 1500);
      }
    } catch (error) {
      console.error("Error creating candidate:", error);
      let errorMessage = error?.response?.data?.error || error?.message || "Failed to add candidate. Please try again.";
      if (typeof errorMessage === "string" && errorMessage.toLowerCase().includes("interview credits")) {
        errorMessage = "No interview credits left. Add credits to continue.";
      }
      showMessage(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  // Filter question sets by selected position
  const filteredQuestionSets = questionSets.filter(qs => qs.positionId === formData.positionId);

  return (
    <div className="min-h-full bg-white relative">
      {/* Fixed Search Button - Right Edge */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed right-0 top-24 px-4 py-2.5 bg-gradient-to-br from-blue-600 to-qwikBlue text-white rounded-l-lg hover:from-blue-700 hover:to-qwikBlueDark flex items-center gap-2 shadow-lg z-40 transition-all"
      >
        <Search size={18} />
        <span className="font-medium">Search</span>
      </button>

      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft size={16} className="text-navy-900" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-navy-900">{isEditMode ? "Edit Candidate" : "Add Candidate"}</h1>
            <p className="text-xs text-gray-600 mt-0.5">{isEditMode ? "Edit candidate interview invitation" : "Add a new candidate for interview"}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <form onSubmit={handleSubmit}>
        <div className="p-6">
          <div>
            {/* Interview Setup Section - 2 columns per row */}
            <div className="space-y-3">
              {/* Row 1: Select Position and Question Set Code */}
              <div className="grid grid-cols-2 gap-3">
                {/* Select Position */}
                <div>
                  <label className="block text-xs font-medium text-navy-700 mb-1">
                    Select Position <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="positionId"
                    value={formData.positionId}
                    onChange={handleChange}
                    required
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition"
                  >
                    <option value="">Select position</option>
                    {Array.isArray(positions) && positions.map((position) => (
                      <option key={position.id} value={position.id}>
                        {position.title} ({position.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Question Set Code */}
                <div>
                  <label className="block text-xs font-medium text-navy-700 mb-1">
                    Question Set Code <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="questionSetId"
                    value={formData.questionSetId}
                    onChange={handleChange}
                    required
                    disabled={!formData.positionId}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select question set</option>
                    {filteredQuestionSets.map((qs) => (
                      <option key={qs.id} value={qs.id}>
                        {qs.questionSetCode}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Interview Schedule Type and Link Expires In */}
              <div className="grid grid-cols-2 gap-3">
                {/* Interview Schedule Type */}
                <div>
                  <label className="block text-xs font-medium text-navy-700 mb-1">
                    Interview Schedule Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="interviewScheduleType"
                    value={formData.interviewScheduleType}
                    onChange={handleChange}
                    required
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition"
                  >
                    <option value="LINK_VALIDITY">Link Validity</option>
                  </select>
                </div>

                {/* Link Expires In */}
                <div>
                  <label className="block text-xs font-medium text-navy-700 mb-1">
                    Link Expires In (Days) <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="linkExpiresInDays"
                    value={formData.linkExpiresInDays}
                    onChange={handleChange}
                    required
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition"
                  >
                    <option value="1">1 Day</option>
                    <option value="3">3 Day(s)</option>
                    <option value="7">7 Day(s)</option>
                    <option value="14">14 Day(s)</option>
                    <option value="30">30 Day(s)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Link Type Buttons - Outside box, connected to top border */}
            <div className="mt-4 flex items-end justify-start">
              <div className="flex ml-6">
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, linkType: "PRIVATE" }));
                    // Clear public link when switching to private
                    setPublicLink("");
                    setLinkParams({
                      positionId: "",
                      questionSetId: "",
                      linkExpiresInDays: ""
                    });
                  }}
                  className={`px-3 py-1.5 rounded-tl text-xs font-semibold transition relative ${formData.linkType === "PRIVATE"
                    ? "bg-gradient-to-r from-blue-600 to-qwikBlue border-2 border-blue-600 ring-2 ring-navy-500 text-white z-10"
                    : "bg-white border-t border-l border-gray-300 hover:bg-gray-50 text-gray-700 z-0"
                    }`}
                >
                  Private Link
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, linkType: "PUBLIC" }));
                    // Don't clear link when switching to public - it will be loaded if exists
                  }}
                  className={`px-3 py-1.5 rounded-tr text-xs font-semibold transition relative ${formData.linkType === "PUBLIC"
                    ? "bg-gradient-to-r from-blue-600 to-qwikBlue border-2 border-blue-600 ring-2 ring-navy-500 text-white z-10"
                    : "bg-white border-t border-r border-gray-300 hover:bg-gray-50 text-gray-700 z-0"
                    }`}
                >
                  Public Link
                </button>
              </div>
            </div>

            {/* Candidate Details Box - Complete border outline */}
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              {/* Header */}
              <div className="border-b border-gray-300 bg-gray-50 px-3 py-1.5">
                <span className="text-xs font-medium text-gray-700">Candidate Details</span>
              </div>

              {/* Public Link Section */}
              {formData.linkType === "PUBLIC" && (
                <div className="p-2">
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-navy-700 mb-1">
                        Public Registration Link
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={publicLink}
                          readOnly
                          placeholder="Click 'Generate Link' to create a public registration link"
                          className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:border-gray-400 transition"
                        />
                        <button
                          type="button"
                          onClick={handleGeneratePublicLink}
                          disabled={isGenerateButtonDisabled()}
                          className="px-4 py-1.5 text-xs font-semibold bg-gradient-to-r from-blue-600 to-qwikBlue hover:from-blue-700 hover:to-qwikBlueDark text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {checkingExistingLink ? "Checking..." : generatingLink ? "Generating..." : publicLink && isGenerateButtonDisabled() ? "Link Generated" : "Generate Link"}
                        </button>
                        {publicLink && (
                          <button
                            type="button"
                            onClick={handleCopyLink}
                            className="px-3 py-1.5 text-xs font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 rounded-lg transition"
                          >
                            Copy
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Share this link with candidates. They can register and will be automatically linked to this position.
                        {publicLink && isGenerateButtonDisabled() && (
                          <span className="block mt-1 text-green-600 font-medium">
                            ✓ Link is active and will expire in {formData.linkExpiresInDays} day(s)
                          </span>
                        )}
                        {checkingExistingLink && (
                          <span className="block mt-1 text-blue-600 text-xs">
                            Checking for existing link...
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Candidate Details Fields (for Private Link) */}
              {formData.linkType === "PRIVATE" && (
                <div className="p-2">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Candidate Email */}
                    <div className="mt-3">
                      <label className="block text-xs font-medium text-navy-700 mb-1">
                        Candidate Email <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          name="candidateEmail"
                          value={formData.candidateEmail}
                          onChange={handleChange}
                          onBlur={handleEmailBlur}
                          required={formData.linkType === "PRIVATE"}
                          placeholder="Enter candidate email"
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition"
                        />
                        {checkingEmail && (
                          <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                            Checking...
                          </span>
                        )}
                      </div>
                    </div>



                    {/* Candidate Name */}
                    <div className="mt-3">
                      <label className="block text-xs font-medium text-navy-700 mb-1">
                        Candidate Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="candidateName"
                        value={formData.candidateName}
                        onChange={handleChange}
                        required={formData.linkType === "PRIVATE"}
                        placeholder="Enter candidate name"
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition"
                      />
                    </div>

                    {/* WhatsApp Number */}
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-navy-700 mb-1">
                        WhatsApp Number <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <div className="flex items-center gap-1 px-2 py-1.5 border border-gray-300 rounded-lg bg-gray-50">
                          <span className="text-xs">🇮🇳</span>
                          <span className="text-xs text-gray-700">+91</span>
                        </div>
                        <input
                          type="tel"
                          name="whatsappNumber"
                          value={formData.whatsappNumber}
                          onChange={handleChange}
                          required={formData.linkType === "PRIVATE"}
                          placeholder="10 digit number"
                          maxLength={10}
                          className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition"
                        />
                      </div>
                    </div>

                    {/* Candidate Resume */}
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-navy-700 mb-1">
                        Candidate Resume (PDF, Word .docx) {formData.resumeFilePath ? "" : <span className="text-red-500">*</span>}
                      </label>
                      <div className="flex items-center gap-2">
                        <label className={`px-3 py-1.5 text-xs border border-gray-300 rounded-lg cursor-pointer transition ${uploading ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"}`}>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileSelect}
                            disabled={uploading}
                            className="hidden"
                          />
                          {uploading ? "Uploading…" : (formData.resumeFilePath ? "Change file" : "Choose file")}
                        </label>
                        <span className="text-xs text-gray-500">
                          {selectedFile ? selectedFile.name : formData.resumeFileName || "No file chosen"}
                        </span>
                        {(selectedFile || formData.resumeFilePath) && (
                          <button
                            type="button"
                            onClick={handleRemoveFile}
                            className="text-red-600 hover:text-red-800 text-xs"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Registration Paid Checkbox */}

                </div>
              )}
            </div>

            {/* Candidate Not Found Popup */}
            {showNotFoundPopup && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                  <h3 className="text-lg font-semibold text-navy-900 mb-2">Candidate Not Found</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    The candidate with email <strong>{formData.candidateEmail}</strong> is not in your candidate list.
                  </p>
                  <div className="flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowNotFoundPopup(false);
                        setFormData(prev => ({ ...prev, candidateEmail: "" }));
                      }}
                      className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNotFoundPopup(false);
                        navigate("/dashboard/candidates/add", {
                          state: {
                            fromTestPortal: true, // Flag to indicate coming from test portal
                            testPortalData: {
                              // Pass all current form data to pre-fill when returning
                              positionId: formData.positionId,
                              questionSetId: formData.questionSetId,
                              interviewScheduleType: formData.interviewScheduleType,
                              linkExpiresInDays: formData.linkExpiresInDays,
                              linkType: formData.linkType,
                              candidateEmail: formData.candidateEmail,
                              candidateName: formData.candidateName,
                              whatsappNumber: formData.whatsappNumber,
                              // semester: formData.semester, // Removed semester from state transmission
                              resumeFilePath: formData.resumeFilePath,
                              resumeFileName: formData.resumeFileName
                            }
                          }
                        });
                      }}
                      className="px-4 py-2 text-xs font-medium text-white bg-gradient-to-r from-gold-500 to-gold-600 rounded-lg hover:from-gold-600 hover:to-gold-700 transition"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading || uploading || (formData.linkType === "PUBLIC" && !publicLink)}
            className="flex-1 py-2 px-4 text-xs bg-gradient-to-r from-blue-600 to-qwikBlue hover:from-blue-700 hover:to-qwikBlueDark text-white font-semibold rounded-lg transition duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save size={16} />
            {formData.linkType === "PUBLIC"
              ? "Link Generated"
              : uploading
                ? "Uploading..."
                : loading
                  ? (isEditMode ? "Updating..." : "Adding...")
                  : (isEditMode ? "Update Candidate" : "Add Candidate")
            }
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-xs border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 font-medium rounded-lg transition duration-200"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Search Sidebar */}
      {sidebarOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Sidebar */}
          <div className="fixed top-0 right-0 h-full w-[40%] bg-white shadow-2xl z-50 overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-navy-900">Search & Filter Candidates</h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X size={20} className="text-gray-600" />
                </button>
              </div>

              {/* Search Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Candidates
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search by Reg ID, Name, Email, Phone..."
                    value={sidebarSearchTerm}
                    onChange={(e) => setSidebarSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Advanced Filters Toggle */}
              <div className="mb-4">
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
                >
                  <div className="flex items-center gap-2">
                    <Filter size={18} className="text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Advanced Filters</span>
                  </div>
                  <span className={`text-xs text-gray-500 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>
              </div>

              {/* Advanced Filters Dropdown */}
              {showAdvancedFilters && (
                <div className="mb-6 space-y-4 p-4 bg-gray-50 rounded-lg">
                  {/* Department Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department
                    </label>
                    <select
                      value={advancedFilters.department}
                      onChange={(e) => setAdvancedFilters({ ...advancedFilters, department: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    >
                      <option value="">All Departments</option>
                      {getUniqueDepartments().map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Degree Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Degree
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={advancedFilters.degree}
                        onChange={handleSidebarDropdownInputChange("degree")}
                        onFocus={() => {
                          setSidebarDropdowns(prev => ({ ...prev, degree: true }));
                          setSidebarFilters(prev => ({ ...prev, degree: advancedFilters.degree }));
                        }}
                        onBlur={() => setTimeout(() => setSidebarDropdowns(prev => ({ ...prev, degree: false })), 200)}
                        placeholder="Type or select degree"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                      />
                      {sidebarDropdowns.degree && degreeOptions.filter(opt => opt.toLowerCase().includes((sidebarFilters.degree || "").toLowerCase())).length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                          {degreeOptions.filter(opt => opt.toLowerCase().includes((sidebarFilters.degree || "").toLowerCase())).map((option) => (
                            <div
                              key={option}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleSidebarDropdownSelect("degree", option);
                              }}
                              className="px-2 py-1.5 text-xs hover:bg-gray-100 cursor-pointer"
                            >
                              {option}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stream Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stream
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={advancedFilters.stream}
                        onChange={handleSidebarDropdownInputChange("stream")}
                        onFocus={() => {
                          setSidebarDropdowns(prev => ({ ...prev, stream: true }));
                          setSidebarFilters(prev => ({ ...prev, stream: advancedFilters.stream }));
                        }}
                        onBlur={() => setTimeout(() => setSidebarDropdowns(prev => ({ ...prev, stream: false })), 200)}
                        placeholder="Type or select stream"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                      />
                      {sidebarDropdowns.stream && streamOptions.filter(opt => opt.toLowerCase().includes((sidebarFilters.stream || "").toLowerCase())).length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                          {streamOptions.filter(opt => opt.toLowerCase().includes((sidebarFilters.stream || "").toLowerCase())).map((option) => (
                            <div
                              key={option}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleSidebarDropdownSelect("stream", option);
                              }}
                              className="px-2 py-1.5 text-xs hover:bg-gray-100 cursor-pointer"
                            >
                              {option}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Batch Start Year */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Batch Start Year
                    </label>
                    <select
                      value={advancedFilters.batchStart}
                      onChange={(e) => setAdvancedFilters({ ...advancedFilters, batchStart: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    >
                      <option value="">All Years</option>
                      {getUniqueBatchYears().map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Batch End Year */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Batch End Year
                    </label>
                    <select
                      value={advancedFilters.batchEnd}
                      onChange={(e) => setAdvancedFilters({ ...advancedFilters, batchEnd: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    >
                      <option value="">All Years</option>
                      {getUniqueBatchYears().map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Clear Filters Button */}
              {(sidebarSearchTerm || advancedFilters.department || advancedFilters.stream || advancedFilters.degree || advancedFilters.batchStart || advancedFilters.batchEnd) && (
                <button
                  onClick={handleClearFilters}
                  className="w-full px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition mb-4"
                >
                  Clear All Filters
                </button>
              )}

              {/* Candidate Results List */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Results ({filteredCandidates.length})
                </h3>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {filteredCandidates.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      No candidates found. Try adjusting your search or filters.
                    </div>
                  ) : (
                    filteredCandidates.map((candidate) => (
                      <div
                        key={candidate.id}
                        onClick={() => handleSelectCandidate(candidate)}
                        className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition"
                      >
                        <div className="font-medium text-sm text-gray-900">
                          {candidate.fullName || candidate.name || "-"}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {candidate.email || "-"}
                        </div>
                        {candidate.regNo && (
                          <div className="text-xs text-gray-500">
                            Reg ID: {candidate.regNo}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <SnackbarAlert
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={handleCloseSnackbar}
      />
    </div>
  );
};

export default CreateCandidate;

