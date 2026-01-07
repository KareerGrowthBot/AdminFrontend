import React, { useState, useEffect } from "react";
import {
    MessageSquare,
    Send,
    Plus,
    Search,
    Filter,
    Calendar,
    Clock,
    CheckCircle2,
    AlertCircle,
    HelpCircle,
    FileText,
    X,
    RefreshCw,
    ChevronDown,
    Upload,
    Paperclip
} from "lucide-react";
import SnackbarAlert from "./SnackbarAlert";
import { ticketService } from "../../services/ticketService";

const ContactUs = ({ adminInfo }) => {
    const [showForm, setShowForm] = useState(false);
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchingTickets, setFetchingTickets] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

    const [formData, setFormData] = useState({
        subject: "",
        type: "feedback",
        message: "",
        file: null
    });
    const [fileName, setFileName] = useState("");

    const ticketTypes = [
        { value: "feedback", label: "Feedback", icon: MessageSquare, color: "bg-blue-50 text-blue-600" },
        { value: "doubt", label: "Doubt", icon: HelpCircle, color: "bg-yellow-50 text-yellow-600" },
        { value: "issue", label: "Issue", icon: AlertCircle, color: "bg-red-50 text-red-600" },
        { value: "other", label: "Other", icon: FileText, color: "bg-gray-50 text-gray-600" }
    ];

    const statusOptions = [
        { value: "all", label: "All Tickets" },
        { value: "OPEN", label: "Open" },
        { value: "CLOSED", label: "Closed" }
    ];

    // Fetch tickets on component mount
    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            setFetchingTickets(true);
            const allTickets = await ticketService.getAllTickets();
            // Filter tickets for current admin user
            const userEmail = adminInfo?.email || adminInfo?.admin?.email;
            const userTickets = allTickets.filter(ticket => 
                ticket.email?.toLowerCase() === userEmail?.toLowerCase()
            );
            setTickets(userTickets);
        } catch (error) {
            console.error("Error fetching tickets:", error);
            showMessage("Failed to load tickets", "error");
        } finally {
            setFetchingTickets(false);
        }
    };

    const showMessage = (message, severity = "success") => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Check file size (5MB = 5 * 1024 * 1024 bytes)
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                showMessage("File size must be less than 5MB", "error");
                e.target.value = ""; // Reset input
                return;
            }
            setFormData(prev => ({
                ...prev,
                file: file
            }));
            setFileName(file.name);
        }
    };

    const handleRemoveFile = () => {
        setFormData(prev => ({
            ...prev,
            file: null
        }));
        setFileName("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.subject.trim() || !formData.message.trim()) {
            showMessage("Please fill in all required fields", "error");
            return;
        }

        setLoading(true);
        try {
            const userEmail = adminInfo?.email || adminInfo?.admin?.email;
            const userName = adminInfo?.fullName || adminInfo?.admin?.fullName || "Admin";
            
            const ticketData = {
                subject: formData.subject,
                type: formData.type,
                message: formData.message,
                file: formData.file,
                userType: "ADMIN",
                name: userName,
                email: userEmail
            };

            const response = await ticketService.submitTicket(ticketData);
            
            showMessage("Ticket submitted successfully! We'll get back to you soon.");
            
            // Reset form
            setFormData({
                subject: "",
                type: "feedback",
                message: "",
                file: null
            });
            setFileName("");
            setShowForm(false);
            
            // Refresh tickets list
            await fetchTickets();
        } catch (error) {
            console.error("Error submitting ticket:", error);
            const errorMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message || "Failed to submit ticket";
            showMessage(errorMessage, "error");
        } finally {
            setLoading(false);
        }
    };


    const getStatusBadge = (status) => {
        const statusConfig = {
            OPEN: { label: "Open", color: "bg-blue-50 text-blue-600 border-blue-200" },
            CLOSED: { label: "Closed", color: "bg-green-50 text-green-600 border-green-200" }
        };
        const config = statusConfig[status] || statusConfig.OPEN;
        return (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${config.color}`}>
                {config.label}
            </span>
        );
    };

    const getTypeInfo = (type) => {
        // Map backend type to frontend type info
        const typeMap = {
            FEEDBACK: { value: "feedback", label: "Feedback", icon: MessageSquare, color: "bg-blue-50 text-blue-600" },
            DOUBT: { value: "doubt", label: "Doubt", icon: HelpCircle, color: "bg-yellow-50 text-yellow-600" },
            ISSUE: { value: "issue", label: "Issue", icon: AlertCircle, color: "bg-red-50 text-red-600" },
            OTHER: { value: "other", label: "Other", icon: FileText, color: "bg-gray-50 text-gray-600" }
        };
        return typeMap[type] || typeMap.OTHER;
    };

    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch = ticket.subject?.toLowerCase().includes(search.toLowerCase()) ||
                            ticket.message?.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filterType === "all" || ticket.status === filterType;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Contact Us</h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">
                        Submit feedback, ask questions, or report issues
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-qwikBlue text-white rounded-lg hover:bg-qwikBlueDark transition-colors text-xs font-semibold shadow-sm"
                >
                    {showForm ? (
                        <>
                            <X size={16} />
                            Cancel
                        </>
                    ) : (
                        <>
                            <Plus size={16} />
                            Raise a Ticket
                        </>
                    )}
                </button>
            </div>

            {/* Ticket Form */}
            {showForm && (
                <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden animate-fade-in">
                    <div className="bg-qwikBlue py-4 px-6">
                        <h2 className="text-lg font-bold text-white">Raise a New Ticket</h2>
                        <p className="text-blue-100 text-xs mt-1">
                            Share your feedback, ask questions, or report any issues
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {/* Subject */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-2">
                                Subject <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="subject"
                                value={formData.subject}
                                onChange={handleChange}
                                required
                                placeholder="Brief description of your ticket"
                                className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-qwikBlue focus:border-qwikBlue transition bg-white text-slate-900 placeholder:text-slate-400"
                            />
                        </div>

                        {/* Type and File Upload - Same Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Type */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-2">
                                    Type <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        name="type"
                                        value={formData.type}
                                        onChange={handleChange}
                                        required
                                        className="w-full pl-3 pr-8 py-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-qwikBlue focus:border-qwikBlue transition bg-white text-slate-900 appearance-none"
                                    >
                                        {ticketTypes.map((type) => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* File Upload */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-2">
                                    Attach File <span className="text-gray-400 text-[10px]">(Max 5MB)</span>
                                </label>
                                {!formData.file ? (
                                    <label className="flex items-center justify-center gap-2 w-full px-3 py-2.5 text-xs border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-qwikBlue hover:bg-blue-50 transition-colors bg-white">
                                        <Upload size={16} className="text-slate-400" />
                                        <span className="text-slate-600 font-medium">Choose file to upload</span>
                                        <input
                                            type="file"
                                            onChange={handleFileChange}
                                            className="hidden"
                                            accept="*/*"
                                        />
                                    </label>
                                ) : (
                                    <div className="flex items-center gap-2 px-3 py-2.5 border border-slate-300 rounded-lg bg-slate-50">
                                        <Paperclip size={16} className="text-slate-600 flex-shrink-0" />
                                        <span className="flex-1 text-xs text-slate-700 truncate font-medium">
                                            {fileName}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={handleRemoveFile}
                                            className="p-1 hover:bg-slate-200 rounded transition-colors flex-shrink-0"
                                        >
                                            <X size={14} className="text-slate-600" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Message */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-2">
                                Message <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                required
                                rows={6}
                                placeholder="Provide detailed information about your ticket..."
                                className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-qwikBlue focus:border-qwikBlue transition bg-white text-slate-900 placeholder:text-slate-400 resize-none"
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowForm(false);
                                    setFormData({ subject: "", type: "feedback", message: "", file: null });
                                    setFileName("");
                                }}
                                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center gap-2 px-4 py-2 bg-qwikBlue text-white rounded-lg hover:bg-qwikBlueDark transition-colors text-xs font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <RefreshCw size={14} className="animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Send size={14} />
                                        Submit Ticket
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Search and Filter Section */}
            {!showForm && tickets.length > 0 && (
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search tickets..."
                            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-qwikBlue focus:border-qwikBlue bg-white text-slate-900"
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="pl-10 pr-8 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-qwikBlue focus:border-qwikBlue bg-white text-slate-900 appearance-none"
                        >
                            {statusOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {/* Tickets List */}
            {!showForm && (
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-900">Your Tickets</h2>
                        <div className="flex items-center gap-3">
                            {fetchingTickets && (
                                <RefreshCw size={14} className="animate-spin text-slate-400" />
                            )}
                            <span className="text-xs text-slate-500 font-medium">
                                {filteredTickets.length} {filteredTickets.length === 1 ? 'ticket' : 'tickets'}
                            </span>
                        </div>
                    </div>
                </div>

                {fetchingTickets ? (
                    <div className="p-12 text-center">
                        <RefreshCw className="w-8 h-8 text-slate-400 mx-auto mb-4 animate-spin" />
                        <p className="text-xs text-slate-500">Loading tickets...</p>
                    </div>
                ) : filteredTickets.length === 0 ? (
                    <div className="p-12 text-center">
                        <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-sm font-semibold text-slate-700 mb-1">No tickets yet</h3>
                        <p className="text-xs text-slate-500 mb-4">
                            {tickets.length === 0 
                                ? "Get started by raising your first ticket"
                                : "No tickets match your search criteria"}
                        </p>
                        {tickets.length === 0 && !showForm && (
                            <button
                                onClick={() => setShowForm(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-qwikBlue text-white rounded-lg hover:bg-qwikBlueDark transition-colors text-xs font-semibold"
                            >
                                <Plus size={14} />
                                Raise a Ticket
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filteredTickets.map((ticket) => {
                            const typeInfo = getTypeInfo(ticket.type);
                            const TypeIcon = typeInfo.icon;
                            const date = ticket.createdAt ? new Date(ticket.createdAt) : new Date();
                            const formattedDate = date.toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                            });
                            const formattedTime = date.toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                            });

                            return (
                                <div
                                    key={ticket.id}
                                    className="p-6 hover:bg-slate-50 transition-colors group"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start gap-3 mb-3">
                                                <div className={`p-2 rounded-lg ${typeInfo.color} flex-shrink-0`}>
                                                    <TypeIcon size={18} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="text-sm font-bold text-slate-900 truncate">
                                                            {ticket.subject}
                                                        </h3>
                                                        {getStatusBadge(ticket.status)}
                                                    </div>
                                                    <p className="text-xs text-slate-600 line-clamp-2 mb-2">
                                                        {ticket.message}
                                                    </p>
                                                    <div className="flex items-center gap-4 text-[10px] text-slate-500">
                                                        <div className="flex items-center gap-1">
                                                            <Calendar size={12} />
                                                            <span>{formattedDate}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Clock size={12} />
                                                            <span>{formattedTime}</span>
                                                        </div>
                                                        {ticket.name && (
                                                            <div className="flex items-center gap-1">
                                                                <span className="font-medium">By:</span>
                                                                <span>{ticket.name}</span>
                                                            </div>
                                                        )}
                                                        {ticket.fileName && (
                                                            <div className="flex items-center gap-1">
                                                                <Paperclip size={12} />
                                                                <span>{ticket.fileName}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
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

export default ContactUs;
