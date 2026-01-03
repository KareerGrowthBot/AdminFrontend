import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, FileText, Download, Trash2, Sparkles } from "lucide-react";
import { positionService } from "../../services/positionService";
import { fileService } from "../../services/fileService";
import { AI_BACKEND_WS_URL } from "../../constants/api";
import SnackbarAlert from "../common/SnackbarAlert";
import JdGeneratorSidebar from "./JdGeneratorSidebar";
import { jsPDF } from "jspdf";

const CreatePosition = ({ adminInfo }) => {
  const navigate = useNavigate();
  const isLoadingTitlesRef = useRef(false);
  const isLoadingMandatorySkillsRef = useRef(false);
  const isLoadingOptionalSkillsRef = useRef(false);
  const hasLoadedRef = useRef(false);
  const [formData, setFormData] = useState({
    code: "",
    title: "",
    domainType: "",
    minimumExperience: "",
    maximumExperience: "",
    jdDocumentPath: "",
    jdDocumentFileName: "",
    positionStatus: "ACTIVE", // Default to ACTIVE, hidden from UI
    noOfPositions: "",
    expectedStartDate: "",
    applicationDeadline: "",
    mandatorySkills: [],
    optionalSkills: []
  });
  const [positionTitles, setPositionTitles] = useState([]);
  const [mandatorySkillsList, setMandatorySkillsList] = useState([]);
  const [optionalSkillsList, setOptionalSkillsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [skillInput, setSkillInput] = useState({ mandatory: "", optional: "" });
  const [showMandatoryDropdown, setShowMandatoryDropdown] = useState(false);
  const [showOptionalDropdown, setShowOptionalDropdown] = useState(false);
  const [showTitleDropdown, setShowTitleDropdown] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // AI Feature State
  const [showJdSidebar, setShowJdSidebar] = useState(false);
  const [skillsGenerated, setSkillsGenerated] = useState(false);
  const [isGeneratingSkills, setIsGeneratingSkills] = useState(false);

  const handleGenerateSkills = async () => {
    if (!formData.title || !formData.domainType) {
      showMessage("Please fill Title and Domain Type first.", "error");
      return;
    }

    setIsGeneratingSkills(true);
    let socket = null;

    try {
      socket = new WebSocket(`${AI_BACKEND_WS_URL}/ws/generate-skills`);

      socket.onopen = () => {
        console.log("AI Skills WebSocket connected");
        const payload = {
          title: formData.title,
          domain: formData.domainType,
          minExp: formData.minimumExperience ? parseInt(formData.minimumExperience) : 0,
          maxExp: formData.maximumExperience ? parseInt(formData.maximumExperience) : 0
        };
        socket.send(JSON.stringify(payload));
      };

      socket.onmessage = (event) => {
        const response = JSON.parse(event.data);
        if (response.success) {
          const newMandatory = response.mandatory || [];
          const newOptional = response.optional || [];

          // Merge unique skills
          setFormData(prev => ({
            ...prev,
            mandatorySkills: [...new Set([...prev.mandatorySkills, ...newMandatory])],
            optionalSkills: [...new Set([...prev.optionalSkills, ...newOptional])]
          }));

          showMessage("Skills generated successfully via AI!");
          setSkillsGenerated(true);
        } else {
          showMessage(response.error || "Failed to generate skills.", "error");
        }
        socket.close();
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        showMessage("Connection to AI service failed.", "error");
        setIsGeneratingSkills(false);
      };

      socket.onclose = () => {
        console.log("AI Skills WebSocket closed");
        setIsGeneratingSkills(false);
      };

    } catch (err) {
      console.error("Skill generation error:", err);
      showMessage("Failed to start skill generation process.", "error");
      setIsGeneratingSkills(false);
      if (socket) socket.close();
    }
  };

  const handleUseJdFromAi = (text) => {
    // Create a PDF from the JD content
    const doc = new jsPDF();

    // Set font and margins
    doc.setFontSize(10);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const maxLineWidth = pageWidth - (margin * 2);

    // Split text into lines that fit the page width
    const lines = doc.splitTextToSize(text, maxLineWidth);

    // Add text to PDF with pagination
    let y = margin;
    const lineHeight = 7;

    lines.forEach((line, index) => {
      if (y + lineHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += lineHeight;
    });

    // Generate PDF as blob
    const pdfBlob = doc.output('blob');

    // Use job title as filename, sanitize it
    const jobTitle = formData.title || "Job_Description";
    const sanitizedTitle = jobTitle.replace(/[^a-z0-9]/gi, '_');
    const filename = `${sanitizedTitle}.pdf`;

    const generatedFile = new File([pdfBlob], filename, { type: 'application/pdf' });

    // Set file logic
    setSelectedFile(generatedFile);
    setFormData(prev => ({
      ...prev,
      jdDocumentPath: "",
      jdDocumentFileName: ""
    }));
    showMessage("AI generated JD attached as PDF successfully!");
  };

  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadPositionTitles();
      loadMandatorySkills();
      loadOptionalSkills();
    }
  }, []);

  const loadPositionTitles = async () => {
    // Prevent duplicate calls
    if (isLoadingTitlesRef.current) {
      return;
    }

    isLoadingTitlesRef.current = true;
    try {
      const titles = await positionService.getAllPositionTitles();
      setPositionTitles(titles);
    } catch (error) {
      console.error("Error loading position titles:", error);
      showMessage("Failed to load position titles", "error");
    } finally {
      isLoadingTitlesRef.current = false;
    }
  };

  const loadMandatorySkills = async () => {
    // Prevent duplicate calls
    if (isLoadingMandatorySkillsRef.current) {
      return;
    }

    isLoadingMandatorySkillsRef.current = true;
    try {
      const skills = await positionService.getAllMandatorySkills();
      setMandatorySkillsList(skills);
    } catch (error) {
      console.error("Error loading mandatory skills:", error);
      // Don't show error message - skills list might be empty initially
    } finally {
      isLoadingMandatorySkillsRef.current = false;
    }
  };

  const loadOptionalSkills = async () => {
    // Prevent duplicate calls
    if (isLoadingOptionalSkillsRef.current) {
      return;
    }

    isLoadingOptionalSkillsRef.current = true;
    try {
      const skills = await positionService.getAllOptionalSkills();
      setOptionalSkillsList(skills);
    } catch (error) {
      console.error("Error loading optional skills:", error);
      // Don't show error message - skills list might be empty initially
    } finally {
      isLoadingOptionalSkillsRef.current = false;
    }
  };

  const showMessage = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Clear previous file path - will be set after upload on submit
      setFormData(prev => ({
        ...prev,
        jdDocumentPath: "",
        jdDocumentFileName: ""
      }));
    }
  };

  const handleRemoveFile = () => {
    setFormData(prev => ({
      ...prev,
      jdDocumentPath: "",
      jdDocumentFileName: ""
    }));
    setSelectedFile(null);
  };

  const handleDownloadFile = async () => {
    if (!formData.jdDocumentPath) return;

    try {
      // Parse the path: "jd-documents/filename.pdf" -> subfolder: "jd-documents", filename: "filename.pdf"
      const pathParts = formData.jdDocumentPath.split('/');
      const subfolder = pathParts[0]; // "jd-documents"
      const filename = formData.jdDocumentFileName || pathParts[pathParts.length - 1]; // Use stored filename or extract from path

      const blob = await fileService.downloadFile(subfolder, filename);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = formData.jdDocumentFileName || filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      showMessage("Failed to download file", "error");
    }
  };

  const handleAddSkill = (type, skillToAdd = null) => {
    const skill = skillToAdd || (type === "mandatory" ? skillInput.mandatory : skillInput.optional);
    const trimmedSkill = skill.trim();
    if (trimmedSkill) {
      // Check if skill already exists
      const existingSkills = type === "mandatory" ? formData.mandatorySkills : formData.optionalSkills;
      if (!existingSkills.includes(trimmedSkill)) {
        setFormData(prev => ({
          ...prev,
          [type === "mandatory" ? "mandatorySkills" : "optionalSkills"]: [
            ...prev[type === "mandatory" ? "mandatorySkills" : "optionalSkills"],
            trimmedSkill
          ]
        }));
      }
      setSkillInput(prev => ({ ...prev, [type]: "" }));
      if (type === "mandatory") {
        setShowMandatoryDropdown(false);
      } else {
        setShowOptionalDropdown(false);
      }
    }
  };

  const getFilteredSkills = (type, searchTerm) => {
    const skillsList = type === "mandatory" ? mandatorySkillsList : optionalSkillsList;
    const existingSkills = type === "mandatory" ? formData.mandatorySkills : formData.optionalSkills;

    if (!searchTerm) {
      return skillsList.filter(skill => !existingSkills.includes(skill));
    }

    return skillsList
      .filter(skill =>
        skill.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !existingSkills.includes(skill)
      );
  };

  const getFilteredTitles = (searchTerm) => {
    if (!searchTerm) {
      return positionTitles.map(t => t.title);
    }

    return positionTitles
      .map(t => t.title)
      .filter(title => title.toLowerCase().includes(searchTerm.toLowerCase()));
  };

  const handleRemoveSkill = (type, index) => {
    setFormData(prev => ({
      ...prev,
      [type === "mandatory" ? "mandatorySkills" : "optionalSkills"]:
        prev[type === "mandatory" ? "mandatorySkills" : "optionalSkills"].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate required fields
    if (!selectedFile) {
      showMessage("Job Description Document is required", "error");
      setLoading(false);
      return;
    }

    if (!formData.mandatorySkills || formData.mandatorySkills.length === 0) {
      showMessage("At least one Mandatory Skill is required", "error");
      setLoading(false);
      return;
    }

    try {
      // Step 1: Upload the file first
      setUploading(true);
      setUploadProgress(30);

      const uploadResponse = await fileService.uploadJdDocument(selectedFile);

      setUploadProgress(60);

      // Step 2: Create position with uploaded file path and filename
      const positionData = {
        title: formData.title,
        domainType: formData.domainType,
        minimumExperience: formData.minimumExperience ? parseInt(formData.minimumExperience) : null,
        maximumExperience: formData.maximumExperience ? parseInt(formData.maximumExperience) : null,
        jdDocumentPath: uploadResponse.filePath,
        jdDocumentFileName: uploadResponse.fileName || uploadResponse.originalFileName || selectedFile.name,
        positionStatus: "ACTIVE", // Always ACTIVE by default
        noOfPositions: formData.noOfPositions ? parseInt(formData.noOfPositions) : null,
        applicationDeadline: formData.applicationDeadline || null,
        mandatorySkills: formData.mandatorySkills,
        optionalSkills: formData.optionalSkills
      };

      setUploadProgress(80);
      const savedPosition = await positionService.createPosition(positionData);



      setUploadProgress(100);
      showMessage("Position created successfully! Redirecting to question set page...", "success");
      setTimeout(() => {
        navigate("/dashboard/question-sets/create", {
          state: {
            positionId: savedPosition.id,
            positionCode: savedPosition.code,
            positionTitle: savedPosition.title
          }
        });
      }, 1000);
    } catch (error) {
      console.error("Error saving position:", error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || "Failed to save position. Please try again.";
      showMessage(errorMessage, "error");
    } finally {
      setLoading(false);
      setUploading(false);
      setUploadProgress(0);
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
            <h1 className="text-lg font-bold text-navy-900">Create Position</h1>
            <p className="text-xs text-gray-600 mt-0.5">Add a new position to your organization</p>
          </div>
        </div>
      </div>

      {/* Main Content - Full Width */}
      <div className="flex-1 p-3 overflow-hidden">
        <div className="h-full overflow-hidden">
          <div className="bg-white rounded-lg shadow-md h-full flex flex-col overflow-hidden">
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Title */}
                  <div className="relative">
                    <label className="block text-xs font-medium text-navy-700 mb-1">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={(e) => {
                          handleChange(e);
                          setShowTitleDropdown(true);
                        }}
                        onFocus={() => setShowTitleDropdown(true)}
                        onBlur={() => setTimeout(() => setShowTitleDropdown(false), 200)}
                        required
                        placeholder="Select or type a title"
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition"
                      />
                      {showTitleDropdown && getFilteredTitles(formData.title).length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg" style={{ maxHeight: '104px', overflowY: 'auto' }}>
                          {getFilteredTitles(formData.title).map((title, index) => (
                            <div
                              key={index}
                              onClick={() => {
                                setFormData(prev => ({ ...prev, title }));
                                setShowTitleDropdown(false);
                              }}
                              className="px-2 py-1.5 text-xs hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                              style={{ minHeight: '26px' }}
                            >
                              {title}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Domain Type */}
                  <div>
                    <label className="block text-xs font-medium text-navy-700 mb-1">
                      Domain Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="domainType"
                      value={formData.domainType}
                      onChange={handleChange}
                      required
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition"
                    >
                      <option value="">Select domain</option>
                      <option value="TECHNICAL">Technical</option>
                      <option value="NON_TECHNICAL">Non-Technical</option>
                    </select>
                  </div>


                  {/* Experience Range */}
                  <div>
                    <label className="block text-xs font-medium text-navy-700 mb-1">
                      Minimum Experience (years)
                    </label>
                    <input
                      type="number"
                      name="minimumExperience"
                      value={formData.minimumExperience}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-navy-700 mb-1">
                      Maximum Experience (years)
                    </label>
                    <input
                      type="number"
                      name="maximumExperience"
                      value={formData.maximumExperience}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition"
                    />
                  </div>

                  {/* Number of Positions */}
                  <div>
                    <label className="block text-xs font-medium text-navy-700 mb-1">
                      Number of Positions
                    </label>
                    <input
                      type="number"
                      name="noOfPositions"
                      value={formData.noOfPositions}
                      onChange={handleChange}
                      min="1"
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition"
                    />
                  </div>

                  {/* Application Deadline */}
                  <div>
                    <label className="block text-xs font-medium text-navy-700 mb-1">
                      Application Deadline
                    </label>
                    <input
                      type="date"
                      name="applicationDeadline"
                      value={formData.applicationDeadline}
                      onChange={handleChange}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition"
                    />
                  </div>

                  {/* Experience and Skills Section with AI Buttons */}
                  <div className="md:col-span-2">
                    <div className="flex gap-2 mb-3">
                      <button
                        type="button"
                        className="px-4 py-2 text-xs font-medium text-white bg-navy-700 hover:bg-navy-800 rounded-lg transition-colors"
                      >
                        Custom JD
                      </button>
                      <button
                        type="button"
                        onClick={handleGenerateSkills}
                        disabled={isGeneratingSkills}
                        className="px-4 py-2 text-xs font-medium text-white bg-navy-700 hover:bg-navy-800 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {isGeneratingSkills ? (
                          <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : null}
                        Generate AI Skills
                      </button>
                      {skillsGenerated && (
                        <button
                          type="button"
                          onClick={() => setShowJdSidebar(true)}
                          className="px-4 py-2 text-xs font-medium text-white bg-navy-700 hover:bg-navy-800 rounded-lg transition-colors flex items-center gap-2"
                        >
                          <Sparkles className="h-3 w-3" />
                          Generate AI JD
                        </button>
                      )}
                    </div>
                  </div>

                  {/* JD Document Upload */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-navy-700 mb-1">
                      Job Description Document <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      <input
                        type="file"
                        onChange={handleFileSelect}
                        accept=".pdf,.doc,.docx"
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition"
                      />
                      {(uploading || loading) && (
                        <div className="text-xs text-gray-600">
                          {uploading ? `Uploading file... ${uploadProgress}%` : "Creating position..."}
                        </div>
                      )}
                      {selectedFile && (
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <FileText size={16} className="text-navy-700" />
                            <span className="text-xs text-gray-700">{selectedFile.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveFile}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mandatory Skills */}
                  <div className="relative">
                    <label className="block text-xs font-medium text-navy-700 mb-1">
                      Mandatory Skills <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="flex flex-wrap gap-2 p-1.5 min-h-[38px] border border-gray-300 rounded-lg focus-within:border-gray-400 bg-white">
                        {formData.mandatorySkills.map((skill, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-navy-100 text-navy-800 rounded text-xs flex items-center gap-1"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => handleRemoveSkill("mandatory", index)}
                              className="text-navy-600 hover:text-red-600 font-semibold leading-none"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        <input
                          type="text"
                          value={skillInput.mandatory}
                          onChange={(e) => {
                            setSkillInput({ ...skillInput, mandatory: e.target.value });
                            setShowMandatoryDropdown(true);
                          }}
                          onFocus={() => setShowMandatoryDropdown(true)}
                          onBlur={() => setTimeout(() => setShowMandatoryDropdown(false), 200)}
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddSkill("mandatory");
                            }
                          }}
                          placeholder={formData.mandatorySkills.length === 0 ? "Select or type a skill, then press Enter" : ""}
                          className="flex-1 min-w-[120px] px-1 py-0.5 text-xs border-0 outline-none bg-transparent"
                        />
                      </div>
                      {showMandatoryDropdown && getFilteredSkills("mandatory", skillInput.mandatory).length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg" style={{ maxHeight: '104px', overflowY: 'auto' }}>
                          {getFilteredSkills("mandatory", skillInput.mandatory).map((skill, index) => (
                            <div
                              key={index}
                              onClick={() => handleAddSkill("mandatory", skill)}
                              className="px-2 py-1.5 text-xs hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                              style={{ minHeight: '26px' }}
                            >
                              {skill}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Optional Skills */}
                  <div className="relative">
                    <label className="block text-xs font-medium text-navy-700 mb-1">
                      Optional Skills
                    </label>
                    <div className="relative">
                      <div className="flex flex-wrap gap-2 p-1.5 min-h-[38px] border border-gray-300 rounded-lg focus-within:border-gray-400 bg-white">
                        {formData.optionalSkills.map((skill, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs flex items-center gap-1"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => handleRemoveSkill("optional", index)}
                              className="text-gray-600 hover:text-red-600 font-semibold leading-none"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        <input
                          type="text"
                          value={skillInput.optional}
                          onChange={(e) => {
                            setSkillInput({ ...skillInput, optional: e.target.value });
                            setShowOptionalDropdown(true);
                          }}
                          onFocus={() => setShowOptionalDropdown(true)}
                          onBlur={() => setTimeout(() => setShowOptionalDropdown(false), 200)}
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddSkill("optional");
                            }
                          }}
                          placeholder={formData.optionalSkills.length === 0 ? "Select or type a skill, then press Enter" : ""}
                          className="flex-1 min-w-[120px] px-1 py-0.5 text-xs border-0 outline-none bg-transparent"
                        />
                      </div>
                      {showOptionalDropdown && getFilteredSkills("optional", skillInput.optional).length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg" style={{ maxHeight: '104px', overflowY: 'auto' }}>
                          {getFilteredSkills("optional", skillInput.optional).map((skill, index) => (
                            <div
                              key={index}
                              onClick={() => handleAddSkill("optional", skill)}
                              className="px-2 py-1.5 text-xs hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                              style={{ minHeight: '26px' }}
                            >
                              {skill}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3 px-3 pb-3 mt-auto border-t border-gray-200 flex-shrink-0">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 px-4 text-xs bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-navy-900 font-semibold rounded-lg transition duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  {loading ? "Creating..." : "Create Position"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-4 py-2 text-xs border-2 border-gold-300 hover:border-gold-600 text-gold-700 hover:text-gold-600 font-medium rounded-lg transition duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <SnackbarAlert
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={handleCloseSnackbar}
      />

      <JdGeneratorSidebar
        isOpen={showJdSidebar}
        onClose={() => setShowJdSidebar(false)}
        inputData={{
          title: formData.title,
          domain: formData.domainType, // Matches API expectation
          minExp: formData.minimumExperience ? parseInt(formData.minimumExperience) : 0,
          maxExp: formData.maximumExperience ? parseInt(formData.maximumExperience) : 0,
          skills: [...formData.mandatorySkills, ...formData.optionalSkills]
        }}
        onUseJd={handleUseJdFromAi}
      />
    </div>
  );
};

export default CreatePosition;

