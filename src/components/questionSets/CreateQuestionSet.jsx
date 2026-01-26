import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Save, Plus, Trash2, Zap, BookOpen, Loader2, X, ChevronDown, ChevronUp, Wand2, AlertCircle, Info, MoveUp, MoveDown, Search, Filter } from "lucide-react";
import { questionSetService } from "../../services/questionSetService";
import { questionSectionService } from "../../services/questionSectionService";
import { instructionService } from "../../services/instructionService";
import { positionService } from "../../services/positionService";
import { aiService } from "../../services/aiService";
import { authService } from "../../services/authService";
import { candidateService } from "../../services/candidateService";
import { assessmentSummaryService } from "../../services/assessmentSummaryService";
import { AI_BACKEND_WS_URL } from "../../constants/api";
import SnackbarAlert from "../common/SnackbarAlert";

const CreateQuestionSet = ({ adminInfo }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const positionIdFromState = location.state?.positionId;
  const positionCodeFromState = location.state?.positionCode;
  const positionTitleFromState = location.state?.positionTitle;
  const questionSetIdFromState = location.state?.questionSetId;
  const questionSetFromState = location.state?.questionSet;
  const isEditMode = location.state?.isEditMode || false;

  const [loading, setLoading] = useState(false);
  const [loadingQuestionSet, setLoadingQuestionSet] = useState(false);
  const [positions, setPositions] = useState([]);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [showRoundDropdown, setShowRoundDropdown] = useState({ general: false, position: false, coding: false, aptitude: false });
  const [selectedRound, setSelectedRound] = useState(null); // Track which round's questions are being edited
  const [questions, setQuestions] = useState({
    general: [
      { id: 1, text: "Tell me about yourself?", prepareTime: "10", answerTime: "2" },
      { id: 2, text: "Why are you interested in this position?", prepareTime: "10", answerTime: "2" }
    ],
    position: [],
    coding: [],
    aptitude: []
  });
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newQuestionPrepareTime, setNewQuestionPrepareTime] = useState("10");
  const [newQuestionAnswerTime, setNewQuestionAnswerTime] = useState("2");
  const [shuffleQuestions, setShuffleQuestions] = useState({ general: false, position: false, coding: false, aptitude: false });

  // Coding question specific state
  const [codingQuestionSource, setCodingQuestionSource] = useState("Coding Library");
  const [codingLanguage, setCodingLanguage] = useState("");
  const [codingDifficulty, setCodingDifficulty] = useState("Easy");
  const [codingDuration, setCodingDuration] = useState("15");
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [languageSearchTerm, setLanguageSearchTerm] = useState("");
  const languageDropdownRef = useRef(null);
  const languageInputRef = useRef(null);

  const programmingLanguages = [
    "Python", "Java", "JavaScript", "C++", "C#",
    "Ruby", "Go", "Swift", "Kotlin", "PHP",
    "TypeScript", "Rust", "Scala", "Perl", "R"
  ];

  // Aptitude question specific state
  const [aptitudeMcqType, setAptitudeMcqType] = useState("");
  const [aptitudeDifficulty, setAptitudeDifficulty] = useState("Easy");
  const [aptitudeNoOfQuestions, setAptitudeNoOfQuestions] = useState("5");
  const [aptitudeTimePerQuestion, setAptitudeTimePerQuestion] = useState("1");

  const aptitudeTopics = [
    "Verbal Reasoning",
    "Numerical Reasoning",
    "Logical Reasoning",
    "Number System",
    "Simplification",
    "Ratio and Proportion",
    "Time and Work",
    "Time, Speed and Distance",
    "Permutations and Combinations"
  ];

  const defaultInstruction = `Welcome to the Interview Assessment

Please follow these guidelines carefully:

1. READ EACH QUESTION THOROUGHLY
  - Take your time to understand what is being asked
    - Pay attention to all details and requirements

2. PROVIDE COMPREHENSIVE ANSWERS
  - Answer all questions to the best of your ability
    - Be clear, concise, and specific in your responses
      - Use examples from your experience when relevant

3. TIME MANAGEMENT
  - Manage your time wisely across all sections
    - Ensure you complete all questions within the allocated time
      - Review your answers before submitting

4. TECHNICAL REQUIREMENTS
  - Ensure you have a stable internet connection
    - Use a modern browser for the best experience
      - Save your work periodically

5. SUBMISSION
  - Double - check all your answers before final submission
    - Once submitted, you cannot make changes
      - Contact support if you encounter any technical issues

Good luck with your assessment!`;

  const [formData, setFormData] = useState({
    questionSetCode: "",
    positionId: positionIdFromState || "",
    totalQuestions: "",
    totalDuration: 0,
    instruction: defaultInstruction,
    interviewPlatform: "BROWSER",
    interviewMode: "",
    version: 1,
    complexityLevel: "",
    generalQuestionsCount: "",
    positionSpecificQuestionsCount: "",
    codingQuestionsCount: "",
    aptitudeQuestionsCount: "",
    status: "DRAFT",
    isActive: true,
    questionSectionIds: ""
  });

  // NEW: State for Question Library Deep Search
  const [showCompanyInput, setShowCompanyInput] = useState(false);
  const [libraryCompanyName, setLibraryCompanyName] = useState("");
  const [generatingLibrary, setGeneratingLibrary] = useState(false);
  const [libraryPreviewQuestions, setLibraryPreviewQuestions] = useState([]);

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [generatingAI, setGeneratingAI] = useState(false);
  const isLoadingPositionsRef = useRef(false);
  const isLoadingQuestionSetRef = useRef(false);
  const isLoadingPositionDetailsRef = useRef(false);
  const hasInitializedRef = useRef(false);
  const libraryPreviewRef = useRef(null);

  useEffect(() => {
    // Auto-scroll library preview to bottom when questions are generating
    if (libraryPreviewRef.current && libraryPreviewQuestions.length > 0) {
      libraryPreviewRef.current.scrollTop = libraryPreviewRef.current.scrollHeight;
    }
  }, [libraryPreviewQuestions]);

  useEffect(() => {
    // Prevent duplicate calls
    if (hasInitializedRef.current) {
      return;
    }

    hasInitializedRef.current = true;

    // If editing/viewing existing question set, load it
    if (questionSetIdFromState || questionSetFromState) {
      loadQuestionSetData();
    } else if (positionIdFromState && positionCodeFromState) {
      // If position data is passed from CreatePosition, use it directly
      setSelectedPosition({
        id: positionIdFromState,
        code: positionCodeFromState,
        title: positionTitleFromState || ""
      });
      setFormData(prev => ({ ...prev, positionId: positionIdFromState }));
    } else {
      // Otherwise, load positions list for selection
      loadPositions();
      if (positionIdFromState) {
        loadPositionDetails();
      }
    }
  }, []);

  // Auto-expand textareas when content changes (including programmatic typing effect)
  useEffect(() => {
    const textareas = document.querySelectorAll('textarea.auto-expand');
    textareas.forEach(textarea => {
      textarea.style.height = 'auto';
      textarea.style.height = (textarea.scrollHeight + 2) + 'px'; // +2 for border
    });
  }, [questions, selectedRound, newQuestionText, generatingAI]);

  const loadQuestionSetData = async () => {
    // Prevent duplicate calls
    if (isLoadingQuestionSetRef.current) {
      return;
    }

    // Don't reload if already loaded
    if (formData.questionSetCode && questions.general.length > 0) {
      return;
    }

    isLoadingQuestionSetRef.current = true;
    setLoadingQuestionSet(true);
    try {
      let questionSetData = questionSetFromState;

      // If we only have ID, fetch the full data
      if (questionSetIdFromState && !questionSetData) {
        questionSetData = await questionSetService.getQuestionSetById(questionSetIdFromState);
      }

      if (questionSetData) {
        // Load position details only if not already loaded
        if (questionSetData.positionId && !selectedPosition) {
          try {
            const position = await positionService.getPositionById(questionSetData.positionId);
            setSelectedPosition(position);
          } catch (error) {
            console.error("Error loading position:", error);
          }
        }

        // Populate form data
        setFormData(prev => ({
          ...prev,
          positionId: questionSetData.positionId,
          questionSetCode: questionSetData.questionSetCode || "",
          totalQuestions: questionSetData.totalQuestions || 0,
          totalDuration: questionSetData.totalDuration || 0,
          instruction: questionSetData.instruction || defaultInstruction,
          interviewPlatform: questionSetData.interviewPlatform || "BROWSER",
          interviewMode: questionSetData.interviewMode || "",
          generalQuestionsCount: questionSetData.generalQuestionsCount || 0,
          positionSpecificQuestionsCount: questionSetData.positionSpecificQuestionsCount || 0,
          codingQuestionsCount: questionSetData.codingQuestionsCount || 0,
          aptitudeQuestionsCount: questionSetData.aptitudeQuestionsCount || 0
        }));

        // Load questions if available
        if (questionSetData.questions) {
          setQuestions({
            general: questionSetData.questions.general || [],
            position: questionSetData.questions.position || [],
            coding: questionSetData.questions.coding || [],
            aptitude: questionSetData.questions.aptitude || []
          });
        }

        // Load shuffle settings if available
        if (questionSetData.shuffleQuestions) {
          setShuffleQuestions(questionSetData.shuffleQuestions);
        }

        // --- NEW: Load detailed sections from MongoDB if they exist ---
        const questionSetId = questionSetIdFromState || questionSetData.id;
        if (questionSetId) {
          try {
            // Fetch detailed questions from MongoDB
            const sectionResponse = await questionSectionService.getQuestionSectionByQuestionSet(questionSetId);
            if (sectionResponse && sectionResponse.status === "success" && sectionResponse.data) {
              const mongoData = sectionResponse.data;
              console.log("Loaded detailed questions from MongoDB");

              setQuestions({
                general: (mongoData.generalQuestions?.questions || []).map(q => ({
                  id: isNaN(q.id) ? q.id : parseInt(q.id),
                  text: q.question,
                  prepareTime: q.timeToPrepare,
                  answerTime: q.timeToAnswer
                })),
                position: (mongoData.positionSpecificQuestions?.questions || []).map(q => ({
                  id: isNaN(q.id) ? q.id : parseInt(q.id),
                  text: q.question,
                  prepareTime: q.timeToPrepare,
                  answerTime: q.timeToAnswer
                })),
                coding: (mongoData.codingQuestions || []).map(q => ({
                  id: isNaN(q.id) ? q.id : String(q.id),
                  text: q.customCodingQuestion || "",
                  language: q.programmingLanguage,
                  difficulty: q.difficultyLevel,
                  duration: q.codeDuration,
                  source: q.questionSource
                })),
                aptitude: (mongoData.aptitudeQuestions || []).map(q => ({
                  id: isNaN(q.id) ? q.id : String(q.id),
                  text: "",
                  source: q.questionSource,
                  difficulty: q.difficultyLevel,
                  questionsCount: q.numberOfQuestions,
                  answerTime: q.timeToAnswer
                }))
              });

              if (mongoData.generalQuestions?.shuffle || mongoData.positionSpecificQuestions?.shuffle) {
                setShuffleQuestions({
                  general: mongoData.generalQuestions?.shuffle?.status || false,
                  position: mongoData.positionSpecificQuestions?.shuffle?.status || false,
                  coding: false,
                  aptitude: false
                });
              }
            }
          } catch (mongoError) {
            console.error("Error loading detailed questions from MongoDB:", mongoError);
          }

          try {
            // Fetch detailed instructions from MongoDB
            const instResponse = await instructionService.getInstructionsByQuestionSet(questionSetId);
            if (instResponse && instResponse.length > 0) {
              const mongoInst = instResponse[0]; // Get first instruction
              setFormData(prev => ({
                ...prev,
                instruction: mongoInst.instructionText || prev.instruction
              }));
              console.log("Loaded detailed instruction from MongoDB");
            }
          } catch (instMongoError) {
            console.error("Error loading detailed instructions from MongoDB:", instMongoError);
          }
        }
        // --- END NEW ---
      }
    } catch (error) {
      console.error("Error loading question set:", error);
      showMessage("Failed to load question set data", "error");
    } finally {
      setLoadingQuestionSet(false);
      isLoadingQuestionSetRef.current = false;
    }
  };

  const loadPositionDetails = async () => {
    // Prevent duplicate calls
    if (isLoadingPositionDetailsRef.current) {
      return;
    }

    // Don't reload if already loaded
    if (selectedPosition && selectedPosition.id === positionIdFromState) {
      return;
    }

    isLoadingPositionDetailsRef.current = true;
    try {
      const position = await positionService.getPositionById(positionIdFromState);
      setSelectedPosition(position);
    } catch (error) {
      console.error("Error loading position details:", error);
      // Try to find position from positions list
      const foundPosition = positions.find(p => p.id === positionIdFromState);
      if (foundPosition) {
        setSelectedPosition(foundPosition);
      }
    } finally {
      isLoadingPositionDetailsRef.current = false;
    }
  };

  useEffect(() => {
    if (positions.length > 0 && positionIdFromState && !selectedPosition) {
      const foundPosition = positions.find(p => p.id === positionIdFromState);
      if (foundPosition) {
        setSelectedPosition(foundPosition);
      }
    }
  }, [positions, positionIdFromState]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.round-dropdown-container')) {
        setShowRoundDropdown({ general: false, position: false, coding: false, aptitude: false });
      }
      // Close language dropdown if clicking outside
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target) &&
        languageInputRef.current && !languageInputRef.current.contains(event.target) &&
        !event.target.closest('[data-language-dropdown]')) {
        setShowLanguageDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadPositions = async () => {
    // Prevent duplicate calls
    if (isLoadingPositionsRef.current) {
      return;
    }

    // Don't load if positions already exist
    if (positions.length > 0) {
      return;
    }

    isLoadingPositionsRef.current = true;
    try {
      const positionsData = await positionService.getAllPositions();
      setPositions(positionsData);
    } catch (error) {
      console.error("Error loading positions:", error);
      // Only show error if position is not already provided from state
      if (!positionIdFromState) {
        showMessage("Failed to load positions", "error");
      }
    } finally {
      isLoadingPositionsRef.current = false;
    }
  };

  const showMessage = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleGenerateAIQuestions = async (roundType) => {
    if (!selectedPosition) {
      showMessage("Please select a position first", "error");
      return;
    }

    setGeneratingAI(true);
    let socket = null;

    try {
      // 1. Fetch fresh position details with skills
      const pos = await positionService.getPositionDetails(selectedPosition.id);
      const mandatorySkills = pos.mandatorySkills || [];
      const optionalSkills = pos.optionalSkills || [];

      // 2. Gather previous questions to avoid duplicates
      const previousQuestions = [
        ...(questions.general || []).map(q => q.text),
        ...(questions.position || []).map(q => q.text),
        ...(questions.coding || []).map(q => q.text),
        ...(questions.aptitude || []).map(q => q.text)
      ].filter(Boolean);

      // 3. Setup WebSocket connection
      socket = new WebSocket(`${AI_BACKEND_WS_URL}/ws/generate-interview-questions`);

      socket.onopen = () => {
        console.log("AI Questions WebSocket connected");
        // Send request parameters
        const payload = {
          jobRole: pos.title || "Position",
          minYearsOfExperience: pos.minimumExperience || 0,
          maxYearsOfExperience: pos.maximumExperience || 0,
          mandatorySkills: mandatorySkills,
          optionalSkills: optionalSkills,
          previousQuestions: previousQuestions,
          numberOfQuestions: 1, // Generate one at a time for better UX
          stream: false
        };
        socket.send(JSON.stringify(payload));
      };

      socket.onmessage = (event) => {
        const response = JSON.parse(event.data);
        if (response.success && response.data) {
          const result = response.data;
          const questionText = result.question || (result.questions && result.questions[0]);

          if (questionText) {
            const newId = `ai_${Date.now()}`;
            const newQuestion = {
              id: newId,
              text: "", // Start empty for typing effect
              prepareTime: newQuestionPrepareTime,
              answerTime: newQuestionAnswerTime,
              isAiGenerated: true
            };

            setQuestions(prev => ({
              ...prev,
              [roundType]: [...(prev[roundType] || []), newQuestion]
            }));

            // Character-by-character typing effect
            let currentText = "";
            let index = 0;
            const typingInterval = setInterval(() => {
              if (index < questionText.length) {
                currentText += questionText[index];
                setQuestions(prev => ({
                  ...prev,
                  [roundType]: prev[roundType].map(q =>
                    q.id === newId ? { ...q, text: currentText } : q
                  )
                }));
                index++;
              } else {
                clearInterval(typingInterval);
              }
            }, 20); // 20ms per character for smooth typing

            // Update question count
            const fieldMap = {
              general: 'generalQuestionsCount',
              position: 'positionSpecificQuestionsCount',
              coding: 'codingQuestionsCount',
              aptitude: 'aptitudeQuestionsCount'
            };
            setFormData(prev => ({
              ...prev,
              [fieldMap[roundType]]: (prev[fieldMap[roundType]] || 0) + 1
            }));

            showMessage("AI question generated successfully!", "success");
          } else {
            showMessage("No question was generated. Please try again.", "error");
          }
        } else {
          showMessage(response.error || "Failed to generate AI questions.", "error");
        }
        socket.close();
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        showMessage("Connection to AI service failed.", "error");
        setGeneratingAI(false);
      };

      socket.onclose = () => {
        console.log("AI Questions WebSocket closed");
        setGeneratingAI(false);
      };

    } catch (error) {
      console.error("Error initiating AI generation:", error);
      showMessage("Failed to start AI generation process.", "error");
      setGeneratingAI(false);
      if (socket) socket.close();
    }
  };

  const handleGenerateLibraryQuestions = async (roundType) => {
    if (!selectedPosition) {
      showMessage("Please select a position first", "error");
      return;
    }

    if (!libraryCompanyName.trim()) {
      showMessage("Please enter a company name", "error");
      return;
    }

    setGeneratingLibrary(true);
    let socket = null;

    try {
      const pos = await positionService.getPositionDetails(selectedPosition.id);
      const mandatorySkills = pos.mandatorySkills || [];
      const optionalSkills = pos.optionalSkills || [];

      // Gather previous questions to avoid duplicates
      const previousQuestions = [
        ...(questions.general || []).map(q => q.text),
        ...(questions.position || []).map(q => q.text),
        ...(questions.coding || []).map(q => q.text),
        ...(questions.aptitude || []).map(q => q.text)
      ].filter(Boolean);

      socket = new WebSocket(`${AI_BACKEND_WS_URL}/ws/generate-interview-questions`);

      socket.onopen = () => {
        console.log("Question Library WebSocket connected");
        const payload = {
          jobRole: pos.title || "Position",
          companyName: libraryCompanyName,
          minYearsOfExperience: pos.minimumExperience || 0,
          maxYearsOfExperience: pos.maximumExperience || 1,
          mandatorySkills: mandatorySkills,
          optionalSkills: optionalSkills,
          previousQuestions: previousQuestions,
          numberOfQuestions: 10,
          questionType: "behavioral"
        };
        socket.send(JSON.stringify(payload));
      };

      socket.onmessage = async (event) => {
        const response = JSON.parse(event.data);
        if (response.success && response.data) {
          const result = response.data;
          const questionsList = result.questions || (result.question ? [result.question] : []);

          if (questionsList.length > 0) {
            setLibraryPreviewQuestions([]); // Clear previous preview

            // Process questions one by one for typing effect in preview
            for (let i = 0; i < questionsList.length; i++) {
              const questionText = questionsList[i];
              const newId = `preview_${Date.now()}_${i}`;
              const previewQuest = {
                id: newId,
                text: "",
                isAiGenerated: true
              };

              setLibraryPreviewQuestions(prev => [...prev, previewQuest]);

              // Character-by-character typing effect
              await new Promise(resolve => {
                let currentText = "";
                let index = 0;
                const typingInterval = setInterval(() => {
                  if (index < questionText.length) {
                    currentText += questionText[index];
                    setLibraryPreviewQuestions(prev => prev.map(q =>
                      q.id === newId ? { ...q, text: currentText } : q
                    ));
                    index++;
                  } else {
                    clearInterval(typingInterval);
                    resolve();
                  }
                }, 10);
              });

              await new Promise(r => setTimeout(r, 200));
            }
            showMessage(`Generated ${questionsList.length} suggestions from ${libraryCompanyName}.`, "success");
          } else {
            showMessage("No questions were generated. Please try again.", "error");
          }
        } else {
          showMessage(response.error || "Failed to generate library questions.", "error");
        }
        socket.close();
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        showMessage("Connection to AI service failed.", "error");
        setGeneratingLibrary(false);
      };

      socket.onclose = () => {
        console.log("Library WebSocket closed");
        setGeneratingLibrary(false);
      };

    } catch (error) {
      console.error("Error initiating Library generation:", error);
      showMessage("Failed to start Library generation process.", "error");
      setGeneratingLibrary(false);
      if (socket) socket.close();
    }
  };

  const addQuestionFromLibrary = (roundType, questionText) => {
    const newId = `ai_${Date.now()}`;
    const newQuestion = {
      id: newId,
      text: questionText,
      prepareTime: newQuestionPrepareTime,
      answerTime: newQuestionAnswerTime,
      isAiGenerated: true
    };

    setQuestions(prev => ({
      ...prev,
      [roundType]: [newQuestion, ...(prev[roundType] || [])] // ADD TO TOP
    }));

    // Update question count
    const fieldMap = {
      general: 'generalQuestionsCount',
      position: 'positionSpecificQuestionsCount',
      coding: 'codingQuestionsCount',
      aptitude: 'aptitudeQuestionsCount'
    };
    setFormData(prev => ({
      ...prev,
      [fieldMap[roundType]]: (prev[fieldMap[roundType]] || 0) + 1
    }));

    // Remove from preview
    setLibraryPreviewQuestions(prev => prev.filter(q => q.text !== questionText));
    showMessage("Question added to list!", "success");
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const calculateTotalQuestions = () => {
    return (questions.general?.length || 0) +
      (questions.position?.length || 0) +
      (questions.coding?.length || 0) +
      (questions.aptitude?.length || 0);
  };

  const calculateTotalDuration = () => {
    return calculateRoundDuration('general') +
      calculateRoundDuration('position') +
      calculateRoundDuration('coding') +
      calculateRoundDuration('aptitude');
  };

  const handleRoundClick = (roundType) => {
    // Close other dropdowns
    setShowRoundDropdown({ general: false, position: false, coding: false, aptitude: false });
    // Show question management UI for this round
    setSelectedRound(roundType);
  };

  const handleRoundOptionSelect = (roundType, value) => {
    const fieldMap = {
      general: 'generalQuestionsCount',
      position: 'positionSpecificQuestionsCount',
      coding: 'codingQuestionsCount',
      aptitude: 'aptitudeQuestionsCount'
    };

    setFormData(prev => ({
      ...prev,
      [fieldMap[roundType]]: value
    }));

    setShowRoundDropdown(prev => ({
      ...prev,
      [roundType]: false
    }));
  };

  const handleQuestionChange = (roundType, identifier, field, value) => {
    setQuestions(prev => ({
      ...prev,
      [roundType]: prev[roundType].map(q =>
        (q.id && q.id === identifier) || (q.text && q.text === identifier)
          ? { ...q, [field]: value }
          : q
      )
    }));
  };

  const handleAddQuestion = (roundType) => {
    if (newQuestionText.trim()) {
      const newId = Math.max(...questions[roundType].map(q => q.id), 0) + 1;
      setQuestions(prev => ({
        ...prev,
        [roundType]: [...prev[roundType], {
          id: newId,
          text: newQuestionText.trim(),
          prepareTime: newQuestionPrepareTime,
          answerTime: newQuestionAnswerTime
        }]
      }));
      setNewQuestionText("");
      // Update question count in formData
      const fieldMap = {
        general: 'generalQuestionsCount',
        position: 'positionSpecificQuestionsCount',
        coding: 'codingQuestionsCount',
        aptitude: 'aptitudeQuestionsCount'
      };
      setFormData(prev => ({
        ...prev,
        [fieldMap[roundType]]: questions[roundType].length + 1
      }));
    }
  };

  const handleDeleteQuestion = (roundType, identifier) => {
    setQuestions(prev => ({
      ...prev,
      [roundType]: prev[roundType].filter(q => (q.id && q.id !== identifier) || (q.text && q.text !== identifier))
    }));
    // Update question count in formData
    const fieldMap = {
      general: 'generalQuestionsCount',
      position: 'positionSpecificQuestionsCount',
      coding: 'codingQuestionsCount',
      aptitude: 'aptitudeQuestionsCount'
    };
    setFormData(prev => ({
      ...prev,
      [fieldMap[roundType]]: Math.max(0, (prev[fieldMap[roundType]] || questions[roundType].length) - 1)
    }));
  };

  const calculateRoundDuration = (roundType) => {
    const roundQuestions = questions[roundType];
    if (roundQuestions.length === 0) return 0;

    // Special handling for coding questions - they use 'duration' field (in minutes)
    if (roundType === 'coding') {
      return roundQuestions.reduce((sum, q) => {
        const duration = parseInt(q.duration) || 0; // in minutes
        return sum + duration;
      }, 0);
    }

    // Special handling for aptitude questions - they use 'noOfQuestions' * 'timePerQuestion'
    // Note: When loaded from DB, fields are 'questionsCount' and 'answerTime'
    // When newly added, fields are 'noOfQuestions' and 'timePerQuestion'
    if (roundType === 'aptitude') {
      return roundQuestions.reduce((sum, q) => {
        const noOfQuestions = parseInt(q.noOfQuestions) || parseInt(q.questionsCount) || 0; // number of questions
        const timePerQuestion = parseInt(q.timePerQuestion) || parseInt(q.answerTime) || 0; // time per question in minutes
        const totalDuration = noOfQuestions * timePerQuestion;
        return sum + totalDuration;
      }, 0);
    }

    // For general and position questions - use prepareTime (seconds) + answerTime (minutes)
    const totalSeconds = roundQuestions.reduce((sum, q) => {
      const prepare = parseInt(q.prepareTime) || 0; // in seconds
      const answer = parseInt(q.answerTime) || 0; // in minutes, convert to seconds
      return sum + prepare + (answer * 60);
    }, 0);

    return totalSeconds / 60; // return in minutes
  };

  const formatDuration = (minutes) => {
    const totalSeconds = Math.round(minutes * 60);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')} `;
  };

  // Format duration in minutes to hh:mm:ss format
  const formatRoundTime = (minutes) => {
    if (!minutes || minutes === 0) return "00:00:00";
    const totalSeconds = Math.round(minutes * 60);
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Validation: Check if mandatory rounds have questions
  const isValidQuestionSet = () => {
    const hasGeneralQuestions = questions.general && questions.general.length > 0;
    const hasPositionQuestions = questions.position && questions.position.length > 0;
    return hasGeneralQuestions && hasPositionQuestions;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!positionIdFromState && !formData.positionId) {
      showMessage("Please select a position", "error");
      return;
    }

    // Validate mandatory rounds (only for create mode)
    if (!isEditMode && !isValidQuestionSet()) {
      showMessage("General Questions (Round 1) and Position Specific (Round 2) are mandatory. Please add at least one question to each.", "error");
      return;
    }

    setLoading(true);

    try {
      const totalQuestions = calculateTotalQuestions();
      const finalDuration = calculateTotalDuration();

      // Only send necessary data to backend
      const questionSetData = {
        positionId: positionIdFromState || formData.positionId,
        totalQuestions: totalQuestions,
        totalDuration: Math.round(finalDuration) || 0,
        interviewPlatform: formData.interviewPlatform || "BROWSER",
        interviewMode: formData.interviewMode || null,
        generalQuestionsCount: questions.general?.length || 0,
        positionSpecificQuestionsCount: questions.position?.length || 0,
        codingQuestionsCount: questions.coding?.length || 0,
        aptitudeQuestionsCount: questions.aptitude?.length || 0,
        // Include questions data
        questions: {
          general: questions.general || [],
          position: questions.position || [],
          coding: questions.coding || [],
          aptitude: questions.aptitude || []
        },
        shuffleQuestions: shuffleQuestions
      };

      // Map questions to the structure expected by QuestionSection API
      const questionSectionData = {
        positionId: positionIdFromState || formData.positionId,
        questionSetCode: formData.questionSetCode || "",
        generalQuestions: {
          shuffle: {
            status: shuffleQuestions.general || false,
            questionsCount: questions.general?.length || 0,
            selectedShuffle: "RANDOM"
          },
          questions: (questions.general || []).map(q => ({
            id: String(q.id || q.text),
            question: q.text || "",
            answer: "",
            questionType: "GENERAL"
          }))
        },
        positionSpecificQuestions: {
          shuffle: {
            status: shuffleQuestions.position || false,
            questionsCount: questions.position?.length || 0,
            selectedShuffle: "RANDOM"
          },
          questions: (questions.position || []).map(q => ({
            id: String(q.id || q.text),
            question: q.text || "",
            answer: "",
            questionType: "POSITION_SPECIFIC"
          }))
        },
        codingQuestions: (questions.coding || []).map(q => ({
          id: String(q.id || q.text),
          questionSource: q.source || "CODING_LIBRARY",
          programmingLanguage: q.language || "PYTHON",
          difficultyLevel: q.difficulty || "EASY",
          codeDuration: String(q.duration) || "15",
          customCodingQuestion: q.text || ""
        })),
        aptitudeQuestions: (questions.aptitude || []).map(q => ({
          id: String(q.id || q.text),
          questionSource: q.source || q.mcqType || "NUMERICAL_REASONING",
          difficultyLevel: q.difficulty || "EASY",
          numberOfQuestions: String(q.noOfQuestions || q.questionsCount) || "5"
        })),
        // Round timing fields (in hh:mm:ss format)
        round1Time: formatRoundTime(calculateRoundDuration('general') || 0),
        round2Time: formatRoundTime(calculateRoundDuration('position') || 0),
        round3Time: formatRoundTime(calculateRoundDuration('coding') || 0),
        round4Time: formatRoundTime(calculateRoundDuration('aptitude') || 0)
      };

      if (isEditMode && questionSetIdFromState) {
        // Update existing question set
        const updatedQuestionSet = await questionSetService.updateQuestionSet(questionSetIdFromState, questionSetData);

        // Also save/update the QuestionSection details in MongoDB
        let savedQuestionSection = null;
        try {
          const sectionResponse = await questionSectionService.createQuestionSection(questionSetIdFromState, questionSectionData);
          console.log("Question section details saved to MongoDB");
          savedQuestionSection = sectionResponse?.data || sectionResponse;
        } catch (sectionError) {
          console.error("Error saving question section details:", sectionError);
          // Don't fail the whole operation if just the details fail, but log it
        }

        // Also save/update instructions in MongoDB
        try {
          await instructionService.saveInstruction({
            positionId: questionSectionData.positionId,
            questionSetId: questionSetIdFromState,
            instructionText: formData.instruction || defaultInstruction,
            instructionType: "GENERAL",
            orderIndex: 0
          });
          console.log("Instruction details saved to MongoDB");
        } catch (instError) {
          console.error("Error saving instruction details:", instError);
        }

        // Create/Update assessment summaries for candidates assigned to this position
        // This API is called when updating a question set, following the same pattern as AddCandidate.jsx
        console.log("🔄 Starting assessment summary update process...");
        try {
          const generalCount = questionSetData.generalQuestionsCount || 0;
          const positionSpecificCount = questionSetData.positionSpecificQuestionsCount || 0;
          const codingCount = questionSetData.codingQuestionsCount || 0;
          const aptitudeCount = questionSetData.aptitudeQuestionsCount || 0;
          const totalDuration = questionSetData.totalDuration || 0;

          // Determine round assignments (matching backend AssessmentSummaryClient pattern)
          // round1=general, round2=position, round3=coding, round4=aptitude
          const round1Assigned = generalCount > 0;
          const round2Assigned = positionSpecificCount > 0;
          const round3Assigned = codingCount > 0;     // round3 = coding (matching backend)
          const round4Assigned = aptitudeCount > 0;   // round4 = aptitude (matching backend)
          const totalRoundsAssigned = [round1Assigned, round2Assigned, round3Assigned, round4Assigned].filter(Boolean).length;

          // Fetch candidates assigned to this position
          const positionId = positionIdFromState || formData.positionId;
          console.log(`🔍 Fetching candidates for position: ${positionId} (update mode)`);
          
          // Try to get candidates with test assignments first (more reliable)
          let positionCandidates = [];
          try {
            const organizationId = localStorage.getItem('organizationId') || adminInfo?.organization?.organizationId || null;
            const candidatesWithAssignments = await candidateService.getCandidatesWithTestAssignments(organizationId);
            
            const candidates = Array.isArray(candidatesWithAssignments) 
              ? candidatesWithAssignments 
              : candidatesWithAssignments?.content || candidatesWithAssignments?.data || [];
            
            console.log(`📋 Total candidates fetched: ${candidates.length}`);
            if (candidates.length > 0) {
              console.log("📋 Sample candidate structure:", JSON.stringify(candidates[0], null, 2));
            }
            
            // Filter candidates for this position - check multiple possible fields
            positionCandidates = candidates.filter(c => {
              const candidatePositionId = c.positionId || 
                                         c.candidatePosition?.positionId || 
                                         c.testAssignment?.positionId ||
                                         c.testAssignments?.[0]?.positionId ||
                                         c.candidatePositionId ||
                                         (c.testAssignments && Array.isArray(c.testAssignments) && c.testAssignments.find(ta => ta.positionId === positionId)?.positionId);
              
              const matches = candidatePositionId === positionId;
              if (!matches && candidatePositionId) {
                console.log(`🔍 Candidate ${c.id || c.candidateId} has positionId: ${candidatePositionId}, looking for: ${positionId}`);
              }
              return matches;
            });
            
            console.log(`👥 Found ${positionCandidates.length} candidates for position ${positionId} (from test assignments)`);
            if (positionCandidates.length > 0) {
              console.log("👥 Matched candidates:", positionCandidates.map(c => ({
                id: c.id || c.candidateId,
                name: c.fullName || c.candidateName || c.name,
                positionId: c.positionId || c.candidatePosition?.positionId || c.testAssignment?.positionId
              })));
            }
          } catch (assignmentsError) {
            console.warn("⚠️ Failed to get candidates with test assignments, trying getAllCandidates:", assignmentsError);
            
            // Fallback to getAllCandidates
            try {
              const organizationId = localStorage.getItem('organizationId') || adminInfo?.organization?.organizationId || null;
              const candidatesResponse = await candidateService.getAllCandidates({
                organizationId,
                page: 0,
                size: 1000,
              });

              const candidates = candidatesResponse?.content || candidatesResponse?.data || candidatesResponse || [];
              positionCandidates = candidates.filter(c => {
                const candidatePositionId = c.positionId || 
                                           c.candidatePosition?.positionId || 
                                           c.testAssignment?.positionId ||
                                           c.testAssignments?.[0]?.positionId;
                return candidatePositionId === positionId;
              });

              console.log(`👥 Found ${positionCandidates.length} candidates for position ${positionId} (from getAllCandidates)`);
            } catch (fallbackError) {
              console.error("❌ Failed to fetch candidates:", fallbackError);
              positionCandidates = [];
            }
          }

          if (positionCandidates.length > 0) {
            console.log(`✅ Updating assessment summaries for ${positionCandidates.length} candidates`);
            
            for (const candidate of positionCandidates) {
              try {
                const candidateId = candidate.id || candidate.candidateId;
                if (!candidateId) continue;

                // Use round times from questionSectionData (already in hh:mm:ss format)
                const round1Time = questionSectionData.round1Time || formatRoundTime(calculateRoundDuration('general') || 0);
                const round2Time = questionSectionData.round2Time || formatRoundTime(calculateRoundDuration('position') || 0);
                const round3Time = questionSectionData.round3Time || formatRoundTime(calculateRoundDuration('coding') || 0);
                const round4Time = questionSectionData.round4Time || formatRoundTime(calculateRoundDuration('aptitude') || 0);

                const assessmentStatePayload = {
                  positionId: positionId,
                  candidateId: candidateId,
                  questionId: questionSetIdFromState,  // This is the questionSetId
                  totalRoundsAssigned: totalRoundsAssigned,
                  totalRoundsCompleted: 0,
                  totalInterviewTime: String(totalDuration),  // Total duration in minutes (as string)
                  
                  // Round 1 - General Questions
                  round1Assigned: round1Assigned,
                  round1Completed: false,
                  round1Time: round1Time,  // Allocated time from question section (hh:mm:ss)
                  round1TimeTaken: null,
                  round1StartTime: null,
                  round1EndTime: null,
                  
                  // Round 2 - Position Specific Questions
                  round2Assigned: round2Assigned,
                  round2Completed: false,
                  round2Time: round2Time,  // Allocated time from question section (hh:mm:ss)
                  round2TimeTaken: null,
                  round2StartTime: null,
                  round2EndTime: null,
                  
                  // Round 3 - Coding Questions
                  round3Assigned: round3Assigned,
                  round3Completed: false,
                  round3Time: round3Time,  // Allocated time from question section (hh:mm:ss)
                  round3TimeTaken: null,
                  round3StartTime: null,
                  round3EndTime: null,
                  
                  // Round 4 - Aptitude Questions
                  round4Assigned: round4Assigned,
                  round4Completed: false,
                  round4Time: round4Time,  // Allocated time from question section (hh:mm:ss)
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

                await assessmentSummaryService.createAssessmentSummary(assessmentStatePayload);
                console.log(`✅ Assessment summary updated for candidate ${candidateId}`);
              } catch (candidateError) {
                console.error(`❌ Failed to update assessment summary for candidate ${candidate.id || candidate.candidateId}:`, candidateError);
              }
            }
          } else {
            console.log("ℹ️ No candidates assigned to this position yet.");
          }
        } catch (assessmentSummaryError) {
          console.error("❌ Error updating assessment summaries:", assessmentSummaryError);
          // Don't block the flow
        }

        showMessage("Question set updated successfully!", "success");
        setTimeout(() => {
          navigate("/dashboard/question-sets");
        }, 1000);
      } else {
        // Create new question set
        const createdQuestionSet = await questionSetService.createQuestionSet(questionSetData);
        const questionSetId = createdQuestionSet.id;

        // Also save the QuestionSection details in MongoDB
        let savedQuestionSection = null;
        try {
          const sectionResponse = await questionSectionService.createQuestionSection(questionSetId, questionSectionData);
          console.log("Question section details saved to MongoDB");
          savedQuestionSection = sectionResponse?.data || sectionResponse;
        } catch (sectionError) {
          console.error("Error saving question section details:", sectionError);
        }

        // Also save instructions in MongoDB
        try {
          await instructionService.saveInstruction({
            positionId: questionSectionData.positionId,
            questionSetId: questionSetId,
            instructionText: formData.instruction || defaultInstruction,
            instructionType: "GENERAL",
            orderIndex: 0
          });
          console.log("Instruction details saved to MongoDB");
        } catch (instError) {
          console.error("Error saving instruction details:", instError);
        }

        // Create/Update assessment summaries for candidates assigned to this position
        // This API is called when creating a question set, following the same pattern as AddCandidate.jsx
        console.log("🔄 Starting assessment summary creation process...");
        console.log("🔄 Question Set ID:", questionSetId);
        console.log("🔄 Position ID:", positionIdFromState || formData.positionId);
        console.log("🔄 CANDIDATE_BACKEND_URL:", import.meta.env.VITE_CANDIDATE_BACKEND_URL);
        try {
          const generalCount = questionSetData.generalQuestionsCount || 0;
          const positionSpecificCount = questionSetData.positionSpecificQuestionsCount || 0;
          const codingCount = questionSetData.codingQuestionsCount || 0;
          const aptitudeCount = questionSetData.aptitudeQuestionsCount || 0;
          const totalDuration = questionSetData.totalDuration || 0;

          console.log("📊 Question counts:", {
            general: generalCount,
            positionSpecific: positionSpecificCount,
            coding: codingCount,
            aptitude: aptitudeCount,
            totalDuration: totalDuration
          });

          // Determine round assignments (matching backend AssessmentSummaryClient pattern)
          // round1=general, round2=position, round3=coding, round4=aptitude
          const round1Assigned = generalCount > 0;
          const round2Assigned = positionSpecificCount > 0;
          const round3Assigned = codingCount > 0;     // round3 = coding (matching backend)
          const round4Assigned = aptitudeCount > 0;   // round4 = aptitude (matching backend)
          const totalRoundsAssigned = [round1Assigned, round2Assigned, round3Assigned, round4Assigned].filter(Boolean).length;

          console.log("🎯 Round assignments:", {
            round1Assigned,
            round2Assigned,
            round3Assigned,
            round4Assigned,
            totalRoundsAssigned
          });

          // Fetch candidates assigned to this position
          const positionId = positionIdFromState || formData.positionId;
          console.log(`🔍 Fetching candidates for position: ${positionId}`);
          
          // Try to get candidates with test assignments first (more reliable)
          let positionCandidates = [];
          try {
            const organizationId = localStorage.getItem('organizationId') || adminInfo?.organization?.organizationId || null;
            const candidatesWithAssignments = await candidateService.getCandidatesWithTestAssignments(organizationId);
            console.log("📋 Candidates with test assignments:", candidatesWithAssignments);
            
            const candidates = Array.isArray(candidatesWithAssignments) 
              ? candidatesWithAssignments 
              : candidatesWithAssignments?.content || candidatesWithAssignments?.data || [];
            
            console.log(`📋 Total candidates fetched: ${candidates.length}`);
            if (candidates.length > 0) {
              console.log("📋 Sample candidate structure:", JSON.stringify(candidates[0], null, 2));
            }
            
            // Filter candidates for this position - check multiple possible fields
            positionCandidates = candidates.filter(c => {
              const candidatePositionId = c.positionId || 
                                         c.candidatePosition?.positionId || 
                                         c.testAssignment?.positionId ||
                                         c.testAssignments?.[0]?.positionId ||
                                         c.candidatePositionId ||
                                         (c.testAssignments && Array.isArray(c.testAssignments) && c.testAssignments.find(ta => ta.positionId === positionId)?.positionId);
              
              const matches = candidatePositionId === positionId;
              if (!matches && candidatePositionId) {
                console.log(`🔍 Candidate ${c.id || c.candidateId} has positionId: ${candidatePositionId}, looking for: ${positionId}`);
              }
              return matches;
            });
            
            console.log(`👥 Found ${positionCandidates.length} candidates for position ${positionId} (from test assignments)`);
            if (positionCandidates.length > 0) {
              console.log("👥 Matched candidates:", positionCandidates.map(c => ({
                id: c.id || c.candidateId,
                name: c.fullName || c.candidateName || c.name,
                positionId: c.positionId || c.candidatePosition?.positionId || c.testAssignment?.positionId
              })));
            }
          } catch (assignmentsError) {
            console.warn("⚠️ Failed to get candidates with test assignments, trying getAllCandidates:", assignmentsError);
            
            // Fallback to getAllCandidates
            try {
              const organizationId = localStorage.getItem('organizationId') || adminInfo?.organization?.organizationId || null;
              const candidatesResponse = await candidateService.getAllCandidates({
                organizationId,
                page: 0,
                size: 1000,
              });

              console.log("📋 Candidates response (fallback):", candidatesResponse);

              const candidates = candidatesResponse?.content || candidatesResponse?.data || candidatesResponse || [];
              positionCandidates = candidates.filter(c => {
                const candidatePositionId = c.positionId || 
                                           c.candidatePosition?.positionId || 
                                           c.testAssignment?.positionId ||
                                           c.testAssignments?.[0]?.positionId;
                return candidatePositionId === positionId;
              });

              console.log(`👥 Found ${positionCandidates.length} candidates for position ${positionId} (from getAllCandidates)`);
            } catch (fallbackError) {
              console.error("❌ Failed to fetch candidates:", fallbackError);
              positionCandidates = [];
            }
          }

          if (positionCandidates.length > 0) {
            console.log(`✅ Creating/updating assessment summaries for ${positionCandidates.length} candidates`);
            
            // Create assessment summary for each candidate
            for (const candidate of positionCandidates) {
              try {
                const candidateId = candidate.id || candidate.candidateId;
                if (!candidateId) {
                  console.warn("⚠️ Skipping candidate - no ID found:", candidate);
                  continue;
                }

                // Use round times from questionSectionData (already in hh:mm:ss format)
                const round1Time = questionSectionData.round1Time || formatRoundTime(calculateRoundDuration('general') || 0);
                const round2Time = questionSectionData.round2Time || formatRoundTime(calculateRoundDuration('position') || 0);
                const round3Time = questionSectionData.round3Time || formatRoundTime(calculateRoundDuration('coding') || 0);
                const round4Time = questionSectionData.round4Time || formatRoundTime(calculateRoundDuration('aptitude') || 0);

                const assessmentStatePayload = {
                  positionId: positionId,
                  candidateId: candidateId,
                  questionId: questionSetId,  // This is the questionSetId
                  totalRoundsAssigned: totalRoundsAssigned,
                  totalRoundsCompleted: 0,
                  totalInterviewTime: String(totalDuration),  // Total duration in minutes (as string)
                  
                  // Round 1 - General Questions
                  round1Assigned: round1Assigned,
                  round1Completed: false,
                  round1Time: round1Time,  // Allocated time from question section (hh:mm:ss)
                  round1TimeTaken: null,
                  round1StartTime: null,
                  round1EndTime: null,
                  
                  // Round 2 - Position Specific Questions
                  round2Assigned: round2Assigned,
                  round2Completed: false,
                  round2Time: round2Time,  // Allocated time from question section (hh:mm:ss)
                  round2TimeTaken: null,
                  round2StartTime: null,
                  round2EndTime: null,
                  
                  // Round 3 - Coding Questions
                  round3Assigned: round3Assigned,
                  round3Completed: false,
                  round3Time: round3Time,  // Allocated time from question section (hh:mm:ss)
                  round3TimeTaken: null,
                  round3StartTime: null,
                  round3EndTime: null,
                  
                  // Round 4 - Aptitude Questions
                  round4Assigned: round4Assigned,
                  round4Completed: false,
                  round4Time: round4Time,  // Allocated time from question section (hh:mm:ss)
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

                console.log(`📤 Calling assessment summary API for candidate ${candidateId}`);
                console.log(`📤 API URL: http://localhost:8085/assessment-summaries`);
                console.log(`📤 Payload:`, JSON.stringify(assessmentStatePayload, null, 2));
                const result = await assessmentSummaryService.createAssessmentSummary(assessmentStatePayload);
                console.log(`✅ Assessment summary created/updated for candidate ${candidateId}:`, result);
                console.log(`✅ Full API Response:`, JSON.stringify(result, null, 2));
              } catch (candidateError) {
                console.error(`❌ Failed to create assessment summary for candidate ${candidate.id || candidate.candidateId}:`, candidateError);
                // Continue with other candidates
              }
            }
            console.log("✅ Assessment summary creation process completed");
          } else {
            console.log("ℹ️ No candidates assigned to this position yet. Assessment summaries will be created when candidates are assigned.");
            console.log("ℹ️ This is expected when creating a new question set. Assessment summaries will be created when candidates are assigned to this position.");
            console.log("ℹ️ Position ID:", positionId);
            console.log("ℹ️ Question Set ID:", questionSetId);
            console.log("ℹ️ To test the API call, please assign at least one candidate to this position first.");
            console.log("ℹ️ API Endpoint: POST http://localhost:8085/assessment-summaries");
            console.log("ℹ️ Total candidates in organization:", candidates.length);
            console.log("ℹ️ All candidate positionIds:", candidates.map(c => ({
              candidateId: c.id || c.candidateId,
              positionId: c.positionId || c.candidatePosition?.positionId || c.testAssignment?.positionId || 'N/A'
            })));
          }
        } catch (assessmentSummaryError) {
          console.error("❌ Error in assessment summary creation process:", assessmentSummaryError);
          console.error("❌ Error stack:", assessmentSummaryError.stack);
          console.error("❌ Full error:", JSON.stringify(assessmentSummaryError, null, 2));
          // Don't block the flow - assessment summaries can be created later when candidates are assigned
        }

        showMessage("Question set created successfully! Redirecting to add candidate for test page...", "success");
        // Redirect to Create Candidate page (add candidate for test) with question set and position data
        setTimeout(() => {
          navigate("/dashboard/candidates/create", {
            state: {
              questionSetId: questionSetId,
              positionId: positionIdFromState || formData.positionId
            }
          });
        }, 1000);
      }
    } catch (error) {
      console.error("Error saving question set:", error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || "Failed to save question set. Please try again.";
      showMessage(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const renderAllRounds = () => {
    const rounds = [
      { type: 'general', label: 'General Questions', color: 'yellow', count: formData.generalQuestionsCount },
      { type: 'position', label: 'Position Specific', color: 'blue', count: formData.positionSpecificQuestionsCount },
      { type: 'coding', label: 'Coding Questions', color: 'green', count: formData.codingQuestionsCount },
      { type: 'aptitude', label: 'Aptitude Questions', color: 'purple', count: formData.aptitudeQuestionsCount }
    ];

    return (
      <div className="space-y-4">
        {/* Top Row - All fields in one row */}
        <div className="grid grid-cols-5 gap-3">
          {/* Position Code - Non-editable */}
          <div>
            <label className="block text-xs font-medium text-navy-700 mb-1">
              Position Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={selectedPosition?.code || positionCodeFromState || ""}
              readOnly
              disabled
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
            />
          </div>

          {/* Question Set Code - Non-editable */}
          <div>
            <label className="block text-xs font-medium text-navy-700 mb-1">
              Question Set Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.questionSetCode || ""}
              readOnly
              disabled
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
            />
          </div>

          {/* Interview Type */}
          <div>
            <label className="block text-xs font-medium text-navy-700 mb-1">
              Interview Type <span className="text-red-500">*</span>
            </label>
            <select
              name="interviewMode"
              value={formData.interviewMode}
              onChange={handleChange}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition"
            >
              <option value="">Select type</option>
              <option value="CONVERSATIONAL">Conversational</option>
              <option value="NON_CONVERSATIONAL">Non-Conversational</option>
            </select>
          </div>

          {/* Interview Platform */}
          <div>
            <label className="block text-xs font-medium text-navy-700 mb-1">
              Interview Platform <span className="text-red-500">*</span>
            </label>
            <select
              name="interviewPlatform"
              value={formData.interviewPlatform}
              onChange={handleChange}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition"
            >
              <option value="BROWSER">Browser</option>
            </select>
          </div>

          {/* Total Timing - Non-editable */}
          <div>
            <label className="block text-xs font-medium text-navy-700 mb-1">
              Total Timing (min) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={(() => {
                const totalMinutes = calculateTotalDuration() || 0;
                const totalSeconds = totalMinutes * 60;
                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                const seconds = Math.floor(totalSeconds % 60);
                return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
              })()}
              readOnly
              disabled
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
            />
          </div>
        </div>

        {/* 4 Round Boxes */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          {rounds.map((round) => {
            return (
              <div key={round.type} className="relative round-dropdown-container">
                <div
                  onClick={() => handleRoundClick(round.type)}
                  className={`bg-gray-50 border-2 rounded-lg p-5 cursor-pointer transition min-h-[80px] flex flex-col ${selectedRound === round.type ? 'border-gray-400' : 'border-gray-200 hover:border-gray-400'}`}
                >
                  <div className="text-base font-semibold text-gray-900 mb-2">
                    {round.label}
                  </div>
                  <div className="text-sm text-gray-600">
                    {questions[round.type]?.length || 0} questions
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Question Management Section */}
        {selectedRound && (
          <div className="mt-6 border-t border-gray-200 pt-4">
            {renderQuestionSection(selectedRound)}
          </div>
        )}
      </div>
    );
  };

  const renderQuestionSection = (roundType) => {
    const roundConfig = {
      general: {
        title: "Section 1. General Questions",
        description: "",
        color: "blue"
      },
      position: {
        title: "Section 2. Position Specific",
        description: "",
        subtitle: "",
        color: "blue"
      },
      coding: {
        title: "Section 3. Coding Questions",
        description: "",
        color: "green"
      },
      aptitude: {
        title: "Section 4. Aptitude Questions",
        description: "",
        color: "purple"
      }
    };

    const config = roundConfig[roundType];
    const roundQuestions = questions[roundType] || [];
    const duration = calculateRoundDuration(roundType);
    const questionCount = roundQuestions.length;

    // Special handling for Coding section
    if (roundType === 'coding') {
      return (
        <div className="space-y-4">
          {/* Section Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold text-navy-900">
                {config.title}
              </h3>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={shuffleQuestions[roundType]}
                  onChange={(e) => setShuffleQuestions(prev => ({ ...prev, [roundType]: e.target.checked }))}
                  className="mr-2 w-3 h-3"
                />
                <label className="text-xs font-medium text-navy-700">
                  Shuffle Questions
                </label>
              </div>
              <div className="text-blue-600">
                <span className="font-medium">Duration: </span>
                {formatDuration(duration)} mins
              </div>
              <div className="text-blue-600">
                <span className="font-medium">Questions: </span>
                {String(questionCount).padStart(2, '0')}
              </div>
            </div>
          </div>

          {/* Questions List or Empty State */}
          {roundQuestions.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg py-3 px-4 text-center">
              <p className="text-sm text-gray-500">
                No coding questions added yet.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {roundQuestions.map((question, index) => (
                <div key={question.id || question.text} className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 text-xs text-gray-700">
                    {question.text || `${question.language} - ${question.difficulty} - ${question.duration} mins`}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteQuestion(roundType, question.id || question.text)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded flex-shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add Coding Question Section */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-navy-700 mb-1">
                  Question Source
                </label>
                <select
                  value={codingQuestionSource}
                  onChange={(e) => setCodingQuestionSource(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition"
                >
                  <option value="Coding Library">Coding Library</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>
              <div className="flex-1 relative">
                <label className="block text-xs font-medium text-navy-700 mb-1">
                  Programming Language <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div
                    data-language-dropdown
                    onClick={() => {
                      setShowLanguageDropdown(!showLanguageDropdown);
                      setLanguageSearchTerm(codingLanguage || "");
                    }}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition cursor-pointer bg-white flex items-center justify-between"
                  >
                    <span className={codingLanguage ? "text-gray-900" : "text-gray-400"}>
                      {codingLanguage || "Select programming language"}
                    </span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {showLanguageDropdown && (
                    <div ref={languageDropdownRef} className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                      <input
                        ref={languageInputRef}
                        type="text"
                        value={languageSearchTerm}
                        onChange={(e) => {
                          setLanguageSearchTerm(e.target.value);
                        }}
                        onFocus={() => {
                          // Scroll to ensure dropdown is visible when it opens
                          setTimeout(() => {
                            if (languageDropdownRef.current) {
                              languageDropdownRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
                            }
                          }, 150);
                        }}
                        placeholder="Search..."
                        className="w-full px-2 py-1.5 text-xs border-b border-gray-300 rounded-t-lg focus:outline-none focus:border-gray-400"
                        autoFocus
                      />
                      <div className="max-h-[130px] overflow-y-auto" style={{ maxHeight: '130px' }}>
                        {programmingLanguages
                          .filter(lang => lang.toLowerCase().includes(languageSearchTerm.toLowerCase()))
                          .map((lang, index) => (
                            <div
                              key={index}
                              onClick={() => {
                                setCodingLanguage(lang);
                                setLanguageSearchTerm("");
                                setShowLanguageDropdown(false);
                              }}
                              className="px-2 py-1.5 text-xs hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              {lang}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-navy-700 mb-1">
                  Difficulty Level
                </label>
                <select
                  value={codingDifficulty}
                  onChange={(e) => setCodingDifficulty(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-navy-700 mb-1">
                  Code Duration
                </label>
                <select
                  value={codingDuration}
                  onChange={(e) => setCodingDuration(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition"
                >
                  <option value="15">15 mins</option>
                  <option value="30">30 mins</option>
                  <option value="45">45 mins</option>
                  <option value="60">60 mins</option>
                  <option value="90">90 mins</option>
                  <option value="120">120 mins</option>
                </select>
              </div>
              <div className="flex-shrink-0 pt-5">
                <button
                  type="button"
                  onClick={() => {
                    if (codingLanguage) {
                      const newQuestion = {
                        text: "",
                        language: codingLanguage,
                        difficulty: codingDifficulty,
                        duration: codingDuration,
                        source: codingQuestionSource
                      };
                      setQuestions(prev => ({
                        ...prev,
                        coding: [...(prev.coding || []), newQuestion]
                      }));
                      setCodingLanguage("");
                      setCodingDifficulty("Easy");
                      setCodingDuration("15");
                      setCodingQuestionSource("Coding Library");
                    }
                  }}
                  className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Special handling for Position Specific section
    if (roundType === 'position') {
      return (
        <div className="space-y-4">
          {/* Section Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold text-navy-900">
                {config.title}
              </h3>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={shuffleQuestions[roundType]}
                  onChange={(e) => setShuffleQuestions(prev => ({ ...prev, [roundType]: e.target.checked }))}
                  className="mr-2 w-3 h-3"
                />
                <label className="text-xs font-medium text-navy-700">
                  Shuffle Questions
                </label>
              </div>
              <div className="text-blue-600">
                <span className="font-medium">Duration: </span>
                {formatDuration(duration)} mins
              </div>
              <div className="text-blue-600">
                <span className="font-medium">Questions: </span>
                {String(questionCount).padStart(2, '0')}
              </div>
            </div>
          </div>

          {/* Questions List or Empty State */}
          {roundQuestions.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg py-3 px-4 text-center">
              <p className="text-sm text-gray-500">
                No position specific questions added yet.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {roundQuestions.map((question, index) => (
                <div key={question.id || index} className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-start gap-3">
                  {/* Question Number */}
                  <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                    {index + 1}
                  </div>

                  {/* Question Text */}
                  <textarea
                    value={question.text}
                    onChange={(e) => handleQuestionChange(roundType, question.id || question.text, 'text', e.target.value)}
                    className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition bg-white resize-none overflow-hidden min-h-[32px] auto-expand"
                    placeholder="Enter question..."
                    rows={1}
                  />

                  {/* Time to Prepare */}
                  <div className="flex-shrink-0 mt-0.5">
                    <select
                      value={question.prepareTime}
                      onChange={(e) => handleQuestionChange(roundType, question.id || question.text, 'prepareTime', e.target.value)}
                      className="px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition bg-white"
                    >
                      <option value="5">5 secs</option>
                      <option value="10">10 secs</option>
                      <option value="15">15 secs</option>
                      <option value="30">30 secs</option>
                      <option value="60">1 min</option>
                      <option value="120">2 mins</option>
                    </select>
                  </div>

                  {/* Time to Answer */}
                  <div className="flex-shrink-0 mt-0.5">
                    <select
                      value={question.answerTime}
                      onChange={(e) => handleQuestionChange(roundType, question.id || question.text, 'answerTime', e.target.value)}
                      className="px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition bg-white"
                    >
                      <option value="1">1 min</option>
                      <option value="2">2 mins</option>
                      <option value="3">3 mins</option>
                      <option value="5">5 mins</option>
                      <option value="10">10 mins</option>
                      <option value="15">15 mins</option>
                    </select>
                  </div>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteQuestion(roundType, question.id || question.text)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded flex-shrink-0 mt-0.5"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Custom Question Section */}
          <div className="border-t border-gray-200 pt-4">
            <div className="space-y-3">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-navy-700 mb-1">
                    Custom Question
                  </label>
                  <textarea
                    value={newQuestionText}
                    onChange={(e) => setNewQuestionText(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddQuestion(roundType);
                      }
                    }}
                    placeholder="Enter custom question"
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition bg-white resize-none overflow-hidden min-h-[32px] auto-expand"
                    rows={1}
                  />
                </div>
                <div className="flex-shrink-0">
                  <label className="block text-xs font-medium text-navy-700 mb-1">
                    Time to Prepare
                  </label>
                  <select
                    value={newQuestionPrepareTime}
                    onChange={(e) => setNewQuestionPrepareTime(e.target.value)}
                    className="px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition"
                  >
                    <option value="5">5 secs</option>
                    <option value="10">10 secs</option>
                    <option value="15">15 secs</option>
                    <option value="30">30 secs</option>
                    <option value="60">1 min</option>
                    <option value="120">2 mins</option>
                  </select>
                </div>
                <div className="flex-shrink-0">
                  <label className="block text-xs font-medium text-navy-700 mb-1">
                    Time to Answer
                  </label>
                  <select
                    value={newQuestionAnswerTime}
                    onChange={(e) => setNewQuestionAnswerTime(e.target.value)}
                    className="px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition"
                  >
                    <option value="1">1 min</option>
                    <option value="2">2 mins</option>
                    <option value="3">3 mins</option>
                    <option value="5">5 mins</option>
                    <option value="10">10 mins</option>
                    <option value="15">15 mins</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleGenerateAIQuestions(roundType)}
                  disabled={generatingAI}
                  className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatingAI ? (
                    <>
                      <Loader2 size={14} className="text-blue-600 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap size={14} className="text-blue-600" />
                      Generate AI Questions
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCompanyInput(!showCompanyInput)}
                  className={`px-3 py-1.5 text-xs border rounded-lg transition flex items-center gap-2 ${showCompanyInput ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-300 hover:bg-gray-50 text-gray-700'}`}
                >
                  <BookOpen size={14} className="text-blue-600" />
                  Question Library
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuestion(roundType)}
                  className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  Add
                </button>
              </div>

              {/* Company Search Input */}
              {showCompanyInput && (
                <div className="flex items-center gap-2 bg-blue-50/50 p-2 rounded-lg border border-blue-100 mt-3 animate-in fade-in slide-in-from-top-1">
                  <input
                    type="text"
                    value={libraryCompanyName}
                    onChange={(e) => setLibraryCompanyName(e.target.value)}
                    placeholder="Enter Company Name (e.g., Sony, Google)"
                    className="flex-1 px-2 py-1.5 text-xs border border-blue-200 rounded focus:outline-none focus:border-blue-400 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleGenerateLibraryQuestions(roundType)}
                    disabled={generatingLibrary || !libraryCompanyName.trim()}
                    className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {generatingLibrary ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                    Deep Search
                  </button>
                </div>
              )}

              {/* Library Preview Area */}
              {libraryPreviewQuestions.length > 0 && (
                <div
                  ref={libraryPreviewRef}
                  className="mt-4 space-y-3 bg-blue-50/30 p-4 rounded-xl border border-blue-100/50 max-h-[400px] overflow-y-auto animate-in fade-in zoom-in-95 duration-300 scroll-smooth"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-blue-800 flex items-center gap-2">
                      <Zap size={14} className="text-blue-600 fill-blue-600" />
                      SUGGESTIONS FROM {libraryCompanyName.toUpperCase()}
                    </h4>
                    <button
                      onClick={() => setLibraryPreviewQuestions([])}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="grid gap-2">
                    {libraryPreviewQuestions.map((q) => (
                      <div
                        key={q.id}
                        className="group bg-white/80 backdrop-blur-sm border border-blue-100 rounded-lg p-3 flex items-center gap-3 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex-1 text-xs text-gray-700 leading-relaxed font-medium">
                          {q.text}
                        </div>
                        <button
                          onClick={() => addQuestionFromLibrary(roundType, q.text)}
                          className="w-8 h-8 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-sm hover:shadow transition-all duration-200 active:scale-90 flex-shrink-0"
                          title="Add to question list"
                        >
                          <Plus size={16} strokeWidth={3} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div >
      );
    }

    // Special handling for Aptitude section
    if (roundType === 'aptitude') {
      return (
        <div className="space-y-4">
          {/* Section Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold text-navy-900">
                {config.title}
              </h3>
              <p className="text-xs text-gray-600 mt-0.5">
                Evaluate logical, numerical, and reasoning capabilities
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={shuffleQuestions[roundType]}
                  onChange={(e) => setShuffleQuestions(prev => ({ ...prev, [roundType]: e.target.checked }))}
                  className="mr-2 w-3 h-3"
                />
                <label className="text-xs font-medium text-navy-700">
                  Shuffle Questions
                </label>
              </div>
              <div className="text-blue-600">
                <span className="font-medium">Duration: </span>
                {formatDuration(duration)} mins
              </div>
              <div className="text-blue-600">
                <span className="font-medium">Questions: </span>
                {String(questionCount).padStart(2, '0')}
              </div>
            </div>
          </div>

          {/* Questions List or Empty State */}
          {roundQuestions.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg py-3 px-4 text-center">
              <p className="text-sm text-gray-500">
                No aptitude questions added yet.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {roundQuestions.map((question, index) => (
                <div key={question.id || question.text} className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 text-xs text-gray-700">
                    {question.text || `Aptitude - ${question.source} - ${question.questionsCount} questions`}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteQuestion(roundType, question.id || question.text)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded flex-shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add Aptitude Question Section */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-navy-700 mb-1">
                  MCQ Type
                </label>
                <select
                  value={aptitudeMcqType}
                  onChange={(e) => setAptitudeMcqType(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition"
                >
                  <option value="">Select Topics</option>
                  {aptitudeTopics.map((topic, index) => (
                    <option key={index} value={topic}>
                      {topic}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-navy-700 mb-1">
                  Difficulty Level
                </label>
                <select
                  value={aptitudeDifficulty}
                  onChange={(e) => setAptitudeDifficulty(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-navy-700 mb-1">
                  No. of Questions
                </label>
                <select
                  value={aptitudeNoOfQuestions}
                  onChange={(e) => setAptitudeNoOfQuestions(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition"
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="15">15</option>
                  <option value="20">20</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-navy-700 mb-1">
                  Time to Answer/Question
                </label>
                <select
                  value={aptitudeTimePerQuestion}
                  onChange={(e) => setAptitudeTimePerQuestion(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition"
                >
                  <option value="1">1 min/Q</option>
                  <option value="2">2 min/Q</option>
                  <option value="3">3 min/Q</option>
                  <option value="5">5 min/Q</option>
                  <option value="10">10 min/Q</option>
                </select>
              </div>
              <div className="flex-shrink-0 pt-5">
                <button
                  type="button"
                  onClick={() => {
                    if (aptitudeMcqType) {
                      const newQuestion = {
                        text: "",
                        source: aptitudeMcqType, // Store as 'source' for API compatibility
                        mcqType: aptitudeMcqType,
                        difficulty: aptitudeDifficulty,
                        noOfQuestions: aptitudeNoOfQuestions,
                        questionsCount: aptitudeNoOfQuestions, // Also store as 'questionsCount' for calculation
                        timePerQuestion: aptitudeTimePerQuestion,
                        answerTime: aptitudeTimePerQuestion // Also store as 'answerTime' for calculation
                      };
                      setQuestions(prev => ({
                        ...prev,
                        aptitude: [...(prev.aptitude || []), newQuestion]
                      }));
                      setAptitudeMcqType("");
                      setAptitudeDifficulty("Easy");
                      setAptitudeNoOfQuestions("5");
                      setAptitudeTimePerQuestion("1");
                    }
                  }}
                  className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Default rendering for other rounds (General)
    return (
      <div className="space-y-4">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-navy-900">
              {config.title}
            </h3>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={shuffleQuestions[roundType]}
                onChange={(e) => setShuffleQuestions(prev => ({ ...prev, [roundType]: e.target.checked }))}
                className="mr-2 w-3 h-3"
              />
              <label className="text-xs font-medium text-navy-700">
                Shuffle Questions
              </label>
            </div>
            <div className="text-blue-600">
              <span className="font-medium">Duration: </span>
              {formatDuration(duration)}
            </div>
            <div className="text-blue-600">
              <span className="font-medium">Questions: </span>
              {String(questionCount).padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-2">
          {roundQuestions.map((question, index) => (
            <div key={question.id || index} className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-start gap-3">
              {/* Question Number */}
              <div className={`w-6 h-6 rounded-full text-white flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5 ${config.color === 'blue' ? 'bg-blue-500' :
                config.color === 'green' ? 'bg-green-500' :
                  config.color === 'purple' ? 'bg-purple-500' : 'bg-yellow-500'
                } `}>
                {index + 1}
              </div>

              {/* Question Text - Using Textarea for multi-line support */}
              <textarea
                value={question.text}
                onChange={(e) => handleQuestionChange(roundType, question.id || question.text, 'text', e.target.value)}
                className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition bg-white resize-none overflow-hidden min-h-[32px] auto-expand"
                placeholder="Enter question..."
                rows={1}
              />

              {/* Time to Prepare */}
              <div className="flex-shrink-0 mt-0.5">
                <select
                  value={question.prepareTime}
                  onChange={(e) => handleQuestionChange(roundType, question.id || question.text, 'prepareTime', e.target.value)}
                  className="px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition bg-white"
                >
                  <option value="5">5 secs</option>
                  <option value="10">10 secs</option>
                  <option value="15">15 secs</option>
                  <option value="30">30 secs</option>
                  <option value="60">1 min</option>
                  <option value="120">2 mins</option>
                </select>
              </div>

              {/* Time to Answer */}
              <div className="flex-shrink-0 mt-0.5">
                <select
                  value={question.answerTime}
                  onChange={(e) => handleQuestionChange(roundType, question.id || question.text, 'answerTime', e.target.value)}
                  className="px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition bg-white"
                >
                  <option value="1">1 min</option>
                  <option value="2">2 mins</option>
                  <option value="3">3 mins</option>
                  <option value="5">5 mins</option>
                  <option value="10">10 mins</option>
                  <option value="15">15 mins</option>
                </select>
              </div>

              {/* Delete Button */}
              <button
                type="button"
                onClick={() => handleDeleteQuestion(roundType, question.id || question.text)}
                className="p-1 text-red-600 hover:bg-red-50 rounded flex-shrink-0 mt-0.5"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Add Question Input */}
        <div className="flex items-start gap-2">
          <textarea
            value={newQuestionText}
            onChange={(e) => setNewQuestionText(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAddQuestion(roundType);
              }
            }}
            placeholder="Add a new question..."
            className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition resize-none overflow-hidden min-h-[32px] auto-expand"
            rows={1}
          />
          <button
            type="button"
            onClick={() => handleAddQuestion(roundType)}
            className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-1 mt-0.5"
          >
            <Plus size={14} />
            Add Question
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-full bg-white">
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
            <h1 className="text-lg font-bold text-navy-900">{isEditMode ? "View/Edit Question Set" : "Create Question Set"}</h1>
            <p className="text-xs text-gray-600 mt-0.5">{isEditMode ? "View and edit interview questions for a position" : "Set up interview questions for a position"}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {loadingQuestionSet ? (
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="text-sm text-gray-600">Loading question set...</div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            {renderAllRounds()}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 px-6 py-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading || !isValidQuestionSet()}
              className="flex-1 py-2 px-4 text-xs bg-gradient-to-r from-blue-600 to-qwikBlue hover:from-blue-700 hover:to-qwikBlueDark text-white font-semibold rounded-lg transition duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Save size={16} />
              {loading ? (isEditMode ? "Updating..." : "Creating...") : (isEditMode ? "Update Question Set" : "Create Question Set")}
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

export default CreateQuestionSet;

