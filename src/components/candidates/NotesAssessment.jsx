import React, { useState, useEffect, useRef } from "react";
import { FileText, Search, Download, Plus, ChevronLeft, ChevronRight, X, Upload, ArrowRight, Folder, MoreVertical, Filter, Trash2, Eye, Edit, RefreshCw } from "lucide-react";
import { notesAssessmentService } from "../../services/notesAssessmentService";
import SnackbarAlert from "../common/SnackbarAlert";
import { API_BASE_URL } from "../../constants/api";
import { useSubscription } from "../../providers/SubscriptionProvider";
import SubscriptionExpired from "../common/SubscriptionExpired";

const NotesAssessment = ({ adminInfo }) => {
    const { isSubscriptionActive, loading: subscriptionLoading } = useSubscription();

    // UI States
    const [viewMode, setViewMode] = useState("LIST"); // LIST, CREATE
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

    // Data States
    const [assessments, setAssessments] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    // Pagination
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    // Form Data
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
    }, [page, size]);

    const fetchAssessments = async () => {
        setLoading(true);
        try {
            const data = await notesAssessmentService.getAssessments(page, size);
            setAssessments(data.assessments || data.content || []);
            setTotalPages(data.totalPages || 0);
            setTotalElements(data.totalElements || 0);
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

            // Reset form
            setFormData({
                content: "",
                degree: "",
                stream: "",
                semester: "",
                subject: "",
                topic: "",
                file: null,
                fileName: ""
            });
            setViewMode("LIST");
            fetchAssessments();
        } catch (error) {
            console.error("Error adding assessment:", error);
            const errorMsg = error.response?.data?.message || error.response?.data || error.message || "Error adding assessment";
            showMessage(errorMsg, "error");
        } finally {
            setSubmitting(false);
        }
    };

    const filteredAssessments = assessments.filter(item =>
        (item.topic && item.topic.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.subject && item.subject.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Pagination helper
    const getPaginationItems = (current, total) => {
        if (total <= 7) return Array.from({ length: total }, (_, i) => i);
        if (current < 3) return [0, 1, 2, 3, '...', total - 1];
        if (current > total - 4) return [0, '...', total - 4, total - 3, total - 2, total - 1];
        return [0, '...', current - 1, current, current + 1, '...', total - 1];
    };

    const paginationItems = getPaginationItems(page, totalPages);
    const startEntry = totalElements > 0 ? page * size + 1 : 0;
    const endEntry = totalElements > 0 ? Math.min((page + 1) * size, totalElements) : 0;

    // Render Logic
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
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notes & Assessment</h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">Manage class notes and study materials</p>
                </div>
            </div>

            {viewMode === "CREATE" ? (
                // CREATE FORM VIEW
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden max-w-5xl mx-auto mt-4">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <div>
                            <h2 className="text-sm font-bold text-navy-900">Add New Note</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Upload materials for students</p>
                        </div>
                        <button
                            onClick={() => setViewMode("LIST")}
                            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            {/* Topic */}
                            <div>
                                <label className="block text-xs font-medium text-navy-700 mb-1.5">Topic Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="topic"
                                    value={formData.topic}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Arrays & Hashing"
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-navy-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                                    required
                                />
                            </div>

                            {/* Subject */}
                            <div>
                                <label className="block text-xs font-medium text-navy-700 mb-1.5">Subject <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Data Structures"
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-navy-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                                    required
                                />
                            </div>

                            {/* File Upload */}
                            <div>
                                <label className="block text-xs font-medium text-navy-700 mb-1.5">File Attachment</label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        id="file-upload"
                                    />
                                    <label
                                        htmlFor="file-upload"
                                        className={`flex items-center justify-between w-full px-3 py-2 border rounded-lg cursor-pointer transition-all ${formData.file ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-300 text-gray-500 hover:border-blue-300'}`}
                                    >
                                        <span className="text-xs truncate mr-2">{formData.fileName || "Choose File..."}</span>
                                        {formData.file ? (
                                            <button
                                                type="button"
                                                onClick={(e) => { e.preventDefault(); removeFile(); }}
                                                className="p-0.5 hover:bg-white rounded-full transition-colors"
                                            >
                                                <X size={12} />
                                            </button>
                                        ) : (
                                            <Upload size={14} />
                                        )}
                                    </label>
                                </div>
                            </div>

                            {/* Degree */}
                            <div>
                                <label className="block text-xs font-medium text-navy-700 mb-1.5">Degree <span className="text-red-500">*</span></label>
                                <select
                                    name="degree"
                                    value={formData.degree}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-navy-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    required
                                >
                                    <option value="">Select Degree</option>
                                    {degreeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>

                            {/* Stream */}
                            <div>
                                <label className="block text-xs font-medium text-navy-700 mb-1.5">Stream <span className="text-red-500">*</span></label>
                                <select
                                    name="stream"
                                    value={formData.stream}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-navy-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    required
                                >
                                    <option value="">Select Stream</option>
                                    {streamOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>

                            {/* Semester */}
                            <div>
                                <label className="block text-xs font-medium text-navy-700 mb-1.5">Semester <span className="text-red-500">*</span></label>
                                <select
                                    name="semester"
                                    value={formData.semester}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-navy-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    required
                                >
                                    <option value="">Select Semester</option>
                                    {semesterOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => setViewMode("LIST")}
                                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-semibold text-xs rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className={`px-6 py-2 bg-qwikBlue text-white font-semibold text-xs rounded-lg shadow-sm hover:bg-qwikBlueDark transition-all flex items-center gap-2 ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {submitting ? (
                                    <>
                                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        Assign Note <ArrowRight size={14} />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                // LIST VIEW
                <div>
                    {/* Standard Controls */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4 mt-6">
                        {/* Page Size Selector */}
                        <div className="flex items-center space-x-2 flex-shrink-0">
                            <label htmlFor="pageSize" className="text-xs text-gray-900 font-medium">Show</label>
                            <select
                                id="pageSize"
                                value={size}
                                onChange={(e) => { setSize(Number(e.target.value)); setPage(0); }}
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
                                    onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
                                    placeholder="Search by topic or subject..."
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
                                onClick={() => fetchAssessments()}
                                title="Refresh Data"
                                className="p-1.5 text-gray-500 hover:text-blue-700 hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                disabled={loading}
                            >
                                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                            </button>

                            <button
                                onClick={() => setViewMode("CREATE")}
                                className="inline-flex items-center gap-x-1.5 rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all"
                            >
                                <Plus className="-ml-0.5 h-4 w-4" aria-hidden="true" />
                                Add Note
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="w-full mt-1">
                        <div className="w-full">
                            <table className="min-w-full border-separate" style={{ borderSpacing: '0 8px' }}>
                                <thead className="sticky top-0 z-10 bg-qwikBlue shadow-sm">
                                    <tr className="rounded-md h-12 mb-4">
                                        <th className="px-6 py-2 rounded-l-lg text-left text-xs font-semibold text-white bg-qwikBlue">Topic</th>
                                        <th className="px-6 py-2 text-left text-xs font-semibold text-white bg-qwikBlue">Subject</th>
                                        <th className="px-6 py-2 text-left text-xs font-semibold text-white bg-qwikBlue">Degree</th>
                                        <th className="px-6 py-2 text-left text-xs font-semibold text-white bg-qwikBlue">Stream</th>
                                        <th className="px-6 py-2 text-left text-xs font-semibold text-white bg-qwikBlue">Semester</th>
                                        <th className="px-6 py-2 text-left text-xs font-semibold text-white bg-qwikBlue">Date</th>
                                        <th className="px-6 py-2 rounded-r-lg text-right text-xs font-semibold text-white bg-qwikBlue">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-transparent">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-12">
                                                <div className="flex flex-col items-center justify-center gap-4">
                                                    <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                                                    <p className="text-sm font-bold text-slate-400">Loading notes...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredAssessments.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-20 text-center text-xs text-gray-500">
                                                <div className="flex flex-col items-center gap-4 opacity-30">
                                                    <FileText size={48} className="text-slate-400" />
                                                    <h3 className="text-lg font-black text-slate-900">No notes found</h3>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredAssessments.map((item) => (
                                            <tr key={item.id} className="bg-white shadow-sm hover:shadow-md transition-shadow group rounded-md">
                                                <td className="px-6 py-2 rounded-l-lg border-l border-y border-gray-100 text-xs font-medium text-gray-900">
                                                    <div className="font-medium text-gray-900">{item.topic?.toUpperCase()}</div>
                                                </td>
                                                <td className="px-6 py-2 border-y border-gray-100 text-xs text-gray-700">
                                                    {item.subject}
                                                </td>
                                                <td className="px-6 py-2 border-y border-gray-100 text-xs text-gray-700">
                                                    {item.degree}
                                                </td>
                                                <td className="px-6 py-2 border-y border-gray-100 text-xs text-gray-700">
                                                    {item.stream}
                                                </td>
                                                <td className="px-6 py-2 border-y border-gray-100 text-xs text-gray-700">
                                                    <span className="inline-flex items-center rounded-md bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-600/20">
                                                        {item.semester}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-2 border-y border-gray-100 text-xs text-gray-700">
                                                    {new Date(item.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-2 rounded-r-lg border-r border-y border-gray-100 text-xs">
                                                    <div className="flex justify-end items-center gap-2">
                                                        {item.filePath && (
                                                            <button
                                                                onClick={() => window.open(`${API_BASE_URL}/api/files/download?path=${encodeURIComponent(item.filePath)}`, '_blank')}
                                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="Download Attachment"
                                                            >
                                                                <Download size={16} />
                                                            </button>
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
                        {totalElements > 0 && (
                            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-xs text-gray-700">
                                            Showing <span className="font-medium">{startEntry}</span> to <span className="font-medium">{endEntry}</span> of <span className="font-medium">{totalElements}</span> entries
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="relative z-0 inline-flex items-center gap-2" aria-label="Pagination">
                                            <button
                                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                                disabled={page === 0}
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
                                                        onClick={() => setPage(item)}
                                                        className={`relative inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${page === item
                                                            ? 'bg-blue-700 text-white shadow-sm hover:bg-blue-800'
                                                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        {item + 1}
                                                    </button>
                                                );
                                            })}
                                            <button
                                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                                disabled={page === totalPages - 1}
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
                </div>
            )}

            <SnackbarAlert
                open={snackbar.open}
                message={snackbar.message}
                severity={snackbar.severity}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            />
        </div>
    );
};

export default NotesAssessment;
