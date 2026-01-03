import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { candidateService } from "../../services/candidateService";
import { fileService } from "../../services/fileService";
import SnackbarAlert from "../common/SnackbarAlert";

const AddCandidate = ({ adminInfo }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const emailFromState = location.state?.email || "";
  const fromTestPortal = location.state?.fromTestPortal || false; // Check if coming from CreateCandidate page
  const testPortalData = location.state?.testPortalData || null; // Store original form data from CreateCandidate

  const [formData, setFormData] = useState({
    name: "",
    email: "", // Don't prefill email - user should enter it
    mobileNumber: "",
    regNo: "",
    college: "",
    degree: "",
    stream: "",
    academicYearStart: "",
    academicYearEnd: "",
    address: "",
    semester: "",
    resumeFile: null,
    resumeFileName: ""
  });

  // Only prefill email if candidate was found (not when candidate is not found)
  // Check if location.state has candidateFound flag
  useEffect(() => {
    // Only prefill if candidate was found (candidateFound === true)
    if (emailFromState && location.state?.candidateFound === true && emailFromState !== formData.email) {
      setFormData(prev => ({ ...prev, email: emailFromState }));
      // Auto-fetch candidate details if email is pre-filled
      fetchCandidateDetails(emailFromState);
    }
  }, [emailFromState, location.state?.candidateFound]);

  // Auto-fetch candidate details when email is set
  const fetchCandidateDetails = async (email) => {
    if (!email || !email.includes("@")) {
      return;
    }

    // If candidate data is already passed from Edit button, skip the API check
    if (location.state?.candidate) {
      const candidate = location.state.candidate;
      setCandidateExists(true);
      setFormData(prev => ({
        ...prev,
        name: candidate.fullName || candidate.name || prev.name,
        mobileNumber: candidate.phone || candidate.mobileNumber || prev.mobileNumber,
        regNo: candidate.regNo || prev.regNo,
        college: candidate.collegeName || candidate.college || prev.college,
        degree: candidate.degree || prev.degree,
        stream: candidate.stream || prev.stream,
        semester: candidate.semester || prev.semester || "",
        academicYearStart: candidate.academicYearStart ? String(candidate.academicYearStart) : prev.academicYearStart,
        academicYearEnd: candidate.academicYearEnd ? String(candidate.academicYearEnd) : prev.academicYearEnd,
        address: candidate.address || prev.address,
        resumeFileName: candidate.resumeFilename || candidate.resumeFileName || prev.resumeFileName
      }));
      return; // Skip API check
    }

    setCheckingEmail(true);
    try {
      // Search candidate by email (includeNullOrg=true to find candidates with null organizationId)
      const candidate = await candidateService.searchCandidateByEmail(email, true);
      if (candidate) {
        // Check if candidate has organizationId
        if (candidate.organizationId && candidate.organizationId.trim() !== "") {
          // Candidate is registered in another college
          showMessage("Candidate is registered in Other college", "error");
          setCandidateExists(false);
        } else {
          // Candidate exists but has no organizationId - populate form with their details
          setCandidateExists(true);
          setFormData(prev => ({
            ...prev,
            name: candidate.fullName || candidate.name || prev.name,
            mobileNumber: candidate.phone || candidate.mobileNumber || prev.mobileNumber,
            regNo: candidate.regNo || prev.regNo,
            college: candidate.collegeName || candidate.college || prev.college,
            degree: candidate.degree || prev.degree,
            stream: candidate.stream || prev.stream,
            semester: candidate.semester || prev.semester || "",
            academicYearStart: candidate.academicYearStart ? String(candidate.academicYearStart) : prev.academicYearStart,
            academicYearEnd: candidate.academicYearEnd ? String(candidate.academicYearEnd) : prev.academicYearEnd,
            address: candidate.address || prev.address,
            resumeFileName: candidate.resumeFilename || candidate.resumeFileName || prev.resumeFileName
          }));
          showMessage("Candidate found. Details populated. You can update and add them to your organization.", "info");
        }
      }
    } catch (error) {
      // Candidate not found - this is fine, they can create a new one
      if (error.response?.status !== 404) {
        console.error("Error checking candidate:", error);
        showMessage("Error checking candidate. Please try again.", "error");
      }
    } finally {
      setCheckingEmail(false);
    }
  };

  const [degreeDropdownOpen, setDegreeDropdownOpen] = useState(false);
  const [streamDropdownOpen, setStreamDropdownOpen] = useState(false);
  const [semesterDropdownOpen, setSemesterDropdownOpen] = useState(false);
  const [degreeFilter, setDegreeFilter] = useState("");
  const [streamFilter, setStreamFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [candidateExists, setCandidateExists] = useState(false);

  const showMessage = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Reset candidate exists flag when email changes
    if (name === "email") {
      setCandidateExists(false);
    }
  };

  const handleEmailBlur = async (e) => {
    const email = e.target.value.trim();

    // Skip email search if we're in edit mode (candidate data passed from Edit button)
    if (location.state?.candidate) {
      return; // Don't search when editing
    }

    // Only check if email is valid and contains @
    if (email && email.includes("@")) {
      setCheckingEmail(true);
      try {
        // Search candidate by email (includeNullOrg=true to find candidates with null organizationId)
        const candidate = await candidateService.searchCandidateByEmail(email, true);
        if (candidate) {
          // Check if candidate has organizationId
          if (candidate.organizationId && candidate.organizationId.trim() !== "") {
            // Candidate is registered in another college
            showMessage("Candidate is registered in Other college", "error");
            setCandidateExists(false);
          } else {
            // Candidate exists but has no organizationId - populate form with their details
            setCandidateExists(true);
            setFormData(prev => ({
              ...prev,
              name: candidate.fullName || candidate.name || prev.name,
              mobileNumber: candidate.phone || candidate.mobileNumber || prev.mobileNumber,
              regNo: candidate.regNo || prev.regNo,
              college: candidate.collegeName || candidate.college || prev.college,
              degree: candidate.degree || prev.degree,
              stream: candidate.stream || prev.stream,
              academicYearStart: candidate.academicYearStart || prev.academicYearStart,
              academicYearEnd: candidate.academicYearEnd || prev.academicYearEnd,
              address: candidate.address || prev.address,
              resumeFileName: candidate.resumeFilename || candidate.resumeFileName || prev.resumeFileName
            }));
            showMessage("Candidate found. Details populated. You can update and add them to your organization.", "info");
          }
        }
      } catch (error) {
        // Candidate not found - this is fine, they can create a new one
        if (error.response?.status === 404) {
          setCandidateExists(false);
          // Don't show error for 404 - it's expected for new candidates
        } else {
          console.error("Error checking candidate:", error);
          showMessage("Error checking candidate. Please try again.", "error");
        }
      } finally {
        setCheckingEmail(false);
      }
    }
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

  const semesterOptions = [
    "Semester 1", "Semester 2", "Semester 3", "Semester 4",
    "Semester 5", "Semester 6", "Semester 7", "Semester 8",
    "1st Year", "2nd Year", "3rd Year", "4th Year",
    "Completed", "Passed Out"
  ];

  const handleDegreeInputChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, degree: value }));
    setDegreeFilter(value);
    setDegreeDropdownOpen(true);
  };

  const handleDegreeSelect = (value) => {
    setFormData(prev => ({ ...prev, degree: value }));
    setDegreeFilter(value);
    setDegreeDropdownOpen(false);
  };

  const handleStreamInputChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, stream: value }));
    setStreamFilter(value);
    setStreamDropdownOpen(true);
  };

  const handleStreamSelect = (value) => {
    setFormData(prev => ({ ...prev, stream: value }));
    setStreamFilter(value);
    setStreamDropdownOpen(false);
  };

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

  const filteredDegreeOptions = degreeOptions.filter(opt =>
    opt.toLowerCase().includes(degreeFilter.toLowerCase())
  );

  const filteredStreamOptions = streamOptions.filter(opt =>
    opt.toLowerCase().includes(streamFilter.toLowerCase())
  );

  const filteredSemesterOptions = semesterOptions.filter(opt =>
    opt.toLowerCase().includes(semesterFilter.toLowerCase())
  );

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        showMessage("Please select a PDF or Word document (.docx)", "error");
        return;
      }
      setSelectedFile(file);
      setFormData(prev => ({ ...prev, resumeFileName: file.name }));
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFormData(prev => ({ ...prev, resumeFileName: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.mobileNumber || !formData.academicYearStart || !formData.academicYearEnd) {
      showMessage("Please fill in all required fields (Name, Email, Mobile Number, Academic Year Start, Academic Year End)", "error");
      return;
    }

    // Resume is mandatory for new candidates, optional for updates
    const isEditMode = !!location.state?.candidateId;
    if (!isEditMode && !selectedFile) {
      showMessage("Please upload a resume file", "error");
      return;
    }

    setLoading(true);

    try {
      // Step 1: Upload the resume file
      setUploading(true);
      let resumeStoragePath = "";
      let resumeFilename = "";

      try {
        const uploadResponse = await fileService.uploadFile(selectedFile, "resumes");
        resumeStoragePath = uploadResponse.path || uploadResponse.filePath;
        resumeFilename = uploadResponse.fileName || uploadResponse.originalFileName || selectedFile.name;
      } catch (uploadError) {
        console.error("Error uploading resume:", uploadError);
        showMessage("Failed to upload resume. Please try again.", "error");
        setUploading(false);
        setLoading(false);
        return;
      }
      setUploading(false);

      // Step 2: Create or Update candidate
      const candidateData = {
        name: formData.name,
        email: formData.email,
        mobileNumber: formData.mobileNumber,
        regNo: formData.regNo || "",
        college: formData.college || "",
        degree: formData.degree || "",
        stream: formData.stream || "",
        academicYearStart: parseInt(formData.academicYearStart) || new Date().getFullYear(),
        academicYearEnd: parseInt(formData.academicYearEnd) || new Date().getFullYear() + 1,
        address: formData.address || "",
        semester: formData.semester || "",
        source: "ADMIN_PORTAL"
      };

      // Handle resume data
      if (resumeFilename) {
        candidateData.resumeFilename = resumeFilename;
        candidateData.resumeStoragePath = resumeStoragePath;
      } else if (isEditMode && formData.resumeFileName) {
        // Keep existing resume info if not updating file in edit mode
        candidateData.resumeFilename = formData.resumeFileName;
        // We might not have storage path in formData if it wasn't prefilled, 
        // but backend usually keeps existing if not sent. 
        // If the backend requires it, we should ensure we have it in state.
      }

      if (isEditMode) {
        await candidateService.updateCandidate(location.state.candidateId, candidateData);
        showMessage("Candidate updated successfully!", "success");
      } else {
        // Ensure resume is present for new candidates
        if (!candidateData.resumeFilename) {
          // This should be caught by validity check above, but double check
          // actually we set resumeFilename from uploadResponse
          candidateData.resumeFilename = resumeFilename;
          candidateData.resumeStoragePath = resumeStoragePath;
        }
        await candidateService.addCandidate(candidateData);
        showMessage("Candidate added successfully! Password has been sent to their email.", "success");
      }

      // Redirect based on where user came from
      setTimeout(() => {
        if (fromTestPortal && testPortalData) {
          // Navigate back to CreateCandidate page with pre-filled data
          navigate("/dashboard/candidates/create", {
            state: {
              ...testPortalData,
              candidateEmail: formData.email, // Pre-fill with the email that was just added
              candidateName: formData.name,
              whatsappNumber: formData.mobileNumber,
              semester: formData.semester,
              resumeFilePath: candidateData.resumeStoragePath,
              resumeFileName: candidateData.resumeFilename
            }
          });
        } else {
          // Navigate back to candidates list (college tab)
          navigate("/dashboard/candidate-database", {
            state: {
              activeTab: "college",
              forceReload: true
            }
          });
        }
      }, 1000);
    } catch (error) {
      console.error("Error adding candidate:", error);
      showMessage(
        error.response?.data?.error || "Failed to add candidate. Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-2 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft size={16} className="text-navy-900" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-navy-900">{location.state?.candidateId ? "Edit Candidate" : "Add Candidate"}</h1>
            <p className="text-xs text-gray-600 mt-0.5">{location.state?.candidateId ? "Update candidate details" : "Add a new candidate to your organization"}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-3 overflow-hidden">
        <div className="h-full overflow-hidden">
          {/* Form */}
          <div className="h-full overflow-hidden">
            <div className="bg-white rounded-lg shadow-md h-full flex flex-col overflow-hidden">
              <form onSubmit={handleSubmit} className="flex-1 flex flex-col p-3 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Email - First field */}
                  <div>
                    <label className="block text-xs font-medium text-navy-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={handleEmailBlur}
                        disabled={checkingEmail}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="candidate@example.com"
                      />
                      {checkingEmail && (
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-navy-900"></div>
                        </div>
                      )}
                    </div>
                    {candidateExists && !location.state?.candidate && (
                      <p className="text-xs text-blue-600 mt-1">
                        ✓ Candidate found. Details populated. You can update and add them to your organization.
                      </p>
                    )}
                  </div>

                  {/* Name - Second field */}
                  <div>
                    <label className="block text-xs font-medium text-navy-700 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition"
                      placeholder="John Doe"
                    />
                  </div>

                  {/* Mobile Number */}
                  <div>
                    <label className="block text-xs font-medium text-navy-700 mb-1">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <div className="flex items-center gap-1 px-2 py-1.5 border border-gray-300 rounded-lg bg-gray-50">
                        <span className="text-xs">🇮🇳</span>
                        <span className="text-xs text-gray-700">+91</span>
                      </div>
                      <input
                        type="tel"
                        name="mobileNumber"
                        required
                        value={formData.mobileNumber}
                        onChange={handleChange}
                        className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition"
                        placeholder="10 digit number"
                        maxLength={10}
                      />
                    </div>
                  </div>

                  {/* Registration Number */}
                  <div>
                    <label className="block text-xs font-medium text-navy-700 mb-1">
                      Registration Number
                    </label>
                    <input
                      type="text"
                      name="regNo"
                      value={formData.regNo}
                      onChange={handleChange}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition"
                      placeholder="Enter registration number"
                    />
                  </div>

                  {/* College */}
                  <div>
                    <label className="block text-xs font-medium text-navy-700 mb-1">
                      College
                    </label>
                    <input
                      type="text"
                      name="college"
                      value={formData.college}
                      onChange={handleChange}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition"
                      placeholder="Enter college name"
                    />
                  </div>

                  {/* Degree */}
                  <div className="relative">
                    <label className="block text-xs font-medium text-navy-700 mb-1">
                      Degree
                    </label>
                    <input
                      type="text"
                      name="degree"
                      value={formData.degree}
                      onChange={handleDegreeInputChange}
                      onFocus={() => {
                        setDegreeDropdownOpen(true);
                        setDegreeFilter(formData.degree);
                      }}
                      onBlur={() => setTimeout(() => setDegreeDropdownOpen(false), 200)}
                      placeholder="Type or select degree"
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition"
                    />
                    {degreeDropdownOpen && filteredDegreeOptions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                        {filteredDegreeOptions.map((option) => (
                          <div
                            key={option}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleDegreeSelect(option);
                            }}
                            className="px-2 py-1.5 text-xs hover:bg-gray-100 cursor-pointer"
                          >
                            {option}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Stream */}
                  <div className="relative">
                    <label className="block text-xs font-medium text-navy-700 mb-1">
                      Stream
                    </label>
                    <input
                      type="text"
                      name="stream"
                      value={formData.stream}
                      onChange={handleStreamInputChange}
                      onFocus={() => {
                        setStreamDropdownOpen(true);
                        setStreamFilter(formData.stream);
                      }}
                      onBlur={() => setTimeout(() => setStreamDropdownOpen(false), 200)}
                      placeholder="Type or select stream"
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition"
                    />
                    {streamDropdownOpen && filteredStreamOptions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                        {filteredStreamOptions.map((option) => (
                          <div
                            key={option}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleStreamSelect(option);
                            }}
                            className="px-2 py-1.5 text-xs hover:bg-gray-100 cursor-pointer"
                          >
                            {option}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Semester */}
                  <div className="relative">
                    <label className="block text-xs font-medium text-navy-700 mb-1">
                      Semester
                    </label>
                    <input
                      type="text"
                      name="semester"
                      value={formData.semester}
                      onChange={handleSemesterInputChange}
                      onFocus={() => {
                        setSemesterDropdownOpen(true);
                        setSemesterFilter(formData.semester);
                      }}
                      onBlur={() => setTimeout(() => setSemesterDropdownOpen(false), 200)}
                      placeholder="Type or select semester"
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition"
                    />
                    {semesterDropdownOpen && filteredSemesterOptions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                        {filteredSemesterOptions.map((option) => (
                          <div
                            key={option}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleSemesterSelect(option);
                            }}
                            className="px-2 py-1.5 text-xs hover:bg-gray-100 cursor-pointer"
                          >
                            {option}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Academic Year Start */}
                  <div>
                    <label className="block text-xs font-medium text-navy-700 mb-1">
                      Academic Year Start <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="academicYearStart"
                      required
                      value={formData.academicYearStart}
                      onChange={handleChange}
                      min="2000"
                      max="2100"
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition"
                      placeholder="e.g., 2024"
                    />
                  </div>

                  {/* Academic Year End */}
                  <div>
                    <label className="block text-xs font-medium text-navy-700 mb-1">
                      Academic Year End <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="academicYearEnd"
                      required
                      value={formData.academicYearEnd}
                      onChange={handleChange}
                      min="2000"
                      max="2100"
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition"
                      placeholder="e.g., 2025"
                    />
                  </div>

                  {/* Resume */}
                  <div>
                    <label className="block text-xs font-medium text-navy-700 mb-1">
                      Resume (PDF, Word .docx) {location.state?.candidateId ? <span className="text-gray-500">(Optional)</span> : <span className="text-red-500">*</span>}
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        Choose file
                      </label>
                      <span className="text-xs text-gray-500">
                        {selectedFile ? selectedFile.name : "No file chosen"}
                      </span>
                      {selectedFile && (
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

                  {/* Address */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-navy-700 mb-1">
                      Address
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition resize-none"
                      placeholder="Enter address"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-3 mt-auto border-t border-gray-200 flex-shrink-0">
                  <button
                    type="submit"
                    disabled={loading || uploading}
                    className="flex-1 py-1.5 px-3 text-xs bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-navy-900 font-semibold rounded-lg transition duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? "Uploading..." : loading ? (location.state?.candidateId ? "Updating..." : "Adding Candidate...") : (location.state?.candidateId ? "Update Candidate" : "Add Candidate")}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="px-3 py-1.5 text-xs border-2 border-gold-300 hover:border-gold-600 text-gold-700 hover:text-gold-600 font-medium rounded-lg transition duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
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
};

export default AddCandidate;
