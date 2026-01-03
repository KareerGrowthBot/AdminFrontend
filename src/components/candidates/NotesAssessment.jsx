import React, { useState, useEffect } from "react";
import { FileText, Search, User, Download, Plus, ChevronLeft, ChevronRight, X, File, Upload, ArrowRight, Folder, MoreVertical, Settings } from "lucide-react";
import { notesAssessmentService } from "../../services/notesAssessmentService";
import SnackbarAlert from "../common/SnackbarAlert";
import { API_BASE_URL } from "../../constants/api";
import { useSubscription } from "../../providers/SubscriptionProvider";
import SubscriptionExpired from "../common/SubscriptionExpired";

const NotesAssessment = ({ adminInfo }) => {
    const { isSubscriptionActive, loading: subscriptionLoading } = useSubscription();
    const [formData, setFormData] = useState({
        content: "",
        degree: "",
        stream: "",
        semester: "",
        subject: "",
        topic: "",
        file: null,
        fileName: ""
    });

    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Pagination for Assessments
    const [assessPage, setAssessPage] = useState(0);
    const [assessTotalPages, setAssessTotalPages] = useState(0);
    const [assessTotalElements, setAssessTotalElements] = useState(0);

    const [degreeDropdownOpen, setDegreeDropdownOpen] = useState(false);
    const [streamDropdownOpen, setStreamDropdownOpen] = useState(false);
    const [semesterDropdownOpen, setSemesterDropdownOpen] = useState(false);

    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

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

    useEffect(() => {
        fetchAssessments();
    }, [assessPage]);

    const fetchAssessments = async () => {
        setLoading(true);
        try {
            const data = await notesAssessmentService.getAssessments(assessPage, 10);
            setAssessments(data.assessments || data.content || []);
            setAssessTotalPages(data.totalPages || 0);
            setAssessTotalElements(data.totalElements || 0);
        } catch (error) {
            console.error("Error fetching assessments:", error);
            showMessage("Error fetching assessments", "error");
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (message, severity = "success") => {
        const displayMessage = typeof message === 'object'
            ? (message.message || message.error || "An unexpected error occurred")
            : message;
        setSnackbar({ open: true, message: displayMessage, severity });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, file: file, fileName: file.name }));
        }
    };

    const removeFile = () => {
        setFormData(prev => ({ ...prev, file: null, fileName: "" }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await notesAssessmentService.addAssessment(formData);
            showMessage("Class Note Assigned successfully");

            // Allow quick add of another note
            setFormData(prev => ({
                ...prev,
                content: "",
                subject: "",
                topic: "",
                file: null,
                fileName: ""
            }));

            if (assessPage === 0) {
                fetchAssessments();
            } else {
                setAssessPage(0);
            }
        } catch (error) {
            console.error("Error adding assessment:", error);
            const errorMsg = error.response?.data?.message || error.response?.data || error.message || "Error adding assessment";
            showMessage(errorMsg, "error");
        } finally {
            setSubmitting(false);
        }
    };

    if (subscriptionLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                <p className="mt-4 text-slate-500 font-medium">Checking subscription...</p>
            </div>
        );
    }

    if (!isSubscriptionActive) {
        return <SubscriptionExpired />;
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Notes & Assessment</h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">Upload and assign notes to classes</p>
                </div>
            </div>

            {/* Standard Form - Clean & Simple */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-sm font-bold text-navy-900">Add New Note</h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
                        {/* Topic */}
                        <div>
                            <label className="block text-xs font-bold text-navy-700 uppercase tracking-wide mb-1.5">Topic Name</label>
                            <input
                                type="text"
                                name="topic"
                                value={formData.topic}
                                onChange={handleInputChange}
                                placeholder="e.g. Arrays & Hashing"
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-navy-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                required
                            />
                        </div>

                        {/* Subject */}
                        <div>
                            <label className="block text-xs font-bold text-navy-700 uppercase tracking-wide mb-1.5">Subject</label>
                            <input
                                type="text"
                                name="subject"
                                value={formData.subject}
                                onChange={handleInputChange}
                                placeholder="e.g. Data Structures"
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-navy-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                required
                            />
                        </div>

                        {/* File Upload */}
                        <div>
                            <label className="block text-xs font-bold text-navy-700 uppercase tracking-wide mb-1.5">File Attachment</label>
                            <div className="relative">
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <label
                                    htmlFor="file-upload"
                                    className={`flex items-center justify-between w-full px-4 py-2.5 border rounded-lg cursor-pointer transition-all ${formData.file ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-blue-300'}`}
                                >
                                    <span className="text-sm truncate mr-2">{formData.fileName || "Choose File..."}</span>
                                    {formData.file ? (
                                        <button
                                            type="button"
                                            onClick={(e) => { e.preventDefault(); removeFile(); }}
                                            className="p-1 hover:bg-white rounded-full transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    ) : (
                                        <Upload size={16} />
                                    )}
                                </label>
                            </div>
                        </div>

                        {/* Degree */}
                        <div>
                            <label className="block text-xs font-bold text-navy-700 uppercase tracking-wide mb-1.5">Degree</label>
                            <select
                                name="degree"
                                value={formData.degree}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-navy-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
                                required
                            >
                                <option value="">Select Degree</option>
                                {degreeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>

                        {/* Stream */}
                        <div>
                            <label className="block text-xs font-bold text-navy-700 uppercase tracking-wide mb-1.5">Stream</label>
                            <select
                                name="stream"
                                value={formData.stream}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-navy-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
                                required
                            >
                                <option value="">Select Stream</option>
                                {streamOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>

                        {/* Semester */}
                        <div>
                            <label className="block text-xs font-bold text-navy-700 uppercase tracking-wide mb-1.5">Semester</label>
                            <select
                                name="semester"
                                value={formData.semester}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-navy-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
                                required
                            >
                                <option value="">Select Semester</option>
                                {semesterOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-gray-100">
                        <button
                            type="submit"
                            disabled={submitting}
                            className={`px-8 py-2.5 bg-navy-900 text-white font-bold text-sm rounded-lg shadow-md hover:bg-navy-800 transition-all flex items-center gap-2 ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {submitting ? 'Creating...' : 'Assign Class Note'}
                            {!submitting && <ArrowRight size={16} />}
                        </button>
                    </div>
                </form>
            </div>


            {/* Recent Assessments - COMPACT "Blue Folder Widget" Style Cards */}
            <div className="mt-8">
                <h3 className="text-sm font-bold text-navy-900 mb-6 px-1 uppercase tracking-wider">Recent Class Notes</h3>

                {loading && assessments.length === 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-[180px] bg-gray-100 rounded-3xl animate-pulse" />
                        ))}
                    </div>
                ) : assessments.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 text-sm italic bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        No notes uploaded yet.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 px-1">
                        {assessments.map(a => (
                            <div key={a.id} className="relative group w-full max-w-[260px] mx-auto pt-3">
                                {/* Folder Tab (Darker Blue) */}
                                <div className="absolute top-0 left-0 w-20 h-5 bg-[#4A90E2] rounded-t-lg z-0 shadow-sm transition-all group-hover:w-24 group-hover:-mt-1"></div>

                                {/* Main Folder Body (Blue Gradient) */}
                                <div
                                    onClick={() => a.filePath && window.open(`${API_BASE_URL}/api/files/download?path=${encodeURIComponent(a.filePath)}`, '_blank')}
                                    className={`relative z-10 bg-gradient-to-br from-[#50A7FF] to-[#007AFF] rounded-b-xl rounded-tr-xl shadow-[0_8px_20px_rgba(0,122,255,0.25)] p-4 h-[200px] flex flex-col justify-between text-white transition-transform duration-300 group-hover:translate-y-[-4px] group-hover:shadow-[0_15px_30px_rgba(0,122,255,0.35)] ${a.filePath ? 'cursor-pointer hover:ring-2 hover:ring-blue-300/50' : ''}`}
                                >

                                    {/* Decoration / Settings dots */}
                                    <div className="absolute top-3 right-3 flex gap-1 opacity-60">
                                        <div className="w-1 h-1 bg-white rounded-full"></div>
                                        <div className="w-1 h-1 bg-white rounded-full"></div>
                                    </div>

                                    {/* Icon & Date Header (Same Row) */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white border border-white/10 shadow-inner">
                                            <Folder size={18} fill="currentColor" className="opacity-90" />
                                        </div>
                                        {/* Date moved here - Top Right */}
                                        <div className="text-right">
                                            <p className="text-[9px] font-bold text-white/90 bg-black/10 px-2 py-1 rounded-lg backdrop-blur-sm">
                                                {new Date(a.createdAt).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Content Info */}
                                    <div className="space-y-0.5 mb-2 flex-grow">
                                        <h4 className="text-sm font-bold leading-tight line-clamp-2 drop-shadow-sm" title={a.topic}>
                                            {a.topic || "Untitled Note"}
                                        </h4>
                                        <p className="text-[10px] font-medium text-blue-100 uppercase tracking-wider truncate" title={a.subject}>
                                            {a.subject}
                                        </p>
                                    </div>

                                    {/* Assigned By Info */}
                                    {a.assignedBy && (
                                        <div className="mb-2 px-0.5">
                                            <p className="text-[9px] text-blue-100/90 truncate flex items-center gap-1" title={`Assigned by ${a.assignedBy}`}>
                                                <span className="opacity-70">By:</span>
                                                <span className="font-semibold text-white">{a.assignedBy}</span>
                                            </p>
                                        </div>
                                    )}

                                    {/* "Recipient" Info (Target Class) - Vertical Stack */}
                                    <div className="space-y-2">
                                        <div className="bg-black/20 rounded-lg p-2.5 backdrop-blur-sm border border-white/5 w-full">
                                            <p className="text-[8px] text-blue-200 uppercase tracking-widest mb-1.5 opacity-80">Assigned To</p>
                                            <div className="flex flex-col gap-0.5">
                                                <p className="text-[10px] font-bold text-white truncate w-full leading-tight" title={`${a.degree} • ${a.stream}`}>
                                                    {a.degree} • {a.stream}
                                                </p>
                                                <p className="text-[10px] text-white/90 font-medium">
                                                    {a.semester}
                                                </p>
                                            </div>
                                        </div>
                                        {/* Button Removed - Entire Card is Clickable */}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {assessTotalPages > 1 && (
                    <div className="mt-8 flex justify-center gap-4">
                        <button onClick={() => setAssessPage(p => Math.max(0, p - 1))} disabled={assessPage === 0} className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 transition-colors"><ChevronLeft size={20} /></button>
                        <span className="text-sm font-medium self-center text-gray-500">{assessPage + 1} / {assessTotalPages}</span>
                        <button onClick={() => setAssessPage(p => Math.min(assessTotalPages - 1, p + 1))} disabled={assessPage === assessTotalPages - 1} className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 transition-colors"><ChevronRight size={20} /></button>
                    </div>
                )}
            </div>

            <SnackbarAlert
                open={snackbar.open}
                message={snackbar.message}
                severity={snackbar.severity}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            />
        </div >
    );
};


export default NotesAssessment;
