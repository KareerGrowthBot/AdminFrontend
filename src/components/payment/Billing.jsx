import React, { useState, useEffect } from 'react';
import { Download, FileText, Search, Filter, Loader2, CreditCard, Calendar, Receipt, ChevronLeft, ChevronRight, Plus, RefreshCw, X } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../constants/api';
import SnackbarAlert from '../common/SnackbarAlert';
import { useNavigate } from 'react-router-dom';

const Billing = () => {
    const navigate = useNavigate();
    const [payments, setPayments] = useState([]);
    const [credits, setCredits] = useState(null);
    const [activeSubscription, setActiveSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

    // Pagination state
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    // Organization ID
    const organizationId = localStorage.getItem('organizationId');

    // User Info for Invoice
    const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
    const user = (adminInfo?.admin && Array.isArray(adminInfo.admin)) ? adminInfo.admin[0] : (adminInfo?.admin || adminInfo || {});
    const userName = user.fullName || (user.firstName ? `${user.firstName} ${user.lastName}` : "Admin User");
    const organizationName = user.organizationName || adminInfo?.organizationName || "My Organization";

    useEffect(() => {
        if (organizationId) {
            fetchAllData();
        } else {
            setLoading(false);
        }
    }, [organizationId]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchPayments(),
                fetchCredits(),
                fetchSubscription()
            ]);
        } catch (error) {
            console.error("Error fetching billing data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCredits = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/credits/organizations/${organizationId}`, {
                withCredentials: true
            });
            if (response.data.status === "success") {
                setCredits(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching credits:", error);
        }
    };

    const fetchSubscription = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/subscriptions/organization/${organizationId}/active`, {
                withCredentials: true
            });
            if (response.data) {
                setActiveSubscription(response.data.subscription);
            }
        } catch (error) {
            console.error("Error fetching subscription:", error);
        }
    };

    const fetchPayments = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/payments/organization/${organizationId}`, {
                withCredentials: true
            });
            const data = response.data.payments || response.data || [];
            setPayments(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching payments:", error);
            setSnackbar({ open: true, message: "Failed to load billing history", severity: "error" });
        }
    };

    const handleViewInvoice = (payment) => {
        setSelectedInvoice(payment);
        setShowInvoiceModal(true);
    };

    const downloadInvoice = (payment) => {
        console.log("Downloading invoice for:", payment.invoiceNumber);
        setSnackbar({ open: true, message: `Downloading invoice #${payment.invoiceNumber}...`, severity: "info" });
    };

    // Filter payments
    const filteredPayments = payments.filter(p =>
        (p.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.planName?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Pagination Logic matches Positions.jsx (0-indexed logic often used there, but here I'll stick to 0-indexed for state to match)
    const totalItems = filteredPayments.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startEntry = totalItems > 0 ? currentPage * pageSize + 1 : 0;
    const endEntry = totalItems > 0 ? Math.min((currentPage + 1) * pageSize, totalItems) : 0;
    const currentTableData = filteredPayments.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

    const getStatusBadgeClasses = (status) => {
        const s = status?.toUpperCase();
        if (s === 'COMPLETED' || s === 'SUCCESS' || s === 'PAID') return "inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-[10px] font-medium text-green-700 ring-1 ring-inset ring-green-600/20";
        if (s === 'PENDING') return "inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-[10px] font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20";
        return "inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-[10px] font-medium text-red-700 ring-1 ring-inset ring-red-600/10";
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Billing & Invoices</h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">Manage your payment history and invoices</p>
                </div>
            </div>

            {/* Controls - Exact match to Positions.jsx */}
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
                            placeholder="Search by invoice # or plan..."
                            className="w-full border border-gray-300 rounded-md pl-3 pr-3 py-1.5 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap justify-start sm:justify-end flex-shrink-0">
                    <button
                        className="p-1.5 text-gray-500 hover:text-blue-700 hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        title="Filter"
                    >
                        <Filter className="h-5 w-5" />
                    </button>
                    <button
                        onClick={fetchPayments}
                        title="Refresh Data"
                        disabled={loading}
                        className="p-1.5 text-gray-500 hover:text-blue-700 hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    >
                        <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>

                    <button
                        onClick={() => navigate('/dashboard/payment')}
                        className="inline-flex items-center gap-x-1.5 rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all"
                    >
                        <Plus className="-ml-0.5 h-4 w-4" />
                        Add Credits
                    </button>
                </div>
            </div>

            {/* Table Section */}
            <div className="w-full mt-1">
                <div className="w-full">
                    <table className="min-w-full border-separate" style={{ borderSpacing: '0 8px' }}>
                        <thead className="sticky top-0 z-10 bg-qwikBlue shadow-sm">
                            <tr className="rounded-md h-12 mb-4">
                                <th className="px-6 py-2.5 text-left text-xs font-semibold text-white bg-qwikBlue rounded-l-lg">Invoice Details</th>
                                <th className="px-6 py-2.5 text-left text-xs font-semibold text-white bg-qwikBlue">Plan</th>
                                <th className="px-6 py-2.5 text-left text-xs font-semibold text-white bg-qwikBlue">Date</th>
                                <th className="px-6 py-2.5 text-left text-xs font-semibold text-white bg-qwikBlue">Amount</th>
                                <th className="px-6 py-2.5 text-center text-xs font-semibold text-white bg-qwikBlue">Status</th>
                                <th className="px-6 py-2.5 text-center text-xs font-semibold text-white bg-qwikBlue rounded-r-lg">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-transparent">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-16">
                                        <div className="flex flex-col items-center justify-center gap-4">
                                            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                                            <p className="text-sm font-bold text-slate-400">Loading invoices...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredPayments.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center text-xs text-gray-500">
                                        <div className="flex flex-col items-center gap-4 opacity-30">
                                            <Receipt size={48} className="text-slate-400" />
                                            <p className="text-lg font-black text-slate-900">No invoices found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                currentTableData.map((payment) => (
                                    <tr key={payment.id} className="bg-white shadow-sm hover:shadow-md transition-shadow group rounded-md">
                                        <td className="px-6 py-2 rounded-l-lg border-l border-y border-gray-100 text-left">
                                            <div className="text-xs font-bold text-gray-900">{payment.invoiceNumber || "INV-PENDING"}</div>
                                        </td>
                                        <td className="px-6 py-2 border-y border-gray-100 text-xs text-gray-700">
                                            <div className="font-medium text-gray-900">{payment.planName || "Custom Plan"}</div>
                                            <div className="text-[10px] text-gray-500">{payment.credits} Credits</div>
                                        </td>
                                        <td className="px-6 py-2 border-y border-gray-100 text-xs text-gray-700">
                                            {new Date(payment.paymentDate || payment.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-2 border-y border-gray-100 text-xs font-medium text-gray-900">
                                            ₹{payment.amount?.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-2 border-y border-gray-100 text-center">
                                            <span className={getStatusBadgeClasses(payment.status || payment.paymentStatus)}>
                                                {(payment.status || payment.paymentStatus || 'UNKNOWN').toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-2 rounded-r-lg border-r border-y border-gray-100 text-center">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => handleViewInvoice(payment)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                                    title="View Invoice"
                                                >
                                                    <Receipt className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => downloadInvoice(payment)}
                                                    className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                                                    title="Download PDF"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination - Matching Positions.jsx exactly */}
                {totalItems > 0 && (
                    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-md shadow-sm mt-4">
                        <div className="flex flex-1 justify-between sm:hidden">
                            <button
                                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                                disabled={currentPage === 0}
                                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                                disabled={currentPage >= totalPages - 1}
                                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                        <div className="hidden sm:flex flex-1 items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-700">
                                    Showing <span className="font-medium">{startEntry}</span> to <span className="font-medium">{endEntry}</span> of <span className="font-medium">{totalItems}</span> results
                                </p>
                            </div>
                            <div>
                                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                    <button
                                        onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                                        disabled={currentPage === 0}
                                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span className="sr-only">Previous</span>
                                        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                                    </button>
                                    {Array.from({ length: totalPages }).map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setCurrentPage(idx)}
                                            aria-current={currentPage === idx ? 'page' : undefined}
                                            className={`relative inline-flex items-center px-4 py-2 text-xs font-semibold focus:z-20 focus:outline-offset-0 ${currentPage === idx
                                                ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                                : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                                                }`}
                                        >
                                            {idx + 1}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                                        disabled={currentPage >= totalPages - 1}
                                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span className="sr-only">Next</span>
                                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Invoice Modal */}
            {showInvoiceModal && selectedInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
                        {/* Modal Header Actions - Absolute to save space */}
                        <div className="absolute top-4 right-4 z-10 print:hidden">
                            <button
                                onClick={() => setShowInvoiceModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors bg-white/50 backdrop-blur-sm rounded-full p-1 shadow-sm"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Invoice Content - Scrollable */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar pt-8 pb-6 px-6 md:pt-10 md:pb-10 md:px-10" id="invoice-content">
                            {/* Invoice Header */}
                            <div className="flex justify-between items-start mb-6 -mt-2">
                                <div>
                                    <img src="/KG-logo.png" alt="KareerGrowth" className="h-14 w-auto mb-2" />
                                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">INVOICE</h1>
                                </div>
                            </div>

                            {/* Horizontal Info Row - Brought down slightly */}
                            <div className="flex flex-wrap gap-x-8 gap-y-3 mb-6 bg-slate-50/50 p-3 rounded-md border border-slate-100">
                                <div className="flex gap-2 items-baseline">
                                    <p className="text-[10px] font-bold text-slate-900 uppercase">Invoice No:</p>
                                    <p className="text-[10px] font-bold text-slate-900">#{selectedInvoice.invoiceNumber || "PENDING"}</p>
                                </div>
                                <div className="flex gap-2 items-baseline">
                                    <p className="text-[10px] font-bold text-slate-900 uppercase">Date:</p>
                                    <p className="text-[10px] font-medium text-slate-700">
                                        {new Date(selectedInvoice.paymentDate || selectedInvoice.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </p>
                                </div>
                                {(activeSubscription?.validUntil && (selectedInvoice.subscriptionId === activeSubscription.id || selectedInvoice.razorpayPaymentId === activeSubscription.paymentId)) && (
                                    <div className="flex gap-2 items-baseline">
                                        <p className="text-[10px] font-bold text-slate-900 uppercase">Valid Until:</p>
                                        <p className="text-[10px] font-medium text-slate-700">
                                            {new Date(activeSubscription.validUntil).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                )}
                            </div>



                            {/* Addresses */}
                            <div className="grid grid-cols-2 gap-8 mb-6 border-t border-b border-slate-100 py-4">
                                <div>
                                    <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-1">Bill From</h3>
                                    <div className="text-xs text-slate-700 space-y-0.5 leading-tight">
                                        <p className="font-bold text-slate-900">KareerGrowth</p>
                                        <p>123 Business Park, Tech City</p>
                                        <p>support@kareergrowth.com</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-1">Bill To</h3>
                                    <div className="text-xs text-slate-700 space-y-0.5 leading-tight">
                                        <p className="font-bold text-slate-900 uppercase">{userName}</p>
                                        <p>{user.email}</p>
                                        <p className="font-medium text-slate-800">{organizationName}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Line Items */}
                            <div className="mb-6">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-900">
                                            <th className="py-2 text-left text-[10px] font-bold text-slate-900 uppercase tracking-wider">Description</th>
                                            <th className="py-2 text-right text-[10px] font-bold text-slate-900 uppercase tracking-wider">Qty</th>
                                            <th className="py-2 text-right text-[10px] font-bold text-slate-900 uppercase tracking-wider">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-[11px] text-slate-700">
                                        <tr className="border-b border-slate-100">
                                            <td className="py-2.5">
                                                <p className="font-bold text-slate-900">{selectedInvoice.planName || activeSubscription?.subscribedProducts || "Subscription Plan"}</p>
                                                <p className="text-[10px] text-slate-500">Base subscription package</p>
                                            </td>
                                            <td className="py-2.5 text-right">1</td>
                                            <td className="py-2.5 text-right font-medium">₹{(activeSubscription && (selectedInvoice.subscriptionId === activeSubscription.id || selectedInvoice.razorpayPaymentId === activeSubscription.paymentId) ? activeSubscription.subTotal : selectedInvoice.amount).toLocaleString()}</td>
                                        </tr>
                                        {activeSubscription && (selectedInvoice.subscriptionId === activeSubscription.id || selectedInvoice.razorpayPaymentId === activeSubscription.paymentId) && (
                                            <>
                                                <tr className="border-b border-slate-50">
                                                    <td className="py-1.5 pl-3 text-[10px] text-slate-500">• Interview Credits</td>
                                                    <td className="py-1.5 text-right text-[10px] text-slate-500">{activeSubscription.totalInterviewCredits}</td>
                                                    <td className="py-1.5 text-right text-[10px] text-slate-500">₹{activeSubscription.interviewCreditsPrice}</td>
                                                </tr>
                                                <tr className="border-b border-slate-50">
                                                    <td className="py-1.5 pl-3 text-[10px] text-slate-500">• Position Credits</td>
                                                    <td className="py-1.5 text-right text-[10px] text-slate-500">{activeSubscription.totalPositionCredits}</td>
                                                    <td className="py-1.5 text-right text-[10px] text-slate-500">₹{activeSubscription.positionCreditsPrice}</td>
                                                </tr>
                                            </>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Totals */}
                            <div className="flex justify-end mb-6">
                                <div className="w-full md:w-1/3 space-y-1">
                                    <div className="flex justify-between text-[11px] text-slate-600">
                                        <span>Subtotal</span>
                                        <span>₹{(activeSubscription && (selectedInvoice.subscriptionId === activeSubscription.id || selectedInvoice.razorpayPaymentId === activeSubscription.paymentId) ? activeSubscription.subTotal : selectedInvoice.amount).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-[11px] text-slate-600">
                                        <span>Tax ({activeSubscription?.taxRate || 18}% GST)</span>
                                        <span>₹{(activeSubscription && (selectedInvoice.subscriptionId === activeSubscription.id || selectedInvoice.razorpayPaymentId === activeSubscription.paymentId)
                                            ? (activeSubscription.grandTotalAmount - activeSubscription.subTotal)
                                            : (selectedInvoice.amount * 0.18)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-900 mt-2">
                                        <span>Total</span>
                                        <span>₹{(activeSubscription && (selectedInvoice.subscriptionId === activeSubscription.id || selectedInvoice.razorpayPaymentId === activeSubscription.paymentId)
                                            ? activeSubscription.grandTotalAmount
                                            : (selectedInvoice.amount * 1.18)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="text-center text-[10px] text-slate-400 mt-8 pt-4 border-t border-slate-50">
                                <p>This is a computer generated invoice. No signature required.</p>
                                <p className="mt-0.5">Thank you for choosing KareerGrowth!</p>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="bg-slate-50 p-4 flex justify-end gap-3 border-t border-slate-100">
                            <button
                                onClick={() => setShowInvoiceModal(false)}
                                className="px-4 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-medium rounded hover:bg-slate-50 transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => downloadInvoice(selectedInvoice)}
                                className="px-4 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                <Download className="w-3.5 h-3.5" /> Download PDF
                            </button>
                        </div>
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

export default Billing;
