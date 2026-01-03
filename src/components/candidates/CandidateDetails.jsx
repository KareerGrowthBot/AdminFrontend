import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Mail,
    Phone,
    MapPin,
    Calendar,
    Briefcase,
    User,
    Award,
    FileText,
    Activity,
    Shield,
    Download,
    Clock,
    CheckCircle,
    Hash,
    Video,
    GraduationCap,
    Sparkles, // For AI button
    Upload,
    ChevronDown,
    ChevronUp,
    Edit
} from 'lucide-react';
import pdfToText from 'react-pdftotext';
import { candidateService } from '../../services/candidateService';
import { aiService } from '../../services/aiService';
// import { adminService } from '../../services/adminService'; // If needed for logs

const CandidateDetails = ({ adminInfo }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('details'); // 'details', 'resume', 'activity'
    const [candidate, setCandidate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [extracting, setExtracting] = useState(false);
    const [extractedData, setExtractedData] = useState(null);
    const [resumeHistory, setResumeHistory] = useState([]);
    const [selectedResumeId, setSelectedResumeId] = useState(null);
    const [fetchingHistory, setFetchingHistory] = useState(false);
    const [expandedResumeIds, setExpandedResumeIds] = useState(new Set());

    const fetchResumeHistory = async () => {
        try {
            setFetchingHistory(true);
            const data = await candidateService.getResumeHistory(id);
            setResumeHistory(data);

            // Pre-select current resume or the latest one
            const current = data.find(r => r.isCurrent) || data[0];
            if (current) {
                setSelectedResumeId(current.id);
                setExtractedData(current);
            }
        } catch (err) {
            console.error("Error fetching resume history:", err);
        } finally {
            setFetchingHistory(false);
        }
    };

    useEffect(() => {
        const fetchCandidate = async () => {
            try {
                setLoading(true);
                // Use the new getCandidateById API
                const data = await candidateService.getCandidateById(id);
                setCandidate(data);
            } catch (err) {
                console.error("Error fetching candidate:", err);
                setError('Failed to load candidate details');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchCandidate();
            fetchResumeHistory();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
            </div>
        );
    }

    if (error || !candidate) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
                <p className="text-red-500 font-medium">{error || 'Candidate not found'}</p>
                <button
                    onClick={() => navigate('/dashboard/candidates')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                    Back to Candidates
                </button>
            </div>
        );
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'RECOMMENDED': return 'bg-emerald-100 text-emerald-700';
            case 'NOT_RECOMMENDED': return 'bg-red-100 text-red-700';
            case 'INVITED': return 'bg-blue-100 text-blue-700';
            case 'TEST_COMPLETED': return 'bg-purple-100 text-purple-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getResumeUrl = () => {
        const path = candidate.resumePath || candidate.resumeFilename;
        if (!path) return null;
        return path.startsWith('http') ? path : `/api/resumes/${path}`;
    };

    const resumeUrl = getResumeUrl();
    const resumeFilename = candidate.resumePath ? candidate.resumePath.split('/').pop() : 'Resume';

    const handleExtractWithAI = async () => {
        if (!resumeUrl) return;

        try {
            setExtracting(true);
            setError(null);

            // 1. Get PDF Blob
            const response = await fetch(resumeUrl);
            const blob = await response.blob();

            // 2. Extract Text
            const text = await pdfToText(blob);

            // 3. Call AI Service (Python)
            const data = await aiService.extractResume(text);

            // 4. Enrich with metadata
            const resumeData = {
                ...data,
                filename: resumeFilename,
                path: candidate.resumePath || candidate.resumeFilename,
                source: 'Platform', // Default source
                isCurrent: true,
                uploadDate: new Date().toISOString()
            };

            // 5. Save to Java Backend
            const saved = await candidateService.saveResumeData(id, resumeData);

            setResumeHistory(prev => [saved, ...prev.filter(r => r.id !== saved.id)]);
            setSelectedResumeId(saved.id);
            setExtractedData(saved);
            alert("Resume extracted and saved to history!");

        } catch (err) {
            console.error("Extraction error:", err);
            setError("Failed to extract resume data.");
        } finally {
            setExtracting(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            setExtracting(true);
            const newResume = await candidateService.uploadResume(id, file);

            setResumeHistory(prev => [newResume, ...prev.filter(r => r.id !== newResume.id)]);
            setSelectedResumeId(newResume.id);
            setExtractedData(newResume);
            alert("Resume uploaded successfully!");

            // Optionally trigger AI extraction automatically for the new upload
            // await handleExtractWithAI(); 
            // But for now, let's keep it manual as requested by the AI flow.
        } catch (err) {
            console.error("Upload error:", err);
            setError("Failed to upload resume.");
        } finally {
            setExtracting(false);
        }
    };

    return (
        <div className="w-full animate-in fade-in duration-700">
            {/* Unified Container Box */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[600px]">

                {/* Unified Header with Horizontal Tabs */}
                <div className="px-6 border-b border-gray-100 bg-gray-50/30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-8 py-4">
                            <button
                                onClick={() => setActiveTab('details')}
                                className={`text-[11px] font-bold tracking-widest uppercase transition-colors relative ${activeTab === 'details'
                                    ? 'text-gray-900 font-black'
                                    : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                Profile
                                {activeTab === 'details' && <div className="absolute -bottom-[17px] left-0 right-0 h-[2px] bg-blue-600"></div>}
                            </button>
                            <button
                                onClick={() => {
                                    setActiveTab('resume');
                                    fetchResumeHistory();
                                }}
                                className={`text-[11px] font-bold tracking-widest uppercase transition-colors relative ${activeTab === 'resume'
                                    ? 'text-gray-900 font-black'
                                    : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                Resume
                                {activeTab === 'resume' && <div className="absolute -bottom-[17px] left-0 right-0 h-[2px] bg-blue-600"></div>}
                            </button>
                            <button
                                onClick={() => setActiveTab('activity')}
                                className={`text-[11px] font-bold tracking-widest uppercase transition-colors relative ${activeTab === 'activity'
                                    ? 'text-gray-900 font-black'
                                    : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                Activity
                                {activeTab === 'activity' && <div className="absolute -bottom-[17px] left-0 right-0 h-[2px] bg-blue-600"></div>}
                            </button>
                        </div>
                        <div className="flex items-center gap-4">
                            {/* Edit Profile Button */}
                            <button
                                onClick={() => navigate("/dashboard/candidates/add", {
                                    state: { candidateId: id, candidate: candidate, candidateFound: true, email: candidate.email }
                                })}
                                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-200 rounded-lg transition-all"
                            >
                                <Edit className="w-3.5 h-3.5" />
                                Edit Profile
                            </button>

                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${candidate.registrationPaid || candidate.registration_paid
                                ? 'bg-green-50 border-green-100'
                                : 'bg-gray-50 border-gray-100'
                                }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${candidate.registrationPaid || candidate.registration_paid ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                <span className={`text-[10px] font-bold uppercase ${candidate.registrationPaid || candidate.registration_paid ? 'text-green-700' : 'text-gray-500'}`}>
                                    {candidate.registrationPaid || candidate.registration_paid ? 'Paid' : 'Unpaid'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-[10px] font-bold text-emerald-700 uppercase">{candidate.status || 'Active'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="p-6">
                    {/* Tab Content */}
                    <div className="grid grid-cols-1 gap-6">

                        {/* Profile Tab */}
                        {activeTab === 'details' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Left Side - User Profile Box */}
                                <div className="lg:col-span-1">
                                    <div className="bg-white border border-gray-200 rounded-lg p-6 h-full">
                                        <div className="flex flex-col items-center text-center">
                                            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white mb-4 text-3xl font-bold shadow-lg">
                                                {(candidate.fullName || candidate.name || 'C').charAt(0).toUpperCase()}
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-1">{candidate.fullName || candidate.name}</h3>
                                            <p className="text-sm text-gray-500 font-medium mb-2">{candidate.degree && candidate.stream ? `${candidate.degree} - ${candidate.stream}` : 'Candidate'}</p>

                                            {/* Status Badges */}
                                            <div className="flex flex-wrap gap-2 justify-center mt-4">
                                                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${candidate.registrationPaid || candidate.registration_paid
                                                    ? 'bg-green-50 border-green-100'
                                                    : 'bg-gray-50 border-gray-100'
                                                    }`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${candidate.registrationPaid || candidate.registration_paid ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                                    <span className={`text-[10px] font-bold uppercase ${candidate.registrationPaid || candidate.registration_paid ? 'text-green-700' : 'text-gray-500'}`}>
                                                        {candidate.registrationPaid || candidate.registration_paid ? 'Paid' : 'Unpaid'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                                    <span className="text-[10px] font-bold text-emerald-700 uppercase">{candidate.status || 'Active'}</span>
                                                </div>
                                            </div>

                                            {/* Last Login */}
                                            <div className="w-full mt-6 pt-6 border-t border-gray-100">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-gray-500 font-medium">Last Login</span>
                                                    <span className="text-xs text-gray-900 font-semibold">
                                                        {candidate.lastLogin || 'Not logged in'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side - Two Stacked Info Boxes */}
                                <div className="lg:col-span-2 space-y-6">
                                    {/* Personal Information Box */}
                                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                        {/* Header */}
                                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                                            <User className="w-4 h-4 text-gray-600" />
                                            <h3 className="text-sm font-bold text-gray-900">Personal Information</h3>
                                        </div>

                                        {/* Content Grid */}
                                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Email */}
                                            <div className="flex items-start gap-3">
                                                <Mail className="w-4 h-4 text-gray-400 mt-0.5" />
                                                <div className="flex-1">
                                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
                                                    <p className="text-sm font-medium text-gray-900">{candidate.email || 'N/A'}</p>
                                                </div>
                                            </div>

                                            {/* Phone */}
                                            <div className="flex items-start gap-3">
                                                <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                                                <div className="flex-1">
                                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Phone</label>
                                                    <p className="text-sm font-medium text-gray-900">{candidate.mobileNumber || 'N/A'}</p>
                                                </div>
                                            </div>

                                            {/* Location */}
                                            <div className="flex items-start gap-3">
                                                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                                                <div className="flex-1">
                                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Location</label>
                                                    <p className="text-sm font-medium text-gray-900">{candidate.address || 'N/A'}</p>
                                                </div>
                                            </div>

                                            {/* Registration Number */}
                                            <div className="flex items-start gap-3">
                                                <Hash className="w-4 h-4 text-gray-400 mt-0.5" />
                                                <div className="flex-1">
                                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Registration No</label>
                                                    <p className="text-sm font-medium text-gray-900">{candidate.regNo || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Academic Information Box */}
                                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                        {/* Header */}
                                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                                            <GraduationCap className="w-4 h-4 text-gray-600" />
                                            <h3 className="text-sm font-bold text-gray-900">Academic Information</h3>
                                        </div>

                                        {/* Content Grid */}
                                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* College */}
                                            <div className="flex items-start gap-3">
                                                <Briefcase className="w-4 h-4 text-gray-400 mt-0.5" />
                                                <div className="flex-1">
                                                    <label className="block text-xs font-semibold text-gray-500 mb-1">College / Institution</label>
                                                    <p className="text-sm font-medium text-gray-900">{candidate.college || candidate.collegeName || 'N/A'}</p>
                                                </div>
                                            </div>

                                            {/* Degree & Stream */}
                                            <div className="flex items-start gap-3">
                                                <Award className="w-4 h-4 text-gray-400 mt-0.5" />
                                                <div className="flex-1">
                                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Degree & Stream</label>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {candidate.degree && candidate.stream ? `${candidate.degree} - ${candidate.stream}` : (candidate.degree || 'N/A')}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Academic Timeline */}
                                            <div className="flex items-start gap-3">
                                                <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                                                <div className="flex-1">
                                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Academic Timeline</label>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {candidate.academicYearStart && candidate.academicYearEnd ? `${candidate.academicYearStart} - ${candidate.academicYearEnd}` : 'N/A'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Current Semester */}
                                            <div className="flex items-start gap-3">
                                                <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                                                <div className="flex-1">
                                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Current Semester</label>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {candidate.currentSemester || candidate.semester ? `Semester ${candidate.currentSemester || candidate.semester}` : 'N/A'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Registration Status */}
                                            <div className="flex items-start gap-3">
                                                <CheckCircle className="w-4 h-4 text-gray-400 mt-0.5" />
                                                <div className="flex-1">
                                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Registration Status</label>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-sm font-bold ${candidate.registrationPaid || candidate.registration_paid ? 'text-green-600' : 'text-red-500'}`}>
                                                            {candidate.registrationPaid || candidate.registration_paid ? 'PAID' : 'UNPAID'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Status */}
                                            <div className="flex items-start gap-3">
                                                <Activity className="w-4 h-4 text-gray-400 mt-0.5" />
                                                <div className="flex-1">
                                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                                        <span className="text-sm font-semibold text-emerald-600">{candidate.status || 'Active'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Resume Tab */}
                        {activeTab === 'resume' && (
                            <div>
                                {fetchingHistory ? (
                                    <div className="flex justify-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : (
                                    <div>
                                        {/* Resume List Section */}
                                        <div>
                                            <div>
                                                {resumeHistory.length > 0 ? (
                                                    resumeHistory.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate)).map((resume) => {
                                                        const isExpanded = expandedResumeIds.has(resume.id);
                                                        const hasExtractedData = resume.professionalSummary || resume.skills;

                                                        return (
                                                            <div key={resume.id} className="border-b border-gray-200">
                                                                {/* Resume Header - Clickable */}
                                                                <div
                                                                    onClick={() => {
                                                                        if (hasExtractedData) {
                                                                            setExpandedResumeIds(prev => {
                                                                                const newSet = new Set(prev);
                                                                                if (newSet.has(resume.id)) {
                                                                                    newSet.delete(resume.id);
                                                                                } else {
                                                                                    newSet.add(resume.id);
                                                                                }
                                                                                return newSet;
                                                                            });
                                                                        }
                                                                    }}
                                                                    className={`p-3 transition-all cursor-pointer flex items-center justify-between ${isExpanded ? 'bg-blue-50/50' : 'hover:bg-gray-50/50'
                                                                        }`}
                                                                >
                                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                        <div className={`p-1.5 rounded ${isExpanded ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                                                            <FileText className="w-4 h-4" />
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center gap-2">
                                                                                <h4 className="text-[11px] font-semibold text-gray-900 truncate">{resume.filename || 'Resume Document'}</h4>
                                                                                {resume.isCurrent && (
                                                                                    <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[8px] font-bold uppercase rounded">Current</span>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex items-center gap-2 text-[9px] text-gray-400 mt-0.5">
                                                                                <span>{resume.uploadDate ? new Date(resume.uploadDate).toLocaleDateString() : 'N/A'}</span>
                                                                                <span>•</span>
                                                                                <span>{resume.source || 'Direct'}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        {!hasExtractedData && (
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setSelectedResumeId(resume.id);
                                                                                    setExtractedData(resume);
                                                                                    handleExtractWithAI();
                                                                                }}
                                                                                disabled={extracting}
                                                                                className={`px-2 py-1 rounded text-[9px] font-bold transition flex items-center gap-1 ${extracting ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
                                                                                title="Extract with AI"
                                                                            >
                                                                                {extracting ? (
                                                                                    <div className="w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                                                                ) : (
                                                                                    <Sparkles className="w-2.5 h-2.5" />
                                                                                )}
                                                                                Extract
                                                                            </button>
                                                                        )}
                                                                        <a
                                                                            href={resume.path.startsWith('http') ? resume.path : `/api/resumes/${resume.path}`}
                                                                            download={resume.filename}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            className="p-1.5 text-gray-400 hover:text-blue-600 rounded transition-all"
                                                                            title="Download"
                                                                        >
                                                                            <Download className="w-3.5 h-3.5" />
                                                                        </a>
                                                                        {hasExtractedData && (
                                                                            isExpanded ? (
                                                                                <ChevronUp className="w-4 h-4 text-gray-400" />
                                                                            ) : (
                                                                                <ChevronDown className="w-4 h-4 text-gray-400" />
                                                                            )
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Expanded Content - AI Extracted Data */}
                                                                {isExpanded && hasExtractedData && (
                                                                    <div className="p-4 space-y-3 bg-gray-50 border-t border-gray-200">
                                                                        {/* Professional Summary */}
                                                                        {resume.professionalSummary && (
                                                                            <div className="bg-white border border-gray-200 p-3">
                                                                                <h5 className="text-[11px] font-bold text-gray-700 mb-2 uppercase">Objective</h5>
                                                                                <p className="text-[12px] text-gray-600 leading-relaxed">
                                                                                    {resume.professionalSummary}
                                                                                </p>
                                                                            </div>
                                                                        )}

                                                                        {/* Skills */}
                                                                        {resume.skills && resume.skills.length > 0 && (
                                                                            <div className="bg-white border border-gray-200 p-3">
                                                                                <h5 className="text-[11px] font-bold text-gray-700 mb-2 uppercase">Skills</h5>
                                                                                <div className="flex flex-wrap gap-1.5">
                                                                                    {resume.skills.map((skill, idx) => (
                                                                                        <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-bold">
                                                                                            {skill}
                                                                                        </span>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {/* Experience */}
                                                                        {resume.experience && resume.experience.length > 0 && (
                                                                            <div className="bg-white border border-gray-200 p-3">
                                                                                <h5 className="text-[11px] font-bold text-gray-700 mb-2 uppercase">Experience</h5>
                                                                                <div className="space-y-3">
                                                                                    {resume.experience.map((exp, idx) => (
                                                                                        <div key={idx}>
                                                                                            <h6 className="text-[11px] font-semibold text-gray-900">{exp.job_title || exp.position}</h6>
                                                                                            <p className="text-[10px] text-gray-500">
                                                                                                {exp.company} • {exp.start_date} - {exp.end_date || 'Present'}
                                                                                            </p>
                                                                                            {exp.description && (
                                                                                                <p className="mt-1 text-[11px] text-gray-600">{exp.description}</p>
                                                                                            )}
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {/* Projects */}
                                                                        {resume.project && resume.project.length > 0 && (
                                                                            <div className="bg-white border border-gray-200 p-3">
                                                                                <h5 className="text-[11px] font-bold text-gray-700 mb-2 uppercase">Projects</h5>
                                                                                <div className="space-y-3">
                                                                                    {resume.project.map((proj, idx) => (
                                                                                        <div key={idx}>
                                                                                            <h6 className="text-[11px] font-semibold text-gray-900">{proj.title || proj.name || proj.project_title}</h6>
                                                                                            {proj.type && <p className="text-[9px] text-gray-500">{proj.type}</p>}
                                                                                            <p className="text-[11px] text-gray-600 mt-0.5">{proj.description}</p>
                                                                                            {proj.technologies && (
                                                                                                <div className="flex flex-wrap gap-1 mt-1">
                                                                                                    {proj.technologies.map((tech, i) => (
                                                                                                        <span key={i} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[9px]">
                                                                                                            {tech}
                                                                                                        </span>
                                                                                                    ))}
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {/* Education */}
                                                                        {resume.education && resume.education.length > 0 && (
                                                                            <div className="bg-white border border-gray-200 p-3">
                                                                                <h5 className="text-[11px] font-bold text-gray-700 mb-2 uppercase">Education</h5>
                                                                                <div className="space-y-2">
                                                                                    {resume.education.map((edu, idx) => (
                                                                                        <div key={idx} className="p-2 bg-gray-50 border border-gray-200">
                                                                                            <h6 className="text-[11px] font-semibold text-gray-900">{edu.degree}</h6>
                                                                                            <p className="text-[10px] text-blue-600">{edu.institution}</p>
                                                                                            {edu.field && <p className="text-[9px] text-gray-500">{edu.field}</p>}
                                                                                            <div className="flex justify-between text-[9px] text-gray-500 mt-1">
                                                                                                <span>{edu.passing_year || edu.graduation_date}</span>
                                                                                                <span className="font-semibold">{edu.percentage_cgpa || edu.gpa}</span>
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {/* Certificates */}
                                                                        {resume.certificates && resume.certificates.length > 0 && (
                                                                            <div className="bg-white border border-gray-200 p-3">
                                                                                <h5 className="text-[11px] font-bold text-gray-700 mb-2 uppercase">Certificates</h5>
                                                                                <div className="space-y-2">
                                                                                    {resume.certificates.map((cert, idx) => (
                                                                                        <div key={idx} className="flex justify-between items-start">
                                                                                            <div>
                                                                                                <h6 className="text-[11px] font-semibold text-gray-900">{cert.name}</h6>
                                                                                                <p className="text-[10px] text-gray-500">{cert.issuer}</p>
                                                                                            </div>
                                                                                            <span className="text-[9px] text-gray-400">{cert.date}</span>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {/* Achievements */}
                                                                        {resume.achievements && resume.achievements.length > 0 && (
                                                                            <div className="bg-white border border-gray-200 p-3">
                                                                                <h5 className="text-[11px] font-bold text-gray-700 mb-2 uppercase">Achievements</h5>
                                                                                <ul className="ml-3 text-[11px] text-gray-600 list-disc space-y-1">
                                                                                    {resume.achievements.map((achievement, idx) => (
                                                                                        <li key={idx}>{achievement}</li>
                                                                                    ))}
                                                                                </ul>
                                                                            </div>
                                                                        )}

                                                                        {/* Languages */}
                                                                        {resume.languages && resume.languages.length > 0 && (
                                                                            <div className="bg-white border border-gray-200 p-3">
                                                                                <h5 className="text-[11px] font-bold text-gray-700 mb-2 uppercase">Languages</h5>
                                                                                <div className="flex flex-wrap gap-1.5">
                                                                                    {resume.languages.map((lang, idx) => (
                                                                                        <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-medium">
                                                                                            {typeof lang === 'string' ? lang : lang.name}
                                                                                        </span>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {/* Hobbies */}
                                                                        {resume.hobbies && resume.hobbies.length > 0 && (
                                                                            <div className="bg-white border border-gray-200 p-3">
                                                                                <h5 className="text-[11px] font-bold text-gray-700 mb-2 uppercase">Hobbies & Interests</h5>
                                                                                <div className="flex flex-wrap gap-1.5">
                                                                                    {resume.hobbies.map((hobby, idx) => (
                                                                                        <span key={idx} className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-[10px] font-medium">
                                                                                            {hobby}
                                                                                        </span>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <div className="text-center py-10 border-2 border-dashed border-gray-100">
                                                        <FileText className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                                                        <p className="text-[11px] text-gray-400 font-medium">No resumes found for this candidate.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Activity Tab */}
                        {activeTab === 'activity' && (
                            <div className="animate-in fade-in duration-500">
                                <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                                    <ActivityLogList candidateId={candidate.id} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Sub-component for Activity Logs
const ActivityLogList = ({ candidateId }) => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                const response = await candidateService.getCandidateActivity(candidateId);
                setActivities(response);
            } catch (err) {
                console.error("Failed to fetch activity:", err);
                setActivities([]);
            } finally {
                setLoading(false);
            }
        };

        if (candidateId) {
            fetchActivity();
        }
    }, [candidateId]);

    const getStatusBadge = (status) => {
        if (status === 'COMPLETED') {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" /> Completed
                </span>
            );
        } else {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <Clock className="w-3 h-3 mr-1" /> Pending
                </span>
            );
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading history...</div>;

    if (activities.length === 0) {
        return (
            <div className="p-12 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900">No Assessment History</h3>
                <p className="mt-1 text-sm text-gray-500">This candidate hasn't been assigned any tests yet.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {activities.map((activity, index) => (
                        <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{activity.testName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(activity.assignedDate).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                {getStatusBadge(activity.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {activity.status === 'COMPLETED' ? (
                                    <div className="flex items-center gap-3">
                                        <a href={activity.reportUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 flex items-center gap-1" title="View Report">
                                            <FileText className="w-4 h-4" /> Report
                                        </a>
                                        <a href={activity.recordingUrl} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-800 flex items-center gap-1" title="View Recording">
                                            <Video className="w-4 h-4" /> Recording
                                        </a>
                                    </div>
                                ) : (
                                    <span className="text-gray-400 text-xs italic">No actions yet</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default CandidateDetails;
